"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, CreditCard, Package, AlertTriangle, TrendingUp, Users } from "lucide-react"
import { 
  getRecentSales, 
  getAllSales, 
  getProducts, 
  type Sale, 
  type Product 
} from "@/lib/db"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

import { useAuth } from "@/contexts/auth-context"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [salesStats, setSalesStats] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
    todayCount: 0,
    monthCount: 0
  })
  
  const { userProfile } = useAuth()
  const isFinancialVisible = userProfile?.role === "SUPERADMIN" || userProfile?.role === "MANAGER"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recent, all, allProducts] = await Promise.all([
          getRecentSales(),
          getAllSales(),
          getProducts()
        ])
        
        setRecentSales(recent)
        setProducts(allProducts)

        // Calculate Stats
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        let todayRev = 0, monthRev = 0, todayCnt = 0, monthCnt = 0
        
        all.forEach(sale => {
          if (!sale.date?.toDate) return
          const saleDate = sale.date.toDate()
          
          if (saleDate >= startOfDay) {
            todayRev += sale.total
            todayCnt++
          }
          if (saleDate >= startOfMonth) {
            monthRev += sale.total
            monthCnt++
          }
        })

        setSalesStats({
          todayRevenue: todayRev,
          monthRevenue: monthRev,
          todayCount: todayCnt,
          monthCount: monthCnt
        })

      } catch (error) {
        console.error("Error loading dashboard:", error)
        toast.error("Erreur de chargement du tableau de bord")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Derived Stats
  const lowStockCount = products.filter(p => p.quantity <= p.minStock).length
  const totalStock = products.length

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement du tableau de bord...</div>
  }

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Revenue - Only for Admin/Manager */}
        {isFinancialVisible && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventes du jour</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesStats.todayRevenue.toLocaleString()} FCFA</div>
              <p className="text-xs text-muted-foreground">
                {salesStats.todayCount} transactions aujourd'hui
              </p>
            </CardContent>
          </Card>
        )}

        {/* Monthly Revenue - Only for Admin/Manager */}
        {isFinancialVisible && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventes Mensuelles</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesStats.monthRevenue.toLocaleString()} FCFA</div>
              <p className="text-xs text-muted-foreground">
                {salesStats.monthCount} transactions ce mois
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stock Status - Visible to All */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits en Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground">
              Références actives
            </p>
          </CardContent>
        </Card>

        {/* Alerts - Visible to All */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${lowStockCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowStockCount > 0 ? "text-destructive" : ""}`}>
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Produits à réapprovisionner
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Remplacer le graphique par un tableau des produits les plus vendus pour le stock/caisse */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className={isFinancialVisible ? "col-span-4" : "col-span-7"}>
          <CardHeader>
            <CardTitle>Top Produits du Mois</CardTitle>
            <CardDescription>Les articles les plus populaires en ce moment.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products
                .sort((a, b) => (b.quantity < b.minStock ? 1 : -1)) // Juste un exemple de tri, idéalement on trierait par ventes réelles
                .slice(0, 5)
                .map(product => (
                <div key={product.id} className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="ml-4 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Stock: {product.quantity}</p>
                  </div>
                  <div className="font-medium text-sm">{product.price.toLocaleString()} F</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales List - Only for Admin/Manager */}
        {isFinancialVisible && (
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Ventes Récentes</CardTitle>
              <CardDescription>
                Dernières transactions enregistrées.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {recentSales.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune vente récente.</p>
                ) : (
                  recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none truncate max-w-[150px]" title={sale.customerName}>
                          {sale.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sale.items.length} article(s)
                        </p>
                      </div>
                      <div className="ml-auto font-medium">+{sale.total.toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
