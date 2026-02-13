"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface PWAContextType {
  isInstallable: boolean
  install: () => void
  isAppInstalled: boolean
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  install: () => {},
  isAppInstalled: false,
})

export function usePWA() {
  return useContext(PWAContext)
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [promptInstall, setPromptInstall] = useState<any>(null)
  const [isAppInstalled, setIsAppInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      console.log("👋 PWA Install Prompt captured")
      setPromptInstall(e)
    }

    const appInstalledHandler = () => {
      console.log("✅ PWA Installed")
      setIsAppInstalled(true)
      setPromptInstall(null)
    }

    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", appInstalledHandler)

    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsAppInstalled(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", appInstalledHandler)
    }
  }, [])

  const install = () => {
    if (!promptInstall) {
      return
    }
    promptInstall.prompt()
    promptInstall.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt")
        setPromptInstall(null)
      } else {
        console.log("User dismissed the install prompt")
      }
    })
  }

  return (
    <PWAContext.Provider value={{ isInstallable: !!promptInstall, install, isAppInstalled }}>
      {children}
    </PWAContext.Provider>
  )
}
