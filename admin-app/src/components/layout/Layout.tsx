import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
        onLogout={onLogout} 
      />
      <main className="main-content">
        <Header setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <div style={{ padding: '20px 0' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
