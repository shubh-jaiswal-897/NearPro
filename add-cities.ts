import { prisma } from './src/config/database.ts';

const additionalCities = [
  { id: 'delhi-city-uuid-10002', name: 'Delhi', state: 'Delhi', country: 'India', lat: 28.7041, lng: 77.1025, isActive: true },
  { id: 'mumbai-city-uuid-10003', name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0760, lng: 72.8777, isActive: true },
  { id: 'bengaluru-city-uuid-10004', name: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lng: 77.5946, isActive: true },
  { id: 'hyderabad-city-uuid-10005', name: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.3850, lng: 78.4867, isActive: true },
  { id: 'chennai-city-uuid-10006', name: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lng: 80.2707, isActive: true },
  { id: 'kolkata-city-uuid-10007', name: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lng: 88.3639, isActive: true },
  { id: 'pune-city-uuid-10008', name: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lng: 73.8567, isActive: true },
  { id: 'lucknow-city-uuid-10009', name: 'Lucknow', state: 'Uttar Pradesh', country: 'India', lat: 26.8467, lng: 80.9462, isActive: true },
  { id: 'kanpur-city-uuid-10010', name: 'Kanpur', state: 'Uttar Pradesh', country: 'India', lat: 26.4499, lng: 80.3319, isActive: true },
  { id: 'varanasi-city-uuid-10011', name: 'Varanasi', state: 'Uttar Pradesh', country: 'India', lat: 25.3176, lng: 82.9739, isActive: true }
];

async function main() {
  console.log('Adding more cities to the database...');
  for (const city of additionalCities) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: {},
      create: city,
    });
    console.log(`Added city: ${city.name}`);
  }
  console.log('Finished adding cities!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
