"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Search, Trash2, ShoppingCart, Plus, Minus, Loader2 } from "lucide-react"
import { getProducts, addSale, type Product, type Sale } from "@/lib/db"
import { toast } from "sonner"
import { Timestamp } from "firebase/firestore"

interface CartItem {
  product: Product
  quantity: number
}

export default function CaissePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getProducts()
        setProducts(data)
      } catch (error) {
        console.error("Error loading products:", error)
        toast.error("Erreur de chargement des produits")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        // Check stock limit
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
        if (newQty <= 0) return null // Remove if 0
        if (newQty > item.product.quantity) {
          toast.warning("Stock insuffisant")
          return item
        }
        return { ...item, quantity: newQty }
      }
      return item
    }).filter(Boolean) as CartItem[])
  }

  const clearCart = () => setCart([])

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const tva = 0 // Assuming prices are TTC or No TVA logic defined yet
  const total = subtotal + tva

  const handleCheckout = async () => {
    if (cart.length === 0) return

    try {
      setProcessing(true)
      
      const sale: Omit<Sale, "id"> = {
        date: Timestamp.now(),
        customerName: "Client Comptoir", // Default for POS
        total: total,
        items: cart.map(item => ({
          productId: item.product.id!,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        }))
      }

      await addSale(sale)
      toast.success("Vente enregistrée avec succès !")
      clearCart()
      
      // Ideally we should also update local product stock or refetch
      // For now let's just refetch to be safe
      const updatedProducts = await getProducts()
      setProducts(updatedProducts)

    } catch (error) {
      console.error("Checkout error:", error)
      toast.error("Erreur lors de l'encaissement")
    } finally {
      setProcessing(false)
    }
  }

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
                        <h3 className="font-semibold truncate" title={product.name}>{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="font-bold text-primary">{product.price.toLocaleString()} F</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${product.quantity > product.minStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            Stock: {product.quantity}
                          </span>
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

      {/* Cart Area */}
      <div className="w-full md:w-[400px] flex flex-col h-full">
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
              {/* <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA (18%)</span>
                <span>{tva.toLocaleString()} FCFA</span>
              </div> */}
              <Separator className="my-2" />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">{total.toLocaleString()} FCFA</span>
              </div>
            </div>
            <div className="p-4 pt-0 w-full grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="w-full text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={clearCart}
                disabled={cart.length === 0 || processing}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Annuler
              </Button>
              <Button 
                className="w-full h-12 text-lg font-bold"
                onClick={handleCheckout}
                disabled={cart.length === 0 || processing}
              >
                {processing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Encaisser"
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
