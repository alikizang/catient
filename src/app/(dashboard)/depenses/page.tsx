"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Receipt, Loader2, Check, X, Filter } from "lucide-react"
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
import { getExpenses, updateExpenseStatus, type Expense } from "@/lib/db"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AddExpenseForm } from "@/components/add-expense-form"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { userProfile } = useAuth()
  
  const isAdmin = userProfile?.role === "SUPERADMIN" || userProfile?.role === "MANAGER"

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const data = await getExpenses()
      setExpenses(data)
    } catch (error) {
      console.error("Error fetching expenses:", error)
      toast.error("Erreur lors du chargement des dépenses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await updateExpenseStatus(id, status)
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, status } : e))
      toast.success(`Dépense ${status === 'APPROVED' ? 'pointée (validée)' : 'signalée (rejetée)'}`)
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleExpenseAdded = () => {
    setIsDialogOpen(false)
    fetchExpenses()
    toast.success("Dépense enregistrée avec succès")
  }

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.performedBy.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestion des Dépenses</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nouvelle Dépense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Enregistrer une dépense</DialogTitle>
              <DialogDescription>
                Déclarez une charge fixe (Loyer, Electricité...) ou variable (Achat crédit, Transport...).
              </DialogDescription>
            </DialogHeader>
            <AddExpenseForm onSuccess={handleExpenseAdded} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dépense..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">À Pointer</TabsTrigger>
          <TabsTrigger value="fixed">Charges Fixes</TabsTrigger>
          <TabsTrigger value="variable">Charges Variables</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <ExpensesTable 
            data={filteredExpenses} 
            loading={loading} 
            isAdmin={isAdmin}
            onUpdateStatus={handleStatusUpdate}
          />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-4">
          <ExpensesTable 
            data={filteredExpenses.filter(e => e.status === 'PENDING')} 
            loading={loading} 
            isAdmin={isAdmin}
            onUpdateStatus={handleStatusUpdate}
          />
        </TabsContent>

        <TabsContent value="fixed" className="mt-4">
          <ExpensesTable 
            data={filteredExpenses.filter(e => e.category === 'FIXED')} 
            loading={loading} 
            isAdmin={isAdmin}
            onUpdateStatus={handleStatusUpdate}
          />
        </TabsContent>

        <TabsContent value="variable" className="mt-4">
          <ExpensesTable 
            data={filteredExpenses.filter(e => e.category === 'VARIABLE')} 
            loading={loading} 
            isAdmin={isAdmin}
            onUpdateStatus={handleStatusUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ExpensesTable({ 
  data, 
  loading, 
  isAdmin, 
  onUpdateStatus 
}: { 
  data: Expense[], 
  loading: boolean, 
  isAdmin: boolean,
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void 
}) {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Auteur</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead className="text-center">Statut</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <Loader2 className="h-4 w-4 animate-spin inline-block" /> Chargement...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">Aucune dépense trouvée.</TableCell>
            </TableRow>
          ) : (
            data.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {expense.date?.toDate ? expense.date.toDate().toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{expense.type}</span>
                    <span className="text-xs text-muted-foreground">{expense.category === 'FIXED' ? 'Charge Fixe' : 'Variable'}</span>
                  </div>
                </TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>{expense.performedBy}</TableCell>
                <TableCell className="text-right font-bold text-destructive">
                  - {expense.amount.toLocaleString()} F
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={
                    expense.status === 'APPROVED' ? 'default' : 
                    expense.status === 'REJECTED' ? 'destructive' : 'secondary'
                  }>
                    {expense.status === 'APPROVED' ? 'Pointé' : 
                     expense.status === 'REJECTED' ? 'Rejeté' : 'Déclaré'}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    {expense.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                          onClick={() => onUpdateStatus(expense.id!, 'APPROVED')}
                          title="Valider / Pointer"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                          onClick={() => onUpdateStatus(expense.id!, 'REJECTED')}
                          title="Signaler un écart"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}