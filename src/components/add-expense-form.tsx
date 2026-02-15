"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { addExpense } from "@/lib/db"
import { Timestamp } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"

const formSchema = z.object({
  category: z.enum(["FIXED", "VARIABLE"]),
  type: z.string().min(1, "Type requis"),
  description: z.string().min(1, "Description requise"),
  amount: z.string().min(1, "Montant requis"),
})

interface AddExpenseFormProps {
  onSuccess: () => void
}

export function AddExpenseForm({ onSuccess }: AddExpenseFormProps) {
  const [loading, setLoading] = useState(false)
  const { userProfile } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "VARIABLE",
      type: "",
      description: "",
      amount: "",
    },
  })

  const category = form.watch("category")

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      await addExpense({
        category: values.category,
        type: values.type,
        description: values.description,
        amount: parseFloat(values.amount),
        performedBy: userProfile?.name || "Inconnu",
        status: 'PENDING', // Always PENDING (Declared) first, to be Verified by Admin later.
        date: Timestamp.now()
      })
      onSuccess()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir catégorie" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="VARIABLE">Charge Variable (Petite caisse)</SelectItem>
                  <SelectItem value="FIXED">Charge Fixe (Mensuelle)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de dépense</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {category === 'FIXED' ? (
                    <>
                      <SelectItem value="Loyer">Loyer</SelectItem>
                      <SelectItem value="Electricité">Electricité (CEET)</SelectItem>
                      <SelectItem value="Salaire">Salaire</SelectItem>
                      <SelectItem value="Internet">Internet / Wifi</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Communication">Crédit de communication</SelectItem>
                      <SelectItem value="Transport">Transport / Déplacement</SelectItem>
                      <SelectItem value="Repas">Restauration</SelectItem>
                      <SelectItem value="Entretien">Entretien / Nettoyage</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description / Motif</FormLabel>
              <FormControl>
                <Textarea placeholder="Détails (ex: Achat crédit pour appeler fournisseur X)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant (FCFA)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer la dépense
        </Button>
      </form>
    </Form>
  )
}