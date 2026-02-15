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

export interface Expense {
  id?: string;
  date: Timestamp;
  category: 'FIXED' | 'VARIABLE';
  type: string; // "Loyer", "Electricité", "Salaire", "Communication", "Autre"
  description: string;
  amount: number;
  performedBy: string; // Name of user who made the expense
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Partner {
  id?: string;
  name: string;
  type: 'CLIENT' | 'SUPPLIER';
  phone?: string;
  email?: string;
  address?: string;
  balance: number; // Positive = They owe us (Créance), Negative = We owe them (Dette)
  createdAt: Timestamp;
}

export interface Transaction {
  id?: string;
  date: Timestamp;
  partnerId: string;
  type: 'INVOICE' | 'PAYMENT'; // Invoice = Nouvelle dette/créance, Payment = Règlement
  amount: number;
  description: string;
  referenceId?: string; // ID de la vente ou de l'approvisionnement lié
  performedBy: string;
}

export interface Invoice {
  id?: string;
  type: 'PROFORMA' | 'INVOICE';
  number: string; // Ex: PRO-2023-001 or FAC-2023-001
  date: Timestamp;
  validUntil?: Timestamp; // For Proforma
  clientId?: string;
  clientName: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'DRAFT' | 'SENT' | 'CONVERTED_TO_SALE' | 'CANCELLED';
  saleId?: string; // If converted
  createdAt: Timestamp;
  createdBy: string;
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
    const supplyRef = doc(collection(db, "supplies"));
    
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

// --- Expenses ---
export async function getExpenses() {
  const q = query(collection(db, "expenses"), orderBy("date", "desc"), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
}

export async function addExpense(expense: Omit<Expense, "id">) {
  return await addDoc(collection(db, "expenses"), {
    ...expense,
    date: expense.date || Timestamp.now()
  });
}

export async function updateExpenseStatus(id: string, status: 'APPROVED' | 'REJECTED') {
  const expenseRef = doc(db, "expenses", id);
  await updateDoc(expenseRef, { status });
}

// --- Partners ---
export async function getPartners() {
  const q = query(collection(db, "partners"), orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Partner));
}

export async function addPartner(partner: Omit<Partner, "id">) {
  return await addDoc(collection(db, "partners"), {
    ...partner,
    createdAt: Timestamp.now()
  });
}

export async function getPartnerTransactions(partnerId: string) {
  const q = query(collection(db, "transactions"), where("partnerId", "==", partnerId), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
}

export async function addPartnerTransaction(transaction: Omit<Transaction, "id">) {
  try {
    await runTransaction(db, async (t) => {
      // 1. Create Transaction Record
      const transactionRef = doc(collection(db, "transactions"));
      t.set(transactionRef, {
        ...transaction,
        date: transaction.date || Timestamp.now()
      });

      // 2. Update Partner Balance
      const partnerRef = doc(db, "partners", transaction.partnerId);
      const partnerDoc = await t.get(partnerRef);
      if (!partnerDoc.exists()) throw "Partner not found";

      const currentBalance = partnerDoc.data().balance || 0;
      // If INVOICE (Dette/Créance augmentée) -> +Amount
      // If PAYMENT (Règlement) -> -Amount
      // Note: Logic depends on Partner Type.
      // Let's keep it simple: Balance = (Total Invoices) - (Total Payments)
      // Positive Balance = Client doit payer OR On a payé d'avance au fournisseur (Avance)
      // Wait, standard accounting:
      // Client: Debit (Doit) is positive. Credit (Payé) is negative.
      // Supplier: Credit (On doit) is positive? No, let's use signed numbers relative to US.
      // Let's stick to "Balance = What they owe us".
      // If Client buys on credit -> Balance Increases (+). Client pays -> Balance Decreases (-).
      // If We buy from Supplier on credit -> Balance Decreases (-) (We owe them). We pay Supplier -> Balance Increases (+) (Back to 0).
      
      // But to avoid confusion, let's just apply the amount signed from the UI.
      // UI sends +Amount for Debt Increase, -Amount for Debt Decrease.
      // Actually, let's do:
      // INVOICE (Facture émise ou reçue) : Increases the absolute debt.
      // PAYMENT (Règlement) : Decreases the absolute debt.
      
      // Let's rely on the `amount` sign passed.
      // If transaction.amount is positive, it adds to balance.
      
      const newBalance = currentBalance + transaction.amount;
      
      t.update(partnerRef, { balance: newBalance });
    });
  } catch (e) {
    console.error("Transaction failed:", e);
    throw e;
  }
}

// --- Documents (Invoices/Proforma) ---
export async function getInvoices() {
  const q = query(collection(db, "invoices"), orderBy("createdAt", "desc"), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
}

export async function addInvoice(invoice: Omit<Invoice, "id">) {
  return await addDoc(collection(db, "invoices"), {
    ...invoice,
    createdAt: Timestamp.now()
  });
}

export async function convertProformaToSale(invoiceId: string, saleData: Omit<Sale, "id">) {
  try {
    const batch = writeBatch(db);
    
    // 1. Create Sale
    const saleRef = doc(collection(db, "sales"));
    const saleId = saleRef.id;
    
    // Copy logic from addSale but in batch
    // We need to update stock for each item
    // Since we are in a batch, we can only do atomic increments, which is fine.
    
    // BUT we need to create stock movements too.
    for (const item of saleData.items) {
      const productRef = doc(db, "products", item.productId);
      batch.update(productRef, { 
        quantity: increment(-item.quantity) 
      });

      const movementRef = doc(collection(db, "movements"));
      batch.set(movementRef, {
        date: Timestamp.now(),
        type: 'OUT',
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        reason: `Vente (Ex-Proforma #${invoiceId})`,
        performedBy: "Caisse" 
      });
    }

    batch.set(saleRef, { ...saleData, date: Timestamp.now() });

    // 2. Update Invoice Status
    const invoiceRef = doc(db, "invoices", invoiceId);
    batch.update(invoiceRef, { 
      status: 'CONVERTED_TO_SALE',
      saleId: saleId
    });

    await batch.commit();
    return saleRef;

  } catch (e) {
    console.error("Conversion failed:", e);
    throw e;
  }
}
