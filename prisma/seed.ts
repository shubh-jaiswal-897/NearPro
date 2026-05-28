import prisma from "../src/config/database";
import { Role, WorkerStatus } from "@prisma/client";
import { Redis } from "ioredis";
import bcrypt from "bcrypt";
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

async function main() {
  console.log("🌱 Starting NearPro database seed...");

  // 1. Clean existing records in dependency order
  console.log("🧹 Cleaning database records...");
  await prisma.workerLocationHistory.deleteMany({});
  await prisma.workerEarningLog.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.cityServicePricing.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.serviceCategory.deleteMany({});
  await prisma.workerProfile.deleteMany({});
  await prisma.customerProfile.deleteMany({});
  await prisma.user.deleteMany({});
  
  // Clean raw city table (must delete via queryRaw due to PostGIS polygons)
  await prisma.$executeRawUnsafe(`DELETE FROM "City"`);

  // Clear Redis geo keys
  console.log("🧹 Cleaning Redis active workers geo sets...");
  const keys = await redis.keys("active_workers:*");
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  const heartbeats = await redis.keys("worker:heartbeat:*");
  if (heartbeats.length > 0) {
    await redis.del(...heartbeats);
  }
  const metadatas = await redis.keys("worker:metadata:*");
  if (metadatas.length > 0) {
    await redis.del(...metadatas);
  }

  // 2. Create operating city (Bengaluru) with PostGIS polygon boundary
  console.log("🌆 Seeding Operating City: Bengaluru...");
  const cityId = "bengaluru-city-uuid-10001";
  const cityName = "Bengaluru";
  const state = "Karnataka";
  const country = "India";
  const lat = 12.9716;
  const lng = 77.5946;
  
  // Simple polygon bounding central Bangalore (West, North, East, South)
  const boundaryWKT = "POLYGON((77.50 12.90, 77.50 13.05, 77.70 13.05, 77.70 12.90, 77.50 12.90))";
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO "City" ("id", "name", "state", "country", "lat", "lng", "boundary", "isActive", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, ST_GeographyFromText($7), true, NOW(), NOW())
  `, cityId, cityName, state, country, lat, lng, boundaryWKT);

  // 3. Create Service Categories (Snabbit matches)
  console.log("🛠️ Seeding Service Categories...");
  
  const dishwashingCat = await prisma.serviceCategory.create({
    data: {
      name: "Utensils & Dishwashing",
      slug: "dishwashing",
      description: "Get sparkling clean plates, pots, and pans in minutes. Standard or heavy loading.",
      iconUrl: "utensils",
    },
  });

  const kitchenCat = await prisma.serviceCategory.create({
    data: {
      name: "Kitchen Deep Cleaning",
      slug: "kitchen-cleaning",
      description: "Dusting, stove degreasing, sink scrub, counters, and cabinet exteriors.",
      iconUrl: "chef-hat",
    },
  });

  const laundryCat = await prisma.serviceCategory.create({
    data: {
      name: "Laundry & Ironing Help",
      slug: "laundry-help",
      description: "Sort, wash, dry, fold, or iron clothes. Gentle care for premium fabrics.",
      iconUrl: "shirt",
    },
  });

  const fanCat = await prisma.serviceCategory.create({
    data: {
      name: "Fan & Window Dusting",
      slug: "fan-cleaning",
      description: "Quick clean of ceiling fans, window frames, glass panes, and grilles.",
      iconUrl: "wind",
    },
  });

  const bathroomCat = await prisma.serviceCategory.create({
    data: {
      name: "Bathroom Deep Polish",
      slug: "bathroom-cleaning",
      description: "Stain removal, tile scrubbing, mirror polishing, and floor sanitization.",
      iconUrl: "bath",
    },
  });

  // 4. Create Services
  console.log("📋 Seeding Services & Hyperlocal Pricing...");
  
  const servicesData = [
    {
      category: dishwashingCat,
      name: "Express Dishwashing (Up to 45 mins)",
      description: "Perfect for daily meals. Up to 35 utensils washed, dried, and stacked.",
      basePrice: 99.00,
      platformFee: 15.00,
    },
    {
      category: kitchenCat,
      name: "Standard Kitchen Cleaning (Up to 1.5 hrs)",
      description: "Thorough cleaning of stoves, counter slabs, sink, and cabinets.",
      basePrice: 249.00,
      platformFee: 30.00,
    },
    {
      category: laundryCat,
      name: "Quick Laundry Assist (Up to 1 hr)",
      description: "Sorting clothes, loading/unloading machine, hanging out to dry, folding.",
      basePrice: 129.00,
      platformFee: 20.00,
    },
    {
      category: fanCat,
      name: "Ceiling Fan & Window Polish",
      description: "Full cleaning of up to 3 ceiling fans and adjacent window screens.",
      basePrice: 149.00,
      platformFee: 20.00,
    },
    {
      category: bathroomCat,
      name: "Bathroom Express Polish (1 Room)",
      description: "Floor scrubbing, toilet sanitization, mirror cleaning, and tap shine.",
      basePrice: 179.00,
      platformFee: 25.00,
    },
  ];

  for (const item of servicesData) {
    const service = await prisma.service.create({
      data: {
        categoryId: item.category.id,
        name: item.name,
        description: item.description,
        priceType: "HOURLY",
        isActive: true,
      },
    });

    // Pricing for Bengaluru city
    await prisma.cityServicePricing.create({
      data: {
        cityId,
        serviceId: service.id,
        basePrice: item.basePrice,
        pricePerKm: 10.00,
        pricePerMinute: 2.00,
        minimumPrice: item.basePrice,
        platformFee: item.platformFee,
      },
    });
  }

  // 5. Create Users (hashed password 'password123')
  console.log("👤 Creating customer & worker accounts...");
  const passwordHash = await bcrypt.hash("password123", 10);

  // Customer
  const customerUser = await prisma.user.create({
    data: {
      email: "customer@nearpro.com",
      phoneNumber: "+919876543210",
      passwordHash,
      firstName: "Amit",
      lastName: "Sharma",
      role: Role.CUSTOMER,
      rating: 4.9,
    },
  });

  await prisma.customerProfile.create({
    data: {
      userId: customerUser.id,
    },
  });

  // Workers with coordinates located inside Bengaluru operational polygon
  const workersData = [
    {
      email: "priya@nearpro.com",
      phoneNumber: "+919876543211",
      firstName: "Priya",
      lastName: "Das",
      category: dishwashingCat,
      lat: 12.9716, // Indiranagar central
      lng: 77.5946,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    },
    {
      email: "sunita@nearpro.com",
      phoneNumber: "+919876543212",
      firstName: "Sunita",
      lastName: "Patil",
      category: kitchenCat,
      lat: 12.9304, // HSR Layout Sector 6
      lng: 77.6784,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    },
    {
      email: "rani@nearpro.com",
      phoneNumber: "+919876543213",
      firstName: "Rani",
      lastName: "Devi",
      category: laundryCat,
      lat: 12.9279, // Koramangala 4th Block
      lng: 77.6271,
      avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200",
    },
  ];

  for (const w of workersData) {
    const user = await prisma.user.create({
      data: {
        email: w.email,
        phoneNumber: w.phoneNumber,
        passwordHash,
        firstName: w.firstName,
        lastName: w.lastName,
        role: Role.WORKER,
        profilePictureUrl: w.avatar,
        rating: 4.8,
      },
    });

    const profile = await prisma.workerProfile.create({
      data: {
        userId: user.id,
        cityId,
        serviceCategoryId: w.category.id,
        status: WorkerStatus.IDLE,
        isOnline: true,
        isVerified: true,
        currentLat: w.lat,
        currentLng: w.lng,
      },
    });

    // Populate spatial PostGIS point via raw SQL update
    await prisma.$executeRawUnsafe(`
      UPDATE "WorkerProfile"
      SET "location" = ST_SetSRID(ST_Point($1, $2), 4326)::geography
      WHERE "id" = $3
    `, w.lng, w.lat, profile.id);

    // 6. Seed active worker into Redis index for realtime location tracking lookup
    const geoKey = `active_workers:${cityId}`;
    const heartbeatKey = `worker:heartbeat:${user.id}`;
    const metadataKey = `worker:metadata:${user.id}`;

    // Add coordinates to Redis Geo set (member is the userId, same as backend query mapping)
    await redis.geoadd(geoKey, w.lng, w.lat, user.id);

    // Save current status metadata with a generous TTL of 24 hours (86400s) for continuous local testing
    await redis.set(
      metadataKey,
      JSON.stringify({ lat: w.lat, lng: w.lng, heading: 90, updatedAt: Date.now() }),
      "EX",
      86400
    );

    // Heartbeat TTL (24 hours) linking to the active city
    await redis.set(heartbeatKey, cityId, "EX", 86400);

    console.log(`📡 Registered active Worker: ${w.firstName} ${w.lastName} (Category: ${w.category.name}) at [${w.lat}, ${w.lng}]`);
  }

  console.log("🙌 Seeding database records completed successfully!");
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Seed execution encountered an error:", e);
  prisma.$disconnect();
  redis.quit();
  process.exit(1);
});
