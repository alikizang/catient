import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PWAProvider } from "@/contexts/pwa-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Çatient Services",
  description: "Gestion de stock et vente pour pièces détachées moto",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Çatient Services",
    startupImage: [
      "/icons/icon-512x512.png",
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.className} antialiased`}>
        <PWAProvider>
          <Providers>
            {children}
            <PWAInstallPrompt />
            <Toaster />
          </Providers>
        </PWAProvider>
      </body>
    </html>
  );
}
