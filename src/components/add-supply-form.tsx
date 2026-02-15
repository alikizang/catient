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
import { getSuppliers, getProducts, addSupply, type Product, type Supplier } from "@/lib/db"
import { Separator } from "@/components/ui/separator"
import { Timestamp } from "firebase/firestore"

const formSchema = z.object({
  supplierId: z.string().min(1, "Fournisseur requis"),
})

interface AddSupplyFormProps {
  onSuccess: () => void
}

interface SupplyItem {
  productId: string
  productName: string
  quantity: number
  buyingPrice: number
}

export function AddSupplyForm({ onSuccess }: AddSupplyFormProps) {
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<SupplyItem[]>([])
  
  // Temporary item state
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [qty, setQty] = useState<string>("")
  const [price, setPrice] = useState<string>("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: "",
    },
  })

  useEffect(() => {
    async function loadData() {
      const [sData, pData] = await Promise.all([getSuppliers(), getProducts()])
      setSuppliers(sData)
      setProducts(pData)
    }
    loadData()
  }, [])

  const addItem = () => {
    if (!selectedProduct || !qty || !price) return
    
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    setItems(prev => [...prev, {
      productId: product.id!,
      productName: product.name,
      quantity: parseInt(qty),
      buyingPrice: parseInt(price)
    }])

    // Reset temp fields
    setSelectedProduct("")
    setQty("")
    setPrice("")
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (items.length === 0) return

    try {
      setLoading(true)
      const supplier = suppliers.find(s => s.id === values.supplierId)
      
      await addSupply({
        supplierId: values.supplierId,
        supplierName: supplier?.name || "Inconnu",
        date: Timestamp.now(),
        items: items,
        totalCost: items.reduce((acc, item) => acc + (item.quantity * item.buyingPrice), 0),
        status: 'COMPLETED'
      })
      
      onSuccess()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const totalCost = items.reduce((acc, item) => acc + (item.quantity * item.buyingPrice), 0)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="supplierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fournisseur</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id!}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />
        
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Ajouter des produits</h4>
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-6">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Produit" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id!}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Input 
                placeholder="Qté" 
                type="number" 
                value={qty}
                onChange={e => setQty(e.target.value)}
              />
            </div>
            <div className="col-span-3">
              <Input 
                placeholder="Prix Achat U." 
                type="number" 
                value={price}
                onChange={e => setPrice(e.target.value)}
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
                  <TableHead className="text-right">Prix Achat</TableHead>
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
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.buyingPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{(item.quantity * item.buyingPrice).toLocaleString()}</TableCell>
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
            <span>Total Facture:</span>
            <span className="text-primary">{totalCost.toLocaleString()} FCFA</span>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading || items.length === 0}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Valider l'arrivage
        </Button>
      </form>
    </Form>
  )
}