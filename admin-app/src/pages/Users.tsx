import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Search, Trash2, UserCheck, UserX, Star } from 'lucide-react';

export const Users: React.FC = () => {
  const { users, toggleUserActiveStatus, deleteUserAccount } = useAdmin();
  const [filter, setFilter] = useState<'ALL' | 'CUSTOMER' | 'WORKER' | 'ADMIN'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'ALL' || user.role === filter;
    const matchesSearch = 
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete the account of ${name}? This action cannot be undone.`)) {
      deleteUserAccount(id);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'badge-danger';
      case 'WORKER': return 'badge-warning';
      default: return 'badge-primary';
    }
  };

  return (
    <div className="animate-fade-in glass-card" style={{ minHeight: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 className="text-gradient" style={{ margin: 0 }}>User Management</h2>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                padding: '8px 16px 8px 36px',
                borderRadius: '8px',
                color: 'white',
                outline: 'none',
                minWidth: '250px'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {(['ALL', 'CUSTOMER', 'WORKER', 'ADMIN'] as const).map(role => (
          <button 
            key={role}
            onClick={() => setFilter(role)}
            className={`btn ${filter === role ? 'btn-primary' : 'btn-glass'}`}
            style={{ padding: '6px 16px', fontSize: '14px', textTransform: 'capitalize' }}
          >
            {role === 'ALL' ? 'All Users' : role.toLowerCase() + 's'}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Contact Details</th>
              <th>Role</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>No users found.</td>
              </tr>
            ) : (
              filteredUsers.map(user => {
                const fullName = `${user.firstName} ${user.lastName}`;
                const joinedDate = new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {user.profilePictureUrl ? (
                          <img 
                            src={user.profilePictureUrl} 
                            alt={fullName} 
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--glass-border)' }} 
                          />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {user.firstName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p style={{ fontWeight: '600', margin: 0 }}>{fullName}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>{user.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p style={{ margin: 0 }}>{user.email}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{user.phoneNumber}</p>
                    </td>
                    <td>
                      <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                      {user.role === 'WORKER' && user.workerProfile && (
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                          {user.workerProfile.serviceCategory?.name} ({user.workerProfile.city?.name})
                        </p>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} fill="var(--warning)" color="var(--warning)" />
                        <span>{user.rating?.toFixed(1) || '5.0'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${user.isActive ? 'success' : 'danger'}`}>
                        {user.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td>{joinedDate}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-glass"
                          onClick={() => toggleUserActiveStatus(user.id)}
                          style={{ 
                            padding: '6px 10px', 
                            fontSize: '12px', 
                            color: user.isActive ? 'var(--danger)' : 'var(--success)',
                            border: '1px solid ' + (user.isActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)')
                          }}
                          title={user.isActive ? "Block Account" : "Activate Account"}
                        >
                          {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        
                        {user.role !== 'ADMIN' && (
                          <button
                            className="btn btn-glass"
                            onClick={() => handleDelete(user.id, fullName)}
                            style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                            title="Delete Account"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
