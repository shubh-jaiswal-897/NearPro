import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import type { Booking } from '../context/AdminContext';

export const Bookings: React.FC = () => {
  const { bookings, updateBookingStatus } = useAdmin();
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBookings = bookings.filter(b => {
    const matchesFilter = filter === 'All' || b.status === filter;
    const matchesSearch = b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.service.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = (id: string, newStatus: Booking['status']) => {
    updateBookingStatus(id, newStatus);
  };

  return (
    <div className="animate-fade-in glass-card" style={{ minHeight: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-glass'}`}
              style={{ padding: '6px 16px', fontSize: '14px' }}
            >
              {f}
            </button>
          ))}
        </div>
        
        <input 
          type="text" 
          placeholder="Search bookings..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--glass-border)',
            padding: '8px 16px',
            borderRadius: '8px',
            color: 'white',
            outline: 'none',
            minWidth: '250px'
          }}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Worker</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>No bookings found.</td>
              </tr>
            ) : (
              filteredBookings.map(booking => (
                <tr key={booking.id}>
                  <td><strong>{booking.id}</strong></td>
                  <td>{booking.date}</td>
                  <td>{booking.customer}</td>
                  <td>{booking.service}</td>
                  <td>{booking.worker || <span className="text-muted">Unassigned</span>}</td>
                  <td>₹{booking.amount}</td>
                  <td>
                    <span className={`badge badge-${booking.status === 'Completed' ? 'success' : booking.status === 'Cancelled' ? 'danger' : booking.status === 'In Progress' ? 'warning' : 'primary'}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <select 
                      value={booking.status} 
                      onChange={(e) => handleStatusChange(booking.id, e.target.value as Booking['status'])}
                      style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
