const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

const defaultCategories = [
  {
    category: 'tshirts',
    isVisible: true,
    displayName: 'T-Shirts',
    description: 'Classic and comfortable t-shirts for everyday wear',
    sortOrder: 1,
    genderVisibility: { men: true, women: true, unisex: true, kids: true },
    updatedBy: 'system'
  },
  {
    category: 'jerseys',
    isVisible: true,
    displayName: 'Jerseys',
    description: 'Sporty jerseys for athletic performance',
    sortOrder: 2,
    genderVisibility: { men: true, women: true, unisex: true, kids: true },
    updatedBy: 'system'
  },
  {
    category: 'tanktops',
    isVisible: true,
    displayName: 'Tank Tops',
    description: 'Sleeveless tops perfect for workouts and warm weather',
    sortOrder: 3,
    genderVisibility: { men: true, women: true, unisex: false, kids: false },
    updatedBy: 'system'
  },
  {
    category: 'longsleeve',
    isVisible: true,
    displayName: 'Long Sleeve Shirts',
    description: 'Long sleeve shirts for cooler weather',
    sortOrder: 4,
    genderVisibility: { men: true, women: true, unisex: true, kids: true },
    updatedBy: 'system'
  },
  {
    category: 'hoodies',
    isVisible: true,
    displayName: 'Hoodies',
    description: 'Comfortable hoodies for casual wear',
    sortOrder: 5,
    genderVisibility: { men: true, women: true, unisex: true, kids: true },
    updatedBy: 'system'
  },
  {
    category: 'sweatshirts',
    isVisible: true,
    displayName: 'Sweatshirts',
    description: 'Warm and cozy sweatshirts',
    sortOrder: 6,
    genderVisibility: { men: true, women: true, unisex: true, kids: true },
    updatedBy: 'system'
  },
  {
    category: 'sweatpants',
    isVisible: true,
    displayName: 'Sweatpants',
    description: 'Comfortable sweatpants for casual wear',
    sortOrder: 7,
    genderVisibility: { men: true, women: true, unisex: false, kids: true },
    updatedBy: 'system'
  },
  {
    category: 'accessories',
    isVisible: true,
    displayName: 'Accessories',
    description: 'Various accessories to complement your outfit',
    sortOrder: 8,
    genderVisibility: { men: true, women: true, unisex: true, kids: true },
    updatedBy: 'system'
  },
  {
    category: 'shortsleeve',
    isVisible: true,
    displayName: 'Short Sleeve Shirts',
    description: 'Short sleeve shirts for warm weather',
    sortOrder: 9,
    genderVisibility: { men: true, women: true, unisex: true, kids: true },
    updatedBy: 'system'
  }
];

async function initializeCategoryVisibility() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('categoryvisibilities');
    
    // Check if categories already exist
    const existingCount = await collection.countDocuments();
    
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing category visibility settings. Skipping initialization.`);
      return;
    }
    
    // Insert default categories
    const result = await collection.insertMany(defaultCategories);
    console.log(`Successfully initialized ${result.insertedCount} category visibility settings:`);
    
    defaultCategories.forEach(cat => {
      console.log(`  - ${cat.category}: ${cat.displayName} (${cat.isVisible ? 'visible' : 'hidden'})`);
    });
    
    console.log('\nCategory visibility settings have been initialized successfully!');
    console.log('Admins can now manage these settings from the admin panel.');
    
  } catch (error) {
    console.error('Error initializing category visibility:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the initialization
initializeCategoryVisibility().catch(console.error);
