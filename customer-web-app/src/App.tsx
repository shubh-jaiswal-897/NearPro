import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import BookingFlow from "./components/BookingFlow";
import TrackingView from "./components/TrackingView";
import AuthModal from "./components/AuthModal";
import type { ServiceCategory } from "./types";
import "./App.css";

type Screen = "HOME" | "BOOKING" | "TRACKING";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("HOME");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMockMode, setIsMockMode] = useState(true); // Default to mock mode for easy previewing

  // Booking details
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("");
  const [activeBookingId, setActiveBookingId] = useState("");
  const [customerLat, setCustomerLat] = useState(12.9716);
  const [customerLng, setCustomerLng] = useState(77.5946);

  // Active categories loaded from DB
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  // Load Auth Session & Categories
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/services/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || data);
      }
    } catch (e) {
      console.log("Could not load categories from Express API. Using offline mock categories.");
    }
  };

  const handleAuthSuccess = (savedToken: string, savedUser: any) => {
    setToken(savedToken);
    setUser(savedUser);
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setCurrentScreen("HOME");
  };

  const handleSelectCategory = (slug: string) => {
    setSelectedCategorySlug(slug);
    setCurrentScreen("BOOKING");
  };

  const handleBookingCreated = (bookingId: string) => {
    setActiveBookingId(bookingId);
    setCurrentScreen("TRACKING");
  };

  return (
    <div className="app-root">
      {/* Mock Mode Control Bar */}
      <div className="mode-bar">
        <span style={{ fontSize: "12px", fontWeight: 600 }}>
          ⚙️ Environment: {isMockMode ? "🔴 Mock (Simulated Workflow)" : "🟢 Live API Connection (ws://localhost:4000)"}
        </span>
        <button
          className="mode-toggle-btn"
          onClick={() => {
            setIsMockMode(!isMockMode);
            // If turning off mock, refresh categories from backend
            if (isMockMode) {
              fetchCategories();
            }
          }}
        >
          Switch to {isMockMode ? "Live API Mode" : "Mock Mode"}
        </button>
      </div>

      {/* Primary Screens */}
      {currentScreen === "HOME" && (
        <LandingPage
          categories={categories}
          token={token}
          user={user}
          onSelectCategory={handleSelectCategory}
          onSignInClick={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === "BOOKING" && (
        <BookingFlow
          categorySlug={selectedCategorySlug}
          token={token}
          isMockMode={isMockMode}
          onBack={() => setCurrentScreen("HOME")}
          onBookingCreated={handleBookingCreated}
          onSignInRequired={() => setIsAuthOpen(true)}
        />
      )}

      {currentScreen === "TRACKING" && (
        <TrackingView
          bookingId={activeBookingId}
          isMockMode={isMockMode}
          token={token}
          customerLat={customerLat}
          customerLng={customerLng}
          onBackToHome={() => setCurrentScreen("HOME")}
        />
      )}

      {/* Auth overlay popup */}
      {isAuthOpen && (
        <AuthModal
          isMockMode={isMockMode}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
