require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Gym = require('../models/Gym');
const Trainer = require('../models/Trainer');

const SAMPLE_GYMS = [
  {
    name: 'PowerHouse Fitness',
    description: 'Premium gym with state-of-the-art equipment and certified trainers.',
    coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80'
    ],
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716], // Bangalore
      address: '123 MG Road, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
    },
    contact: { phone: '+91-9876543210', email: 'powerhouse@gym.com' },
    facilities: ['AC', 'Parking', 'Locker Room', 'Shower', 'Cafe/Juice Bar', 'Personal Training'],
    equipment: [
      { name: 'Treadmill', count: 8, brand: 'Life Fitness', condition: 'excellent' },
      { name: 'Elliptical', count: 4, brand: 'Precor', condition: 'excellent' },
      { name: 'Bench Press', count: 5, brand: 'Hammer Strength', condition: 'good' },
      { name: 'Squat Rack', count: 4, brand: 'Rogue', condition: 'excellent' },
      { name: 'Dumbbells (5-50kg)', count: 1, brand: 'Bodycraft', condition: 'good' },
      { name: 'Cable Machine', count: 3, brand: 'Life Fitness', condition: 'excellent' },
    ],
    pricing: { hourly: 150, daily: 300, weekly: 1500, monthly: 4000 },
    capacity: 60,
    currentOccupancy: 15,
    rating: 4.7,
    totalReviews: 238,
    verificationStatus: 'approved',
    isActive: true,
    isFeatured: true,
    tags: ['premium', '24/7', 'certified-trainers'],
  },
  {
    name: 'FitZone Pro',
    description: 'Affordable and clean gym for all fitness levels.',
    coverImage: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80'
    ],
    location: {
      type: 'Point',
      coordinates: [77.6101, 12.9352],
      address: '45 HSR Layout, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560102',
    },
    contact: { phone: '+91-9876543211', email: 'fitzone@gym.com' },
    facilities: ['AC', 'Locker Room', 'Shower', 'Free Weights', 'Cardio Zone'],
    equipment: [
      { name: 'Treadmill', count: 5, brand: 'Cosco', condition: 'good' },
      { name: 'Stationary Bike', count: 3, condition: 'good' },
      { name: 'Multi Gym Station', count: 2, condition: 'good' },
      { name: 'Dumbbells (2-40kg)', count: 1, condition: 'good' },
      { name: 'Barbell Set', count: 3, condition: 'fair' },
    ],
    pricing: { hourly: 80, daily: 150, weekly: 800, monthly: 2000 },
    capacity: 40,
    currentOccupancy: 22,
    rating: 4.2,
    totalReviews: 115,
    verificationStatus: 'approved',
    isActive: true,
    tags: ['budget', 'beginner-friendly'],
  },
  {
    name: 'Zen Yoga & Wellness',
    description: 'Holistic wellness center offering yoga, pilates, and meditation.',
    coverImage: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=800&q=80'
    ],
    location: {
      type: 'Point',
      coordinates: [77.6408, 12.9141],
      address: '78 Koramangala, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
    },
    contact: { phone: '+91-9876543212', email: 'zen@wellness.com' },
    facilities: ['AC', 'Yoga Studio', 'Locker Room', 'Shower', 'WiFi'],
    equipment: [
      { name: 'Yoga Mats', count: 30 },
      { name: 'Resistance Bands', count: 20 },
      { name: 'Foam Rollers', count: 15 },
      { name: 'Pilates Reformer', count: 5, brand: 'Balanced Body' },
    ],
    pricing: { hourly: 200, daily: 400, weekly: 2000, monthly: 5500 },
    capacity: 25,
    currentOccupancy: 8,
    rating: 4.9,
    totalReviews: 310,
    verificationStatus: 'approved',
    isActive: true,
    isFeatured: true,
    tags: ['yoga', 'women-friendly', 'wellness', 'premium'],
  },
];

const SAMPLE_TRAINERS = [
  {
    name: 'Rajesh Kumar',
    bio: '8 years of experience in bodybuilding and strength training. National level powerlifter.',
    photo: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&h=200&q=80',
    specializations: ['Muscle Building', 'Bodybuilding', 'Functional Training'],
    certifications: ['NASM CPT', 'ACE Certified', 'Precision Nutrition Level 1'],
    experience: 8,
    pricing: { perSession: 600, monthly: 6000 },
    availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    rating: 4.8,
    isCertified: true,
  },
  {
    name: 'Priya Sharma',
    bio: 'Certified yoga instructor and nutrition consultant with 5 years experience.',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80',
    specializations: ['Yoga', 'Weight Loss', 'Nutrition'],
    certifications: ['RYT-200', 'ISSA Nutrition'],
    experience: 5,
    pricing: { perSession: 500, monthly: 5000 },
    availability: ['Mon', 'Wed', 'Fri', 'Sat'],
    rating: 4.9,
    isCertified: true,
  },
  {
    name: 'Arjun Singh',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    bio: 'CrossFit Level 2 trainer. Specializes in HIIT and athletic conditioning.',
    specializations: ['CrossFit', 'HIIT', 'Cardio'],
    certifications: ['CrossFit L2', 'TRX Certified'],
    experience: 4,
    pricing: { perSession: 450, monthly: 4500 },
    availability: ['Tue', 'Thu', 'Sat', 'Sun'],
    rating: 4.6,
    isCertified: true,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔌 Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Gym.deleteMany({}),
      Trainer.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Gymzy Admin',
      email: process.env.ADMIN_EMAIL || 'admin@gymzy.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
      isVerified: true,
    });
    console.log(`✅ Admin created: ${admin.email}`);

    // Create a gym owner
    const owner = await User.create({
      name: 'Test Gym Owner',
      email: 'owner@gymzy.com',
      password: 'Owner@123',
      role: 'gym_owner',
      isVerified: true,
    });
    console.log(`✅ Gym Owner created: ${owner.email}`);

    // Create test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'user@gymzy.com',
      password: 'User@123',
      role: 'user',
      isVerified: true,
    });
    console.log(`✅ Test User created: ${testUser.email}`);

    // Create gyms
    const gyms = await Gym.insertMany(SAMPLE_GYMS.map((g) => ({ ...g, ownerId: owner._id })));
    console.log(`✅ ${gyms.length} sample gyms created`);

    // Create trainers and link to gyms
    for (let i = 0; i < SAMPLE_TRAINERS.length; i++) {
      const gymId = gyms[i % gyms.length]._id;
      const trainer = await Trainer.create({ ...SAMPLE_TRAINERS[i], gymId });
      await Gym.findByIdAndUpdate(gymId, { $push: { trainers: trainer._id } });
    }
    console.log(`✅ ${SAMPLE_TRAINERS.length} trainers created`);

    console.log('\n🎉 Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:    admin@gymzy.com  / Admin@123');
    console.log('Owner:    owner@gymzy.com  / Owner@123');
    console.log('User:     user@gymzy.com   / User@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
};

seed();
