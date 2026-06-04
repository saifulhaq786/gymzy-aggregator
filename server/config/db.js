const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Create geospatial index on gyms collection
    mongoose.connection.once('open', async () => {
      try {
        const Gym = require('../models/Gym');
        await Gym.collection.createIndex({ location: '2dsphere' });
        console.log('📍 Geospatial index created on gyms.location');
      } catch (err) {
        // Index may already exist
      }
    });
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
