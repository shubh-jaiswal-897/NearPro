import React, { useState } from "react";
import { X } from "lucide-react";
import "./AuthModal.css";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (token: string, user: { firstName: string; lastName: string; email: string; phoneNumber: string; role: string }) => void;
  isMockMode: boolean;
}

export default function AuthModal({ onClose, onSuccess, isMockMode }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isMockMode) {
      // Simulate API call delay
      setTimeout(() => {
        const dummyUser = {
          firstName: isLogin ? "Amit" : firstName || "Amit",
          lastName: isLogin ? "Sharma" : lastName || "Sharma",
          email: email || "customer@nearpro.com",
          phoneNumber: phoneNumber || "+919876543210",
          role: "CUSTOMER",
        };
        localStorage.setItem("token", "mock-jwt-token-12345");
        localStorage.setItem("user", JSON.stringify(dummyUser));
        setLoading(false);
        onSuccess("mock-jwt-token-12345", dummyUser);
        onClose();
      }, 1000);
      return;
    }

    // Live mode connection
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { email, password }
        : { firstName, lastName, email, phoneNumber, password, role: "CUSTOMER" };

      const response = await fetch(`http://localhost:4000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed. Please check your inputs.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {isMockMode && (
          <div style={{ textAlign: "center" }}>
            <span className="mock-badge">Mock Mode Active</span>
          </div>
        )}

        <h3 className="modal-title">{isLogin ? "Welcome Back" : "Create Account"}</h3>
        <p className="modal-subtitle">
          {isLogin
            ? "Sign in to hire verified home experts in 10 minutes"
            : "Join NearPro and get started with on-demand cleaning"}
        </p>

        {error && <div className="form-error" style={{ marginBottom: "20px", textAlign: "center" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Amit"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Sharma"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="customer@nearpro.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                required
                className="form-input"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="modal-btn" disabled={loading}>
            {loading ? "Processing..." : isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        <p className="modal-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span className="modal-toggle-link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign Up" : "Sign In"}
          </span>
        </p>
      </div>
    </div>
  );
}
