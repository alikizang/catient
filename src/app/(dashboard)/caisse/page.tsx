import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Search, Trash2, ShoppingCart, Plus, Minus } from "lucide-react"

export default function CaissePage() {
  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-4 md:flex-row">
      {/* Product Selection Area */}
      <div className="flex flex-1 flex-col gap-4">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="p-4 pb-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Scanner code-barres ou rechercher produit..."
                className="pl-8 h-10 text-lg"
                autoFocus
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Product Cards Placeholder */}
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <h3 className="font-semibold truncate">Produit {i}</h3>
                      <p className="text-sm text-muted-foreground">SKU-{i}00</p>
                      <p className="font-bold text-primary mt-1">15.000 F</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart Area */}
      <div className="w-full md:w-[400px] flex flex-col">
        <Card className="flex-1 flex flex-col h-full border-l shadow-lg">
          <CardHeader className="p-4 border-b bg-muted/20">
            <CardTitle className="flex items-center justify-between">
              <span>Panier actuel</span>
              <span className="text-sm font-normal text-muted-foreground">#VENTE-1234</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <div className="divide-y">
              {/* Cart Item */}
              <div className="p-4 flex gap-4 items-start">
                <div className="flex-1">
                  <h4 className="font-medium line-clamp-1">Amortisseur AR - Yamaha</h4>
                  <p className="text-sm text-muted-foreground">45.000 F x 1</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-4 text-center">1</span>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="font-bold min-w-[60px] text-right">
                  45.000
                </div>
              </div>
              
               {/* Cart Item 2 */}
               <div className="p-4 flex gap-4 items-start">
                <div className="flex-1">
                  <h4 className="font-medium line-clamp-1">Bougie NGK</h4>
                  <p className="text-sm text-muted-foreground">2.500 F x 2</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-4 text-center">2</span>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="font-bold min-w-[60px] text-right">
                  5.000
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-0 flex flex-col border-t bg-muted/20">
            <div className="p-4 w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span>50.000 FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA (18%)</span>
                <span>9.000 FCFA</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">59.000 FCFA</span>
              </div>
            </div>
            <div className="p-4 pt-0 w-full grid grid-cols-2 gap-2">
              <Button variant="outline" className="w-full text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /> Annuler
              </Button>
              <Button className="w-full h-12 text-lg font-bold">
                Encaisser
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
