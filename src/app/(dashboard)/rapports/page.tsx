"use client"

import { useEffect, useState } from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { Loader2, TrendingUp, DollarSign, ShoppingBag, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllSales, getProducts, type Sale, type Product } from "@/lib/db"
import { toast } from "sonner"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesData, productsData] = await Promise.all([
          getAllSales(),
          getProducts()
        ])
        setSales(salesData)
        setProducts(productsData)
      } catch (error) {
        console.error("Error fetching report data:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // --- Calculations ---

  // 1. Total Revenue
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)

  // 2. Total Sales Count
  const totalSalesCount = sales.length

  // 3. Sales by Day (Last 7 days approx, based on available data)
  const salesByDayMap = new Map<string, number>()
  sales.forEach(sale => {
    if (sale.date?.toDate) {
      const dateStr = sale.date.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      salesByDayMap.set(dateStr, (salesByDayMap.get(dateStr) || 0) + sale.total)
    }
  })
  // Sort by date could be tricky with strings, but let's take just the last few entries or rely on query order
  // Since query is desc, we reverse to show chronological on chart
  const salesByDay = Array.from(salesByDayMap.entries())
    .map(([date, amount]) => ({ date, amount }))
    .reverse()
    .slice(-7) // Show last 7 active days

  // 4. Top Selling Products
  const productSalesMap = new Map<string, number>()
  sales.forEach(sale => {
    sale.items.forEach(item => {
      productSalesMap.set(item.name, (productSalesMap.get(item.name) || 0) + item.quantity)
    })
  })
  const topProducts = Array.from(productSalesMap.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  // 5. Stock Value by Category
  const stockByCategoryMap = new Map<string, number>()
  products.forEach(product => {
    const category = product.category || "Autre"
    const value = product.price * product.quantity
    stockByCategoryMap.set(category, (stockByCategoryMap.get(category) || 0) + value)
  })
  const stockByCategory = Array.from(stockByCategoryMap.entries())
    .map(([name, value]) => ({ name, value }))

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Rapports & Statistiques</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">Sur la période affichée</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes Totales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesCount}</div>
            <p className="text-xs text-muted-foreground">Transactions réalisées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits en Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Références uniques</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Produit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate text-sm" title={topProducts[0]?.name || "N/A"}>
              {topProducts[0]?.name || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {topProducts[0]?.quantity || 0} unités vendues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Sales Trend Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Évolution des Ventes</CardTitle>
            <CardDescription>Revenus quotidiens sur les derniers jours d'activité</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip formatter={(value: number | undefined) => [`${(value || 0).toLocaleString()} FCFA`, "Revenu"]} />
                  <Bar dataKey="amount" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top 5 Produits</CardTitle>
            <CardDescription>Les articles les plus vendus en quantité</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProducts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantity"
                    label={(props: any) => `${((props.percent || 0) * 100).toFixed(0)}%`}
                  >
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="truncate" title={product.name}>{product.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Value by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Valeur du Stock par Catégorie</CardTitle>
          <CardDescription>Répartition de la valeur financière de l'inventaire</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip formatter={(value: number | undefined) => [`${(value || 0).toLocaleString()} FCFA`, "Valeur"]} />
                <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
