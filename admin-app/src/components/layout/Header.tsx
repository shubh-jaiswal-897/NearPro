import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  setIsMobileMenuOpen: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ setIsMobileMenuOpen }) => {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return "Welcome back, Admin 👋";
      case '/bookings': return "Manage Bookings";
      case '/workers': return "Worker Directory";
      case '/services': return "Services Catalog";
      default: return "Admin Portal";
    }
  };

  const getPageSubtitle = () => {
    switch (location.pathname) {
      case '/dashboard': return "Here's what's happening with NearPro today.";
      case '/bookings': return "View and manage all customer bookings.";
      case '/workers': return "Approve and manage service professionals.";
      case '/services': return "Add or update the services you offer.";
      default: return "";
    }
  };

  return (
    <>
      <div className="mobile-header">
        <h2 className="text-gradient">NearPro</h2>
        <button 
          className="btn btn-glass" 
          onClick={() => setIsMobileMenuOpen(true)}
          style={{ padding: '8px' }}
        >
          <Menu size={24} />
        </button>
      </div>

      <header className="header-top animate-fade-in desktop-only-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <div>
          <h3>{getPageTitle()}</h3>
          <p className="text-muted">{getPageSubtitle()}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search..." 
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                padding: '8px 16px 8px 36px',
                borderRadius: '20px',
                color: 'white',
                outline: 'none'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          </div>
          <button className="btn btn-glass" style={{ padding: '8px', borderRadius: '50%' }}>
            <Bell size={20} />
          </button>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            A
          </div>
        </div>
      </header>
    </>
  );
};
