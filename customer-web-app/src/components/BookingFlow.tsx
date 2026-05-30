import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, ShieldAlert, CheckCircle, CreditCard, Banknote, Landmark, Smartphone } from "lucide-react";
import L from "leaflet";
import "./BookingFlow.css";

interface BookingFlowProps {
  categorySlug: string;
  onBack: () => void;
  onBookingCreated: (bookingId: string) => void;
  isMockMode: boolean;
  token: string | null;
  onSignInRequired: () => void;
}

export default function BookingFlow({
  categorySlug,
  onBack,
  onBookingCreated,
  isMockMode,
  token,
  onSignInRequired,
}: BookingFlowProps) {
  const [step, setStep] = useState(1);
  const [hours, setHours] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [lat, setLat] = useState(12.9716); // Default Gorakhpur
  const [lng, setLng] = useState(77.5946);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "CASH" | "WALLET">("UPI");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);

  // Categories lookup
  const categoryNames: Record<string, string> = {
    dishwashing: "Utensils & Dishwashing",
    "kitchen-cleaning": "Kitchen Deep Cleaning",
    "laundry-help": "Laundry & Ironing Help",
    "fan-cleaning": "Fan & Window Dusting",
    "bathroom-cleaning": "Bathroom Deep Polish",
  };

  // Snabbit-like base pricing
  const basePricings: Record<string, { basePrice: number; platformFee: number; name: string; serviceId: string }> = {
    dishwashing: { basePrice: 99.00, platformFee: 15.00, name: "Express Dishwashing", serviceId: "dishwashing-svc-1" },
    "kitchen-cleaning": { basePrice: 249.00, platformFee: 30.00, name: "Standard Kitchen Cleaning", serviceId: "kitchen-svc-1" },
    "laundry-help": { basePrice: 129.00, platformFee: 20.00, name: "Quick Laundry Assist", serviceId: "laundry-svc-1" },
    "fan-cleaning": { basePrice: 149.00, platformFee: 20.00, name: "Ceiling Fan & Window Polish", serviceId: "fan-svc-1" },
    "bathroom-cleaning": { basePrice: 179.00, platformFee: 25.00, name: "Bathroom Express Polish", serviceId: "bathroom-svc-1" },
  };

  const currentPricing = basePricings[categorySlug] || basePricings.dishwashing;

  // Pricing math
  const serviceCharge = currentPricing.basePrice * hours;
  const platformFee = currentPricing.platformFee;
  const gst = Math.round(serviceCharge * 0.18); // 18% GST
  const totalPrice = serviceCharge + platformFee + gst;

  // Initialize Map on Step 2
  useEffect(() => {
    if (step === 2 && mapRef.current && !leafletMap.current) {
      // Map configuration
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
      }).setView([lat, lng], 14);

      // Add OSM Tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
      }).addTo(leafletMap.current);

      // Custom marker icon
      const customIcon = L.divIcon({
        className: "custom-pin",
        html: '<div class="pin-ring"><div class="pin-dot"></div></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Add Draggable Marker
      marker.current = L.marker([lat, lng], {
        draggable: true,
        icon: customIcon,
      }).addTo(leafletMap.current);

      // Listen to drag events to update coordinates
      marker.current.on("dragend", () => {
        const pos = marker.current?.getLatLng();
        if (pos) {
          setLat(pos.lat);
          setLng(pos.lng);
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (step !== 2 && leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        marker.current = null;
      }
    };
  }, [step]);

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!flatNumber || !streetAddress) {
        setErrorMessage("Please fill in your flat/house number and street name");
        return;
      }
      setErrorMessage("");
      setStep(3);
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const handleBookNow = async () => {
    if (!token) {
      onSignInRequired();
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const bookingPayload = {
      customerId: "", // Will be resolved by jwt
      serviceId: currentPricing.serviceId,
      pickupLat: lat,
      pickupLng: lng,
      pickupAddress: `${flatNumber}, ${streetAddress}, Gorakhpur`,
      totalPrice,
      platformCut: platformFee,
      workerCut: serviceCharge - platformFee,
    };

    if (isMockMode) {
      // Simulate booking delay
      setTimeout(() => {
        setLoading(false);
        onBookingCreated(`mock-booking-id-${Math.floor(Math.random() * 100000)}`);
      }, 1500);
      return;
    }

    try {
      // Attempt real booking creation via Express API
      const response = await fetch("http://localhost:4000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create booking.");
      }

      setLoading(false);
      onBookingCreated(data.id || data.booking.id);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || "Unable to reach server. Trying simulation...");
      // Auto-fallback mock in case DB/Server isn't set up yet
      setTimeout(() => {
        onBookingCreated(`fallback-booking-id-${Math.floor(Math.random() * 100000)}`);
      }, 1000);
    }
  };

  return (
    <div className="booking-container">
      <div className="booking-card">
        {/* Header */}
        <div className="booking-header">
          <button className="booking-back-btn" onClick={handleBackStep}>
            <ArrowLeft size={16} /> Back
          </button>
          <h2 className="booking-title">
            Book {categoryNames[categorySlug] || "Helper"}
          </h2>
        </div>

        {/* Steps indicator */}
        <div className="steps-indicator">
          <div className={`step-node ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
            <div className="step-circle">{step > 1 ? "✓" : "1"}</div>
            <span className="step-label">Duration</span>
          </div>
          <div className={`step-node ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
            <div className="step-circle">{step > 2 ? "✓" : "2"}</div>
            <span className="step-label">Location</span>
          </div>
          <div className={`step-node ${step >= 3 ? "active" : ""} ${step > 3 ? "completed" : ""}`}>
            <div className="step-circle">3</div>
            <span className="step-label">Payment</span>
          </div>
        </div>

        {errorMessage && (
          <div style={{ color: "#DC2626", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px", background: "#FEF2F2", padding: "12px", borderRadius: "12px", border: "1px solid #FCA5A5" }}>
            <ShieldAlert size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Configure Service duration */}
        {step === 1 && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <div className="config-group">
              <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Select Service Duration</h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                Prices are transparent and charged per hour of labor. Additional hours can be added later if needed.
              </p>
              
              <div className="duration-selector">
                {[1, 2, 3, 4].map((h) => (
                  <div
                    key={h}
                    className={`duration-option ${hours === h ? "active" : ""}`}
                    onClick={() => setHours(h)}
                  >
                    <div className="duration-time">{h} Hour{h > 1 ? "s" : ""}</div>
                    <div className="duration-price">₹{currentPricing.basePrice * h} base</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="config-group">
              <label className="form-label" style={{ fontSize: "15px", marginBottom: "8px", display: "block" }}>
                Add Custom Instructions (Optional)
              </label>
              <textarea
                placeholder="e.g. Focus on kitchen grease scrubbing, handle glass items with care, extra utensils present..."
                rows={4}
                className="form-input"
                style={{ resize: "none", background: "#F9FAFB", padding: "14px" }}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="flow-btn-group single-btn">
              <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={handleNextStep}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Address & Location Pin */}
        {step === 2 && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Set Delivery Address</h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
              Drag the pink pin on the map to pinpoint your exact door.
            </p>

            <div className="map-container" ref={mapRef} style={{ height: "280px" }}></div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "16px", marginBottom: "20px" }}>
              <div className="form-group">
                <label className="form-label">Flat/Building No.</label>
                <input
                  type="text"
                  required
                  placeholder="Flat 302, Block A"
                  className="form-input"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Street / Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="12th Main Road, HSR Layout"
                  className="form-input"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="flow-btn-group">
              <button className="booking-back-btn" onClick={handleBackStep}>
                Back
              </button>
              <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={handleNextStep}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment & Bill Breakdown */}
        {step === 3 && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>Bill Details</h3>

            <div className="bill-summary">
              <div className="bill-row">
                <span>{currentPricing.name} ({hours} hr{hours > 1 ? "s" : ""})</span>
                <span>₹{serviceCharge.toFixed(2)}</span>
              </div>
              <div className="bill-row">
                <span>Platform Commission</span>
                <span>₹{platformFee.toFixed(2)}</span>
              </div>
              <div className="bill-row">
                <span>Government Taxes (18% GST)</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <div className="bill-row total">
                <span>Total Amount to Pay</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Select Payment Method</h3>
            <div className="payment-options">
              <div
                className={`payment-card ${paymentMethod === "UPI" ? "active" : ""}`}
                onClick={() => setPaymentMethod("UPI")}
              >
                <Smartphone size={20} color={paymentMethod === "UPI" ? "#F70F79" : "#6B7280"} />
                <span className="payment-label">UPI / Google Pay</span>
              </div>
              <div
                className={`payment-card ${paymentMethod === "CASH" ? "active" : ""}`}
                onClick={() => setPaymentMethod("CASH")}
              >
                <Banknote size={20} color={paymentMethod === "CASH" ? "#F70F79" : "#6B7280"} />
                <span className="payment-label">Cash after Service</span>
              </div>
              <div
                className={`payment-card ${paymentMethod === "CARD" ? "active" : ""}`}
                onClick={() => setPaymentMethod("CARD")}
              >
                <CreditCard size={20} color={paymentMethod === "CARD" ? "#F70F79" : "#6B7280"} />
                <span className="payment-label">Debit / Credit Card</span>
              </div>
              <div
                className={`payment-card ${paymentMethod === "WALLET" ? "active" : ""}`}
                onClick={() => setPaymentMethod("WALLET")}
              >
                <Landmark size={20} color={paymentMethod === "WALLET" ? "#F70F79" : "#6B7280"} />
                <span className="payment-label">NearPro Wallet</span>
              </div>
            </div>

            <div className="flow-btn-group" style={{ marginTop: "40px" }}>
              <button className="booking-back-btn" onClick={handleBackStep}>
                Back
              </button>
              <button className="btn-primary" style={{ minWidth: "160px" }} disabled={loading} onClick={handleBookNow}>
                {loading ? "Creating..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
