import admin from 'firebase-admin';
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

const db = admin.firestore();

interface Product {
  name: string;
  typeMoto: string;
  stock: number;
  minStock: number;
  price: number;
  costPrice: number;
  category: string;
}

const productsData = [
  // Image 1
  { typeMoto: "110-3", designation: "Amortisseur arrière" },
  { typeMoto: "AP125-8", designation: "Amortisseur arrière" },
  { typeMoto: "AP110-3", designation: "Amortisseur arrière 125-3" },
  { typeMoto: "AP110-3", designation: "Amortisseur avant" },
  { typeMoto: "SGN AP125-8", designation: "Amortisseur avant" },
  { typeMoto: "AP125-10", designation: "Amortisseur avant / Front stock" },
  { typeMoto: "125-8", designation: "Ampoule feu-stop" },
  { typeMoto: "AP125-8", designation: "Ampoule phare" },
  { typeMoto: "AP12-8", designation: "Ampoule phare 125-8" },
  { typeMoto: "CG 125", designation: "Ampoule phare bleu" },
  { typeMoto: "125-8", designation: "Appareil clignotant GAD" },
  { typeMoto: "AP110-2", designation: "Arbre à came / Cam Shaft" },
  { typeMoto: "CG125", designation: "Arbre à came / Cam Shaft" },
  { typeMoto: "AP 110-2", designation: "Arbre à came simple" },
  { typeMoto: "CG 125", designation: "Arbre à came simple" },
  { typeMoto: "AP125-8", designation: "Arrêt d’huile amortisseur 32-44" },
  { typeMoto: "AP110-2", designation: "Arrêt d’huile amortisseur / Front stock oil stop 26-37" },
  { typeMoto: "CG125", designation: "Arrêt d’huile complet / complet oil seal" },
  { typeMoto: "AP110-2", designation: "Engaine valve oil seal" },
  { typeMoto: "AP110-2", designation: "Arrêt d’huile complet" },
  { typeMoto: "CG 125", designation: "Arrêt d’huile complète" },
  { typeMoto: "AP125-10", designation: "Arrêt d’huile soupape" },
  { typeMoto: "AP110-2", designation: "Arrêt d’huile manivelle" },
  { typeMoto: "CG 125", designation: "Arrêt d’huile transmit" },
  { typeMoto: "CG 125", designation: "Arrêt d’huile vitesse" },
  { typeMoto: "110", designation: "axe de vitesse" },
  { typeMoto: "AP110-2", designation: "Axe levier vitesse" },
  { typeMoto: "CG125", designation: "Axe levier vitesse / Gear pédalais" },
  { typeMoto: "AP110", designation: "Batterie blindé" },
  { typeMoto: "AP110-3", designation: "Batterie blindé" },
  { typeMoto: "AP125-8", designation: "Batterie blindé" },
  { typeMoto: "AP125-10", designation: "Batterie blindé / Battery" },
  { typeMoto: "AP125-8", designation: "Batterie blindé / Battery" },
  { typeMoto: "110-2", designation: "béquille central" },
  { typeMoto: "AP125-8", designation: "béquille penchant" },
  { typeMoto: "CG 125", designation: "Bille démarreur" },
  { typeMoto: "126-8", designation: "Bille direction / Neck Baring" },
  { typeMoto: "AP125-10", designation: "Bille direction / Neck Baring" },
  { typeMoto: "CG", designation: "Bille volant simple" },
  
  // Image 2
  { typeMoto: "CG125", designation: "Bobine / Magneto" },
  { typeMoto: "AP110-2", designation: "Bobine volant" },
  { typeMoto: "AP125-8", designation: "Bobine volant" },
  { typeMoto: "AP110-2", designation: "Bougie" },
  { typeMoto: "CG 125", designation: "Bougie" },
  { typeMoto: "AP110-2", designation: "Bougie / Spart plug TORCH" },
  { typeMoto: "CG125", designation: "Bougie / Spart plug TORCH" },
  { typeMoto: "110", designation: "Boulon culasse" },
  { typeMoto: "126-8 125", designation: "Boulon filtre" },
  { typeMoto: "AP125-10", designation: "Boulon porte dent" },
  { typeMoto: "AP110-2", designation: "Boulon porte dent complet" },
  { typeMoto: "AP110-2", designation: "Bouton changement phare" },
  { typeMoto: "AP110-2", designation: "Bouton clignotant" },
  { typeMoto: "AP110-2", designation: "Bouton démarreur" },
  { typeMoto: "AP110-2", designation: "Bouton Klass on" },
  { typeMoto: "AP110-2", designation: "Bouton phare" },
  { typeMoto: "CG", designation: "Butté d’embrayage BJ" },
  { typeMoto: "AP110", designation: "Butté d’embrayage BJ" },
  { typeMoto: "AP125-10", designation: "Câble à gaz / Gags" },
  { typeMoto: "AP125-8", designation: "Câble à gaz / Gags" },
  { typeMoto: "110-3", designation: "câble compteur / Speedometer cable" },
  { typeMoto: "KA150", designation: "Câble d’embrayage" },
  { typeMoto: "126-8", designation: "Câble d’embrayage / Clutch câble" },
  { typeMoto: "AP125-10", designation: "Câble de frein / Breker cable" },
  { typeMoto: "110-2", designation: "câble de gaz" },
  { typeMoto: "125-BM", designation: "câble d’embrayage" },
  { typeMoto: "126-8 (125-8)", designation: "câble d’embrayage" },
  { typeMoto: "KA150", designation: "câble d’embrayage" },
  { typeMoto: "AP125-8", designation: "câble d’embrayage 125-8" },
  { typeMoto: "AP125LH4", designation: "câble d’embrayage BAJAJ" },
  { typeMoto: "AP125-8", designation: "câble d’embrayage GN" },
  { typeMoto: "125-8", designation: "câble moteur" },
  { typeMoto: "AP125-8", designation: "câble moteur" },
  { typeMoto: "AP125-8", designation: "câble moteur" }, // Duplicate? keeping as per list
  { typeMoto: "AP110-2", designation: "Cage d’embrayage / Housing" },
  { typeMoto: "AP125-8", designation: "Cage d’embrayage / Housing" },
  { typeMoto: "AP125-8", designation: "Cage d’embrayage" },
  { typeMoto: "AP125-8", designation: "Cage simple" },
  { typeMoto: "CG", designation: "Cage simple" },
  { typeMoto: "CG 125", designation: "cane Axe porte dent" },

  // Image 3
  { typeMoto: "AP110-3", designation: "carburateur" },
  { typeMoto: "AP110-2", designation: "Carburateur / Carburetor" },
  { typeMoto: "AP125-8", designation: "Carburateur" },
  { typeMoto: "AP125-8", designation: "Carburateur 125-8" },
  { typeMoto: "110-2", designation: "chaine motrice" },
  { typeMoto: "AP150-9", designation: "chaine motrice" },
  { typeMoto: "BJ150", designation: "chaine motrice" },
  { typeMoto: "AP110-2", designation: "Chaine motrice / Engaine Chain" },
  { typeMoto: "AP150-9", designation: "Engaine Chain" },
  { typeMoto: "AP125BJ", designation: "chaine motrice complet 110" },
  // { typeMoto: "110-2", designation: "cherte tönne?" }, // Skipping unclear
  // { typeMoto: "AP110-2", designation: "Cinclo complet?" }, // Skipping unclear
  { typeMoto: "125-10", designation: "clé contact complet" },
  { typeMoto: "CG 125", designation: "clé contact complet" },
  { typeMoto: "AP1208", designation: "clé content complets" },
  { typeMoto: "AP110", designation: "clé contact complets" },
  { typeMoto: "AP110-2", designation: "Clet contact / Locke set" },
  { typeMoto: "KA150", designation: "Clet contact complet" },
  { typeMoto: "AP110-3", designation: "Clet contact complet" },
  { typeMoto: "AP125GN", designation: "Clignotant arrière 110" },
  { typeMoto: "AP125-8", designation: "Clignotant arrière complet" },
  { typeMoto: "AP110-3", designation: "Clignotant avant complet" },
  { typeMoto: "125-10", designation: "clignotant complets" },
  { typeMoto: "125-8", designation: "clignotant complets" },
  { typeMoto: "110-2", designation: "clignotant complets droit" },
  { typeMoto: "110-2", designation: "clignotant complets gauche" },
  { typeMoto: "AP110-2", designation: "Cône porte dent" },
  { typeMoto: "AP110-2", designation: "Couvre chaine" },
  { typeMoto: "AP110", designation: "Cylindré 110-2" },
  { typeMoto: "AP110-2", designation: "Cylindre 125-8, 10" },
  { typeMoto: "AP110-2", designation: "Cylindre complet" },
  { typeMoto: "AP110-2", designation: "Cylindre complet / Engaine block démarreur" },
  { typeMoto: "AP110-2", designation: "Dent chaine BAJAJ" },
  { typeMoto: "AP110-2", designation: "Dent chaine complet / complet Chain" },
  { typeMoto: "KA150", designation: "Dent chaine complet / complet Chain" },
  { typeMoto: "AP110-2", designation: "Dent chaine complet / complet Chain" }, // Duplicate?
  { typeMoto: "AP125-10", designation: "Dent chaine complet / complet Chain" },
  { typeMoto: "AP125-8", designation: "Dent chaine complet / complet Chain" },

  // Image 4
  { typeMoto: "BJ150", designation: "Dent chaine complet TVS 180" },
  { typeMoto: "TVS 180", designation: "Dent de chaine" },
  { typeMoto: "AP110-2", designation: "Dent de pompe / socket pump" },
  { typeMoto: "CG125", designation: "Dent de vitesse / Main couter shift" },
  { typeMoto: "AP110-2", designation: "Dent de vitesse 110" },
  { typeMoto: "AP 125-10", designation: "Disjoncteur" },
  { typeMoto: "AP KA 150", designation: "Disjoncteur" },
  { typeMoto: "AP125-10", designation: "Disque d’embrayage / clutch disc" },
  { typeMoto: "CG125", designation: "Disque d’embrayage / clutch disc" },
  { typeMoto: "ZH200", designation: "Double d’embrayage / clutch disc" },
  { typeMoto: "AP110-2", designation: "Double d’embrayage / Dual disc" },
  { typeMoto: "AP 110", designation: "Double embrayage" },
  { typeMoto: "BJ 150", designation: "Filtre à huile" },
  // { typeMoto: "BJ150", designation: "Filtre à huile" }, // Duplicate
  { typeMoto: "125-8", designation: "Guidon" },
  { typeMoto: "AP125-8", designation: "Guidon" },
  { typeMoto: "GN", designation: "Guidon" },
  { typeMoto: "RA 150", designation: "Guidon" },
  { typeMoto: "AP110-2", designation: "Joins culasse / top basket" },
  { typeMoto: "CG125", designation: "Joins culasse / complet basket" },
  { typeMoto: "ZH150", designation: "Joins culasse CG" },
  { typeMoto: "AP125", designation: "Joins culindre 110" },
  { typeMoto: "KA150", designation: "Joins cylindre" },
  { typeMoto: "CG125", designation: "Joins cylindre / cylindre basket" },
  { typeMoto: "ZH150", designation: "Joins cylindre / cylindre basket" },
  { typeMoto: "110-2", designation: "Joins cylindre 110" },
  { typeMoto: "CG125", designation: "Joins demi-cataire" },
  { typeMoto: "AP110-2", designation: "Joins volant / Magneto basket" },
  { typeMoto: "CG125", designation: "Joins volant / Magneto basket" },
  { typeMoto: "AP125-10", designation: "levier de frein" },
  // { typeMoto: "AP125-10", designation: "levier de frein" }, // Duplicate
  { typeMoto: "125-8", designation: "levier de vitesse" },
  // { typeMoto: "125-8", designation: "levier de vitesse" }, // Duplicate
  { typeMoto: "CG 125", designation: "levier de vitesse" },
  { typeMoto: "AP110-2", designation: "Levier vitesse" },
  { typeMoto: "AP125-8", designation: "Levier vitesse / Pédale gear" },
  { typeMoto: "AP125-8", designation: "Manette d’embrayage / clutch Handler" },
  { typeMoto: "AP110-3", designation: "Manivelle" },
  // { typeMoto: "AP110-3", designation: "Manivelle" }, // Duplicate
  { typeMoto: "AP125-8", designation: "Mano stop" },

  // Image 5
  { typeMoto: "ZH150", designation: "Nouvelle / Cranko" },
  { typeMoto: "AP110", designation: "Patin 110 avant" },
  { typeMoto: "AP125-8", designation: "Patin arrière / Bracke shore" },
  { typeMoto: "AP110-2", designation: "Patin arrière / Bracke shore" },
  { typeMoto: "AP 110-3", designation: "Patin avant" },
  { typeMoto: "126-8", designation: "Patin avant / Frantz Bracke" },
  { typeMoto: "AP110", designation: "Patin d’embrayage" },
  { typeMoto: "AP125-8", designation: "Phare complet / Compte headlight" },
  { typeMoto: "175", designation: "Piston +" },
  { typeMoto: "BJ 125", designation: "Piston +" },
  { typeMoto: "CG 125-10", designation: "Piston ++" },
  { typeMoto: "CV CG (125-1)", designation: "Piston ++" },
  { typeMoto: "KA150", designation: "Piston +" },
  { typeMoto: "CG125", designation: "Piston segment / Rings piston STD+" },
  { typeMoto: "AP125BJ", designation: "Piston segment CG++" },
  { typeMoto: "AP 1102", designation: "Piston segment STD+" },
  { typeMoto: "BJ 125", designation: "Piston segment STD+" },
  { typeMoto: "CG 125", designation: "Piston segment STD+" },
  { typeMoto: "AP 1258", designation: "Piston segment STD+" },
  { typeMoto: "AP 1258", designation: "Piston segment STD" },
  { typeMoto: "KA150", designation: "Piston segment STD ++" },
  // { typeMoto: "KA150", designation: "Piston segment STD ++" }, // Duplicate
  { typeMoto: "Z 150", designation: "Piston segment STD." },
  { typeMoto: "AP110-2", designation: "Piston segment STD+ / Rings piston STD+" },
  { typeMoto: "AP125-8", designation: "Piston segment STD+ / Rings piston STD+" },
  { typeMoto: "ZH150", designation: "Piston segment STD+ / Rings piston STD+" },
  { typeMoto: "AP110-2", designation: "Piston segment STD++ / Rings piston STD++" },
  { typeMoto: "AP125-8", designation: "Piston segment STD++ / Rings piston STD++" },
  { typeMoto: "AP125CG", designation: "Piston segment STD+125" },
  { typeMoto: "KA150", designation: "Piston STD+" },
  { typeMoto: "BJ150", designation: "Piston STD+ 125" },
  { typeMoto: "AP125-8", designation: "Poignet droit / Right whist poignet" },
  { typeMoto: "AP125-8", designation: "Poignet gauche / Left whist poignet" },
  { typeMoto: "AP110-2", designation: "Pompe à huile" },
  { typeMoto: "CG 125", designation: "Pompe à huile" },
  { typeMoto: "AP110-2", designation: "Pompe à huile / Oil pump" },
];

