import React from "react";
import { Sparkles, Star, Shield, Clock, Utensils, ChefHat, Shirt, Wind, Bath, LogOut } from "lucide-react";
import { ServiceCategory } from "../types";
import "./LandingPage.css";

interface LandingPageProps {
  onSelectCategory: (slug: string) => void;
  onSignInClick: () => void;
  token: string | null;
  user: any;
  onLogout: () => void;
  categories: ServiceCategory[];
}

export default function LandingPage({
  onSelectCategory,
  onSignInClick,
  token,
  user,
  onLogout,
  categories,
}: LandingPageProps) {
  
  // Icon selector mapping category slugs to Lucide icons
  const getIcon = (slug: string) => {
    switch (slug) {
      case "dishwashing":
        return <Utensils size={32} />;
      case "kitchen-cleaning":
        return <ChefHat size={32} />;
      case "laundry-help":
        return <Shirt size={32} />;
      case "fan-cleaning":
        return <Wind size={32} />;
      case "bathroom-cleaning":
        return <Bath size={32} />;
      default:
        return <Sparkles size={32} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Navigation Header */}
      <header className="header">
        <div className="header-container">
          <a href="#" className="logo">
            NearPro<span>.</span>
          </a>
          <nav className="nav-links">
            <a href="#services" className="nav-link">Services</a>
            <a href="#safety" className="nav-link">Safety</a>
            <a href="#about" className="nav-link">About</a>
          </nav>
          <div className="header-actions">
            {token && user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>Hi, {user.firstName}!</span>
                <button className="btn-signin" style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={onLogout}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <button className="btn-signin" onClick={onSignInClick}>Sign In</button>
            )}
            <button className="btn-primary" onClick={() => onSelectCategory("dishwashing")}>Book Now</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div style={{ animation: "fadeIn 1s ease" }}>
            <div className="hero-badge">
              <Shield size={14} />
              <span>Trusted by 12L+ families across Bengaluru</span>
            </div>
            <h1 className="hero-title">
              Instant Home Services in <span>Minutes</span>
            </h1>
            <p className="hero-desc">
              Book trained & background-verified home service professionals for cleaning, utensils washing, laundry & more - instantly, whenever you need.
            </p>
            <div className="hero-actions-container">
              <button className="btn-primary" style={{ padding: "14px 32px", fontSize: "16px" }} onClick={() => onSelectCategory("dishwashing")}>
                Book a Helper
              </button>
            </div>
            
            <div className="hero-benefits">
              <div className="benefit-tag">
                <Star size={14} fill="white" /> Top Rated Experts
              </div>
              <div className="benefit-tag">
                <Shield size={14} /> Background Verified
              </div>
              <div className="benefit-tag">
                <Clock size={14} /> 2-Day Professional Training
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-wrapper">
              <img
                src="/hero_helper.png"
                alt="NearPro Home Helper"
                className="hero-img"
              />
            </div>
            
            {/* Snabbit en-route badge simulation */}
            <div className="widget-eta animate-float">
              <div className="widget-icon">
                <Clock size={20} />
              </div>
              <div>
                <p className="widget-title">Expert on the way</p>
                <p className="widget-subtitle">ETA: ~10 minutes</p>
                <div className="widget-bar">
                  <div className="widget-progress"></div>
                </div>
              </div>
            </div>

            <div className="widget-rating animate-float-delayed">
              <Star size={16} fill="#F70F79" stroke="#F70F79" />
              <span>4.8 Rated</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section id="services" className="section-services">
        <h2 className="section-title">What Can Your House Help Do?</h2>
        <p className="section-subtitle">
          Select a category below to configure your booking. NearPro will assign a background-verified helper located closest to your location.
        </p>

        <div className="services-grid">
          {categories.length > 0 ? (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="service-card"
                onClick={() => onSelectCategory(cat.slug)}
              >
                <div className="service-icon-box">
                  {getIcon(cat.slug)}
                </div>
                <h3 className="service-name">{cat.name}</h3>
                <p className="service-desc">{cat.description}</p>
              </div>
            ))
          ) : (
            // Fallback default services if not seeded yet
            [
              { name: "Utensils & Dishwashing", slug: "dishwashing", desc: "Get sparkling clean plates, pots, and pans in minutes." },
              { name: "Kitchen Deep Cleaning", slug: "kitchen-cleaning", desc: "Deep stove, counter, sink, and cabinet exterior scrubbing." },
              { name: "Laundry & Ironing Help", slug: "laundry-help", desc: "Wash, dry, fold, and press service at your door." },
              { name: "Fan & Window Dusting", slug: "fan-cleaning", desc: "Dust and clean ceiling fans, window glasses, and grilles." },
              { name: "Bathroom Deep Polish", slug: "bathroom-cleaning", desc: "Floor scrubbing, toilet sanitization, and mirror shine." },
            ].map((cat, idx) => (
              <div
                key={idx}
                className="service-card"
                onClick={() => onSelectCategory(cat.slug)}
              >
                <div className="service-icon-box">
                  {getIcon(cat.slug)}
                </div>
                <h3 className="service-name">{cat.name}</h3>
                <p className="service-desc">{cat.desc}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Safety Section (Snabbit Kavach model) */}
      <section id="safety" className="section-kavach">
        <div className="kavach-card">
          <div>
            <h2 className="kavach-title">NearPro Kavach: Safety First</h2>
            <p className="kavach-desc">
              We care deeply about our helpers and customers. Every booking is covered under our proactive safety framework that guards every trip.
            </p>
            <div className="kavach-features">
              <div className="kavach-feature">
                <CheckCircleIcon /> Aadhaar & PAN verification for all professionals.
              </div>
              <div className="kavach-feature">
                <CheckCircleIcon /> Real-time tracking shared with friends & family.
              </div>
              <div className="kavach-feature">
                <CheckCircleIcon /> AI-powered distress signals monitoring decibel alerts.
              </div>
              <div className="kavach-feature">
                <CheckCircleIcon /> One-touch emergency SOS button on the app.
              </div>
            </div>
          </div>
          <div className="kavach-shield">
            <div className="shield-container">
              <div className="shield-core">
                <Shield size={48} color="white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <a href="#" className="footer-logo">
          NearPro<span>.</span>
        </a>
        <p style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "14px" }}>
          Instant hourly-based helpers. Trained, verified, and at your doorstep in 10 minutes.
        </p>
        <p className="footer-text">
          © {new Date().getFullYear()} NearPro Home Services Private Limited. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// Simple Helper Icon Component
function CheckCircleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#F70F79"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ minWidth: "16px" }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
