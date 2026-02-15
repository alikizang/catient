"use client"

import { useEffect, useState } from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllSales, getProducts, type Sale, type Product } from "@/lib/db"
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ProfitData {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  margin: number
}

interface ProductPerformance {
  id: string
  name: string
  soldQty: number
  revenue: number
  cost: number
  profit: number
  margin: number
  currentStock: number
}

export default function FinancePage() {
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  
  // Analytics State
  const [globalStats, setGlobalStats] = useState<ProfitData>({ totalRevenue: 0, totalCost: 0, totalProfit: 0, margin: 0 })
  const [productStats, setProductStats] = useState<ProductPerformance[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [salesData, productsData] = await Promise.all([getAllSales(), getProducts()])
        setSales(salesData)
        setProducts(productsData)
        calculateStats(salesData, productsData)
      } catch (error) {
        console.error("Error loading finance data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const calculateStats = (salesData: Sale[], productsData: Product[]) => {
    let revenue = 0
    let cost = 0
    const productPerfMap = new Map<string, ProductPerformance>()

    // Initialize map with all products to show even those not sold
    productsData.forEach(p => {
      productPerfMap.set(p.id!, {
        id: p.id!,
        name: p.name,
        soldQty: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        currentStock: p.quantity
      })
    })

    salesData.forEach(sale => {
      sale.items.forEach(item => {
        const itemRevenue = item.price * item.quantity
        // Use recorded cost price snapshot if available, otherwise fallback to current product cost (less accurate for old sales)
        // If neither exists, assume cost is 0 (100% margin) - simplistic fallback
        const itemCostUnit = item.costPrice || productsData.find(p => p.id === item.productId)?.costPrice || 0
        const itemTotalCost = itemCostUnit * item.quantity

        revenue += itemRevenue
        cost += itemTotalCost

        // Update Product Performance
        const perf = productPerfMap.get(item.productId)
        if (perf) {
          perf.soldQty += item.quantity
          perf.revenue += itemRevenue
          perf.cost += itemTotalCost
          perf.profit += (itemRevenue - itemTotalCost)
          perf.margin = perf.revenue > 0 ? (perf.profit / perf.revenue) * 100 : 0
        }
      })
    })

    const profit = revenue - cost
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0

    setGlobalStats({
      totalRevenue: revenue,
      totalCost: cost,
      totalProfit: profit,
      margin
    })

    // Convert map to array and sort by profit
    const sortedProducts = Array.from(productPerfMap.values()).sort((a, b) => b.profit - a.profit)
    setProductStats(sortedProducts)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analyse de Rentabilité</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.totalRevenue.toLocaleString()} F</div>
            <p className="text-xs text-muted-foreground">Total des ventes enregistrées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coût des Marchandises</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.totalCost.toLocaleString()} F</div>
            <p className="text-xs text-muted-foreground">Basé sur le PUMP des produits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéfice Net</CardTitle>
            <TrendingUp className={`h-4 w-4 ${globalStats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${globalStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {globalStats.totalProfit.toLocaleString()} F
            </div>
            <p className="text-xs text-muted-foreground">Marge brute globale</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Marge</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalStats.margin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Rentabilité moyenne</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Rentabilité par Produit</TabsTrigger>
          <TabsTrigger value="alerts">Alertes Rentabilité</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Classement des Produits</CardTitle>
              <CardDescription>
                Analyse de la performance de chaque produit (du plus rentable au moins rentable).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Ventes (Qté)</TableHead>
                    <TableHead className="text-right">CA Généré</TableHead>
                    <TableHead className="text-right">Bénéfice</TableHead>
                    <TableHead className="text-right">Marge %</TableHead>
                    <TableHead className="text-right">Stock Actuel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productStats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell className="font-medium">{stat.name}</TableCell>
                      <TableCell className="text-right">{stat.soldQty}</TableCell>
                      <TableCell className="text-right">{stat.revenue.toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-bold ${stat.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.profit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{stat.margin.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          stat.currentStock <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {stat.currentStock}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Produits à Surveiller</CardTitle>
              <CardDescription>
                Produits avec une marge faible ou négative, ou stock bas mais très rentables.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <h4 className="mb-4 text-sm font-medium text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Ventes à Perte ou Marge Faible ({'<'} 10%)
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {productStats.filter(p => p.soldQty > 0 && p.margin < 10).map(p => (
                      <Card key={p.id} className="bg-destructive/5 border-destructive/20">
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm">{p.name}</CardTitle>
                          <CardDescription>Marge: {p.margin.toFixed(1)}%</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold text-destructive">
                            {p.profit.toLocaleString()} F
                          </div>
                          <p className="text-xs text-muted-foreground">Perte/Gain sur {p.soldQty} ventes</p>
                        </CardContent>
                      </Card>
                    ))}
                    {productStats.filter(p => p.soldQty > 0 && p.margin < 10).length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucun produit à problème détecté.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="mb-4 text-sm font-medium text-green-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Top Rentabilité (À réapprovisionner d'urgence si stock bas)
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {productStats.filter(p => p.margin > 30 && p.currentStock < 10).map(p => (
                      <Card key={p.id} className="bg-green-50 border-green-200">
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm">{p.name}</CardTitle>
                          <CardDescription>Stock Critique: {p.currentStock}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold text-green-700">
                            Marge {p.margin.toFixed(0)}%
                          </div>
                          <p className="text-xs text-green-600/80">Produit très rentable à ne pas manquer</p>
                        </CardContent>
                      </Card>
                    ))}
                     {productStats.filter(p => p.margin > 30 && p.currentStock < 10).length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucun produit critique.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Truck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  )
}

function BarChart3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  )
}