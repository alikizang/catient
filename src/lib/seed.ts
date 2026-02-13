import { Timestamp } from "firebase/firestore";
import { 
  getProducts,
  addUser, 
  addSale, 
  addSupplier, 
  addStockMovement,
  Product,
  User,
  Supplier
} from "./db";

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

  // 3. Get Real Products from DB
  console.log("Fetching existing products for simulation...");
  const products = await getProducts();
  
  if (products.length === 0) {
    console.warn("No products found in database. Skipping sales and movements generation.");
    return;
  }
  
  // 4. Generate Random Movements for Real Products (Simulation)
  console.log("Seeding Stock Movements...");
  for (let i = 0; i < 15; i++) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    if (!randomProduct.id) continue;

    const isIncoming = Math.random() > 0.5;
    
    await addStockMovement({
      date: Timestamp.now(),
      type: isIncoming ? "IN" : "OUT",
      productId: randomProduct.id,
      productName: randomProduct.name,
      quantity: Math.floor(Math.random() * 10) + 1,
      reason: isIncoming ? "Réassort fournisseur" : "Ajustement inventaire",
      performedBy: "System Seeder"
    });
  }

  // 5. Generate Random Sales (Past 30 days) using Real Products
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
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      if (!randomProduct.id) continue;

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
