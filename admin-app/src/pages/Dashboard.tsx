import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export const Dashboard: React.FC = () => {
  const { bookings, workers, stats, updateWorkerStatus } = useAdmin();

  const recentBookings = bookings.slice(0, 5);
  const pendingWorkers = workers.filter(w => w.status === 'Pending');

  return (
    <div className="animate-fade-in">
      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card">
          <p className="text-muted">Total Revenue</p>
          <h2 style={{ marginTop: '8px', fontSize: '28px' }}>₹ {stats.revenue.toLocaleString()}</h2>
          <p style={{ color: 'var(--success)', fontSize: '12px', marginTop: '8px' }}>+12.5% from last month</p>
        </div>
        <div className="glass-card delay-100 animate-fade-in">
          <p className="text-muted">Active Bookings</p>
          <h2 style={{ marginTop: '8px', fontSize: '28px' }}>{stats.activeBookings}</h2>
          <p style={{ color: 'var(--success)', fontSize: '12px', marginTop: '8px' }}>+5 new today</p>
        </div>
        <div className="glass-card delay-200 animate-fade-in">
          <p className="text-muted">Total Workers</p>
          <h2 style={{ marginTop: '8px', fontSize: '28px' }}>{stats.totalWorkers}</h2>
          <p style={{ color: 'var(--warning)', fontSize: '12px', marginTop: '8px' }}>{pendingWorkers.length} pending verification</p>
        </div>
        <div className="glass-card delay-300 animate-fade-in">
          <p className="text-muted">Total Customers</p>
          <h2 style={{ marginTop: '8px', fontSize: '28px' }}>{stats.totalCustomers.toLocaleString()}</h2>
          <p style={{ color: 'var(--success)', fontSize: '12px', marginTop: '8px' }}>+120 this week</p>
        </div>
      </div>

      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '24px' }}>Recent Bookings</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Service</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(booking => (
                  <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td>{booking.service}</td>
                    <td>{booking.customer}</td>
                    <td>
                      <span className={`badge badge-${booking.status === 'Completed' ? 'success' : booking.status === 'Cancelled' ? 'danger' : booking.status === 'In Progress' ? 'warning' : 'primary'}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>₹ {booking.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '24px' }}>Pending Verifications</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingWorkers.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: '20px 0' }}>No pending verifications.</p>
            ) : (
              pendingWorkers.map(worker => (
                <div key={worker.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontWeight: '500' }}>{worker.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{worker.profession}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => updateWorkerStatus(worker.id, 'Active')}
                      style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer' }}
                      title="Approve"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button 
                      onClick={() => updateWorkerStatus(worker.id, 'Suspended')}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      title="Reject"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
