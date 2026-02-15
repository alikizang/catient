"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Partner, Transaction, getPartnerTransactions, addPartnerTransaction } from "@/lib/db"
import { ArrowDownLeft, ArrowUpRight, Loader2, Wallet, Plus, Minus } from "lucide-react"
import { toast } from "sonner"
import { Timestamp } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"

interface PartnerDetailsProps {
  partner: Partner
  open: boolean
  onClose: () => void
}

export function PartnerDetails({ partner, open, onClose }: PartnerDetailsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("history")
  
  // New Transaction State
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { userProfile } = useAuth()

  useEffect(() => {
    if (open && partner.id) {
      loadTransactions()
    }
  }, [open, partner.id])

  async function loadTransactions() {
    try {
      setLoading(true)
      const data = await getPartnerTransactions(partner.id!)
      setTransactions(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleTransaction(type: 'INVOICE' | 'PAYMENT') {
    if (!amount || parseFloat(amount) <= 0) return

    try {
      setIsSubmitting(true)
      const val = parseFloat(amount)
      
      // Determine sign based on logic:
      // If CLIENT: 
      //   - INVOICE (Dette) = +Amount
      //   - PAYMENT (Règlement) = -Amount
      // If SUPPLIER:
      //   - INVOICE (Dette qu'on a envers lui) = -Amount (Balance becomes negative)
      //   - PAYMENT (On le paye) = +Amount (Balance goes back to 0)
      
      // Let's simplify: Balance = "Ce qu'IL nous doit".
      // Client: Invoice (+), Payment (-).
      // Supplier: Invoice (Il nous livre a crédit -> On lui doit -> Balance Négative) -> -Amount.
      //           Payment (On le paye -> On rembourse -> Balance Positive) -> +Amount.
      
      let signedAmount = val
      if (partner.type === 'CLIENT') {
        signedAmount = type === 'INVOICE' ? val : -val
      } else {
        signedAmount = type === 'INVOICE' ? -val : val
      }

      await addPartnerTransaction({
        partnerId: partner.id!,
        type,
        amount: signedAmount, // Store the signed impact on balance
        description: description || (type === 'INVOICE' ? "Nouvelle Facture / Dette" : "Règlement / Acompte"),
        performedBy: userProfile?.name || "Inconnu",
        date: Timestamp.now()
      })

      toast.success("Transaction enregistrée")
      setAmount("")
      setDescription("")
      setActiveTab("history")
      loadTransactions()
      // Note: Parent needs to refresh balance. We can call onClose to trigger refresh or add callback.
      // For now, closing re-fetches in parent.
    } catch (error) {
      toast.error("Erreur")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px] flex flex-col h-full">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>{partner.name}</SheetTitle>
          <SheetDescription>
            {partner.type === 'CLIENT' ? 'Client' : 'Fournisseur'} • {partner.phone || 'Pas de numéro'}
          </SheetDescription>
          <div className="flex items-center gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
            <Wallet className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Solde Actuel</p>
              <p className={`text-2xl font-bold ${
                partner.balance > 0 ? 'text-red-600' : 
                partner.balance < 0 ? 'text-green-600' : ''
              }`}>
                {Math.abs(partner.balance).toLocaleString()} F
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {partner.balance > 0 
                    ? (partner.type === 'CLIENT' ? "(Il doit)" : "(On lui a trop payé)") 
                    : partner.balance < 0 
                      ? (partner.type === 'CLIENT' ? "(Avance)" : "(On lui doit)") 
                      : "(Soldé)"}
                </span>
              </p>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="action">Nouveau Mouvement</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="flex-1 overflow-y-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24"><Loader2 className="animate-spin inline" /></TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">Aucune transaction.</TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">
                        {tx.date?.toDate ? tx.date.toDate().toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{tx.description}</span>
                          <span className="text-xs text-muted-foreground">{tx.performedBy}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-bold ${tx.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="action" className="mt-4 space-y-4">
            <div className="grid gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Montant (FCFA)</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Description / Motif</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Acompte, Facture N°..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button 
                  variant="outline" 
                  className="border-red-200 hover:bg-red-50 text-red-700"
                  onClick={() => handleTransaction('INVOICE')}
                  disabled={isSubmitting || !amount}
                >
                  <Plus className="mr-2 h-4 w-4" /> 
                  {partner.type === 'CLIENT' ? 'Ajouter Dette' : 'Ajouter Facture Reçue'}
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleTransaction('PAYMENT')}
                  disabled={isSubmitting || !amount}
                >
                  <Minus className="mr-2 h-4 w-4" /> 
                  {partner.type === 'CLIENT' ? 'Encaisser Règlement' : 'Payer Fournisseur'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                * {partner.type === 'CLIENT' ? '"Ajouter Dette" augmente le solde dû par le client.' : '"Ajouter Facture" augmente ce qu\'on doit au fournisseur.'}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}