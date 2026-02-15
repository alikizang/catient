"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Search, Trash2, ShoppingCart, Plus, Minus, Loader2, CreditCard, Banknote, Smartphone, Check, Printer, Share2, Receipt } from "lucide-react"
import { getProducts, addSale, getPartners, addPartnerTransaction, getSettings, type Product, type Sale, type PaymentMethod, type Partner, type AppSettings } from "@/lib/db"
import { toast } from "sonner"
import { Timestamp } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useAuth } from "@/contexts/auth-context"

interface CartItem {
  product: Product
  quantity: number
}

export default function CaissePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  
  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH")
  const [mobileProvider, setMobileProvider] = useState<string>("MIXX_BY_YAS")
  const [amountPaid, setAmountPaid] = useState<string>("")
  const [reference, setReference] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [processing, setProcessing] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  
  const { userProfile } = useAuth()

  useEffect(() => {
    async function loadData() {
      try {
        const [pData, partData, settingsData] = await Promise.all([
          getProducts(), 
          getPartners(),
          getSettings()
        ])
        setProducts(pData)
        setPartners(partData)
        setSettings(settingsData)
      } catch (error) {
        console.error("Error loading products:", error)
        toast.error("Erreur de chargement des produits")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Optimisation de la recherche : filtrage direct sans state dérivé complexe
  // La recherche est déjà instantanée car nous filtrons une liste locale 'products'
  // Si lenteur perçue, c'est peut-être dû au rendu de la liste ou au focus
  const filteredProducts = products.filter(p => {
    const searchLower = searchQuery.toLowerCase().trim()
    if (!searchLower) return true
    return (
      p.name.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower)
    )
  })

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.warning("Stock insuffisant")
          return prev
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta
        if (newQty <= 0) return null 
        if (newQty > item.product.quantity) {
          toast.warning("Stock insuffisant")
          return item
        }
        return { ...item, quantity: newQty }
      }
      return item
    }).filter(Boolean) as CartItem[])
  }

  const clearCart = () => {
    setCart([])
    setAmountPaid("")
    setReference("")
    setPaymentMethod("CASH")
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const total = subtotal 

  const handleCheckout = async () => {
    try {
      setProcessing(true)
      
      let customerName = "Client Comptoir"
      if (paymentMethod === 'CREDIT' && selectedClientId) {
        const client = partners.find(p => p.id === selectedClientId)
        if (client) customerName = client.name
      } else if (reference) {
         // Use reference as customer name if provided in credit note, or keep generic
         // Actually, for credit sales, we MUST have a partner ID.
         // If generic credit note, we store it in reference.
         if (paymentMethod === 'CREDIT' && !selectedClientId) {
            // Allow generic credit? Ideally not.
            customerName = reference || "Client Crédit (Inconnu)"
         }
      }

      const sale: Omit<Sale, "id"> = {
        date: Timestamp.now(),
        customerName,
        total: total,
        paymentMethod,
        amountPaid: amountPaid ? parseFloat(amountPaid) : (paymentMethod === 'CREDIT' ? 0 : total),
        reference: paymentMethod === 'CREDIT' && selectedClientId ? `Dette Client: ${customerName}` : reference,
        items: cart.map(item => ({
          productId: item.product.id!,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        }))
      }

      const saleRef = await addSale(sale)
      
      // If Credit Sale linked to Partner, add Debt Transaction
      if (paymentMethod === 'CREDIT' && selectedClientId) {
        await addPartnerTransaction({
          partnerId: selectedClientId,
          type: 'INVOICE',
          amount: total, // Positive amount = Increases Debt (Client owes us)
          description: `Achat Crédit (Vente #${saleRef.id})`,
          referenceId: saleRef.id,
          performedBy: userProfile?.name || "Caisse",
          date: Timestamp.now()
        })
      }
      
      // Update local stock optimistically
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(c => c.product.id === p.id)
        if (cartItem) {
          return { ...p, quantity: p.quantity - cartItem.quantity }
        }
        return p
      }))

      setLastSale({ ...sale, date: Timestamp.now() } as Sale)
      setIsCheckoutOpen(false)
      setIsSuccessOpen(true)
      clearCart()

    } catch (error) {
      console.error("Checkout error:", error)
      toast.error("Erreur lors de l'encaissement")
    } finally {
      setProcessing(false)
    }
  }

  const generateReceipt = (sale: Sale) => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(18)
    doc.text(settings?.companyName || "CATIENT SERVICES", 105, 20, { align: "center" })
    doc.setFontSize(10)
    if (settings?.companyPhone) {
      doc.text(`Tel: ${settings.companyPhone}`, 105, 25, { align: "center" })
    }
    
    doc.setFontSize(12)
    doc.text(settings?.receiptHeader || "REÇU DE CAISSE", 105, 35, { align: "center" })
    
    // Info
    doc.setFontSize(10)
    const dateStr = sale.date?.toDate ? sale.date.toDate().toLocaleString() : new Date().toLocaleString()
    doc.text(`Date: ${dateStr}`, 14, 45)
    doc.text(`Client: ${sale.customerName}`, 14, 50)
    
    let paymentLabel = sale.paymentMethod as string
    if (sale.paymentMethod === 'MOBILE_MONEY' && sale.reference) {
      paymentLabel = `MOBILE MONEY`
    }
    
    doc.text(`Paiement: ${paymentLabel}`, 14, 55)
    if(sale.reference) {
      doc.text(`Réf: ${sale.reference}`, 14, 60)
    }

    // Table
    autoTable(doc, {
      startY: 65,
      head: [['Produit', 'Qté', 'Prix U.', 'Total']],
      body: sale.items.map(item => [
        item.name,
        item.quantity,
        item.price.toLocaleString(),
        (item.price * item.quantity).toLocaleString()
      ]),
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [220, 220, 220], textColor: 20, fontStyle: 'bold' }
    })

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 70
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    const currency = settings?.currency || "FCFA"
    doc.text(`TOTAL: ${sale.total.toLocaleString()} ${currency}`, 14, finalY + 10)
    
    if (sale.paymentMethod === 'CASH' && sale.amountPaid) {
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Reçu: ${sale.amountPaid.toLocaleString()} ${currency}`, 14, finalY + 16)
      doc.text(`Rendu: ${(sale.amountPaid - sale.total).toLocaleString()} ${currency}`, 14, finalY + 21)
    }
    
    // Footer
    if (settings?.receiptFooter) {
      doc.setFontSize(8)
      doc.text(settings.receiptFooter, 105, finalY + 30, { align: "center" })
    }

    doc.save(`recu_${Date.now()}.pdf`)
  }

  const shareOnWhatsApp = (sale: Sale) => {
    const itemsList = sale.items.map(i => `- ${i.name} x${i.quantity}`).join('%0A')
    const dateStr = sale.date?.toDate ? sale.date.toDate().toLocaleDateString() : new Date().toLocaleDateString()
    const message = `*CATIENT SERVICES - REÇU*%0A------------------%0ADate: ${dateStr}%0ATotal: *${sale.total.toLocaleString()} FCFA*%0A------------------%0AArticles:%0A${itemsList}%0A------------------%0AMerci de votre visite !`
    
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const formatProductName = (name: string) => {
    const match = name.match(/^(.*?)\s*(\(.*\))$/);
    if (match) {
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-sm leading-tight mb-0.5">{match[1]}</span>
          <span className="font-bold text-xs text-primary">{match[2]}</span>
        </div>
      );
    }
    return <h3 className="font-semibold text-sm leading-tight mb-1" title={name}>{name}</h3>;
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-4 md:flex-row p-4 pt-0">
      {/* Product Selection Area */}
      <div className="flex flex-1 flex-col gap-4 h-full">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="p-4 pb-0 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Scanner code-barres ou rechercher produit..."
                className="pl-8 h-10 text-lg"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Aucun produit trouvé.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className={`cursor-pointer hover:bg-accent/50 transition-colors ${product.quantity <= 0 ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
                        )}
                      </div>
                      <div>
                        {formatProductName(product.name)}
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                        <div className="flex flex-col items-start gap-1 mt-1 md:flex-row md:justify-between md:items-center">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${product.quantity > product.minStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            Stock: {product.quantity}
                          </span>
                          <p className="font-bold text-primary">{product.price.toLocaleString()} F</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cart Area - Desktop */}
      <div className="hidden md:flex w-full md:w-[400px] flex-col h-full">
        <Card className="flex-1 flex flex-col h-full border-l shadow-lg overflow-hidden">
          <CardHeader className="p-4 border-b bg-muted/20 shrink-0">
            <CardTitle className="flex items-center justify-between">
              <span>Panier actuel</span>
              <span className="text-sm font-normal text-muted-foreground">
                {cart.length} articles
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                <ShoppingCart className="h-12 w-12 opacity-20" />
                <p>Le panier est vide</p>
              </div>
            ) : (
              <div className="divide-y">
                {cart.map((item) => (
                  <div key={item.product.id} className="p-4 flex gap-4 items-start hover:bg-muted/5">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate" title={item.product.name}>
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {item.product.price.toLocaleString()} F x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id!, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id!, 1)}
                        disabled={item.quantity >= item.product.quantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="font-bold min-w-[70px] text-right shrink-0">
                      {(item.product.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="p-0 flex flex-col border-t bg-muted/20 shrink-0">
            <div className="p-4 w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{subtotal.toLocaleString()} FCFA</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">{total.toLocaleString()} FCFA</span>
              </div>
            </div>
            <div className="p-4 pt-0 w-full grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="w-full h-12 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={clearCart}
                disabled={cart.length === 0 || processing}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Annuler
              </Button>
              <Button 
                className="w-full h-12 text-lg font-bold"
                onClick={() => setIsCheckoutOpen(true)}
                disabled={cart.length === 0 || processing}
              >
                Encaisser
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Mobile Cart Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full h-14 text-lg font-bold flex justify-between items-center px-6">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span>{cart.length} articles</span>
              </div>
              <span>{total.toLocaleString()} FCFA</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0 rounded-t-xl">
            <SheetHeader className="p-4 border-b bg-muted/20 shrink-0">
              <SheetTitle className="flex items-center justify-between">
                <span>Panier actuel</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {cart.length} articles
                </span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-0">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                  <ShoppingCart className="h-12 w-12 opacity-20" />
                  <p>Le panier est vide</p>
                </div>
              ) : (
                <div className="divide-y">
                  {cart.map((item) => (
                    <div key={item.product.id} className="p-4 flex gap-4 items-start hover:bg-muted/5">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate" title={item.product.name}>
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {item.product.price.toLocaleString()} F x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id!, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id!, 1)}
                          disabled={item.quantity >= item.product.quantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="font-bold min-w-[70px] text-right shrink-0">
                        {(item.product.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-0 flex flex-col border-t bg-muted/20 shrink-0">
              <div className="p-4 w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{subtotal.toLocaleString()} FCFA</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">{total.toLocaleString()} FCFA</span>
                </div>
              </div>
              <div className="p-4 pt-0 w-full grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="w-full h-12 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
                  onClick={clearCart}
                  disabled={cart.length === 0 || processing}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Annuler
                </Button>
                <Button 
                  className="w-full h-12 text-lg font-bold"
                  onClick={() => setIsCheckoutOpen(true)}
                  disabled={cart.length === 0 || processing}
                >
                  Encaisser
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Paiement</DialogTitle>
            <DialogDescription>
              Total à payer : <span className="font-bold text-primary">{total.toLocaleString()} FCFA</span>
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="CASH" onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="CASH">Espèce</TabsTrigger>
              <TabsTrigger value="MOBILE_MONEY">Mobile</TabsTrigger>
              <TabsTrigger value="CARD">Carte</TabsTrigger>
              <TabsTrigger value="CREDIT">Crédit</TabsTrigger>
            </TabsList>
            
            <div className="py-4 space-y-4">
              <TabsContent value="CASH" className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                  <Banknote className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor="amount-received">Montant reçu</Label>
                    <Input 
                      id="amount-received" 
                      type="number" 
                      placeholder="Ex: 10000" 
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                  </div>
                </div>
                {amountPaid && parseFloat(amountPaid) >= total && (
                  <div className="text-center p-2 bg-green-100 text-green-700 rounded-md font-medium">
                    Monnaie à rendre : {(parseFloat(amountPaid) - total).toLocaleString()} FCFA
                  </div>
                )}
              </TabsContent>

              <TabsContent value="MOBILE_MONEY" className="space-y-4">
                <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-4">
                    <Smartphone className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <Label className="mb-2 block">Opérateur</Label>
                      <Select value={mobileProvider} onValueChange={setMobileProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir opérateur" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MIXX_BY_YAS">Mixx By Yas</SelectItem>
                          <SelectItem value="FLOOZ">Flooz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="mm-ref">Référence Transaction</Label>
                    <Input 
                      id="mm-ref" 
                      placeholder={mobileProvider === 'MIXX_BY_YAS' ? "Ex: 14033285824" : "Ex: 1250326442549"} 
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {mobileProvider === 'MIXX_BY_YAS' ? 'Format: Ref: XXXXXXXXXXX' : 'Format: Txn Id: XXXXXXXXXXXXX'}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="CARD" className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor="card-ref">Derniers 4 chiffres (Optionnel)</Label>
                    <Input 
                      id="card-ref" 
                      placeholder="Ex: 4242" 
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="CREDIT" className="space-y-4">
                <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-4">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <Label className="mb-2 block">Client (Compte)</Label>
                      <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner Client" />
                        </SelectTrigger>
                        <SelectContent>
                          {partners.filter(p => p.type === 'CLIENT').map(p => (
                            <SelectItem key={p.id} value={p.id!}>
                              {p.name} (Solde: {p.balance} F)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sélectionnez un client enregistré pour ajouter à sa dette.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="credit-note">Note (Optionnel)</Label>
                    <Input 
                      id="credit-note" 
                      placeholder="Ex: Passe payer demain..." 
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Annuler</Button>
            <Button onClick={handleCheckout} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer Paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-[400px] text-center">
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">Paiement Réussi !</DialogTitle>
            <DialogDescription>
              La vente a été enregistrée avec succès.
            </DialogDescription>
            
            <div className="flex flex-col w-full gap-2 mt-4">
              <Button className="w-full" onClick={() => lastSale && generateReceipt(lastSale)}>
                <Printer className="mr-2 h-4 w-4" /> Télécharger Reçu PDF
              </Button>
              <Button variant="outline" className="w-full" onClick={() => lastSale && shareOnWhatsApp(lastSale)}>
                <Share2 className="mr-2 h-4 w-4" /> Envoyer sur WhatsApp
              </Button>
              <Button variant="ghost" onClick={() => setIsSuccessOpen(false)}>
                Nouvelle Vente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
