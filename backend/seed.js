/**
 * Seed a few demo users, mockups, and orders so you can log in and poke around
 * right after cloning. Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Mockup = require('./models/Mockup');
const Order = require('./models/Order');

const run = async () => {
  await connectDB();
  console.log('Clearing collections...');
  await Promise.all([User.deleteMany({}), Mockup.deleteMany({}), Order.deleteMany({})]);

  console.log('Creating users...');
  const designer = await User.create({
    name: 'Alex Rivera',
    email: 'designer@example.com',
    password: 'password123',
    role: 'designer',
  });
  const client = await User.create({
    name: 'Jamie Chen',
    email: 'client@example.com',
    password: 'password123',
    role: 'client',
  });

  console.log('Creating mockups...');
  const mockups = await Mockup.create([
    {
      name: 'Eco-Box Series V2',
      description: 'High-resolution sustainable packaging box mockup.',
      price: 49,
      category: 'Packaging',
      imageUrl: 'https://picsum.photos/seed/ecobox/800/600',
      designer: designer._id,
    },
    {
      name: 'Glass Dropper Kit',
      description: 'Essential cosmetics bottle kit including eyedropper detail.',
      price: 35,
      category: 'Bottles',
      imageUrl: 'https://picsum.photos/seed/dropper/800/600',
      designer: designer._id,
    },
    {
      name: 'Urban Tote Canvas',
      description: 'Natural fabric textures with realistic lighting.',
      price: 29,
      category: 'Apparel',
      imageUrl: 'https://picsum.photos/seed/tote/800/600',
      designer: designer._id,
    },
    {
      name: 'Studio Ceramic Mug',
      description: 'Matte finish ceramic mug with adjustable colours.',
      price: 19,
      category: 'Other',
      imageUrl: 'https://picsum.photos/seed/mug/800/600',
      designer: designer._id,
    },
  ]);

  console.log('Creating sample orders...');
  await Order.create([
    {
      client: client._id,
      mockup: mockups[0]._id,
      quantity: 3,
      unitPrice: mockups[0].price,
      totalPrice: mockups[0].price * 3,
      status: 'pending',
    },
    {
      client: client._id,
      mockup: mockups[1]._id,
      quantity: 1,
      unitPrice: mockups[1].price,
      totalPrice: mockups[1].price,
      status: 'in_production',
    },
  ]);

  console.log('\nSeed complete. Login with:');
  console.log('  Designer: designer@example.com / password123');
  console.log('  Client:   client@example.com / password123');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
