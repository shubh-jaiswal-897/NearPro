import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Plus, Trash2, XCircle, Tag } from 'lucide-react';

export const Services: React.FC = () => {
  const { services, categories, addService, deleteService, toggleServiceStatus, addCategory } = useAdmin();
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  
  const [newService, setNewService] = useState({ name: '', categoryId: '', basePrice: 0, description: '' });
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '', iconUrl: '' });

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newService.name && newService.categoryId && newService.basePrice >= 0) {
      await addService(newService);
      setShowAddServiceModal(false);
      setNewService({ name: '', categoryId: '', basePrice: 0, description: '' });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.name && newCategory.slug) {
      await addCategory(newCategory);
      setShowAddCategoryModal(false);
      setNewCategory({ name: '', slug: '', description: '', iconUrl: '' });
    }
  };

  const generateSlug = (val: string) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setNewCategory(prev => ({ ...prev, name: val, slug }));
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 className="text-gradient" style={{ margin: 0 }}>Service Catalog</h2>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-glass" onClick={() => setShowAddCategoryModal(true)}>
            <Tag size={18} style={{ marginRight: '8px' }} /> Create Category
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddServiceModal(true)}>
            <Plus size={18} style={{ marginRight: '8px' }} /> Add Service
          </button>
        </div>
      </div>

      <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {services.map(service => (
          <div key={service.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
              <button 
                className="btn btn-glass" 
                onClick={() => deleteService(service.id)}
                style={{ padding: '6px', color: 'var(--danger)', borderRadius: '50%', border: 'none' }}
                title="Delete Service"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div>
              <span className="badge badge-primary" style={{ marginBottom: '8px', display: 'inline-block' }}>{service.category}</span>
              <h3 style={{ fontSize: '20px', margin: '4px 0' }}>{service.name}</h3>
              {service.description && <p className="text-muted" style={{ fontSize: '13px', margin: '4px 0 8px 0' }}>{service.description}</p>}
              <p className="text-muted" style={{ marginTop: '8px', fontSize: '14px' }}>Base Price: <strong style={{ color: 'white' }}>₹{service.basePrice}</strong></p>
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

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Add New Service</h3>
              <button onClick={() => setShowAddServiceModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleAddService} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Service Name *</label>
                <input 
                  type="text" 
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  placeholder="e.g. Sofa Cleaning"
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Description</label>
                <textarea 
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                  placeholder="Service description and details..."
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none', resize: 'vertical', minHeight: '80px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Category *</label>
                <select 
                  value={newService.categoryId}
                  onChange={(e) => setNewService({...newService, categoryId: e.target.value})}
                  style={{ width: '100%', padding: '10px 16px', background: '#1a1a1a', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Base Price (₹) *</label>
                <input 
                  type="number" 
                  value={newService.basePrice || ''}
                  onChange={(e) => setNewService({...newService, basePrice: Number(e.target.value)})}
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  min="0"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '12px' }}>Save Service</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3>Create Service Category</h3>
              <button onClick={() => setShowAddCategoryModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Category Name *</label>
                <input 
                  type="text" 
                  value={newCategory.name}
                  onChange={(e) => generateSlug(e.target.value)}
                  placeholder="e.g. Appliance Repair"
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Slug (Generated) *</label>
                <input 
                  type="text" 
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({...newCategory, slug: e.target.value})}
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Description</label>
                <textarea 
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  placeholder="Category description..."
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none', resize: 'vertical', minHeight: '80px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>Icon Name (Lucide Icon name)</label>
                <input 
                  type="text" 
                  value={newCategory.iconUrl}
                  onChange={(e) => setNewCategory({...newCategory, iconUrl: e.target.value})}
                  placeholder="e.g. chef-hat, utensils, shirt"
                  style={{ width: '100%', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '12px' }}>Save Category</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
