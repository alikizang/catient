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
  const [chartData, setChartData] = useState<{date: string, amount: number}[]>([])

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
        const dailyMap = new Map<string, number>()

        all.forEach(sale => {
          if (!sale.date?.toDate) return
          const saleDate = sale.date.toDate()
          
          // Chart Data (Last 7 days)
          const dateStr = saleDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
          dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + sale.total)

          // Revenue Stats
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

        // Format Chart Data
        const chart = Array.from(dailyMap.entries())
          .map(([date, amount]) => ({ date, amount }))
          .reverse() // Most recent first from query, so reverse might be needed depending on sort
          // Actually getAllSales is desc, so we need to reverse to show chronological left-to-right
          .reverse() 
          .slice(-7) // Last 7 days

        setChartData(chart)

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
        {/* Today's Revenue */}
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

        {/* Monthly Revenue */}
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

        {/* Stock Status */}
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

        {/* Alerts */}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Aperçu des ventes</CardTitle>
            <CardDescription>Revenus quotidiens (Derniers 7 jours)</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value/1000}k`} 
                    />
                    <Tooltip 
                      formatter={(value: number | undefined) => [`${(value || 0).toLocaleString()} FCFA`, "Revenu"]}
                      cursor={{fill: 'transparent'}}
                    />
                    <Bar dataKey="amount" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Pas assez de données pour afficher le graphique
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales List */}
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
      </div>
    </div>
  )
}
