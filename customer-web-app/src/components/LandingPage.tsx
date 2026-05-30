import React, { useState } from "react";
import { Sparkles, Star, Shield, Clock, Utensils, ChefHat, Shirt, Wind, Bath, LogOut, ChevronDown } from "lucide-react";
import type { ServiceCategory } from "../types";

const FAQS = [
  {
    question: "How fast does a NearPro helper arrive?",
    answer: "Our helpers are distributed across local zones in Gorakhpur. Typically, a verified helper will reach your doorstep within 10-15 minutes of booking confirmation."
  },
  {
    question: "Are NearPro helpers background-verified?",
    answer: "Yes, absolutely. Every helper goes through a strict verification process, including government-issued ID checks (Aadhaar & PAN) and professional training verification before they can accept bookings."
  },
  {
    question: "How does the pricing work? Is it fixed or hourly?",
    answer: "NearPro uses a transparent hourly billing model. You pay for the exact duration of help you select (e.g. 1 hour, 2 hours) plus a small flat platform fee. There are no hidden charges."
  },
  {
    question: "What is NearPro Kavach?",
    answer: "NearPro Kavach is our safety ecosystem. It includes real-time tracking of the helper's route, instant SOS distress signals, and decibel-level monitoring on the helper's application to ensure safety for both customers and professionals."
  },
  {
    question: "Can I schedule a booking for later?",
    answer: "Yes! While NearPro specializes in instant, on-demand dispatch, you can easily schedule a helper for any specific date and time using our checkout wizard."
  }
];
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
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };
  
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
            <a href="#cities" className="nav-link">Cities</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#faq" className="nav-link">FAQ</a>
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
            <button className="btn-primary" onClick={() => onSelectCategory(categories[0]?.slug || "dishwashing")}>Book Now</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div style={{ animation: "fadeIn 1s ease" }}>
            <div className="hero-badge">
              <Shield size={14} />
              <span>Trusted by 12L+ families across Gorakhpur</span>
            </div>
            <h1 className="hero-title">
              Instant Home Services in <span>Minutes</span>
            </h1>
            <p className="hero-desc">
              Book trained & background-verified home service professionals for cleaning, utensils washing, laundry & more - instantly, whenever you need.
            </p>
            <div className="hero-actions-container">
              <button className="btn-primary" style={{ padding: "14px 32px", fontSize: "16px" }} onClick={() => onSelectCategory(categories[0]?.slug || "dishwashing")}>
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

      {/* Operational Cities Section */}
      <section id="cities" className="section-cities">
        <h2 className="section-title">Operational Cities</h2>
        <p className="section-subtitle" style={{ marginBottom: "32px" }}>
          NearPro is currently active in Gorakhpur, bringing background-verified helpers to your doorstep.
        </p>
        <div className="cities-grid">
          <div className="city-card active">
            <div className="city-badge">Active</div>
            <h3 className="city-name">Gorakhpur</h3>
            <p className="city-desc">Active in Indiranagar, HSR Layout, Koramangala, Whitefield, and more.</p>
          </div>
          <div className="city-card upcoming">
            <div className="city-badge-upcoming">Upcoming</div>
            <h3 className="city-name">Mumbai</h3>
            <p className="city-desc">Expanding our verified house help services to Mumbai soon.</p>
          </div>
          <div className="city-card upcoming">
            <div className="city-badge-upcoming">Upcoming</div>
            <h3 className="city-name">Delhi NCR</h3>
            <p className="city-desc">Bringing 10-minute on-demand help to the capital region soon.</p>
          </div>
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

      {/* About Section */}
      <section id="about" className="section-about">
        <div className="about-container">
          <div className="about-content">
            <h2 className="about-title">About NearPro</h2>
            <p className="about-desc">
              NearPro is India's leading on-demand platform for instant house help services. Inspired by the convenience of quick commerce, we are reshaping how families hire helpers for daily tasks. 
            </p>
            <p className="about-desc">
              By leveraging advanced routing technology and keeping our operations local, we match you with background-verified helpers in your neighborhood within minutes, while ensuring fair wages and dignified employment for our partners.
            </p>
          </div>
          <div className="about-stats">
            <div className="stat-card">
              <h4>10 Min</h4>
              <p>Average ETA</p>
            </div>
            <div className="stat-card">
              <h4>100%</h4>
              <p>Verified Partners</p>
            </div>
            <div className="stat-card">
              <h4>12 Lakh+</h4>
              <p>Happy Bookings</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section-faq">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-subtitle" style={{ marginBottom: "24px" }}>
          Everything you need to know about NearPro on-demand home help services.
        </p>

        <div className="faq-container">
          {FAQS.map((faq, index) => {
            const isActive = openFaqIndex === index;
            return (
              <div key={index} className={`faq-item ${isActive ? "active" : ""}`}>
                <button className="faq-question" onClick={() => toggleFaq(index)}>
                  <span>{faq.question}</span>
                  <ChevronDown className="faq-icon" size={18} />
                </button>
                <div 
                  className="faq-answer-wrapper" 
                  style={{ maxHeight: isActive ? "200px" : "0" }}
                >
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
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
