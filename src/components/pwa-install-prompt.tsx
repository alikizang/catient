"use client"

import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { usePWA } from "@/contexts/pwa-context"
import { useEffect, useState } from "react"

export function PWAInstallPrompt() {
  const { isInstallable, install, isAppInstalled } = usePWA()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isInstallable && !isAppInstalled) {
      const timer = setTimeout(() => setIsVisible(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [isInstallable, isAppInstalled])

  const onClick = (evt: React.MouseEvent) => {
    evt.preventDefault()
    install()
    setIsVisible(false)
  }

  if (!isInstallable || isAppInstalled || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="pb-2 relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 h-6 w-6" 
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Installer l'application
          </CardTitle>
          <CardDescription>
            Installez Çatient pour un accès plus rapide et une meilleure expérience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={onClick}>
            Installer
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
