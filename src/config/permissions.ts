import {
  Home,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  Truck,
  Wallet,
  PieChart,
  Handshake,
  Settings
} from "lucide-react"

export const PERMISSIONS = [
  // --- Opérations Quotidiennes (Vente) ---
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
    title: "Ventes",
    url: "/ventes",
    icon: FileText,
    roles: ["SUPERADMIN", "MANAGER", "CAISSE"],
  },

  // --- Gestion des Stocks & Achats ---
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
    title: "Approvisionnements",
    url: "/approvisionnements",
    icon: Truck,
    roles: ["SUPERADMIN"],
  },
  {
    title: "Partenaires",
    url: "/partenaires",
    icon: Handshake,
    roles: ["SUPERADMIN", "MANAGER"],
  },

  // --- Finance & Administration ---
  {
    title: "Dépenses",
    url: "/depenses",
    icon: Wallet,
    roles: ["SUPERADMIN", "MANAGER", "CAISSE"],
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
    title: "Rentabilité",
    url: "/finance",
    icon: PieChart,
    roles: ["SUPERADMIN"],
  },
  {
    title: "Paramètres",
    url: "/settings",
    icon: Settings,
    roles: ["SUPERADMIN"],
  },
]
