import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// Dummy data
const users = [
  {
    id: "1",
    name: "Prosper (Vous)",
    email: "admin@catient-services.com",
    role: "SUPERADMIN",
    status: "Actif",
  },
  {
    id: "2",
    name: "Jean Vendeur",
    email: "jean@catient-services.com",
    role: "CAISSE",
    status: "Actif",
  },
  {
    id: "3",
    name: "Paul Stock",
    email: "paul@catient-services.com",
    role: "STOCK",
    status: "Inactif",
  },
]

const roleColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SUPERADMIN: "default",
  CAISSE: "secondary",
  STOCK: "outline",
  COMPTABLE: "secondary",
}

export default function UsersPage() {
  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Utilisateurs</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Ajouter un utilisateur
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un utilisateur..."
            className="pl-8"
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
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={roleColors[user.role]}>
                    <Shield className="mr-1 h-3 w-3" />
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${user.status === "Actif" ? "bg-green-500" : "bg-gray-300"}`} />
                    {user.status}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Gérer</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
