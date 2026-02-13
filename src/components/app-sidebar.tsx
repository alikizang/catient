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
import { getUserProfile, User } from "@/lib/db"

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
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      console.log("Auth State Changed:", authUser?.email);
      setDebugInfo((prev: any) => ({ ...prev, authEmail: authUser?.email, authStatus: authUser ? 'Logged In' : 'Logged Out' }))
      
      if (authUser && authUser.email) {
        try {
          const profile = await getUserProfile(authUser.email)
          console.log("Fetched User Profile:", profile);
          setUserProfile(profile)
          setDebugInfo((prev: any) => ({ ...prev, profileFound: !!profile, role: profile?.role, profileId: profile?.id }))
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setDebugInfo((prev: any) => ({ ...prev, error: String(error) }))
        }
      } else {
        setUserProfile(null)
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
  const filteredItems = allItems.filter(item => 
    userProfile?.role && item.roles.includes(userProfile.role)
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
            
            {/* DEBUG SECTION - REMOVE BEFORE PRODUCTION */}
            <div className="mt-4 p-2 text-xs bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-red-500">Debug Info:</p>
              <p>Email: {debugInfo.authEmail || 'None'}</p>
              <p>Profile Found: {debugInfo.profileFound ? 'Yes' : 'No'}</p>
              <p>Role: {debugInfo.role || 'None'}</p>
              <p>Items: {filteredItems.length}</p>
            </div>

          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {userProfile && (
            <SidebarMenuItem className="mb-2">
              <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Users className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{userProfile.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{userProfile.role}</span>
                </div>
              </div>
            </SidebarMenuItem>
          )}
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
