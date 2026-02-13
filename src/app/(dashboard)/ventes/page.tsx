"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getRecentSales } from "@/lib/db"
import { Skeleton } from "@/components/ui/skeleton"

export default function VentesPage() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSales() {
      try {
        const data = await getRecentSales()
        setSales(data)
      } catch (error) {
        console.error("Failed to load sales:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSales()
  }, [])

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Historique des Ventes</h2>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center"><Skeleton className="h-4 w-[200px]" /></div>
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Aucune vente trouvée.
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.date?.toDate().toLocaleDateString()}</TableCell>
                  <TableCell>{sale.customerName || "Anonyme"}</TableCell>
                  <TableCell>{sale.items?.length || 0} articles</TableCell>
                  <TableCell>{sale.total?.toLocaleString()} FCFA</TableCell>
                  <TableCell>
                    <Badge variant="outline">Complété</Badge>
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
