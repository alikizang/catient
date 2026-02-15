"use client"

import { useEffect, useState } from "react"
import { Plus, Search, User, Truck, Phone, Mail, MapPin, Wallet, ArrowUpRight, ArrowDownLeft, History } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getPartners, addPartner, type Partner } from "@/lib/db"
import { toast } from "sonner"
import { AddPartnerForm } from "@/components/add-partner-form"
import { PartnerDetails } from "@/components/partner-details"

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)

  const fetchPartners = async () => {
    try {
      setLoading(true)
      const data = await getPartners()
      setPartners(data)
    } catch (error) {
      console.error("Error fetching partners:", error)
      toast.error("Erreur lors du chargement des partenaires")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPartners()
  }, [])

  const handlePartnerAdded = () => {
    setIsDialogOpen(false)
    fetchPartners()
    toast.success("Partenaire ajouté avec succès")
  }

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.phone && p.phone.includes(searchQuery))
  )

  const clients = filteredPartners.filter(p => p.type === 'CLIENT')
  const suppliers = filteredPartners.filter(p => p.type === 'SUPPLIER')

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Partenaires</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nouveau Tiers
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter un Partenaire</DialogTitle>
              <DialogDescription>
                Créez une fiche pour un client ou un fournisseur.
              </DialogDescription>
            </DialogHeader>
            <AddPartnerForm onSuccess={handlePartnerAdded} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou téléphone..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map(client => (
              <PartnerCard 
                key={client.id} 
                partner={client} 
                onClick={() => setSelectedPartner(client)} 
              />
            ))}
            {clients.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">Aucun client trouvé.</p>}
          </div>
        </TabsContent>
        
        <TabsContent value="suppliers" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map(supplier => (
              <PartnerCard 
                key={supplier.id} 
                partner={supplier} 
                onClick={() => setSelectedPartner(supplier)} 
              />
            ))}
            {suppliers.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">Aucun fournisseur trouvé.</p>}
          </div>
        </TabsContent>
      </Tabs>

      {/* Details Sheet/Dialog */}
      {selectedPartner && (
        <PartnerDetails 
          partner={selectedPartner} 
          open={!!selectedPartner} 
          onClose={() => {
            setSelectedPartner(null)
            fetchPartners() // Refresh on close to update balance
          }} 
        />
      )}
    </div>
  )
}

function PartnerCard({ partner, onClick }: { partner: Partner, onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={onClick}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${partner.type === 'CLIENT' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
            {partner.type === 'CLIENT' ? <User className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
          </div>
          <div>
            <CardTitle className="text-base font-semibold">{partner.name}</CardTitle>
            <CardDescription className="text-xs">{partner.type === 'CLIENT' ? 'Client' : 'Fournisseur'}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-1 text-sm text-muted-foreground mb-4">
          {partner.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" /> {partner.phone}
            </div>
          )}
          {partner.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" /> {partner.address}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs font-medium text-muted-foreground">Solde :</span>
          <span className={`font-bold ${
            partner.balance > 0 ? 'text-red-600' : // Positive = They owe us (Debt) - Red for alert? Or Green? Usually Debt is Red.
            partner.balance < 0 ? 'text-green-600' : // Negative = We owe them (Credit/Advance)
            'text-muted-foreground'
          }`}>
            {Math.abs(partner.balance).toLocaleString()} F
            {partner.balance > 0 ? " (Doit)" : partner.balance < 0 ? " (Avance)" : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}