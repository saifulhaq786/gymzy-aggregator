# 🏋️ Gymzy — Location-Based Gym Aggregator

> Find, book, and access gyms near you. A complete platform for gym-goers and gym owners.

## 📦 Project Structure

```
GYMZY/
├── server/          # Node.js + Express REST API
├── mobile/          # React Native (Expo) iOS + Android App
└── admin/           # React Web Admin Dashboard (Phase 2)
```

---

## 🚀 Quick Start

### 1. Backend (Server)

```bash
cd server
cp .env.example .env          # Fill in your credentials
npm install
npm run seed                  # Seed sample gyms + test users
npm run dev                   # Start server on :5000
```

**Test Accounts (after seeding):**
| Role | Email | Password |
|---|---|---|
| Admin | admin@gymzy.com | Admin@123 |
| Gym Owner | owner@gymzy.com | Owner@123 |
| User | user@gymzy.com | User@123 |

### 2. Mobile App

```bash
cd mobile
npm install
npx expo start
```
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR with Expo Go app on your phone

---

## 🔑 Required Environment Variables

Copy `server/.env.example` to `server/.env` and fill in:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random secret string |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `CLOUDINARY_*` | Cloudinary account credentials |
| `RAZORPAY_*` | Razorpay API keys |

---

## 🗺️ Key Features

| Feature | Status |
|---|---|
| Email + Google + Phone OTP Auth | ✅ Complete |
| Location-based gym search | ✅ Complete |
| Gym detail (equipment, trainers, pricing) | ✅ Complete |
| Gym registration with document upload | ✅ Complete |
| Admin approval workflow | ✅ Complete |
| Booking system (hourly/daily/weekly/monthly) | ✅ Complete |
| Razorpay payment integration | ✅ Complete |
| QR code check-in | ✅ Complete |
| Reviews & ratings | ✅ Complete |
| Map view with markers | ✅ Complete |
| Push notifications | 🔜 Phase 2 |
| Gym dashboard for owners | 🔜 Phase 2 |
| Universal subscription | 🔜 Phase 2 |

---

## 📱 App Screens

### Auth
- **Login** — Email, Google, Phone OTP
- **Register** — With role selection (User / Gym Owner)
- **Phone OTP** — 6-digit OTP with resend timer

### User
- **Home** — Featured gyms, filters, nearby list
- **Map** — Interactive map with gym markers + radius selector
- **Gym Detail** — Images, tabs (about/equipment/trainers/reviews)
- **Booking** — Plan selector + Razorpay payment
- **My Bookings** — Status-filtered booking history with QR
- **Profile** — Stats, settings, role-based menu

### Gym Partner
- **Gym Registration** — 4-step wizard with document upload
- **Gym Dashboard** — (Phase 2)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + Google OAuth + Phone OTP |
| Payments | Razorpay |
| Files | Cloudinary |
| Maps | Google Maps (react-native-maps) |
| State | Zustand |
| Tokens | expo-secure-store |

---

## 📍 MongoDB Geospatial

The location-based search uses MongoDB's `$near` with `2dsphere` index:

```js
db.gyms.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [lng, lat] },
      $maxDistance: 5000  // 5km radius
    }
  },
  verificationStatus: "approved",
  isActive: true
})
```

---

## 🔐 Security

- JWT with refresh token rotation
- Passwords hashed with bcrypt (12 rounds)
- Rate limiting on auth routes (20 req/15min)
- Role-based middleware on all protected routes
- File type validation on all uploads
- `helmet` + `cors` configured

---

*Built with ❤️ using React Native + Node.js*
