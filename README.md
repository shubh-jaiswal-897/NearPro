# 📍 NearPro: On-Demand Hyperlocal Home Services Marketplace

NearPro is a real-time, spatial-temporal on-demand marketplace platform matching consumer service requests (plumbing, electrical work, cleaning, etc.) with geographically proximate, verified service providers (workers). 

The platform optimizes hyperlocal resource matching under spatial-temporal constraints to solve the classical "liquidity density" problem: maximizing matching rate while minimizing customer wait times and provider fuel/transit overhead.

---

## 🔬 Scientific & Architectural Design

The platform resolves matching challenges by combining database geofencing, real-time cache indexing, and network routing services.

### 1. Spatial-Temporal System Architecture

```mermaid
graph TD
    %% Clients
    CustomerWeb["🌐 Customer Web Portal<br/>(React + Vite + Leaflet)"]
    CustomerMobile["📱 Customer Mobile App<br/>(React Native + Expo)"]
    PartnerMobile["👷 Partner Mobile App<br/>(React Native + Expo)"]
    AdminPanel["🛡️ Admin Dashboard<br/>(React + Vite)"]

    %% Gateway and Application Server
    Server["🟢 Backend API Server<br/>(Bun + Express + Node)"]
    Sockets["⚡ WebSocket Gateway<br/>(Socket.IO)"]

    %% Infrastructure Components
    PostGIS["🐘 PostgreSQL + PostGIS<br/>(Transactional DB & Geofencing)"]
    Redis["🔴 Redis Server<br/>(Geo-index, Metadata, Locks)"]
    Maps["🗺️ Google Maps Distance Matrix<br/>(Road Network ETAs)"]
    Firebase["🔥 Firebase SDK & APNs<br/>(Push Alert Fallbacks)"]

    %% Connections
    CustomerWeb <-->|HTTP / WS| Server
    CustomerMobile <-->|HTTP / WS| Server
    PartnerMobile <-->|HTTP / WS| Server
    AdminPanel <-->|HTTP / WS| Server

    Server <--> Sockets
    Server <-->|SQL Queries| PostGIS
    Server <-->|Commands / PubSub| Redis
    Server -->|Fetch ETAs| Maps
    Server -->|Trigger FCM| Firebase
```

---

## 📐 Mathematical Formulation & Geospatial Heuristics

NearPro relies on three distinct layers of mathematical spatial filtering to optimize the candidate pool:

### 1. Hard Geofencing (PostGIS R-Tree Bounds)
A customer coordinate $C(\text{lat}, \text{lng})$ is checked against active operational city boundaries represented as multi-polygons $P_i$. The activation function is:

$$\text{IsOperational}(P_i, C) = \begin{cases} 1 & \text{if } C \in P_i \\ 0 & \text{otherwise} \end{cases}$$

This is evaluated at the database layer using PostGIS indexing and the `ST_Covers` operator:
```sql
SELECT id FROM "City"
WHERE ST_Covers(boundary, ST_SetSRID(ST_Point(lng, lat), 4326)::geography)
  AND "isActive" = true LIMIT 1;
```

### 2. Proximity Range Querying (Haversine Approximation)
To minimize database scan latency, the system utilizes a spherical earth distance calculation (Haversine formula) inside Redis' spatial index or PostgreSQL fallback:

$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$

Where $R = 6371$ km (earth radius), $\phi$ is latitude, and $\lambda$ is longitude. In Redis, this is executed via:
`GEOSEARCH active_workers:cityId FROMLONLAT lng lat BYRADIUS 5 km WITHDIST ASC`

### 3. Actual Road-Network ETA Routing (Distance Matrix)
As crow-flies distance fails to represent urban traffic and route geography, NearPro resolves road durations for the top candidates:

$$\text{Candidates} = \text{SortByETA}\Big(\{ w_j \mid \text{ETA}_j = \text{MapsClient}(C, W_j).\text{duration} \}\Big)$$

---

## 🔄 Core Execution Sequences & Workflows

### 1. Hyperlocal Match & Dispatch Loop

The system operates a multi-stage dispatch model when a customer creates a booking:

