import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Types
export interface Booking {
  id: string;
  service: string;
  customer: string;
  worker: string | null;
  date: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  amount: number;
}

export interface Worker {
  id: string;
  name: string;
  profession: string;
  status: 'Active' | 'Pending' | 'Suspended';
  rating: number;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  active: boolean;
}

interface AdminContextType {
  bookings: Booking[];
  workers: Worker[];
  services: Service[];
  stats: {
    revenue: number;
    activeBookings: number;
    totalWorkers: number;
    totalCustomers: number;
  };
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  updateWorkerStatus: (id: string, status: Worker['status']) => void;
  addWorker: (worker: Omit<Worker, 'id'>) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  deleteService: (id: string) => void;
  toggleServiceStatus: (id: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const API_BASE = 'http://localhost:4000/api';

// Initial Mock Data (Fallback for non-integrated parts)
const initialBookings: Booking[] = [
  { id: 'B-1001', service: 'AC Repair', customer: 'Rahul K.', worker: 'Amit Sharma', date: '2026-05-30', status: 'In Progress', amount: 1200 },
  { id: 'B-1002', service: 'Plumbing', customer: 'Sneha M.', worker: 'Rajesh Verma', date: '2026-05-30', status: 'Completed', amount: 850 },
];

const initialServices: Service[] = [
  { id: 'S-001', name: 'AC Repair', category: 'Appliance Repair', basePrice: 499, active: true },
  { id: 'S-002', name: 'Plumbing', category: 'Home Maintenance', basePrice: 299, active: true },
];

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<Service[]>(initialServices);

  // Fetch real workers from backend
  const fetchWorkers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/workers/admin/all`);
      const backendWorkers = response.data.data.workers;
      
      const mappedWorkers: Worker[] = backendWorkers.map((w: any) => ({
        id: w.id,
        name: `${w.user.firstName} ${w.user.lastName}`,
        profession: w.serviceCategory?.name || 'Helper',
        status: w.isVerified ? 'Active' : 'Pending', // Assuming unverified = Pending
        rating: 5.0, // Default for now
      }));
      setWorkers(mappedWorkers);
    } catch (error) {
      console.error("Failed to fetch workers:", error);
    }
  };

  useEffect(() => {
    fetchWorkers();
    
    // Polling every 10 seconds for new registrations
    const interval = setInterval(fetchWorkers, 10000);
    return () => clearInterval(interval);
  }, []);

  // Computed stats based on state
  const stats = {
    revenue: bookings.filter(b => b.status === 'Completed').reduce((sum, b) => sum + b.amount, 0) + 123650, 
    activeBookings: bookings.filter(b => b.status === 'In Progress' || b.status === 'Pending').length + 37,
    totalWorkers: workers.length,
    totalCustomers: 1890
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  };

  const updateWorkerStatus = async (id: string, status: Worker['status']) => {
    try {
      if (status === 'Active') {
        // Approve worker
        await axios.patch(`${API_BASE}/workers/admin/${id}/approve`);
      } else if (status === 'Suspended') {
        // Reject worker
        await axios.delete(`${API_BASE}/workers/admin/${id}/reject`);
      }
      
      // Fetch latest after mutation
      fetchWorkers();
    } catch (error) {
      console.error("Failed to update worker status:", error);
      alert("Failed to update worker status");
    }
  };

  const addWorker = (worker: Omit<Worker, 'id'>) => {
    // Currently adding manually via UI is not fully integrated with backend registration schema.
    // We'll leave the local mock behavior for the manual UI add for now, 
    // but actual registrations come from the Partner App and appear via fetchWorkers().
    const newWorker = { ...worker, id: `W-00${workers.length + 1}` };
    setWorkers(prev => [...prev, newWorker]);
  };

  const addService = (service: Omit<Service, 'id'>) => {
    const newService = { ...service, id: `S-00${services.length + 1}` };
    setServices(prev => [...prev, newService]);
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const toggleServiceStatus = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  return (
    <AdminContext.Provider value={{
      bookings, workers, services, stats,
      updateBookingStatus, updateWorkerStatus, addWorker, addService, deleteService, toggleServiceStatus
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
