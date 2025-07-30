const { connectToDatabase } = require('../src/lib/mongodb');
const TempOrder = require('../src/backend/models/TempOrder');

async function cleanupTempOrders() {
  try {
    await connectToDatabase();
    
    // Delete temp orders older than 2 hours (extra safety margin)
    const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000));
    
    const result = await TempOrder.deleteMany({
      createdAt: { $lt: twoHoursAgo }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old temporary orders`);
    
    // Also clean up any temp orders without proper data
    const invalidResult = await TempOrder.deleteMany({
      $or: [
        { orderDataKey: { $exists: false } },
        { items: { $exists: false } },
        { items: { $size: 0 } }
      ]
    });
    
    console.log(`Cleaned up ${invalidResult.deletedCount} invalid temporary orders`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up temp orders:', error);
    process.exit(1);
  }
}

cleanupTempOrders(); 