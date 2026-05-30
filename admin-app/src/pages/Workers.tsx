import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import type { Worker } from '../context/AdminContext';
import { Star, CheckCircle, XCircle, Plus } from 'lucide-react';

export const Workers: React.FC = () => {
  const { workers, updateWorkerStatus, addWorker } = useAdmin();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: '', profession: '', status: 'Active' as const, rating: 0 });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorker.name && newWorker.profession) {
      addWorker(newWorker);
      setShowAddModal(false);
      setNewWorker({ name: '', profession: '', status: 'Active', rating: 0 });
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
            <p className="text-muted" style={{ fontSize: '12px' }}>Pending</p>
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
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                  {worker.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px' }}>{worker.name}</h3>
                  <p className="text-muted">{worker.profession}</p>
                </div>
              </div>
              <span className={`badge badge-${worker.status === 'Active' ? 'success' : worker.status === 'Pending' ? 'warning' : 'danger'}`}>
                {worker.status}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={16} fill={worker.rating > 0 ? "var(--warning)" : "none"} color="var(--warning)" />
              <span>{worker.rating > 0 ? worker.rating : 'No ratings yet'}</span>
            </div>

            {worker.status === 'Pending' && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  className="btn"
                  onClick={() => updateWorkerStatus(worker.id, 'Active')}
                  style={{ flex: 1, background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', border: '1px solid var(--success)' }}
                >
                  <CheckCircle size={16} style={{ marginRight: '8px' }} /> Approve
                </button>
                <button 
                  className="btn"
                  onClick={() => updateWorkerStatus(worker.id, 'Suspended')}
                  style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                >
                  <XCircle size={16} style={{ marginRight: '8px' }} /> Reject
                </button>
              </div>
            )}
            {worker.status === 'Active' && (
              <button 
                className="btn btn-glass"
                onClick={() => updateWorkerStatus(worker.id, 'Suspended')}
                style={{ width: '100%', marginTop: '8px', color: 'var(--danger)' }}
              >
                Suspend Worker
              </button>
            )}
            {worker.status === 'Suspended' && (
              <button 
                className="btn btn-glass"
                onClick={() => updateWorkerStatus(worker.id, 'Active')}
                style={{ width: '100%', marginTop: '8px', color: 'var(--success)' }}
              >
                Reactivate
              </button>
            )}
          </div>
        ))}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Add New Worker</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Full Name</label>
                <input 
                  type="text" 
                  value={newWorker.name}
                  onChange={(e) => setNewWorker({...newWorker, name: e.target.value})}
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Profession</label>
                <input 
                  type="text" 
                  value={newWorker.profession}
                  onChange={(e) => setNewWorker({...newWorker, profession: e.target.value})}
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>Add Worker</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
