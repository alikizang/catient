import { db } from "./firebase";
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";

export async function seedDatabase() {
  const batch = writeBatch(db);

  // 1. Roles
  const roles = [
    { id: "SUPERADMIN", name: "Super Admin", permissions: ["*"] },
    { id: "CAISSE", name: "Caisse", permissions: ["sales:create", "products:read"] },
    { id: "STOCK", name: "Stock", permissions: ["products:write", "stock:write"] },
  ];

  roles.forEach(role => {
    const roleRef = doc(db, "roles", role.id);
    batch.set(roleRef, role);
  });

  // 2. Sample Products
  const products = [
    {
      sku: "AMT-001",
      name: "Amortisseur AR - Yamaha",
      category: "Suspension",
      quantity: 15,
      price: 45000,
      minStock: 5,
    },
    {
      sku: "BATT-12V",
      name: "Batterie 12V 7Ah",
      category: "Électrique",
      quantity: 3,
      price: 18000,
      minStock: 5,
    },
    {
      sku: "HUILE-4T",
      name: "Huile Moteur 4T 10W40",
      category: "Entretien",
      quantity: 50,
      price: 4500,
      minStock: 20,
    },
  ];

  products.forEach(product => {
    const productRef = doc(collection(db, "products"));
    batch.set(productRef, product);
  });

  // 3. Sample Users (Note: Auth users must be created via Auth API, these are just DB records)
  const users = [
    {
      email: "admin@tvs-moto.com",
      name: "Prosper (Vous)",
      role: "SUPERADMIN",
      status: "active"
    },
    {
      email: "jean@tvs-moto.com",
      name: "Jean Vendeur",
      role: "CAISSE",
      status: "active"
    }
  ];

  users.forEach(user => {
    const userRef = doc(collection(db, "users"));
    batch.set(userRef, user);
  });

  await batch.commit();
  console.log("Database seeded successfully!");
}
