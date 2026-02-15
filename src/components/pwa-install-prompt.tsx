"use client"

import { Button } from "@/components/ui/button"
import { Share, Download, X } from "lucide-react"
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
  const { isInstallable, install, isAppInstalled, isIOS } = usePWA()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // On iOS, always show if not installed (since we can't detect 'beforeinstallprompt')
    // On Android/Desktop, show if 'beforeinstallprompt' fired (isInstallable is true)
    if (isInstallable && !isAppInstalled) {
      const timer = setTimeout(() => setIsVisible(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [isInstallable, isAppInstalled])

  const onClick = (evt: React.MouseEvent) => {
    evt.preventDefault()
    if (!isIOS) {
      install()
      setIsVisible(false)
    }
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
            {isIOS 
              ? "Installez Çatient sur votre iPhone pour un accès rapide." 
              : "Installez Çatient pour un accès plus rapide et une meilleure expérience."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isIOS ? (
            <div className="text-sm space-y-2">
              <p>1. Appuyez sur le bouton <Share className="inline h-4 w-4" /> <strong>Partager</strong> en bas de l'écran.</p>
              <p>2. Faites défiler et choisissez <strong>Sur l'écran d'accueil</strong>.</p>
            </div>
          ) : (
            <Button className="w-full" onClick={onClick}>
              Installer
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
