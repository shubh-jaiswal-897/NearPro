import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';

// Types
export interface Booking {
  id: string;
  service: string;
  serviceId: string;
  categoryId: string;
  cityId: string;
  customer: string;
  worker: string | null;
  workerId: string | null;
  date: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  amount: number;
}

export interface Worker {
  id: string;
  userId: string;
  name: string;
  profession: string;
  categoryId: string;
  cityId: string;
  status: 'Active' | 'Pending' | 'Suspended';
  rating: number;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  category: string;
  description?: string;
  basePrice: number;
  active: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
}

export interface UserDetails {
  id: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'WORKER' | 'ADMIN';
  profilePictureUrl: string | null;
  rating: number;
  isActive: boolean;
  createdAt: string;
  workerProfile?: {
    city: { name: string };
    serviceCategory: { name: string };
  } | null;
}

interface AdminContextType {
  bookings: Booking[];
  workers: Worker[];
  services: Service[];
  categories: ServiceCategory[];
  users: UserDetails[];
  stats: {
    revenue: number;
    activeBookings: number;
    totalWorkers: number;
    totalCustomers: number;
  };
  cities: { id: string; name: string }[];
  fetchBookings: () => Promise<void>;
  fetchWorkers: () => Promise<void>;
  fetchServices: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchCities: () => Promise<void>;
  updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
  assignWorkerToBooking: (bookingId: string, workerId: string | null) => Promise<void>;
  updateWorkerStatus: (id: string, status: Worker['status']) => Promise<void>;
  addWorker: (workerData: any) => Promise<void>;
  addService: (service: { name: string; categoryId: string; basePrice: number; description?: string }) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  toggleServiceStatus: (id: string) => Promise<void>;
  addCategory: (category: { name: string; slug: string; description?: string; iconUrl?: string }) => Promise<void>;
  toggleUserActiveStatus: (id: string) => Promise<void>;
  deleteUserAccount: (id: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState({
    revenue: 123650,
    activeBookings: 37,
    totalWorkers: 0,
    totalCustomers: 1890,
  });

  // Fetch true dynamic dashboard stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/bookings/admin/stats`);
      setStats(response.data.data.stats);
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    }
  };

  // Fetch real workers from backend
  const fetchWorkers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/workers/admin/all`);
      const backendWorkers = response.data.data.workers;
      
      const mappedWorkers: Worker[] = backendWorkers.map((w: any) => ({
        id: w.id,
        userId: w.userId,
        name: `${w.user.firstName} ${w.user.lastName}`,
        profession: w.serviceCategory?.name || 'Helper',
        categoryId: w.serviceCategoryId,
        cityId: w.cityId,
        status: !w.user.isActive ? 'Suspended' : w.isVerified ? 'Active' : 'Pending',
        rating: w.user.rating || 5.0,
      }));
      setWorkers(mappedWorkers);
    } catch (error) {
      console.error("Failed to fetch workers:", error);
    }
  };

  // Fetch real services from backend
  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API_BASE}/services/admin/all`);
      const backendServices = response.data.data.services;
      setServices(backendServices);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  // Fetch operational service categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/services/admin/categories`);
      setCategories(response.data.data.categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Fetch all users list
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/users/admin/all`);
      setUsers(response.data.data.users);
    } catch (error) {
      console.error("Failed to fetch users list:", error);
    }
  };

  // Fetch operational cities list
  const fetchCities = async () => {
    try {
      const response = await axios.get(`${API_BASE}/cities`);
      const list = response.data.data?.cities || response.data.data || [];
      setCities(list.map((c: any) => ({ id: c.id, name: c.name })));
    } catch (error) {
      console.error("Failed to fetch operational cities:", error);
    }
  };

  // Fetch bookings list
  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_BASE}/bookings/admin/all`);
      const backendBookings = response.data.data.bookings;
      
      const mappedBookings: Booking[] = backendBookings.map((b: any) => ({
        id: b.id,
        service: b.service?.name || 'Service',
        serviceId: b.serviceId,
        categoryId: b.service?.categoryId || '',
        cityId: b.cityId,
        customer: `${b.customer.user.firstName} ${b.customer.user.lastName}`,
        worker: b.worker ? `${b.worker.user.firstName} ${b.worker.user.lastName}` : null,
        workerId: b.workerId,
        date: new Date(b.createdAt).toISOString().split('T')[0],
        status: b.status === 'PENDING' ? 'Pending' : 
                b.status === 'ACCEPTED' ? 'In Progress' :
                b.status === 'EN_ROUTE' ? 'In Progress' :
                b.status === 'IN_PROGRESS' ? 'In Progress' :
                b.status === 'COMPLETED' ? 'Completed' : 'Cancelled',
        amount: Number(b.totalPrice)
      }));
      setBookings(mappedBookings);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchServices();
    fetchCategories();
    fetchUsers();
    fetchBookings();
    fetchCities();
    fetchStats();
    
    // Polling every 10 seconds for real-time registrations and bookings
    const interval = setInterval(() => {
      fetchWorkers();
      fetchBookings();
      fetchUsers();
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    try {
      // Map frontend status to backend BookingStatus enum
      const backendStatus = status === 'Pending' ? 'PENDING' :
                            status === 'In Progress' ? 'ACCEPTED' : // Or IN_PROGRESS, the backend handles assignment/transitions
                            status === 'Completed' ? 'COMPLETED' : 'CANCELLED';

      await axios.patch(`${API_BASE}/bookings/admin/${id}`, { status: backendStatus });
      await fetchBookings();
      await fetchStats();
    } catch (error) {
      console.error("Failed to update booking status on backend:", error);
      alert("Failed to update booking status");
    }
  };

  const assignWorkerToBooking = async (bookingId: string, workerId: string | null) => {
    try {
      await axios.patch(`${API_BASE}/bookings/admin/${bookingId}`, { 
        workerId: workerId || "unassign" 
      });
      await fetchBookings();
      await fetchWorkers();
      await fetchStats();
    } catch (error) {
      console.error("Failed to assign worker:", error);
      alert("Failed to assign worker to booking");
    }
  };

  const updateWorkerStatus = async (id: string, status: Worker['status']) => {
    try {
      if (status === 'Active') {
        // Approve worker
        await axios.patch(`${API_BASE}/workers/admin/${id}/approve`);
      } else if (status === 'Suspended') {
        // Suspend worker
        await axios.patch(`${API_BASE}/workers/admin/${id}/suspend`);
      } else if (status === 'Pending') {
        // Approve to undo suspend
        await axios.patch(`${API_BASE}/workers/admin/${id}/approve`);
      }
      await fetchWorkers();
      await fetchUsers();
      await fetchStats();
    } catch (error) {
      console.error("Failed to update worker status:", error);
      alert("Failed to update worker status");
    }
  };

  const addWorker = async (workerData: any) => {
    try {
      // Worker registration requires calling the auth endpoint
      await axios.post(`${API_BASE}/auth/register`, {
        ...workerData,
        role: "WORKER"
      });
      await fetchWorkers();
      await fetchUsers();
    } catch (error: any) {
      console.error("Failed to register worker:", error);
      alert(error.response?.data?.message || "Failed to add worker profile");
    }
  };

  const addService = async (service: { name: string; categoryId: string; basePrice: number; description?: string }) => {
    try {
      await axios.post(`${API_BASE}/services/admin/services`, service);
      await fetchServices();
    } catch (error) {
      console.error("Failed to add service:", error);
      alert("Failed to add service to catalog");
    }
  };

  const deleteService = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/services/admin/services/${id}`);
      await fetchServices();
    } catch (error) {
      console.error("Failed to delete service:", error);
      alert("Failed to delete service");
    }
  };

  const toggleServiceStatus = async (id: string) => {
    try {
      await axios.patch(`${API_BASE}/services/admin/services/${id}/toggle`);
      await fetchServices();
    } catch (error) {
      console.error("Failed to toggle service status:", error);
      alert("Failed to toggle service status");
    }
  };

  const addCategory = async (category: { name: string; slug: string; description?: string; iconUrl?: string }) => {
    try {
      await axios.post(`${API_BASE}/services/admin/categories`, category);
      await fetchCategories();
    } catch (error) {
      console.error("Failed to add category:", error);
      alert("Failed to create category");
    }
  };

  const toggleUserActiveStatus = async (id: string) => {
    try {
      await axios.patch(`${API_BASE}/users/admin/${id}/toggle-active`);
      await fetchUsers();
      await fetchWorkers();
    } catch (error) {
      console.error("Failed to toggle user status:", error);
      alert("Failed to toggle user active status");
    }
  };

  const deleteUserAccount = async (id: string) => {
    try {
      await axios.delete(`${API_BASE}/users/admin/${id}`);
      await fetchUsers();
      await fetchWorkers();
      await fetchBookings();
      await fetchStats();
    } catch (error) {
      console.error("Failed to delete user account:", error);
      alert("Failed to delete user account");
    }
  };

  return (
    <AdminContext.Provider value={{
      bookings, workers, services, categories, users, stats, cities,
      fetchBookings, fetchWorkers, fetchServices, fetchCategories, fetchUsers, fetchStats, fetchCities,
      updateBookingStatus, assignWorkerToBooking, updateWorkerStatus, addWorker, addService, deleteService, toggleServiceStatus,
      addCategory, toggleUserActiveStatus, deleteUserAccount
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
