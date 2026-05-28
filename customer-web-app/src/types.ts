export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: "CUSTOMER" | "WORKER" | "ADMIN";
  profilePictureUrl?: string;
  rating: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl?: string;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceType: "FIXED" | "HOURLY";
}

export interface CityServicePricing {
  id: string;
  cityId: string;
  serviceId: string;
  basePrice: number;
  pricePerKm: number;
  pricePerMinute: number;
  minimumPrice: number;
  platformFee: number;
}

export interface Booking {
  id: string;
  customerId: string;
  workerId?: string;
  serviceId: string;
  cityId: string;
  status: "PENDING" | "ACCEPTED" | "EN_ROUTE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  totalPrice: number;
  platformCut: number;
  workerCut: number;
  worker?: {
    id: string;
    name: string;
    phone: string;
    photo?: string;
  };
}
