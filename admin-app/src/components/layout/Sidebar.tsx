import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Settings, LogOut, X } from 'lucide-react';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen, onLogout }) => {
  return (
    <>
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ padding: '0 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="text-gradient">NearPro</h2>
            <p className="text-muted" style={{ fontSize: '12px' }}>Admin Portal</p>
          </div>
          <button 
            className="btn btn-glass desktop-only-close" 
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ padding: '4px', border: 'none', display: window.innerWidth <= 768 ? 'block' : 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-item btn ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent' }}
          >
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          
          <NavLink 
            to="/bookings" 
            className={({ isActive }) => `nav-item btn ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent' }}
          >
            <Briefcase size={20} /> Bookings
          </NavLink>

          <NavLink 
            to="/workers" 
            className={({ isActive }) => `nav-item btn ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent' }}
          >
            <Users size={20} /> Workers
          </NavLink>

          <NavLink 
            to="/services" 
            className={({ isActive }) => `nav-item btn ${isActive ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent' }}
          >
            <Settings size={20} /> Services
          </NavLink>
        </nav>

        <button 
          className="nav-item btn" 
          onClick={onLogout}
          style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', color: 'var(--danger)' }}
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>
    </>
  );
};
