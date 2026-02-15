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
import { getInvoices, getAllSales, getSettings, type Invoice, type Sale, type AppSettings } from "@/lib/db"
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
  const [settings, setSettings] = useState<AppSettings | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [invData, salesData, settingsData] = await Promise.all([
        getInvoices(), 
        getAllSales(),
        getSettings()
      ])
      setInvoices(invData)
      setSales(salesData)
      setSettings(settingsData)
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
    const dateStr = sale.date?.toDate ? sale.date.toDate().toLocaleString() : 'N/A'
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

    doc.save(`recu_${sale.id}.pdf`)
  }

  const generateInvoicePDF = (invoice: Invoice) => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(settings?.companyName || "CATIENT SERVICES", 105, 20, { align: "center" })
    
    doc.setFontSize(10)
    let yPos = 25
    if (settings?.companyAddress) {
      doc.text(settings.companyAddress, 105, yPos, { align: "center" })
      yPos += 5
    }
    if (settings?.companyPhone) {
      doc.text(`Tel: ${settings.companyPhone}`, 105, yPos, { align: "center" })
      yPos += 5
    }
    if (settings?.companyEmail) {
      doc.text(`Email: ${settings.companyEmail}`, 105, yPos, { align: "center" })
      yPos += 10
    } else {
      yPos += 5
    }

    doc.setFontSize(12)
    doc.text(invoice.type === 'PROFORMA' ? "FACTURE PROFORMA" : "FACTURE", 105, yPos, { align: "center" })
    
    doc.setFontSize(10)
    doc.text(`N°: ${invoice.number}`, 14, yPos + 12)
    const dateStr = invoice.date?.toDate ? invoice.date.toDate().toLocaleDateString() : 'N/A'
    doc.text(`Date: ${dateStr}`, 14, yPos + 17)
    doc.text(`Client: ${invoice.clientName}`, 14, yPos + 22)
    if (invoice.validUntil) {
      doc.text(`Valide jusqu'au: ${invoice.validUntil.toDate().toLocaleDateString()}`, 14, yPos + 27)
    }

    autoTable(doc, {
      startY: yPos + 35,
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
    const currency = settings?.currency || "FCFA"
    doc.text(`TOTAL: ${invoice.total.toLocaleString()} ${currency}`, 14, finalY + 10)
    
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