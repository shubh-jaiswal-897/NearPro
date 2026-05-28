import React, { useState, useEffect, useRef } from "react";
import { Clock, Phone, ShieldAlert, Award, Star, Compass, CheckCircle2, ArrowRight } from "lucide-react";
import L from "leaflet";
import io from "socket.io-client";
import "./TrackingView.css";

interface TrackingViewProps {
  bookingId: string;
  onBackToHome: () => void;
  isMockMode: boolean;
  token: string | null;
  customerLat?: number;
  customerLng?: number;
}

interface WorkerInfo {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  rating?: number;
}

export default function TrackingView({
  bookingId,
  onBackToHome,
  isMockMode,
  token,
  customerLat = 12.9716,
  customerLng = 77.5946,
}: TrackingViewProps) {
  const [status, setStatus] = useState<"PENDING" | "ACCEPTED" | "EN_ROUTE" | "IN_PROGRESS" | "COMPLETED">("PENDING");
  const [worker, setWorker] = useState<WorkerInfo | null>(null);
  const [workerLat, setWorkerLat] = useState<number | null>(null);
  const [workerLng, setWorkerLng] = useState<number | null>(null);
  const [eta, setEta] = useState<number>(10); // in minutes
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [jobTimer, setJobTimer] = useState<number>(10); // 10 second countdown during progress

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const customerMarker = useRef<L.Marker | null>(null);
  const workerMarker = useRef<L.Marker | null>(null);
  const socketRef = useRef<any>(null);

  // 1. Initialize Map
  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: false,
      }).setView([customerLat, customerLng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(leafletMap.current);

      // Add Customer Home Marker
      const homeIcon = L.divIcon({
        className: "custom-pin",
        html: '<div class="pin-ring" style="border-color:#3B2EA3; background:rgba(59,46,163,0.2)"><div class="pin-dot" style="background:#3B2EA3"></div></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      customerMarker.current = L.marker([customerLat, customerLng], { icon: homeIcon })
        .addTo(leafletMap.current)
        .bindPopup("Your Home")
        .openPopup();
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        customerMarker.current = null;
        workerMarker.current = null;
      }
    };
  }, [customerLat, customerLng]);

  // 2. Manage Worker Marker on Map
  useEffect(() => {
    if (!leafletMap.current || workerLat === null || workerLng === null) return;

    const workerPhoto = worker?.photo || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100";

    const workerIcon = L.divIcon({
      className: "custom-pin",
      html: `<div class="worker-pin"><img src="${workerPhoto}" alt="Worker" /></div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    if (!workerMarker.current) {
      workerMarker.current = L.marker([workerLat, workerLng], { icon: workerIcon })
        .addTo(leafletMap.current)
        .bindPopup(`<b>${worker?.name || "Helper"}</b><br/>En route to your door`)
        .openPopup();
      
      // Auto-fit bounds to show both pins
      const bounds = L.latLngBounds([
        [customerLat, customerLng],
        [workerLat, workerLng],
      ]);
      leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
    } else {
      workerMarker.current.setLatLng([workerLat, workerLng]);
    }
  }, [workerLat, workerLng, worker, customerLat, customerLng]);

  // 3. Simulated Mock matching & movement
  useEffect(() => {
    if (!isMockMode) return;

    // Simulation states timeline:
    // A. 4s: Match found -> ACCEPTED & EN_ROUTE. Set worker starting position 2.5km away.
    // B. Worker moves closer. Every 1s, coordinates update.
    // C. Worker arrives (lat/lng matches user) -> IN_PROGRESS. Countdown starts.
    // D. Timer ends -> COMPLETED.

    let moveInterval: any;
    let timerTimeout: any;

    const startMatchingDelay = setTimeout(() => {
      // Worker accepted
      setStatus("ACCEPTED");
      const assignedWorker = {
        id: "mock-worker-101",
        name: "Priya Das",
        phone: "+91 98765 43211",
        photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100",
        rating: 4.8,
      };
      setWorker(assignedWorker);

      // Start coordinate: slightly northeast of customer
      let currentWLat = customerLat + 0.015;
      let currentWLng = customerLng + 0.015;
      setWorkerLat(currentWLat);
      setWorkerLng(currentWLng);
      setEta(8);

      // Move worker towards home
      const steps = 10;
      let stepCount = 0;

      const latStep = (customerLat - currentWLat) / steps;
      const lngStep = (customerLng - currentWLng) / steps;

      moveInterval = setInterval(() => {
        stepCount++;
        currentWLat += latStep;
        currentWLng += lngStep;
        setWorkerLat(currentWLat);
        setWorkerLng(currentWLng);
        setEta(Math.max(1, 8 - Math.floor((stepCount / steps) * 8)));
        setProgressPercent(Math.round((stepCount / steps) * 100));

        if (stepCount >= steps) {
          clearInterval(moveInterval);
          // Worker arrived
          setStatus("IN_PROGRESS");
          setEta(0);
          setProgressPercent(100);
          
          // Trigger job timer countdown
          let currentJobTimer = 10;
          const countdown = setInterval(() => {
            currentJobTimer--;
            setJobTimer(currentJobTimer);
            if (currentJobTimer <= 0) {
              clearInterval(countdown);
              setStatus("COMPLETED");
            }
          }, 1000);
        }
      }, 1000);

    }, 4000);

    return () => {
      clearTimeout(startMatchingDelay);
      clearInterval(moveInterval);
      clearTimeout(timerTimeout);
    };
  }, [isMockMode, customerLat, customerLng]);

  // 4. Live socket connection integration
  useEffect(() => {
    if (isMockMode) return;

    // Connect to websocket server
    socketRef.current = io("http://localhost:4000", {
      auth: { token },
    });

    socketRef.current.on("connect", () => {
      console.log("WebSocket connected to NearPro API Server");
      // Join booking tracking room
      socketRef.current.emit("join_room", { roomId: `booking:${bookingId}` });
    });

    // Listen to job status changes
    socketRef.current.on("job:state_changed", (data: any) => {
      console.log("Received job:state_changed:", data);
      if (data.status) {
        if (data.status === "ACCEPTED" || data.status === "EN_ROUTE") {
          setStatus("ACCEPTED");
          if (data.worker) {
            setWorker({
              id: data.worker.id,
              name: data.worker.name,
              phone: data.worker.phone,
              photo: data.worker.photo,
              rating: 4.8,
            });
          }
        } else if (data.status === "IN_PROGRESS") {
          setStatus("IN_PROGRESS");
        } else if (data.status === "COMPLETED") {
          setStatus("COMPLETED");
        } else if (data.status === "CANCELLED") {
          onBackToHome();
        }
      }
    });

    // Listen to real-time worker coordinates stream
    socketRef.current.on("worker:location_stream", (data: any) => {
      console.log("Received worker:location_stream:", data);
      if (data.latitude && data.longitude) {
        setWorkerLat(data.latitude);
        setWorkerLng(data.longitude);
        
        // Calculate dynamic ETA based on Haversine distance
        const R = 6371; // Earth radius in km
        const dLat = ((customerLat - data.latitude) * Math.PI) / 180;
        const dLng = ((customerLng - data.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((data.latitude * Math.PI) / 180) *
            Math.cos((customerLat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        
        // Assume avg speed 30km/h -> 2 min per km
        const etaMin = Math.max(1, Math.ceil(distance * 2));
        setEta(etaMin);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isMockMode, bookingId, token, customerLat, customerLng]);

  return (
    <div className="tracker-container">
      <div className="tracker-grid">
        {/* Status Dashboard Panel */}
        <div className="tracker-panel">
          <div>
            <div className="tracker-title-box">
              <h2 style={{ fontSize: "20px" }}>Order Tracking</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Booking ID: {bookingId}
              </p>
            </div>

            {/* Status Badges */}
            {status === "PENDING" && (
              <div>
                <span className="tracker-status-badge status-pending">Searching for Helper</span>
                <h3 style={{ fontSize: "22px", margin: "12px 0 8px 0" }}>Finding your NearPro helper</h3>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Connecting with the closest verified house helper in your area...
                </p>
              </div>
            )}

            {status === "ACCEPTED" && (
              <div>
                <span className="tracker-status-badge status-accepted">Helper En Route</span>
                <h3 style={{ fontSize: "22px", margin: "12px 0 8px 0" }}>Arriving in {eta} minutes</h3>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Your helper has accepted your task and is heading to your door.
                </p>
              </div>
            )}

            {status === "IN_PROGRESS" && (
              <div>
                <span className="tracker-status-badge status-inprogress">Work in Progress</span>
                <h3 style={{ fontSize: "22px", margin: "12px 0 8px 0" }}>Helper is at work</h3>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  The task has started. Relax while your verified helper finishes the job!
                </p>
              </div>
            )}

            {status === "COMPLETED" && (
              <div>
                <span className="tracker-status-badge status-completed">Completed</span>
                <h3 style={{ fontSize: "22px", margin: "12px 0 8px 0" }}>Task completed successfully!</h3>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Your house help has completed the task. Thank you for using NearPro!
                </p>
              </div>
            )}
          </div>

          {/* Dynamic visual representation based on status */}
          {status === "PENDING" && (
            <div className="radar-box">
              <div className="radar-circle">
                <div className="radar-core">
                  <Compass size={40} className="animate-pulse-soft" color="var(--primary)" />
                </div>
              </div>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-muted)" }}>
                Checking liquidity density...
              </p>
            </div>
          )}

          {status === "ACCEPTED" && worker && (
            <div>
              <div className="worker-profile-card">
                <div className="worker-header">
                  <img src={worker.photo} alt={worker.name} className="worker-photo" />
                  <div className="worker-info">
                    <div className="worker-name">{worker.name}</div>
                    <div className="worker-desc">NearPro Verified Professional</div>
                    <div className="worker-rating-badge">
                      <Star size={12} fill="var(--primary)" stroke="var(--primary)" />
                      <span>{worker.rating || "4.8"} Rating</span>
                    </div>
                  </div>
                </div>
                <div className="contact-action">
                  <button className="contact-btn" onClick={() => alert(`Calling ${worker.name} at ${worker.phone}`)}>
                    <Phone size={14} /> Call Helper
                  </button>
                  <button className="contact-btn primary-btn" onClick={() => alert("SOS Triggered. NearPro Kavach is alerting emergency response.")}>
                    Emergency SOS
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                <span>Route progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="widget-bar" style={{ height: "6px" }}>
                <div className="widget-progress" style={{ width: `${progressPercent}%`, animation: "none" }}></div>
              </div>
            </div>
          )}

          {status === "IN_PROGRESS" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 0" }}>
              <div className="radar-circle" style={{ borderColor: "rgba(59,46,163,0.15)", animation: "none" }}>
                <div className="radar-core" style={{ background: "rgba(59,46,163,0.06)" }}>
                  <Clock size={40} color="var(--secondary)" className="animate-float" />
                </div>
              </div>
              <p style={{ fontSize: "18px", fontWeight: "700", margin: "16px 0 4px 0" }}>
                Job timer counting down:
              </p>
              <p style={{ fontSize: "28px", fontWeight: "800", color: "var(--secondary)" }}>
                00:{jobTimer < 10 ? `0${jobTimer}` : jobTimer}
              </p>
            </div>
          )}

          {status === "COMPLETED" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 0" }}>
              <CheckCircle2 size={64} color="#059669" className="animate-float" />
              <button
                className="btn-primary"
                style={{ marginTop: "32px", display: "flex", alignItems: "center", gap: "6px", width: "100%", justifyContent: "center" }}
                onClick={onBackToHome}
              >
                Back to Dashboard <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Bottom disclaimer */}
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "#F9FAFB", padding: "14px", borderRadius: "12px", border: "1px solid rgba(15,17,23,0.05)", marginTop: "24px" }}>
            <Award size={18} color="var(--secondary)" style={{ minWidth: "18px", marginTop: "2px" }} />
            <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4 }}>
              <strong>NearPro Kavach is active:</strong> Your helper underwent dual Aadhaar/PAN checks and a 2-day physical training course prior to booking.
            </p>
          </div>
        </div>

        {/* Leaflet Live Map Frame */}
        <div className="tracker-map-frame">
          <div ref={mapRef} style={{ height: "100%" }}></div>
        </div>
      </div>
    </div>
  );
}
