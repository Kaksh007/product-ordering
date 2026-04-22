const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Options below are defaults in Mongoose 6+, kept explicit for clarity.
    });
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[db] Mongo connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
