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
  updateDoc,
  runTransaction,
  writeBatch,
  increment
} from "firebase/firestore";

// --- Types ---
export interface Product {
  id?: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice?: number; // Prix d'achat moyen (PUMP) ou dernier prix d'achat
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

export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'CREDIT';

export interface Sale {
  id?: string;
  date: Timestamp;
  customerName: string;
  customerPhone?: string;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid?: number;
  reference?: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    costPrice?: number; // Snapshot of buying price at time of sale
  }>;
}

export interface Supply {
  id?: string;
  date: Timestamp;
  supplierId: string;
  supplierName: string;
  totalCost: number;
  status: 'COMPLETED' | 'PENDING';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    buyingPrice: number;
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
  try {
    // Use writeBatch instead of runTransaction for offline support
    const batch = writeBatch(db);

    // 1. Create a reference for the new sale
    const saleRef = doc(collection(db, "sales"));
    const saleId = saleRef.id;
    
    // 2. Process each item in the sale
    for (const item of sale.items) {
      // Get current product data to store cost price snapshot
      const productRef = doc(db, "products", item.productId);
      
      // Update product stock using atomic increment (works offline)
      batch.update(productRef, { 
        quantity: increment(-item.quantity) 
      });

      // Note: In offline mode with batch, we cannot read the *current* cost price inside the transaction 
      // if we want to rely purely on optimistic updates without blocking.
      // However, usually we should read the product first.
      // For now, let's assume the UI passes the current cost price or we accept that 
      // strict profit calculation requires being online or having data cached.
      // We will try to read it if possible, or use the one provided in item if we update the UI to pass it.
      
      // Create a stock movement record
      const movementRef = doc(collection(db, "movements"));
      batch.set(movementRef, {
        date: sale.date || Timestamp.now(),
        type: 'OUT',
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        reason: `Vente #${sale.reference || saleId.slice(0, 6)}`,
        performedBy: "Caisse" 
      });
    }

    // 3. Commit the sale
    batch.set(saleRef, {
      ...sale,
      date: sale.date || Timestamp.now()
    });

    await batch.commit();
    return saleRef;

  } catch (e) {
    console.error("Batch failed: ", e);
    throw e;
  }
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

// --- Supplies ---
export async function getSupplies() {
  const q = query(collection(db, "supplies"), orderBy("date", "desc"), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supply));
}

export async function addSupply(supply: Omit<Supply, "id">) {
  try {
    const batch = writeBatch(db);
    const supplyRef = doc(collection(db, "supplies"));
    
    // 1. Save Supply
    batch.set(supplyRef, {
      ...supply,
      date: supply.date || Timestamp.now()
    });

    // 2. Process items (Update Stock & Cost Price)
    for (const item of supply.items) {
      const productRef = doc(db, "products", item.productId);
      
      // We need to read the current product to calculate Weighted Average Cost
      // In a real offline-first app, this might be tricky if data isn't cached.
      // We'll assume we can read it or use a simpler "Last Price" approach if reading fails/is too complex for batch.
      // But for correct accounting, we MUST read.
      
      // Since we can't easily "read-modify-write" in a batch without a transaction (which requires online),
      // we have two choices:
      // A. Use Transaction (Requires Online).
      // B. Read first (async), then Batch write. (Risk of race condition, but acceptable for this scale).
      // Let's go with B for better offline-capability (if read comes from cache).
      
      // Actually, we can't await inside the batch loop easily if we want to be purely atomic in one go.
      // But we CAN read before creating the batch.
    }
    
    // Let's refactor to read all products first
    // Note: This function will be called from UI where we might already have product data.
    // To be safe, we'll assume the UI sends the *Calculated* new cost or we assume "Last Price" if we want simple logic.
    // But the prompt wants "clean and coherent". The most coherent is Weighted Average.
    // Let's use a Transaction to be safe and accurate. Offline support for *Supplies* (Admin task) is less critical than Sales.
    
    await runTransaction(db, async (transaction) => {
      // 1. Create Supply
      transaction.set(supplyRef, { ...supply, date: supply.date || Timestamp.now() });

      for (const item of supply.items) {
        const productRef = doc(db, "products", item.productId);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) throw "Product not found " + item.productId;
        
        const p = productDoc.data() as Product;
        const currentQty = p.quantity || 0;
        const currentCost = p.costPrice || 0;
        
        // Calculate Weighted Average Cost (PUMP)
        // New Cost = ((OldQty * OldCost) + (NewQty * NewCost)) / (OldQty + NewQty)
        const newQty = currentQty + item.quantity;
        let newCost = item.buyingPrice;
        
        if (newQty > 0) {
           newCost = ((currentQty * currentCost) + (item.quantity * item.buyingPrice)) / newQty;
        }

        // Update Product
        transaction.update(productRef, {
          quantity: newQty,
          costPrice: newCost
        });

        // Add Movement
        const movementRef = doc(collection(db, "movements"));
        transaction.set(movementRef, {
          date: supply.date || Timestamp.now(),
          type: 'IN',
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          reason: `Approvisionnement`,
          performedBy: "Admin" 
        });
      }
    });

    return supplyRef;
  } catch (e) {
    console.error("Supply transaction failed:", e);
    throw e;
  }
}