```mermaid
sequenceDiagram
    participant Customer as Customer Client
    participant API as Backend Server
    participant Redis as Redis Geo Index
    participant DB as PostgreSQL (PostGIS)
    participant Maps as Google Maps Matrix
    participant Worker as Worker Clients (Top 5)

    Customer->>API: Create Booking (pickupLat, pickupLng, serviceId)
    API->>DB: Resolve boundary (ST_Covers)
    DB-->>API: Operational City ID
    API->>DB: Fetch city pricing & calculate totalPrice
    API->>DB: Insert Booking (Status: PENDING)
    API->>API: Asynchronously invoke dispatchBooking()
    API->>Redis: GEOSEARCH active_workers (Radius: 5.0 km)
    Redis-->>API: List of nearby worker userIds & distances
    API->>DB: Filter workers (Online, IDLE, Verified, Category match)
    DB-->>API: Active Worker Profiles
    API->>Maps: Query Distance Matrix (Origin: Customer, Destinations: Worker coords)
    Maps-->>API: Road distances & ETA values
    API->>API: Sort by ETA ascending & select top 5
    API->>Worker: Broadcast socket ("job:broadcast") & FCM notification
```

### 2. Concurrency-Safe Booking Acceptance

To prevent double allocation under concurrent worker acceptance, booking requests are protected by a Redis distributed lock:

```mermaid
sequenceDiagram
    participant Worker as Worker Client
    participant API as Backend Server
    participant Redis as Redis Lock Manager
    participant DB as PostgreSQL Database
    participant Sockets as WebSocket Gateway

    Worker->>API: Accept Job (bookingId, workerUserId)
    API->>Redis: SET booking:lock:id workerUserId NX PX 5000
    alt Lock Acquired (Success)
        Redis-->>API: OK
        API->>DB: Query Booking Status (Confirm PENDING)
        alt Status is PENDING
            API->>DB: Transaction: Update Booking (ACCEPTED) & Worker (ASSIGNED)
            DB-->>API: Transaction Success
            API->>Redis: ZREM active_workers workerUserId
            API->>Sockets: Emit state transition ("job:state_changed", status: ACCEPTED)
            API-->>Worker: HTTP 200 OK (Assigned)
        else Status already updated (Stale)
            API-->>Worker: HTTP 400 Bad Request (Already Accepted)
            API->>Redis: DEL booking:lock:id
        end
    else Lock Acquisition Failed (Conflict)
        Redis-->>API: NULL
        API-->>Worker: HTTP 409 Conflict (Job accepted by another technician)
    end
```

### 3. Real-Time Tracking & Heartbeat Loop
1. **Online Registry:** Workers emit `worker:register` via socket. The server updates their database profile (`isOnline = true`, `status = IDLE`) and joins them to `city:${cityId}` and `worker:${workerId}` rooms.
2. **Periodic Heartbeat:** Worker devices emit `worker:location_update` every 10–15 seconds.
3. **Cache Storage:** The server updates the Redis Geo Set (`active_workers:${cityId}`) and sets worker coordinates metadata key (`worker:metadata:${workerId}`) with a Time-to-Live (TTL) of 30 seconds.
4. **Stream Broadcast:** If the worker is fulfilling an active job (`bookingId` present), the coordinates are immediately routed via socket to the customer's room:
   `io.to("booking:bookingId").emit("worker:location_stream", coordinates)`
5. **Auto-Cleanup:** Upon socket disconnect, the server calls `TrackingService.removeWorker()` which deletes keys in Redis and transitions the database profile to `OFFLINE`.

### 4. Settlement & Payout Sequence
When a worker updates a booking to `COMPLETED`:
1. Database transaction credits the worker's earnings (`totalEarnings` incremented by `workerCut`).
2. A detailed `WorkerEarningLog` is created for accounting.
3. The worker is unregistered from the active job room, their status changes to `IDLE`, and their coordinate node is re-indexed back to the Redis `active_workers` pool for immediate reallocation.

---

## 🗄️ Database & Schema Design

NearPro uses **PostgreSQL + PostGIS** mapped via **Prisma ORM**. Key configurations and enums include:

