const { MongoClient } = require('mongodb');

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shirthappenz';

async function updateOrdersWithShippingFields() {
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
      
      // Add trackingNumber if not exists
      if (!order.shippingDetails?.trackingNumber) {
        if (!updateData['shippingDetails.trackingNumber']) {
          updateData['shippingDetails.trackingNumber'] = null;
          needsUpdate = true;
        }
      }
      
      // Add courier if not exists
      if (!order.shippingDetails?.courier) {
        if (!updateData['shippingDetails.courier']) {
          updateData['shippingDetails.courier'] = null;
          needsUpdate = true;
        }
      }
      
      // Add estimatedDelivery if not exists
      if (!order.shippingDetails?.estimatedDelivery) {
        if (!updateData['shippingDetails.estimatedDelivery']) {
          updateData['shippingDetails.estimatedDelivery'] = null;
          needsUpdate = true;
        }
      }
      
      // Add shippedAt if not exists
      if (!order.shippingDetails?.shippedAt) {
        if (!updateData['shippingDetails.shippedAt']) {
          updateData['shippingDetails.shippedAt'] = null;
          needsUpdate = true;
        }
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
updateOrdersWithShippingFields()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 