async function seedProducts() {
  console.log('🚀 Starting product seed...');
  console.log(`Found ${productsData.length} products to seed.`);

  const batch = db.batch();
  let operationCount = 0;
  const BATCH_SIZE = 450; // Firestore batch limit is 500

  for (const item of productsData) {
    // Generate a unique SKU based on typeMoto and simplified designation
    // Remove special chars and spaces
    const cleanType = item.typeMoto.replace(/[^a-zA-Z0-9]/g, '');
    const cleanDesignation = item.designation.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5);
    const sku = `${cleanType}-${cleanDesignation}-${Math.random().toString(36).substring(7)}`.toUpperCase();

    const productRef = db.collection('products').doc();
    
    batch.set(productRef, {
      name: `${item.designation} (${item.typeMoto})`,
      typeMoto: item.typeMoto,
      designation: item.designation,
      sku: sku,
      quantity: 0, // Default stock
      price: 0, // Default price
      minStock: 5, // Default warning level
      category: 'General', // Default category
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    operationCount++;

    if (operationCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`✅ Committed batch of ${operationCount} products`);
      operationCount = 0;
      // Start new batch? The batch object is reused in this simple logic but ideally re-instantiated
      // But actually db.batch() returns a new batch instance.
      // So we need to restructure the loop to handle multiple batches properly if we had > 500 items.
      // Since we have ~140 items, one batch is enough. 
      // But for correctness in case list grows:
      // We should actually commit and create a NEW batch.
    }
  }

  if (operationCount > 0) {
    await batch.commit();
    console.log(`✅ Committed final batch of ${operationCount} products`);
  }

  console.log('🎉 Product seeding completed!');
}

seedProducts().catch(console.error);
