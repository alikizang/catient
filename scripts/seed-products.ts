import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    process.exit(1);
  }
}

// Connect to the specific named database 'catient'
const db = getFirestore(admin.app(), 'catient');

const productsData = [
  // Image 6
  { typeMoto: "CG125", designation: "Pompe à huile / Oil pump" },
  { typeMoto: "AP110-2", designation: "Port disque / simple clutch disc" },
  { typeMoto: "125-8", designation: "Porte dent" },
  { typeMoto: "AP110-2", designation: "Porte dent" },
  { typeMoto: "126-8", designation: "Porte dent / Stroke setting" },
  { typeMoto: "AP125-8", designation: "Porte disque" },
  { typeMoto: "CG125", designation: "Porte disque" },
  { typeMoto: "AP110-8", designation: "Porte disque / Clutch assembly" },
  { typeMoto: "CG125", designation: "Porte disque / Clutch assembly (5-6)" },
  { typeMoto: "125-8", designation: "Pose pied" },
  { typeMoto: "AP110-8", designation: "Pose pied arrière" },
  { typeMoto: "125-10", designation: "pose pied plate" },
  { typeMoto: "AP125CG", designation: "Ressort béquille CG" },
  { typeMoto: "AP125GN", designation: "Ressort béquille GN" },
  { typeMoto: "AP125-8", designation: "Ressort béquille penchant" },
  { typeMoto: "AP125CG", designation: "Ressort frein CG" },
  { typeMoto: "AP125GN", designation: "Ressort frein GN" },
  { typeMoto: "AP125-8-1", designation: "Rétroviseur" },
  { typeMoto: "AP125-10", designation: "Rétroviseur" },
  { typeMoto: "AP110-8", designation: "Rétroviseur" },
  { typeMoto: "KA150", designation: "Rétroviseur" },
  { typeMoto: "AP110-2", designation: "Rearview Mirror / Rétroviseur" },
  { typeMoto: "AP110-3", designation: "Rearview Mirror / Rétroviseur" },
  { typeMoto: "AP125-10", designation: "Rearview Mirror / Rétroviseur" },
  { typeMoto: "CG", designation: "Ressort béquille penchant" },
  { typeMoto: "CG", designation: "Ressort frein" },
  { typeMoto: "AP125-8", designation: "Robinet" },
  { typeMoto: "AP125-8", designation: "Robinet" }, // Duplicate? keeping as per list
  { typeMoto: "602", designation: "roulement" },
  { typeMoto: "6204", designation: "roulement" },
  { typeMoto: "CG125", designation: "Roulement 6004" },
  { typeMoto: "AP125C", designation: "Roulement 6204" },
  { typeMoto: "CG125", designation: "Roulement 6301" },
  { typeMoto: "CG125", designation: "Roulement 6302" },
  { typeMoto: "CG125", designation: "Roulement / Bearing 6004" },
  { typeMoto: "CG125", designation: "Roulement / Bearing 6203" },
  { typeMoto: "CG125", designation: "Roulement / Bearing 6301" },
  { typeMoto: "CG125", designation: "Roulement / Bearing 6302" },
  { typeMoto: "AP110", designation: "Roulette Grande" },

  // Image 7
  { typeMoto: "AP110", designation: "Roulette Piton" },
  { typeMoto: "AP1102", designation: "Sincro" },
  { typeMoto: "AP110-3", designation: "Sincro de vitesse" },
  { typeMoto: "AP125-2", designation: "Sincro de vitesse" },
  { typeMoto: "CG125", designation: "Soupape" },
  { typeMoto: "AP110-2", designation: "Soupape / Engaine valve" },
  { typeMoto: "CG125", designation: "Soupape / Engaine valve" },
  { typeMoto: "AP110-2", designation: "Tapette culasse / Top tape" },
  { typeMoto: "AP125-8", designation: "Tapette culasse / Top tape" },
  { typeMoto: "AP125-8", designation: "Tapette cylindre / Rocker arm" },
  { typeMoto: "CG125", designation: "Tapette cylindre / Rocker arm" },
  { typeMoto: "AP110-2", designation: "Tendeur chaine motrice" },
  { typeMoto: "AP110-2", designation: "Tendeur chaine motrice" }, // Duplicate?
  { typeMoto: "AP125-10", designation: "Tendeur chaine / Chain adjust" },
  { typeMoto: "AP125-8", designation: "Tendeur chaine / Chain adjust" },
  { typeMoto: "KA150", designation: "Tendeur cylindre" },
  { typeMoto: "125-8", designation: "Tête bougie" },
  { typeMoto: "AP1258", designation: "Tête bougie" },
  { typeMoto: "AP125-8", designation: "Tête bougie / Plug cap" },
  { typeMoto: "CG", designation: "Tige culbuteur" },
  { typeMoto: "125-10", designation: "Tige de transmission" },
  { typeMoto: "125-8", designation: "Tige de transmission" },
  { typeMoto: "AP110", designation: "Tuyau d’essence" },
  { typeMoto: "125-8", designation: "Axe gérant" },
  { typeMoto: "125-8", designation: "Vilebrequin" },
  { typeMoto: "CG125", designation: "Vilebrequin / crankshaft" },
  { typeMoto: "KA150", designation: "Vitre phare" },
];

async function seedProducts() {
  console.log('🚀 Starting product seed (Targeting DB: catient)...');
  console.log(`Found ${productsData.length} new products to seed.`);

  const batch = db.batch();
  let operationCount = 0;
  const BATCH_SIZE = 450; 

  for (const item of productsData) {
    const cleanType = item.typeMoto.replace(/[^a-zA-Z0-9]/g, '');
    const cleanDesignation = item.designation.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5);
    const sku = `${cleanType}-${cleanDesignation}-${Math.random().toString(36).substring(7)}`.toUpperCase();

    const productRef = db.collection('products').doc();
    
    batch.set(productRef, {
      name: `${item.designation} (${item.typeMoto})`,
      typeMoto: item.typeMoto,
      designation: item.designation,
      sku: sku,
      quantity: 0, 
      price: 0, 
      minStock: 5, 
      category: 'General', 
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    operationCount++;

    if (operationCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`✅ Committed batch of ${operationCount} products`);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
    console.log(`✅ Committed final batch of ${operationCount} products`);
  }

  console.log('🎉 Product seeding completed!');
}

seedProducts().catch(console.error);
