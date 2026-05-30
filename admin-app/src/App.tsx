import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { AdminProvider } from './context/AdminContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Bookings } from './pages/Bookings';
import { Workers } from './pages/Workers';
import { Services } from './pages/Services';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Shubh' && password === 'Shubh@1234') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid username or password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <form onSubmit={handleLogin} className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h2 className="text-gradient">NearPro Admin</h2>
            <p className="text-muted">Please log in to continue</p>
          </div>
          
          {error && <div style={{ color: 'var(--danger)', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
          
          <input 
            type="text" 
            placeholder="User ID" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)',
              padding: '12px 16px',
              borderRadius: '8px',
              color: 'white',
              outline: 'none',
              width: '100%'
            }}
          />
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                padding: '12px 40px 12px 16px',
                borderRadius: '8px',
                color: 'white',
                outline: 'none',
                width: '100%'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <AdminProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout onLogout={() => setIsAuthenticated(false)} />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="workers" element={<Workers />} />
            <Route path="services" element={<Services />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AdminProvider>
  );
}

export default App;
