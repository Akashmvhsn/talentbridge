const mongoose = require('mongoose');

module.exports = async function connectDB() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing in .env');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing in .env');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
};
