import {
  Home,
  Package,
  ShoppingCart,
  Users,
  FileText,
  BarChart3,
  Truck,
  Wallet,
  PieChart,
  Handshake
} from "lucide-react"

export const PERMISSIONS = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    roles: ["SUPERADMIN", "MANAGER", "CAISSE", "STOCK"],
  },
  {
    title: "Caisse",
    url: "/caisse",
    icon: ShoppingCart,
    roles: ["SUPERADMIN", "MANAGER", "CAISSE"],
  },
  {
    title: "Stock",
    url: "/stock",
    icon: Package,
    roles: ["SUPERADMIN", "MANAGER", "STOCK"],
    items: [
      { title: "Produits", url: "/stock/products" },
      { title: "Fournisseurs", url: "/stock/suppliers" },
      { title: "Mouvements", url: "/stock/movements" },
    ]
  },
  {
    title: "Ventes",
    url: "/ventes",
    icon: FileText,
    roles: ["SUPERADMIN", "MANAGER", "CAISSE"],
  },
  {
    title: "Utilisateurs",
    url: "/utilisateurs",
    icon: Users,
    roles: ["SUPERADMIN"],
  },
  {
    title: "Partenaires",
    url: "/partenaires",
    icon: Handshake,
    roles: ["SUPERADMIN", "MANAGER"],
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    roles: ["SUPERADMIN", "MANAGER", "CAISSE"],
  },
  {
    title: "Rapports",
    url: "/rapports",
    icon: BarChart3,
    roles: ["SUPERADMIN", "MANAGER"],
  },
  {
    title: "Approvisionnements",
    url: "/approvisionnements",
    icon: Truck,
    roles: ["SUPERADMIN"],
  },
  {
    title: "Dépenses",
    url: "/depenses",
    icon: Wallet,
    roles: ["SUPERADMIN", "MANAGER", "CAISSE"],
  },
  {
    title: "Rentabilité",
    url: "/finance",
    icon: PieChart,
    roles: ["SUPERADMIN"],
  },
]
