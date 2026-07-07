import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MdPhotoCamera, MdRefresh, MdCheckCircle, MdError, MdLocationOn, MdBatteryAlert, MdSignalCellularAlt } from 'react-icons/md';

export default function CameraCheckIn({ 
  token, 
  actionType = 'checkin', // checkin or checkout
  officeLat = 12.9716, 
  officeLng = 77.5946, 
  radiusMeters = 150, 
  onSuccess 
}) {
  const [cameraActive, setCameraActive] = useState(false);
  const [photo, setPhoto] = useState(null); // base64 string
  const [gpsCoords, setGpsCoords] = useState({ latitude: 12.9716, longitude: 77.5946, accuracy: 10 });
  const [isWfh, setIsWfh] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true); // default to simulation for testing ease
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [distance, setDistance] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Haversine Distance helper
  const calculateHaversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Recompute distance whenever coordinates update
  useEffect(() => {
    const dist = calculateHaversine(gpsCoords.latitude, gpsCoords.longitude, officeLat, officeLng);
    setDistance(dist);
  }, [gpsCoords, officeLat, officeLng]);

  // Load Real GPS Location if not simulating
  useEffect(() => {
    if (!isSimulating && navigator.geolocation) {
      const watchId = navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 10
          });
        },
        (err) => {
          console.error("GPS fetch error:", err);
          setMessage("Failed to retrieve real GPS coords. Reverting to Simulation.");
          setMessageType('error');
          setIsSimulating(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [isSimulating]);

  // Start Camera feed
  const startCamera = async () => {
    setMessage(null);
    try {
      if (streamRef.current) {
        stopCamera();
      }

      // Restrict to front camera only
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access failed:", err);
      setMessage("Failed to access front camera. Please check permissions.");
      setMessageType('error');
    }
  };

  // Stop Camera feed
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Clean up camera on unmount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [actionType]);

  // Capture snapshot
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    
    // Draw horizontal mirror flip (standard front camera style)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Convert to JPEG format string
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPhoto(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  // Adjust simulation positions
  const handleSimChange = (mode) => {
    if (mode === 'inside') {
      setGpsCoords({ latitude: officeLat, longitude: officeLng, accuracy: 8 });
    } else {
      // Offset by 5km
      setGpsCoords({ latitude: officeLat + 0.045, longitude: officeLng + 0.045, accuracy: 12 });
    }
  };

  // Gather browser meta
  const getClientMeta = async () => {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    let os = "Unknown OS";

    if (ua.indexOf("Firefox") > -1) browser = "Mozilla Firefox";
    else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Browser";
    else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
    else if (ua.indexOf("Trident") > -1) browser = "Internet Explorer";
    else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) browser = "Microsoft Edge";
    else if (ua.indexOf("Chrome") > -1) browser = "Google Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Apple Safari";

    if (ua.indexOf("Windows NT 10.0") > -1) os = "Windows 10/11";
    else if (ua.indexOf("Macintosh") > -1) os = "macOS";
    else if (ua.indexOf("iPhone") > -1) os = "iOS";
    else if (ua.indexOf("Android") > -1) os = "Android";
    else if (ua.indexOf("Linux") > -1) os = "Linux";

    const deviceName = /Mobi|Android|iPhone/i.test(ua) ? 'Mobile Device' : 'Desktop/Laptop';
    const networkType = navigator.connection ? navigator.connection.effectiveType || navigator.connection.type : 'wifi';
    
    let batteryLevel = null;
    try {
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        batteryLevel = battery.level * 100;
      }
    } catch (e) {}

    return { browser, os, deviceName, networkType, batteryLevel };
  };

  // Submit checkin / checkout
  const handleSubmit = async () => {
    if (!photo) {
      setMessage("Please capture a live photo first.");
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const meta = await getClientMeta();
      const payload = {
        photo,
        latitude: gpsCoords.latitude,
        longitude: gpsCoords.longitude,
        gps_accuracy: gpsCoords.accuracy,
        is_wfh: isWfh ? 1 : 0,
        browser: meta.browser,
        operating_system: meta.os,
        device_name: meta.deviceName,
        network_type: meta.networkType,
        battery_level: meta.batteryLevel
      };

      const url = `http://localhost:8000/index.php?route=/api/attendance/${actionType}`;
      const response = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessageType('success');
      setMessage(response.data.message);
      
      // Stop camera if still running
      stopCamera();

      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.error || "Attendance registration failed.");
    } finally {
      setLoading(false);
    }
  };

  // Distance status checks
  const isWithinRadius = distance <= radiusMeters || isWfh;

  return (
    <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>
            {actionType === 'checkin' ? 'Check In Portal' : 'Check Out Portal'}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>Front camera face capture + geofencing check</p>
        </div>
        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '6px', backgroundColor: '#e0e7ff', color: '#4338ca', fontWeight: 700 }}>
          Radius: {radiusMeters}m
        </span>
      </div>

      {/* Main Stream Container */}
      <div style={{ position: 'relative', width: '100%', height: '240px', backgroundColor: '#0f172a', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {photo ? (
          <img src={photo} alt="Captured checkin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
            />
            {!cameraActive && (
              <div style={{ position: 'absolute', color: '#94a3b8', fontSize: '0.85rem' }}>
                Initializing lens access...
              </div>
            )}
          </>
        )}
      </div>

      {/* Camera Actions */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {!photo ? (
          <button 
            type="button" 
            onClick={capturePhoto} 
            disabled={!cameraActive}
            className="btn-primary" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', border: 'none', backgroundColor: '#0047B8', color: '#fff', fontWeight: 600 }}
          >
            <MdPhotoCamera size={20} /> Capture Selfie
          </button>
        ) : (
          <button 
            type="button" 
            onClick={retakePhoto} 
            className="btn-secondary" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', fontWeight: 600 }}
          >
            <MdRefresh size={20} /> Retake Snapshot
          </button>
        )}
      </div>

      {/* Geofencing Verification Status Panel */}
      <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <MdLocationOn color="#E30613" /> Geofence Verification Status
        </h4>

        {/* WFH Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Work From Home (WFH) Mode</span>
          <input 
            type="checkbox" 
            checked={isWfh} 
            onChange={(e) => setIsWfh(e.target.checked)} 
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
        </div>

        {/* Coords details */}
        {!isWfh && (
          <>
            {/* GPS Simulation Toggle */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.5rem', marginBottom: '0.25rem', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Coordinate Source Sim</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setIsSimulating(true); handleSimChange('inside'); }}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #0047B8', cursor: 'pointer', backgroundColor: (isSimulating && distance < 10) ? '#e0e7ff' : '#fff' }}
                >
                  Inside Office
                </button>
                <button 
                  type="button" 
                  onClick={() => { setIsSimulating(true); handleSimChange('outside'); }}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #E30613', cursor: 'pointer', backgroundColor: (isSimulating && distance > 1000) ? '#fde8e8' : '#fff' }}
                >
                  Outside Office
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsSimulating(false)}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #64748b', cursor: 'pointer', backgroundColor: !isSimulating ? '#f1f5f9' : '#fff' }}
                >
                  Real GPS
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem', color: '#475569' }}>
              <div>
                <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem' }}>Distance to Office</span>
                <strong style={{ color: isWithinRadius ? '#0047B8' : '#E30613' }}>
                  {distance > 1000 ? `${(distance/1000).toFixed(2)} km` : `${Math.round(distance)} meters`}
                </strong>
              </div>
              <div>
                <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem' }}>GPS Accuracy</span>
                <strong>&plusmn; {Math.round(gpsCoords.accuracy)} meters</strong>
              </div>
            </div>

            {/* Geofence Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem', fontSize: '0.8rem' }}>
              {isWithinRadius ? (
                <>
                  <MdCheckCircle color="#0047B8" size={18} />
                  <span style={{ color: '#0047B8', fontWeight: 700 }}>Inside boundaries. Verification OK.</span>
                </>
              ) : (
                <>
                  <MdError color="#E30613" size={18} />
                  <span style={{ color: '#E30613', fontWeight: 700 }}>Outside permitted office radius.</span>
                </>
              )}
            </div>
          </>
        )}

        {isWfh && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#475569' }}>
            <MdCheckCircle color="#0047B8" size={18} />
            <span>WFH bypass active. Verification OK.</span>
          </div>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.75rem 1rem', 
          borderRadius: '8px', 
          fontSize: '0.8rem',
          backgroundColor: messageType === 'success' ? 'rgba(0,71,184,0.06)' : 'rgba(227,6,19,0.06)',
          color: messageType === 'success' ? '#0047B8' : '#E30613',
          border: `1px solid ${messageType === 'success' ? 'rgba(0,71,184,0.1)' : 'rgba(227,6,19,0.1)'}`
        }}>
          {messageType === 'success' ? <MdCheckCircle size={18} /> : <MdError size={18} />}
          <span>{message}</span>
        </div>
      )}

      {/* Submit Trigger */}
      <button 
        type="button" 
        onClick={handleSubmit} 
        disabled={loading || !photo || !isWithinRadius}
        style={{
          width: '100%',
          padding: '0.85rem',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: (!photo || !isWithinRadius) ? '#cbd5e1' : '#0047B8',
          color: (!photo || !isWithinRadius) ? '#94a3b8' : '#fff',
          fontWeight: 700,
          cursor: (!photo || !isWithinRadius) ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          boxShadow: (!photo || !isWithinRadius) ? 'none' : '0 4px 6px rgba(0, 71, 184, 0.15)'
        }}
      >
        {loading ? 'Registering details...' : (actionType === 'checkin' ? 'Submit Clock In' : 'Submit Clock Out')}
      </button>
    </div>
  );
}
