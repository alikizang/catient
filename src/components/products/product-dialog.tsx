"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Product } from "@/lib/db"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { app } from "@/lib/firebase"
import { Loader2, Upload } from "lucide-react"

const productSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  sku: z.string().min(2, "Le SKU doit contenir au moins 2 caractères"),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  quantity: z.coerce.number().min(0, "La quantité doit être positive"),
  minStock: z.coerce.number().min(0, "Le stock minimum doit être positif"),
  category: z.string().default("General"),
  imageUrl: z.string().optional(),
})

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSubmit: (values: z.infer<typeof productSchema>) => Promise<void>
}

export function ProductDialog({ open, onOpenChange, product, onSubmit }: ProductDialogProps) {
  const [uploading, setUploading] = useState(false)
  
  const form = useForm<any>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      price: 0,
      quantity: 0,
      minStock: 5,
      category: "General",
      imageUrl: "",
    },
  })

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: product.quantity,
        minStock: product.minStock,
        category: product.category || "General",
        imageUrl: product.imageUrl || "",
      })
    } else {
      form.reset({
        name: "",
        sku: "",
        price: 0,
        quantity: 0,
        minStock: 5,
        category: "General",
        imageUrl: "",
      })
    }
  }, [product, form])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const storage = getStorage(app)
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      form.setValue("imageUrl", url)
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (values: z.infer<typeof productSchema>) => {
    await onSubmit(values)
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
          <DialogDescription>
            {product ? "Modifiez les détails du produit ici." : "Entrez les détails du nouveau produit ici."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            
            {/* Image Upload Field */}
            <div className="flex flex-col gap-2">
              <FormLabel>Image du produit</FormLabel>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-md border flex items-center justify-center overflow-hidden bg-muted">
                  {form.watch("imageUrl") ? (
                    <img src={form.watch("imageUrl")} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  disabled={uploading}
                  className="flex-1"
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom du produit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="Code SKU" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="minStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Minimum</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{product ? "Mettre à jour" : "Ajouter"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
