"use client"

import { useEffect, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, Search, History, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getStockMovements, type StockMovement } from "@/lib/db"

export default function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchMovements = async () => {
    try {
      setLoading(true)
      const data = await getStockMovements()
      setMovements(data)
    } catch (error) {
      console.error("Error fetching movements:", error)
      toast.error("Erreur lors du chargement de l'historique")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovements()
  }, [])

  const filteredMovements = movements.filter(m => 
    m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.reason.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Mouvements de Stock</h2>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par produit ou motif..."
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
              <TableHead>Type</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead>Opérateur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-4 w-4 animate-spin inline-block" /> Chargement...
                </TableCell>
              </TableRow>
            ) : filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Aucun mouvement récent.</TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="font-medium">
                    {movement.date?.toDate ? movement.date.toDate().toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={movement.type === "IN" ? "default" : "destructive"}>
                      {movement.type === "IN" ? <ArrowDownLeft className="mr-1 h-3 w-3" /> : <ArrowUpRight className="mr-1 h-3 w-3" />}
                      {movement.type === "IN" ? "Entrée" : "Sortie"}
                    </Badge>
                  </TableCell>
                  <TableCell>{movement.productName}</TableCell>
                  <TableCell className="text-right font-bold">
                    {movement.type === "IN" ? "+" : "-"}{movement.quantity}
                  </TableCell>
                  <TableCell>{movement.reason}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{movement.performedBy}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
