# 📍 NearPro - On-Demand Home Services Marketplace

NearPro is a modern, real-time, on-demand home services marketplace application (similar to Uber or Urban Company). It allows customers to book various services (plumbing, cleaning, electrical, etc.), match with nearby workers, track worker locations in real-time, and handle transactions seamlessly.

---

## 🛠️ Architecture & Tech Stack

NearPro is structured as a multi-application repository containing the following services:

### 1. 🖥️ Backend API & WebSockets Server (`/`)
- **Runtime:** [Bun](https://bun.sh/) (Fast JS runtime)
- **Framework:** Express.js (REST API Endpoints)
- **Real-Time Communication:** Socket.IO with Redis Adapter (for real-time worker tracking & notifications)
- **Database ORM:** Prisma ORM
- **Database:** PostgreSQL with **PostGIS** extension (for spatial routing, geofencing, and proximity queries)
- **Caching & Pub/Sub:** Redis
- **Auth & Services:** Supabase Auth (legacy fallback support), Firebase Admin SDK (for FCM Push Notifications)
- **File Uploads:** AWS S3 (for worker verification documents & pictures) or local file storage fallback

### 2. 🛡️ Admin Panel Dashboard (`/admin-app`)
- **Tech Stack:** React (v19) + TypeScript + Vite
- **Purpose:** Admin portal to manage cities, service categories, pricing tables, view active bookings, and verify worker profiles.

### 3. 🌐 Customer Web Application (`/customer-web-app`)
- **Tech Stack:** React (v19) + TypeScript + Vite + Leaflet Maps
- **Purpose:** Web-based interface for customers to browse service categories, check pricing, book services, and track workers on a map in real-time.

### 4. 📱 Customer Mobile App (`/customer-app`)
- **Tech Stack:** React Native (Expo) + TypeScript + React Navigation + Leaflet/Native Maps
- **Purpose:** Cross-platform mobile application for customers to book services on the go.

### 5. 👷 Partner/Worker Mobile App (`/partner-app`)
- **Tech Stack:** React Native (Expo) + TypeScript + Background Location Services
- **Purpose:** Mobile application for service providers (workers) to set their online status, receive job bookings, stream real-time location coordinates, update work progress, and view payout/earnings logs.

### 6. 📝 Snabit Code Sandbox Client (`/snabit/client`)
- **Tech Stack:** React + Vite + TypeScript
- **Purpose:** A sandbox/playground client for managing and executing serverless Javascript code snippets.

---

## 🔑 Default Credentials (महत्वपूर्ण लॉगिन)
For local testing or seeded database configurations:
- **Default ID / Username:** `Shubh`
- **Default Password:** `Shubh@1234`

---

## 🚀 Quick Start Guide (चलाने की विधि)

### Prerequisites (आवश्यक चीजें)
Make sure you have the following installed:
- [Bun Runtime](https://bun.sh/) (Highly recommended for fast execution)
- [Node.js](https://nodejs.org/) (Required for Expo CLI and React Native packing)
- [Docker](https://www.docker.com/) (Required for running PostgreSQL + PostGIS & Redis container locally)
- [Expo Go App](https://expo.dev/client) (On your Android/iOS device to run and test mobile applications)

---

## ⚙️ Environment Configuration

1. Locate the `.env.example` file in the root directory.
2. Copy it to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill out your credentials. Here are the core variables needed for local operation:
   - `DATABASE_URL`: Your PostgreSQL connection string (needs to have PostGIS extension enabled).
   - `REDIS_URL`: Redis connection URL (e.g., `redis://localhost:6379`).
   - `JWT_SECRET`: Secret token for JWT session signing.
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: Required if using Supabase features.
   - `GOOGLE_MAPS_API_KEY`: Required for maps and geolocation services.

---

## 📦 Dependency Installation

Before running the projects, you must install dependencies for each app. Run the following commands in the root directory:

```bash
# 1. Install root dependencies (Backend and general packages)
bun install

# 2. Install Admin Dashboard dependencies
cd admin-app && bun install && cd ..

# 3. Install Customer Web App dependencies
cd customer-web-app && bun install && cd ..

# 4. Install Customer Mobile App dependencies
cd customer-app && bun install && cd ..

# 5. Install Partner Mobile App dependencies
cd partner-app && bun install && cd ..

# 6. Install Snabit Client dependencies
cd snabit/client && bun install && cd ../..
```

---

## 🏃‍♂️ How to Run the Project (प्रोजेक्ट कैसे रन करें)

You can run each of the applications using the root-level scripts defined in the root `package.json`, or navigate to each directory manually.

### Step 1: Start Database & Redis (Docker)
Start the local PostGIS PostgreSQL and Redis containers:
```bash
bun run redis:up
```
*(Alternatively, run `docker compose up -d` in the root folder).*

### Step 2: Push Database Schema & Seed Data
Push the Prisma schemas to your database and run the seeds to populate operational cities, categories, and test data:
```bash
# Push schema structure to Database
bun run db:push

# Seed default cities, categories, pricing & admin
bun run db:seed
```

### Step 3: Run the Services (अलग-अलग एप्लिकेशन चलाएं)

Here are the commands to start the different apps. Open separate terminal windows for each:

#### 🟢 1. Backend API Server (Port: 4000)
Starts the Express API and Socket.io tracking server:
```bash
bun run backend
```

#### 🔵 2. Admin Dashboard Panel (Vite Web App)
Starts the Admin portal locally:
```bash
bun run admin
```

#### 🟡 3. Customer Web App (Vite Web App)
Starts the customer portal for booking services on the browser:
```bash
bun run customer-web
```

#### 📱 4. Customer Mobile Application (Expo App - Port: 8081)
Starts the customer app for Android/iOS:
```bash
bun run customer-mobile
```
*Press `a` for Android emulator, `i` for iOS simulator, or scan the QR code using the **Expo Go** app on your phone.*

#### 👷 5. Partner Mobile Application (Expo App - Port: 8082)
Starts the service provider/worker app for Android/iOS:
```bash
bun run partner-mobile
```
*Press `a` for Android emulator, `i` for iOS simulator, or scan the QR code using the **Expo Go** app on your phone.*

#### 📝 6. Snabit Sandbox Client (Vite Web App)
Starts the Snabit code executor client:
```bash
cd snabit/client && bun run dev
```

---

## 📁 Repository Structure
```
NearPro/
├── admin-app/           # React Admin Dashboard
├── customer-app/        # React Native Customer App (Expo)
├── customer-web-app/    # React Customer Web Portal (Vite)
├── partner-app/         # React Native Worker App (Expo)
├── snabit/              # Sandbox/Playground Client & Submodule
├── src/                 # Backend Core Code (Express, Socket.io, Modules)
│   ├── config/          # Configurations (Prisma, Redis, etc.)
│   ├── middlewares/     # Auth & Error middlewares
│   ├── modules/         # API Features (bookings, auth, workers, etc.)
│   └── socket/          # Socket.io Location Streaming & Handlers
├── prisma/              # Prisma DB schemas & seed script
├── docker-compose.yml   # Postgres & Redis config
└── package.json         # Main workspaces script manager
```
