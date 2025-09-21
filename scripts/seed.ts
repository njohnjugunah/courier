import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only if not already initialized)
if (!getApps().length) {
  // For local development, you'll need to set GOOGLE_APPLICATION_CREDENTIALS
  // or provide service account credentials
  initializeApp({
    projectId: 'courier-pwa-5b980'
  });
}

const db = getFirestore();

async function seed() {
  try {
    console.log('Starting seed process...');
    
    // Seed destinations
    const destinations = [
      { name: 'Nairobi CBD', region: 'Nairobi', baseFee: 150 },
      { name: 'Westlands', region: 'Nairobi', baseFee: 120 },
      { name: 'Mombasa', region: 'Coast', baseFee: 250 },
      { name: 'Kisumu', region: 'Nyanza', baseFee: 200 },
      { name: 'Eldoret', region: 'Rift Valley', baseFee: 180 },
      { name: 'Nakuru', region: 'Rift Valley', baseFee: 160 }
    ];
    
    console.log('Seeding destinations...');
    for (const destination of destinations) {
      await db.collection('destinations').add({
        ...destination,
        createdAt: new Date()
      });
    }
    
    // Note: Staff documents will be created automatically when users first login
    // This is just an example of what the structure would look like
    console.log('Example staff document structure:');
    console.log({
      uid: 'USER_UID_FROM_FIREBASE_AUTH',
      name: 'Jane Dispatcher',
      phone: '+254700000000',
      role: 'admin', // or 'staff'
      createdAt: new Date()
    });
    
    console.log(' Seed process completed successfully!');
    console.log('- Added', destinations.length, 'destinations');
    console.log('- Staff documents will be created on first login');
    
  } catch (error) {
    console.error('Seed process failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

seed();