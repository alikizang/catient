"use client"

import { useState } from "react"
import { Database, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { seedDatabase } from "@/lib/seed"
import { useAuth } from "@/contexts/auth-context"

export function SeedDatabaseButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { userProfile } = useAuth()

  // Only SUPERADMIN can seed
  if (userProfile?.role !== "SUPERADMIN") return null

  const handleSeed = async () => {
    try {
      setLoading(true)
      await seedDatabase()
      toast.success("Base de données peuplée avec succès !")
      setOpen(false)
      // Optional: reload page to see changes
      window.location.reload()
    } catch (error) {
      console.error("Seeding error:", error)
      toast.error("Erreur lors du peuplement de la base de données")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
          <Database className="h-4 w-4" />
          Peupler la BDD (Dev)
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Peupler la base de données ?</DialogTitle>
          <DialogDescription>
            Cette action va ajouter des données fictives (Produits, Utilisateurs, Ventes, etc.) à votre base Firestore.
            <br />
            <strong>Attention :</strong> Cela ne supprime pas les données existantes, mais peut créer des doublons si vous l'exécutez plusieurs fois.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSeed} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer l'injection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
