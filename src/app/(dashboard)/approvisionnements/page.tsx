"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Truck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getSupplies, type Supply } from "@/lib/db"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AddSupplyForm } from "@/components/add-supply-form"

export default function SuppliesPage() {
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchSupplies = async () => {
    try {
      setLoading(true)
      const data = await getSupplies()
      setSupplies(data)
    } catch (error) {
      console.error("Error fetching supplies:", error)
      toast.error("Erreur lors du chargement des approvisionnements")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSupplies()
  }, [])

  const filteredSupplies = supplies.filter(s => 
    s.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSupplyAdded = () => {
    setIsDialogOpen(false)
    fetchSupplies()
    toast.success("Approvisionnement enregistré avec succès")
  }

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Approvisionnements</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nouvel Arrivage
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enregistrer un arrivage</DialogTitle>
              <DialogDescription>
                Saisissez les détails de la facture fournisseur et les produits reçus.
              </DialogDescription>
            </DialogHeader>
            <AddSupplyForm onSuccess={handleSupplyAdded} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher fournisseur..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead className="text-right">Coût Total</TableHead>
              <TableHead className="text-right">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-4 w-4 animate-spin inline-block" /> Chargement...
                </TableCell>
              </TableRow>
            ) : filteredSupplies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Aucun approvisionnement enregistré.</TableCell>
              </TableRow>
            ) : (
              filteredSupplies.map((supply) => (
                <TableRow key={supply.id}>
                  <TableCell className="font-medium">
                    {supply.date?.toDate ? supply.date.toDate().toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>{supply.supplierName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {supply.items.slice(0, 2).map((item, idx) => (
                        <span key={idx} className="text-sm text-muted-foreground">
                          {item.productName} (x{item.quantity})
                        </span>
                      ))}
                      {supply.items.length > 2 && (
                        <span className="text-xs text-muted-foreground italic">
                          +{supply.items.length - 2} autres...
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {supply.totalCost.toLocaleString()} FCFA
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                      {supply.status || "Terminé"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}