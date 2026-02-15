"use client"

import { useEffect, useState } from "react"
import { Search, FileText, Printer, Eye, Plus, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getInvoices, getAllSales, type Invoice, type Sale } from "@/lib/db"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { CreateInvoiceForm } from "@/components/create-invoice-form"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function DocumentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [invData, salesData] = await Promise.all([getInvoices(), getAllSales()])
      setInvoices(invData)
      setSales(salesData)
    } catch (error) {
      console.error("Error fetching docs:", error)
      toast.error("Erreur lors du chargement des documents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleInvoiceCreated = () => {
    setIsDialogOpen(false)
    loadData()
    toast.success("Facture créée avec succès")
  }

  const generateReceiptPDF = (sale: Sale) => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("CATIENT SERVICES", 105, 20, { align: "center" })
    doc.setFontSize(12)
    doc.text("REÇU DE CAISSE", 105, 28, { align: "center" })
    
    doc.setFontSize(10)
    const dateStr = sale.date?.toDate ? sale.date.toDate().toLocaleString() : 'N/A'
    doc.text(`Date: ${dateStr}`, 14, 40)
    doc.text(`Client: ${sale.customerName}`, 14, 45)
    doc.text(`Paiement: ${sale.paymentMethod}`, 14, 50)

    autoTable(doc, {
      startY: 60,
      head: [['Produit', 'Qté', 'Prix U.', 'Total']],
      body: sale.items.map(item => [
        item.name,
        item.quantity,
        item.price.toLocaleString(),
        (item.price * item.quantity).toLocaleString()
      ]),
    })

    const finalY = (doc as any).lastAutoTable.finalY || 65
    doc.setFontSize(12)
    doc.text(`TOTAL: ${sale.total.toLocaleString()} FCFA`, 14, finalY + 10)
    
    doc.save(`recu_${sale.id}.pdf`)
  }

  const generateInvoicePDF = (invoice: Invoice) => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("CATIENT SERVICES", 105, 20, { align: "center" })
    doc.setFontSize(12)
    doc.text(invoice.type === 'PROFORMA' ? "FACTURE PROFORMA" : "FACTURE", 105, 28, { align: "center" })
    
    doc.setFontSize(10)
    doc.text(`N°: ${invoice.number}`, 14, 40)
    const dateStr = invoice.date?.toDate ? invoice.date.toDate().toLocaleDateString() : 'N/A'
    doc.text(`Date: ${dateStr}`, 14, 45)
    doc.text(`Client: ${invoice.clientName}`, 14, 50)
    if (invoice.validUntil) {
      doc.text(`Valide jusqu'au: ${invoice.validUntil.toDate().toLocaleDateString()}`, 14, 55)
    }

    autoTable(doc, {
      startY: 65,
      head: [['Produit', 'Qté', 'Prix U.', 'Total']],
      body: invoice.items.map(item => [
        item.name,
        item.quantity,
        item.price.toLocaleString(),
        (item.price * item.quantity).toLocaleString()
      ]),
    })

    const finalY = (doc as any).lastAutoTable.finalY || 70
    doc.setFontSize(12)
    doc.text(`TOTAL: ${invoice.total.toLocaleString()} FCFA`, 14, finalY + 10)
    
    doc.save(`${invoice.type}_${invoice.number}.pdf`)
  }

  const filteredSales = sales.filter(s => 
    s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.reference && s.reference.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredInvoices = invoices.filter(i => 
    i.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Documents & Archives</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nouvelle Facture / Proforma
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <CreateInvoiceForm onSuccess={handleInvoiceCreated} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher client, n°..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="receipts" className="w-full">
        <TabsList>
          <TabsTrigger value="receipts">Historique Reçus (Ventes)</TabsTrigger>
          <TabsTrigger value="invoices">Factures & Devis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="receipts" className="mt-4">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Mode Paiement</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.date?.toDate ? sale.date.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>{sale.paymentMethod}</TableCell>
                    <TableCell className="text-right font-bold">{sale.total.toLocaleString()} F</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => generateReceiptPDF(sale)}>
                        <Printer className="mr-2 h-4 w-4" /> Reçu
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="invoices" className="mt-4">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.date?.toDate ? invoice.date.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invoice.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">{invoice.total.toLocaleString()} F</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'CONVERTED_TO_SALE' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => generateInvoicePDF(invoice)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                        {invoice.status === 'DRAFT' && (
                          <Button variant="ghost" size="sm" title="Convertir en Vente">
                            <FileCheck className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}