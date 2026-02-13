"use client"

import { useEffect, useState } from "react"
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  FileText,
  BarChart3,
  LogOut,
  Wrench,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut, onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getUserRole } from "@/lib/db"

// Menu items definition with allowed roles
const allItems = [
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
    title: "Rapports",
    url: "/rapports",
    icon: BarChart3,
    roles: ["SUPERADMIN", "MANAGER"],
  },
]

export function AppSidebar() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        try {
          const userRole = await getUserRole(user.email)
          setRole(userRole)
        } catch (error) {
          console.error("Error fetching user role:", error)
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Filter items based on role
  // If role is null (loading or not found), show minimal or nothing? 
  // Let's show nothing while loading to avoid flickering, or show Dashboard only?
  // If role is not found but user is logged in, maybe default to 'cashier' or minimal access?
  // For now, if loading, return empty list.
  
  const filteredItems = allItems.filter(item => 
    role && item.roles.includes(role)
  )

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">Çatient</span>
            <span className="">Services</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Déconnexion">
              <LogOut />
              <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
