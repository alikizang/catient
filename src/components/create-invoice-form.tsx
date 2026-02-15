"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { getProducts, addInvoice, type Product } from "@/lib/db"
import { Separator } from "@/components/ui/separator"
import { Timestamp } from "firebase/firestore"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { useAuth } from "@/contexts/auth-context"

const formSchema = z.object({
  type: z.enum(["PROFORMA", "INVOICE"]),
  clientName: z.string().min(2, "Nom client requis"),
})

interface CreateInvoiceFormProps {
  onSuccess: () => void
}

interface InvoiceItem {
  productId: string
  name: string
  quantity: number
  price: number
}

export function CreateInvoiceForm({ onSuccess }: CreateInvoiceFormProps) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<InvoiceItem[]>([])
  const { userProfile } = useAuth()
  
  // Temp item state
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [qty, setQty] = useState<string>("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "PROFORMA",
      clientName: "",
    },
  })

  useEffect(() => {
    async function loadData() {
      const pData = await getProducts()
      setProducts(pData)
    }
    loadData()
  }, [])

  const addItem = () => {
    if (!selectedProduct || !qty) return
    
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    setItems(prev => [...prev, {
      productId: product.id!,
      name: product.name,
      quantity: parseInt(qty),
      price: product.price
    }])

    setSelectedProduct("")
    setQty("")
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (items.length === 0) return

    try {
      setLoading(true)
      const number = `${values.type === 'PROFORMA' ? 'PRO' : 'FAC'}-${Date.now().toString().slice(-6)}`
      
      await addInvoice({
        type: values.type,
        number,
        date: Timestamp.now(),
        clientName: values.clientName,
        items,
        total: items.reduce((acc, item) => acc + (item.quantity * item.price), 0),
        status: 'DRAFT',
        createdBy: userProfile?.name || "Inconnu",
        createdAt: Timestamp.now(),
        validUntil: values.type === 'PROFORMA' ? Timestamp.fromDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)) : undefined // 15 days validity
      })
      
      onSuccess()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce((acc, item) => acc + (item.quantity * item.price), 0)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de document</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PROFORMA">Facture Proforma (Devis)</SelectItem>
                    <SelectItem value="INVOICE">Facture Simple (Hors Stock)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du Client</FormLabel>
                <FormControl>
                  <Input placeholder="Entreprise ou Particulier" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />
        
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Produits</h4>
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-8">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Produit" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id!}>
                      {p.name} ({p.price} F)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <Input 
                placeholder="Qté" 
                type="number" 
                value={qty}
                onChange={e => setQty(e.target.value)}
              />
            </div>
            <div className="col-span-1">
              <Button type="button" size="icon" onClick={addItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">Prix U.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                      Aucun produit ajouté
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.price.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{(item.quantity * item.price).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end items-center gap-2 text-lg font-bold">
            <span>Total Document:</span>
            <span className="text-primary">{total.toLocaleString()} FCFA</span>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading || items.length === 0}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer le document
        </Button>
      </form>
    </Form>
  )
}