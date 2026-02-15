"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface PWAContextType {
  isInstallable: boolean
  install: () => void
  isAppInstalled: boolean
  isIOS: boolean
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  install: () => {},
  isAppInstalled: false,
  isIOS: false,
})

export function usePWA() {
  return useContext(PWAContext)
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [promptInstall, setPromptInstall] = useState<any>(null)
  const [isAppInstalled, setIsAppInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

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
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsAppInstalled(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", appInstalledHandler)
    }
  }, [])

  const install = () => {
    if (isIOS) {
       // iOS doesn't support programmatic install
       // We can only show instructions
       return
    }
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
    <PWAContext.Provider value={{ isInstallable: !!promptInstall || (isIOS && !isAppInstalled), install, isAppInstalled, isIOS }}>
      {children}
    </PWAContext.Provider>
  )
}
