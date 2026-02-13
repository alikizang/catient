import { db } from "./firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  Timestamp,
  where,
  doc,
  updateDoc
} from "firebase/firestore";

// --- Types ---
export interface Product {
  id?: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  quantity: number;
  minStock: number;
  imageUrl?: string;
  createdAt?: Timestamp;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

export interface Sale {
  id?: string;
  date: Timestamp;
  customerName: string;
  total: number;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface Supplier {
  id?: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}

export interface StockMovement {
  id?: string;
  date: Timestamp;
  type: 'IN' | 'OUT';
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  performedBy: string;
}

// --- Products ---
export async function getProducts() {
  const q = query(collection(db, "products"), orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function addProduct(product: Omit<Product, "id">) {
  return await addDoc(collection(db, "products"), {
    ...product,
    createdAt: Timestamp.now()
  });
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const productRef = doc(db, "products", id);
  await updateDoc(productRef, product);
}

// --- Users ---
export async function getUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

export async function getUserRole(email: string): Promise<string | null> {
  const q = query(collection(db, "users"), where("email", "==", email), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data().role;
}

export async function getUserProfile(email: string): Promise<User | null> {
  const q = query(collection(db, "users"), where("email", "==", email), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as User;
}

export async function updateUser(id: string, data: Partial<User>) {
  const userRef = doc(db, "users", id);
  await updateDoc(userRef, data);
}

export async function addUser(user: Omit<User, "id">) {
  return await addDoc(collection(db, "users"), {
    ...user,
    createdAt: Timestamp.now()
  });
}

// --- Sales ---
export async function getRecentSales() {
  const q = query(collection(db, "sales"), orderBy("date", "desc"), limit(5));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
}

export async function getAllSales() {
  const q = query(collection(db, "sales"), orderBy("date", "desc"), limit(100));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
}

export async function addSale(sale: Omit<Sale, "id">) {
  return await addDoc(collection(db, "sales"), {
    ...sale,
    date: sale.date || Timestamp.now()
  });
}

// --- Suppliers ---
export async function getSuppliers() {
  const q = query(collection(db, "suppliers"), orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
}

export async function addSupplier(supplier: Omit<Supplier, "id">) {
  return await addDoc(collection(db, "suppliers"), supplier);
}

// --- Stock Movements ---
export async function getStockMovements() {
  const q = query(collection(db, "movements"), orderBy("date", "desc"), limit(20));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement));
}

export async function addStockMovement(movement: Omit<StockMovement, "id">) {
  return await addDoc(collection(db, "movements"), {
    ...movement,
    date: movement.date || Timestamp.now()
  });
}
