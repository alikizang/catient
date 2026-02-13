import { db } from "./firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  Timestamp
} from "firebase/firestore";

// --- Types ---
export interface Product {
  id?: string;
  name: string;
  sku: string;
  category?: string;
  price: number;
  quantity: number;
  minStock: number;
  createdAt?: Timestamp;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
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
  const { doc, updateDoc } = await import("firebase/firestore");
  const productRef = doc(db, "products", id);
  await updateDoc(productRef, product);
}

// --- Users ---
export async function getUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

export async function getUserRole(email: string): Promise<string | null> {
  const { where } = await import("firebase/firestore");
  const q = query(collection(db, "users"), where("email", "==", email), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data().role;
}

export async function getUserProfile(email: string): Promise<User | null> {
  const { where } = await import("firebase/firestore");
  const q = query(collection(db, "users"), where("email", "==", email), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as User;
}

export async function updateUser(id: string, data: Partial<User>) {
  const { doc, updateDoc } = await import("firebase/firestore");
  const userRef = doc(db, "users", id);
  await updateDoc(userRef, data);
}

// --- Sales ---
export async function getRecentSales() {
  const q = query(collection(db, "sales"), orderBy("date", "desc"), limit(5));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
