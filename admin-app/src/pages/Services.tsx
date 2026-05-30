import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Plus, Trash2, Edit2, XCircle } from 'lucide-react';

export const Services: React.FC = () => {
  const { services, addService, deleteService, toggleServiceStatus } = useAdmin();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState({ name: '', category: '', basePrice: 0, active: true });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newService.name && newService.category) {
      addService(newService);
      setShowAddModal(false);
      setNewService({ name: '', category: '', basePrice: 0, active: true });
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 className="text-gradient">Service Catalog</h3>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} style={{ marginRight: '8px' }} /> Add Service
        </button>
      </div>

      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {services.map(service => (
          <div key={service.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-glass" 
                onClick={() => deleteService(service.id)}
                style={{ padding: '6px', color: 'var(--danger)', borderRadius: '50%' }}
                title="Delete Service"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div>
              <span className="badge badge-primary" style={{ marginBottom: '8px', display: 'inline-block' }}>{service.category}</span>
              <h3 style={{ fontSize: '20px' }}>{service.name}</h3>
              <p className="text-muted" style={{ marginTop: '4px', fontSize: '14px' }}>Base Price: <strong style={{ color: 'white' }}>₹{service.basePrice}</strong></p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '14px', color: service.active ? 'var(--success)' : 'var(--text-muted)' }}>
                {service.active ? '● Active' : '○ Inactive'}
              </span>
              <button 
                className="btn"
                onClick={() => toggleServiceStatus(service.id)}
                style={{ background: 'transparent', border: '1px solid var(--glass-border)', padding: '6px 12px', fontSize: '12px' }}
              >
                {service.active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Add New Service</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Service Name</label>
                <input 
                  type="text" 
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Category</label>
                <select 
                  value={newService.category}
                  onChange={(e) => setNewService({...newService, category: e.target.value})}
                  style={{ width: '100%', padding: '10px 16px', background: '#1a1a1a', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Home Maintenance">Home Maintenance</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Appliance Repair">Appliance Repair</option>
                  <option value="Beauty & Wellness">Beauty & Wellness</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Base Price (₹)</label>
                <input 
                  type="number" 
                  value={newService.basePrice || ''}
                  onChange={(e) => setNewService({...newService, basePrice: Number(e.target.value)})}
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  min="0"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>Save Service</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
