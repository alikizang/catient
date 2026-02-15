"use client"

import { useEffect, useState } from "react"
import { Plus, Search, Shield, Loader2, Pencil, KeyRound, Copy, Check } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getUsers, updateUser, addUser, type User } from "@/lib/db"

import { useAuth } from "@/contexts/auth-context"

const roleColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SUPERADMIN: "default",
  MANAGER: "default",
  CAISSE: "secondary",
  STOCK: "outline",
}

const AVAILABLE_ROLES = ["SUPERADMIN", "MANAGER", "CAISSE", "STOCK"]

export function UsersList() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [editedName, setEditedName] = useState<string>("")
  const [updating, setUpdating] = useState(false)

  // Add User State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "CAISSE" })
  const [adding, setAdding] = useState(false)

  // Reset Link State
  const [resetLink, setResetLink] = useState<string | null>(null)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [resettingUserEmail, setResettingUserEmail] = useState("")
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await getUsers()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Erreur lors du chargement des utilisateurs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setSelectedRole(user.role)
    setEditedName(user.name)
    setIsDialogOpen(true)
  }

  const handleSaveRole = async () => {
    if (!editingUser || !editingUser.id) return

    try {
      setUpdating(true)
      await updateUser(editingUser.id, { role: selectedRole, name: editedName })
      toast.success("Utilisateur mis à jour avec succès")
      setIsDialogOpen(false)
      fetchUsers() // Refresh list
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setUpdating(false)
    }
  }

  const handleGenerateResetLink = async (email: string) => {
    try {
      setGeneratingLink(true)
      setResettingUserEmail(email)
      setIsResetDialogOpen(true)
      setResetLink(null)
      
      const response = await fetch('/api/admin/generate-reset-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération du lien')
      }
      
      setResetLink(data.link)
    } catch (error: any) {
      console.error("Error generating reset link:", error)
      toast.error(error.message)
      setIsResetDialogOpen(false)
    } finally {
      setGeneratingLink(false)
    }
  }

  const copyToClipboard = () => {
    if (resetLink) {
      navigator.clipboard.writeText(resetLink)
      setCopied(true)
      toast.success("Lien copié !")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast.error("Veuillez remplir le nom et l'email")
      return
    }

    try {
      setAdding(true)
      await addUser({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: "active",
      })
      toast.success("Utilisateur ajouté avec succès")
      setIsAddDialogOpen(false)
      setNewUser({ name: "", email: "", role: "CAISSE" })
      fetchUsers()
    } catch (error) {
      console.error("Error adding user:", error)
      toast.error("Erreur lors de l'ajout de l'utilisateur")
    } finally {
      setAdding(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Liste des Utilisateurs</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher par nom ou email..."
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
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Aucun utilisateur trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleColors[user.role] || "outline"}>
                      <Shield className="mr-1 h-3 w-3" />
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          user.status === "active" ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      {user.status === "active" ? "Actif" : "Inactif"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleGenerateResetLink(user.email)}
                        title="Générer lien de réinitialisation"
                      >
                        <KeyRound className="h-4 w-4 text-orange-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditClick(user)}
                        disabled={currentUser?.email === user.email}
                        title={currentUser?.email === user.email ? "Vous ne pouvez pas modifier votre propre rôle" : "Modifier"}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Modifier le rôle pour l'utilisateur <strong>{editingUser?.name}</strong> (
              {editingUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rôle
              </Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={updating}>
              Annuler
            </Button>
            <Button onClick={handleSaveRole} disabled={updating}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription>
              Créez un profil pour un utilisateur existant dans Firebase Auth. L'email doit
              correspondre exactement.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-name" className="text-right">
                Nom
              </Label>
              <Input
                id="new-name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="col-span-3"
                placeholder="Ex: Paul Stock"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-email" className="text-right">
                Email
              </Label>
              <Input
                id="new-email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="col-span-3"
                placeholder="Ex: stock@catient-services.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-role" className="text-right">
                Rôle
              </Label>
              <Select
                value={newUser.role}
                onValueChange={(val) => setNewUser({ ...newUser, role: val })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={adding}>
              Annuler
            </Button>
            <Button onClick={handleAddUser} disabled={adding}>
              {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lien de réinitialisation</DialogTitle>
            <DialogDescription>
              Ce lien permettra à <strong>{resettingUserEmail}</strong> de définir un nouveau mot de passe.
            </DialogDescription>
          </DialogHeader>

          {generatingLink ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : resetLink ? (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-md break-all text-sm font-mono border max-h-[100px] overflow-y-auto">
                {resetLink}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                  Fermer
                </Button>
                <Button onClick={copyToClipboard}>
                  {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied ? "Copié !" : "Copier le lien"}
                </Button>
              </div>
            </div>
          ) : (
             <div className="py-4 text-center text-muted-foreground">
               Génération du lien en cours...
             </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
