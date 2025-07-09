const { MongoClient } = require('mongodb');

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shirthappenz';

async function updateOrdersWithProductionFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    
    // Get all orders
    const orders = await ordersCollection.find({}).toArray();
    console.log(`Found ${orders.length} orders to update`);
    
    let updatedCount = 0;
    
    for (const order of orders) {
      const updateData = {};
      let needsUpdate = false;
      
      // Add productionStatus if not exists
      if (!order.productionStatus) {
        updateData.productionStatus = 'not_started';
        needsUpdate = true;
      }
      
      // Add deliveryPriority if not exists
      if (typeof order.deliveryPriority === 'undefined') {
        const priorityMap = {
          'Next Day Delivery': 100,
          'Express Delivery': 50,
          'Standard Delivery': 10
        };
        
        const basePriority = priorityMap[order.shippingDetails?.shippingMethod] || 10;
        const createdAt = new Date(order.createdAt);
        const daysSinceOrder = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        
        // Increase priority for older orders
        updateData.deliveryPriority = basePriority + (daysSinceOrder * 5);
        needsUpdate = true;
      }
      
      // Add productionNotes if not exists
      if (!order.productionNotes) {
        updateData.productionNotes = '';
        needsUpdate = true;
      }
      
      // Add productionStartDate if not exists
      if (!order.productionStartDate) {
        updateData.productionStartDate = null;
        needsUpdate = true;
      }
      
      // Add productionCompletedDate if not exists
      if (!order.productionCompletedDate) {
        updateData.productionCompletedDate = null;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: updateData }
        );
        updatedCount++;
        console.log(`Updated order ${order.reference || order._id}`);
      }
    }
    
    console.log(`\nUpdate complete! Updated ${updatedCount} orders out of ${orders.length} total orders.`);
    
  } catch (error) {
    console.error('Error updating orders:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the update
updateOrdersWithProductionFields()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 