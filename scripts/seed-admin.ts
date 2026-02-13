const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function seed() {
  console.log('🌱 Starting database seed...');

  // 1. Create Users
  const users = [
    {
      email: 'admin@tvs-moto.com',
      password: 'password123',
      displayName: 'Prosper (Admin)',
      role: 'SUPERADMIN',
    },
    {
      email: 'caisse@tvs-moto.com',
      password: 'password123',
      displayName: 'Jean Vendeur',
      role: 'CAISSE',
    },
    {
      email: 'stock@tvs-moto.com',
      password: 'password123',
      displayName: 'Paul Stock',
      role: 'STOCK',
    },
  ];

  for (const user of users) {
    try {
      // Create in Auth
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(user.email);
        console.log(`User ${user.email} already exists.`);
      } catch {
        userRecord = await auth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.displayName,
        });
        console.log(`Created Auth user: ${user.email}`);
      }

      // Create in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        name: user.displayName,
        email: user.email,
        role: user.role,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      console.log(`Synced Firestore profile for: ${user.email}`);
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
    }
  }

  // 2. Create Roles
  const roles = [
    { id: 'SUPERADMIN', name: 'Super Admin', permissions: ['*'] },
    { id: 'CAISSE', name: 'Caisse', permissions: ['sales:create', 'products:read'] },
    { id: 'STOCK', name: 'Stock', permissions: ['products:write', 'stock:write'] },
  ];

  for (const role of roles) {
    await db.collection('roles').doc(role.id).set(role, { merge: true });
  }
  console.log('✅ Roles seeded.');

  // 3. Create Products
  const products = [
    {
      sku: 'AMT-001',
      name: 'Amortisseur AR - Yamaha',
      category: 'Suspension',
      quantity: 15,
      price: 45000,
      minStock: 5,
    },
    {
      sku: 'BATT-12V',
      name: 'Batterie 12V 7Ah',
      category: 'Électrique',
      quantity: 3,
      price: 18000,
      minStock: 5,
    },
    {
      sku: 'HUILE-4T',
      name: 'Huile Moteur 4T 10W40',
      category: 'Entretien',
      quantity: 50,
      price: 4500,
      minStock: 20,
    },
  ];

  for (const product of products) {
    // Check if product exists by SKU to avoid duplicates
    const snapshot = await db.collection('products').where('sku', '==', product.sku).get();
    if (snapshot.empty) {
      await db.collection('products').add({
        ...product,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Created product: ${product.name}`);
    } else {
      console.log(`Product ${product.sku} already exists.`);
    }
  }

  console.log('✅ Database seed completed!');
}

seed().catch(console.error);
