const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

async function testCategoryVisibility() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('categoryvisibilities');
    
    // Test 1: Check if collection exists and has data
    const count = await collection.countDocuments();
    console.log(`📊 Found ${count} category visibility settings`);
    
    if (count === 0) {
      console.log('⚠️  No category visibility settings found. Run init-category-visibility.js first.');
      return;
    }
    
    // Test 2: Check sample data structure
    const sample = await collection.findOne();
    console.log('🔍 Sample category structure:');
    console.log(`   Category: ${sample.category}`);
    console.log(`   Visible: ${sample.isVisible}`);
    console.log(`   Display Name: ${sample.displayName}`);
    console.log(`   Sort Order: ${sample.sortOrder}`);
    console.log(`   Gender Visibility:`, sample.genderVisibility);
    
    // Test 3: Check specific categories
    const categories = ['tshirts', 'jerseys', 'hoodies'];
    for (const cat of categories) {
      const found = await collection.findOne({ category: cat });
      if (found) {
        console.log(`✅ ${cat}: ${found.isVisible ? 'visible' : 'hidden'}`);
      } else {
        console.log(`❌ ${cat}: not found`);
      }
    }
    
    // Test 4: Check gender visibility
    const menCategories = await collection.find({ 'genderVisibility.men': true }).toArray();
    const womenCategories = await collection.find({ 'genderVisibility.women': true }).toArray();
    const unisexCategories = await collection.find({ 'genderVisibility.unisex': true }).toArray();
    const kidsCategories = await collection.find({ 'genderVisibility.kids': true }).toArray();
    
    console.log(`👨 Men: ${menCategories.length} categories`);
    console.log(`👩 Women: ${womenCategories.length} categories`);
    console.log(`🚶 Unisex: ${unisexCategories.length} categories`);
    console.log(`👶 Kids: ${kidsCategories.length} categories`);
    
    // Test 5: Check sort order
    const sortedCategories = await collection.find().sort({ sortOrder: 1 }).toArray();
    console.log('📋 Categories by sort order:');
    sortedCategories.forEach(cat => {
      console.log(`   ${cat.sortOrder}. ${cat.category} (${cat.displayName})`);
    });
    
    console.log('\n🎉 Category visibility test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testCategoryVisibility().catch(console.error);
