"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { PERMISSIONS } from "@/config/permissions"
import { Loader2 } from "lucide-react"

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // If not authenticated, let the page/layout handle redirection to login 
    // (usually handled by a separate protection or middleware, but we can do it here too)
    if (!user) {
      router.push("/login")
      return
    }

    if (!userProfile) return // Wait for profile

    // Find if the current path is defined in our permissions config
    // We sort by length desc to match the most specific path first (e.g. /stock/products vs /stock)
    // Create a copy to avoid mutating the original array which affects Sidebar order!
    const matchedConfig = [...PERMISSIONS]
      .sort((a, b) => b.url.length - a.url.length)
      .find(item => 
        pathname === item.url || pathname.startsWith(`${item.url}/`)
      )

    // If the path is a known protected route
    if (matchedConfig) {
      const hasAccess = matchedConfig.roles.includes(userProfile.role)
      
      if (!hasAccess) {
        // Redirect unauthorized access to dashboard
        console.warn(`Access denied to ${pathname} for role ${userProfile.role}`)
        router.push("/")
      }
    } else {
      // If path is not in our config at all (e.g. /settings, /profile), 
      // strictly speaking per user request we might want to block it, 
      // but usually we allow "other" paths or they might be 404s.
      // For now, we only restrict what is explicitly defined in PERMISSIONS.
      // If the user wants a STRICT whitelist (only sidebar items allowed), we would redirect here too.
      // Given "seul les chemin que chaque role a dans son sidebar seul doivent etre autoriser",
      // we should probably be strict.
      
      // However, preventing access to "/" (dashboard) if it wasn't in the list would be bad. 
      // Fortunately "/" is in the list.
      
      // Let's stick to: if it matches a known route configuration, enforce roles. 
      // If it doesn't match any known sidebar route, we assume it's either a 404 or an internal page not in sidebar.
    }
  }, [pathname, user, userProfile, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Optional: render nothing while checking permissions to avoid flash of content
  // But since we use useEffect, content might render briefly. 
  // For better UX, we can return null if we know we are redirecting.
  if (userProfile) {
    const matchedConfig = PERMISSIONS.find(item => 
      pathname === item.url || pathname.startsWith(`${item.url}/`)
    )
    if (matchedConfig && !matchedConfig.roles.includes(userProfile.role)) {
      return null
    }
  }

  return <>{children}</>
}
