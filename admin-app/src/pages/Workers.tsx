import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Star, CheckCircle, XCircle, Plus } from 'lucide-react';

export const Workers: React.FC = () => {
  const { workers, categories, cities, updateWorkerStatus, addWorker } = useAdmin();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWorker, setNewWorker] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    cityId: '',
    serviceCategoryId: '',
    aadhaarNumber: '',
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      newWorker.firstName &&
      newWorker.lastName &&
      newWorker.email &&
      newWorker.password &&
      newWorker.phoneNumber &&
      newWorker.cityId &&
      newWorker.serviceCategoryId
    ) {
      await addWorker(newWorker);
      setShowAddModal(false);
      setNewWorker({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        cityId: '',
        serviceCategoryId: '',
        aadhaarNumber: '',
      });
    } else {
      alert("Please fill in all required fields.");
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '16px 24px' }}>
            <p className="text-muted" style={{ fontSize: '12px' }}>Total Workers</p>
            <h3>{workers.length}</h3>
          </div>
          <div className="glass-card" style={{ padding: '16px 24px', borderColor: 'rgba(234, 179, 8, 0.3)' }}>
            <p className="text-muted" style={{ fontSize: '12px' }}>Pending Approval</p>
            <h3>{workers.filter(w => w.status === 'Pending').length}</h3>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} style={{ marginRight: '8px' }} /> Add Worker
        </button>
      </div>

      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {workers.map(worker => (
          <div key={worker.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {worker.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>{worker.name}</h3>
                  <p className="text-muted" style={{ margin: 0 }}>{worker.profession}</p>
                </div>
              </div>
              <span className={`badge badge-${worker.status === 'Active' ? 'success' : worker.status === 'Pending' ? 'warning' : 'danger'}`}>
                {worker.status}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={16} fill="var(--warning)" color="var(--warning)" />
              <span>{worker.rating > 0 ? worker.rating.toFixed(1) : 'No ratings yet'}</span>
            </div>

            {worker.status === 'Pending' && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  className="btn"
                  onClick={() => updateWorkerStatus(worker.id, 'Active')}
                  style={{ flex: 1, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid var(--success)', padding: '8px' }}
                >
                  <CheckCircle size={16} style={{ marginRight: '8px' }} /> Approve
                </button>
                <button 
                  className="btn"
                  onClick={() => updateWorkerStatus(worker.id, 'Suspended')}
                  style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '8px' }}
                >
                  <XCircle size={16} style={{ marginRight: '8px' }} /> Reject
                </button>
              </div>
            )}
            {worker.status === 'Active' && (
              <button 
                className="btn btn-glass"
                onClick={() => updateWorkerStatus(worker.id, 'Suspended')}
                style={{ width: '100%', marginTop: '8px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                Suspend Worker
              </button>
            )}
            {worker.status === 'Suspended' && (
              <button 
                className="btn btn-glass"
                onClick={() => updateWorkerStatus(worker.id, 'Active')}
                style={{ width: '100%', marginTop: '8px', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
              >
                Reactivate
              </button>
            )}
          </div>
        ))}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Add New Worker</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>First Name *</label>
                  <input 
                    type="text" 
                    value={newWorker.firstName}
                    onChange={(e) => setNewWorker({...newWorker, firstName: e.target.value})}
                    style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Last Name *</label>
                  <input 
                    type="text" 
                    value={newWorker.lastName}
                    onChange={(e) => setNewWorker({...newWorker, lastName: e.target.value})}
                    style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Email Address *</label>
                <input 
                  type="email" 
                  value={newWorker.email}
                  onChange={(e) => setNewWorker({...newWorker, email: e.target.value})}
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Phone Number (+91...) *</label>
                <input 
                  type="tel" 
                  value={newWorker.phoneNumber}
                  onChange={(e) => setNewWorker({...newWorker, phoneNumber: e.target.value})}
                  placeholder="+919999999999"
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Password *</label>
                <input 
                  type="password" 
                  value={newWorker.password}
                  onChange={(e) => setNewWorker({...newWorker, password: e.target.value})}
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Operating City *</label>
                <select 
                  value={newWorker.cityId}
                  onChange={(e) => setNewWorker({...newWorker, cityId: e.target.value})}
                  style={{ width: '100%', padding: '10px 16px', background: '#1a1a1a', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                >
                  <option value="">Select Operational City</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Service Category (Profession) *</label>
                <select 
                  value={newWorker.serviceCategoryId}
                  onChange={(e) => setNewWorker({...newWorker, serviceCategoryId: e.target.value})}
                  style={{ width: '100%', padding: '10px 16px', background: '#1a1a1a', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                >
                  <option value="">Select Service Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Aadhaar Card Number (12-digit)</label>
                <input 
                  type="text" 
                  value={newWorker.aadhaarNumber}
                  onChange={(e) => setNewWorker({...newWorker, aadhaarNumber: e.target.value})}
                  maxLength={12}
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', width: '100%', padding: '12px' }}>
                Add and Register Worker
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
