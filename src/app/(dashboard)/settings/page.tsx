"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Save, Store, Users, Shield, Printer } from "lucide-react"
import { getSettings, updateSettings, type AppSettings } from "@/lib/db"
import { UsersList } from "@/components/users-list"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<AppSettings>({
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    receiptHeader: "",
    receiptFooter: "",
    currency: "FCFA",
    showTva: false
  })

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings()
        setSettings(data)
      } catch (error) {
        console.error("Error loading settings:", error)
        toast.error("Erreur de chargement des paramètres")
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateSettings(settings)
      toast.success("Paramètres enregistrés avec succès")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" /> Enregistrer
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Store className="mr-2 h-4 w-4" /> Général
          </TabsTrigger>
          <TabsTrigger value="receipts">
            <Printer className="mr-2 h-4 w-4" /> Impression & Tickets
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" /> Utilisateurs & Sécurité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil de l'entreprise</CardTitle>
              <CardDescription>
                Ces informations apparaîtront sur vos factures et documents officiels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  placeholder="Ex: CATIENT SERVICES"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyPhone">Téléphone</Label>
                  <Input
                    id="companyPhone"
                    value={settings.companyPhone}
                    onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                    placeholder="Ex: +228 90 00 00 00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    value={settings.companyEmail}
                    onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                    placeholder="contact@entreprise.tg"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="companyAddress">Adresse</Label>
                <Textarea
                  id="companyAddress"
                  value={settings.companyAddress}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  placeholder="Ex: Lomé, Togo..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des Reçus</CardTitle>
              <CardDescription>
                Personnalisez l'apparence de vos tickets de caisse.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="receiptHeader">En-tête du ticket</Label>
                <Input
                  id="receiptHeader"
                  value={settings.receiptHeader}
                  onChange={(e) => setSettings({ ...settings, receiptHeader: e.target.value })}
                  placeholder="Ex: REÇU DE CAISSE"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="receiptFooter">Message de pied de page</Label>
                <Textarea
                  id="receiptFooter"
                  value={settings.receiptFooter}
                  onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                  placeholder="Ex: Merci de votre visite ! Ni repris ni échangé."
                />
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  id="showTva"
                  checked={settings.showTva}
                  onCheckedChange={(checked) => setSettings({ ...settings, showTva: checked })}
                />
                <Label htmlFor="showTva">Afficher la TVA sur les tickets</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>
                Gérez les accès et les rôles de vos collaborateurs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsersList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