```prisma
enum Role {
  CUSTOMER
  WORKER
  ADMIN
}

enum WorkerStatus {
  OFFLINE
  IDLE
  ASSIGNED
  EN_ROUTE
  IN_PROGRESS
}

enum BookingStatus {
  PENDING
  ACCEPTED
  EN_ROUTE
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

### Key Models & Spatial Columns
* **WorkerProfile:** Holds physical attributes and earnings. Contains `location` which uses `Unsupported("geography(Point, 4326)")` mapped to a PostGIS spatial point.
* **City:** Represents operational boundaries. Contains `boundary` mapped as `Unsupported("geography(Polygon, 4326)")` to allow geo-containment checks.
* **Booking:** Tracks coordinate markers (`pickupLat`, `pickupLng`), transaction payouts (`platformCut`, `workerCut`), and references relationships with `User`, `City`, and `Service`.
* **WorkerLocationHistory:** Tracks chronological worker coordinates for audit logging and route mapping.

---

## 🛠️ Tech Stack & Justifications

* **Express.js on Bun:** Bun is used for faster runtime executions, natively handling TypeScript transpilation and boosting request throughput.
* **Socket.IO + Redis Adapter:** Enables scaling across multiple server instances by coordinating pub/sub state channels over a centralized Redis cluster.
* **PostgreSQL + PostGIS:** Provides transactional ACID guarantees combined with native database-level geometry calculations for geofences.
* **Redis Cache:** Ultra-low latency location tracking index and distributed locking manager.
* **React Native (Expo):** Unified codebase for cross-platform iOS and Android mobile app distribution.
* **Leaflet Maps:** Lightweight open-source interactive mapping wrapper for web and native UI.

---

## 📁 Repository Structure

```
NearPro/
├── admin-app/                # React Admin Dashboard (Vite + TypeScript)
│   ├── src/pages/            # Management pages (Workers.tsx, Services.tsx, Cities.tsx)
│   └── src/context/          # Admin context & API wrappers
├── customer-web-app/         # Customer Web Portal (React + Vite + Leaflet)
│   ├── src/components/       # UI Components (TrackingView.tsx, BookingForm.tsx)
│   └── src/App.tsx           # Customer flow coordinator
├── customer-app/             # Customer Cross-Platform Mobile Application (Expo)
├── partner-app/              # Partner/Worker Cross-Platform Mobile Application (Expo)
├── snabit/                   # Code sandbox system
│   └── client/               # React client playground for executing javascript snippets
├── src/                      # Backend Core Application
│   ├── config/               # Database, Redis, Maps, and Firebase clients
│   ├── middlewares/          # Auth, role-validation, and error handler middlewares
│   ├── modules/              # Segmented feature APIs
│   │   ├── auth/             # Session signup / login controller
│   │   ├── bookings/         # Booking creation and dispatch service logic
│   │   ├── cities/           # Operational city boundaries management
│   │   ├── tracking/         # Location streaming, nearby worker searches
│   │   └── transactions/     # Payment creation, gateway webhook handlers
│   ├── socket/               # Socket.io connection setup and event handlers
│   └── server.ts             # Application entry point & service bootstrappers
├── prisma/                   # DB migrations, database configuration schema, and seed scripts
├── docker-compose.yml        # Multi-container orchestration (PostGIS, Redis)
└── package.json              # Main project workspace script definitions
```

---

## ⚙️ Environment Configurations

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

| Variable Name | Description | Default / Example Value |
| :--- | :--- | :--- |
| `PORT` | Local express HTTP server port | `4000` |
| `NODE_ENV` | App execution environment mode | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgrespassword@localhost:5432/nearpro?schema=public` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for JWT signing | `your-jwt-secret-key` |
| `GOOGLE_MAPS_API_KEY` | Key for Google maps matrix API | `your-google-maps-api-key` |
| `FIREBASE_PROJECT_ID` | Project ID for push fallbacks | `your-firebase-project-id` |

---

## 🚀 Installation & Local Development Setup

### Prerequisites
Make sure your development machine has:
* [Bun Runtime](https://bun.sh/) (version 1.0+)
* [Node.js](https://nodejs.org/) (version 18+)
* [Docker Desktop](https://www.docker.com/)
* [Expo Go](https://expo.dev/client) app installed on your physical mobile testing device.

---

### Step-by-Step Installation

#### 1. Install Workspace Dependencies
Execute the unified bun commands from the root directory to install all packages for all workspaces:
```bash
# Install root backend dependencies
bun install

# Install UI modules and application workspaces
cd admin-app && bun install && cd ..
cd customer-web-app && bun install && cd ..
cd customer-app && bun install && cd ..
cd partner-app && bun install && cd ..
cd snabit/client && bun install && cd ../..
```

#### 2. Start PostgreSQL & Redis Containers
Fire up the background databases via Docker Compose:
```bash
# This starts PostGIS PostgreSQL and Redis in detached mode
bun run redis:up
```

#### 3. Database Initialization & Seeding
Push the database schema models and apply default city geofences, pricing rates, and admin configurations:
```bash
# Push database structures
bun run db:push

# Run seed scripts
bun run db:seed
```

#### 4. Run the Application Servers
Open separate terminal screens and boot up the desired application instances:

```bash
bun run index.ts
```
id Shubh
pass Shubh@1234
This project was created using `bun init` in bun v1.3.12. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
