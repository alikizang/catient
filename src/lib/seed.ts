import { Timestamp } from "firebase/firestore";
import { 
  addProduct, 
  addUser, 
  addSale, 
  addSupplier, 
  addStockMovement,
  Product,
  User,
  Supplier
} from "./db";

const DUMMY_PRODUCTS = [
  { name: "Huile Moteur 5W30", sku: "OIL-5W30", category: "Entretien", price: 15000, quantity: 50, minStock: 10 },
  { name: "Filtre à Huile", sku: "FLT-OIL", category: "Entretien", price: 5000, quantity: 30, minStock: 5 },
  { name: "Plaquettes de Frein AV", sku: "BRK-PAD-F", category: "Freinage", price: 25000, quantity: 15, minStock: 4 },
  { name: "Disque de Frein", sku: "BRK-DSC", category: "Freinage", price: 45000, quantity: 8, minStock: 2 },
  { name: "Liquide de Refroidissement", sku: "CLT-5L", category: "Entretien", price: 8000, quantity: 25, minStock: 8 },
  { name: "Batterie 12V 70Ah", sku: "BAT-70", category: "Électricité", price: 65000, quantity: 5, minStock: 2 },
  { name: "Essuie-glace Avant", sku: "WIP-F", category: "Accessoires", price: 7500, quantity: 40, minStock: 10 },
  { name: "Nettoyant Injecteurs", sku: "CLN-INJ", category: "Additifs", price: 6000, quantity: 20, minStock: 5 },
  { name: "Ampoule H7", sku: "LGT-H7", category: "Éclairage", price: 3500, quantity: 100, minStock: 20 },
  { name: "Tapis de Sol (Set)", sku: "MAT-SET", category: "Accessoires", price: 12000, quantity: 10, minStock: 3 },
];

const DUMMY_SUPPLIERS = [
  { name: "AutoParts Express", contact: "Jean Dupont", email: "contact@autoparts.com", phone: "0102030405", address: "123 Rue de la Mécanique, Paris" },
  { name: "Global Import", contact: "Marie Martin", email: "sales@globalimport.com", phone: "0607080910", address: "Zone Industrielle Nord, Lyon" },
  { name: "Technic Auto", contact: "Pierre Durand", email: "pierre@technicauto.fr", phone: "0504030201", address: "45 Avenue des Garages, Marseille" },
];

const DUMMY_USERS = [
  { name: "Super Admin", email: "admin@catient.com", role: "SUPERADMIN", status: "active" as const },
  { name: "Manager General", email: "manager@catient.com", role: "MANAGER", status: "active" as const },
  { name: "Caissier Principal", email: "caisse@catient.com", role: "CAISSE", status: "active" as const },
  { name: "Responsable Stock", email: "stock@catient.com", role: "STOCK", status: "active" as const },
];

export async function seedDatabase() {
  console.log("Starting database seeding...");

  // 1. Add Users
  console.log("Seeding Users...");
  for (const user of DUMMY_USERS) {
    // Note: In a real app, you'd check if user exists first. 
    // Here we just add. You might want to manually clear DB first or handle duplicates.
    await addUser(user);
  }

  // 2. Add Suppliers
  console.log("Seeding Suppliers...");
  const supplierIds = [];
  for (const supplier of DUMMY_SUPPLIERS) {
    const ref = await addSupplier(supplier);
    supplierIds.push(ref.id);
  }

  // 3. Add Products & Initial Stock Movements
  console.log("Seeding Products...");
  const productIds = [];
  for (const product of DUMMY_PRODUCTS) {
    const ref = await addProduct(product);
    productIds.push({ id: ref.id, ...product });

    // Add initial stock movement
    await addStockMovement({
      date: Timestamp.now(),
      type: "IN",
      productId: ref.id,
      productName: product.name,
      quantity: product.quantity,
      reason: "Initial Stock",
      performedBy: "System Seeder"
    });
  }

  // 4. Generate Random Sales (Past 30 days)
  console.log("Seeding Sales...");
  const now = new Date();
  for (let i = 0; i < 20; i++) {
    // Random date within last 30 days
    const dateOffset = Math.floor(Math.random() * 30);
    const saleDate = new Date(now);
    saleDate.setDate(saleDate.getDate() - dateOffset);

    // Random items (1 to 5 items)
    const numItems = Math.floor(Math.random() * 5) + 1;
    const saleItems = [];
    let total = 0;

    for (let j = 0; j < numItems; j++) {
      const randomProduct = productIds[Math.floor(Math.random() * productIds.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const itemTotal = randomProduct.price * qty;
      
      saleItems.push({
        productId: randomProduct.id,
        name: randomProduct.name,
        quantity: qty,
        price: randomProduct.price
      });
      total += itemTotal;
    }

    await addSale({
      date: Timestamp.fromDate(saleDate),
      customerName: Math.random() > 0.5 ? "Client Comptoir" : `Client #${1000 + i}`,
      total: total,
      items: saleItems
    });
  }

  console.log("Database seeding completed!");
}
