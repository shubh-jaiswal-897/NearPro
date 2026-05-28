import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  MapPin, 
  Settings, 
  LogOut,
  Bell,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Menu,
  X
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <div className="app-container">
      {/* Mobile Header */}
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

      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Sidebar */}
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
          <button 
            className={`nav-item btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent' }}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          
          <button 
            className={`nav-item btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
            style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent' }}
          >
            <Briefcase size={20} />
            Bookings
          </button>

          <button 
            className={`nav-item btn ${activeTab === 'workers' ? 'active' : ''}`}
            onClick={() => setActiveTab('workers')}
            style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent' }}
          >
            <Users size={20} />
            Workers
          </button>

          <button 
            className={`nav-item btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
            style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent' }}
          >
            <Settings size={20} />
            Services
          </button>
        </nav>

        <button 
          className="nav-item btn" 
          onClick={() => setIsAuthenticated(false)}
          style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', color: 'var(--danger)' }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header-top animate-fade-in">
          <div>
            <h3>Welcome back, Admin 👋</h3>
            <p className="text-muted">Here's what's happening with NearPro today.</p>
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

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <div className="glass-card">
                <p className="text-muted">Total Revenue</p>
                <h2 style={{ marginTop: '8px', fontSize: '28px' }}>₹ 1,24,500</h2>
                <p style={{ color: 'var(--success)', fontSize: '12px', marginTop: '8px' }}>+12.5% from last month</p>
              </div>
              <div className="glass-card delay-100 animate-fade-in">
                <p className="text-muted">Active Bookings</p>
                <h2 style={{ marginTop: '8px', fontSize: '28px' }}>42</h2>
                <p style={{ color: 'var(--success)', fontSize: '12px', marginTop: '8px' }}>+5 new today</p>
              </div>
              <div className="glass-card delay-200 animate-fade-in">
                <p className="text-muted">Total Workers</p>
                <h2 style={{ marginTop: '8px', fontSize: '28px' }}>156</h2>
                <p style={{ color: 'var(--warning)', fontSize: '12px', marginTop: '8px' }}>8 pending verification</p>
              </div>
              <div className="glass-card delay-300 animate-fade-in">
                <p className="text-muted">Total Customers</p>
                <h2 style={{ marginTop: '8px', fontSize: '28px' }}>1,890</h2>
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
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>#B-1001</td>
                        <td>AC Repair</td>
                        <td>Rahul K.</td>
                        <td><span className="badge badge-warning">In Progress</span></td>
                        <td><button className="btn btn-glass" style={{ padding: '4px 12px', fontSize: '12px' }}>View</button></td>
                      </tr>
                      <tr>
                        <td>#B-1002</td>
                        <td>Plumbing</td>
                        <td>Sneha M.</td>
                        <td><span className="badge badge-success">Completed</span></td>
                        <td><button className="btn btn-glass" style={{ padding: '4px 12px', fontSize: '12px' }}>View</button></td>
                      </tr>
                      <tr>
                        <td>#B-1003</td>
                        <td>House Cleaning</td>
                        <td>Vikram S.</td>
                        <td><span className="badge badge-danger">Cancelled</span></td>
                        <td><button className="btn btn-glass" style={{ padding: '4px 12px', fontSize: '12px' }}>View</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-card">
                <h3 style={{ marginBottom: '24px' }}>Pending Verifications</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--glass-border)' }}></div>
                        <div>
                          <p style={{ fontWeight: '500' }}>Amit Sharma</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Electrician</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer' }}><CheckCircle size={20} /></button>
                        <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><XCircle size={20} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Tabs Placeholders */}
        {activeTab !== 'dashboard' && (
          <div className="glass-card animate-fade-in" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Clock size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h2>
            <p className="text-muted" style={{ marginTop: '8px' }}>This section is currently under development.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
