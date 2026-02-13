"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Pencil } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getProducts, addProduct, updateProduct, Product } from "@/lib/db"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductDialog } from "@/components/products/product-dialog"
import { toast } from "sonner"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      setLoading(true)
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      console.error("Failed to load products:", error)
      toast.error("Erreur lors du chargement des produits")
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setIsDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDialogOpen(true)
  }

  const handleProductSubmit = async (values: any) => {
    try {
      if (selectedProduct && selectedProduct.id) {
        await updateProduct(selectedProduct.id, values)
        toast.success("Produit mis à jour avec succès")
      } else {
        await addProduct(values)
        toast.success("Produit ajouté avec succès")
      }
      await loadProducts()
    } catch (error) {
      console.error("Failed to save product:", error)
      toast.error("Erreur lors de l'enregistrement du produit")
    }
  }

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Produits</h2>
          {!loading && (
            <Badge variant="outline" className="text-base px-2 py-1">
              {products.length} Total
            </Badge>
          )}
        </div>
          <div className="flex items-center space-x-2 w-full md:w-auto mt-2 md:mt-0">
            <Button onClick={handleAddProduct} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> 
              <span className="hidden md:inline">Ajouter un produit</span>
              <span className="md:hidden">Ajouter</span>
            </Button>
          </div>
        </div>
      <div className="flex items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un produit..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun produit trouvé.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Prix</span>
                    <span className="font-medium">{product.price.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Stock</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.quantity}</span>
                      {product.quantity <= product.minStock && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Bas</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Catégorie</span>
                    <span>{product.category || "Général"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Prix Vente</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex justify-center"><Skeleton className="h-4 w-[200px]" /></div>
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Aucun produit trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category || "Général"}</TableCell>
                  <TableCell>{product.price.toLocaleString()} FCFA</TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>
                    {product.quantity <= product.minStock ? (
                      <Badge variant="destructive">Stock Faible</Badge>
                    ) : (
                      <Badge variant="secondary">En Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>Modifier</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <ProductDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        product={selectedProduct} 
        onSubmit={handleProductSubmit} 
      />
    </div>
  )
}
