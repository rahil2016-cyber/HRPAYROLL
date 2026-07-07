import React from 'react';
import { MdCheckCircle, MdDateRange, MdAccessTime, MdMyLocation } from 'react-icons/md';
import CameraCheckIn from './CameraCheckIn';

export default function GPSCheckIn({ 
  token,
  branchName = 'Head Office',
  officeLat = 12.9716, 
  officeLng = 77.5946, 
  radiusMeters = 150, 
  onClockIn, 
  lastLog 
}) {

  // SUCCESS STATE: Checked In & Checked Out
  if (lastLog && lastLog.clock_in && lastLog.clock_out) {
    return (
      <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '16px', textAlign: 'center', alignItems: 'center' }}>
        <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: 'rgba(0, 71, 184, 0.08)', color: '#0047B8', width: 'fit-content' }}>
          <MdCheckCircle size={40} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Attendance Logging Complete</h3>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Your shifts for today have been fully logged and verified.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '0.5rem' }}>
          <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>CLOCK IN</span>
            <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{lastLog.clock_in}</strong>
          </div>
          <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>CLOCK OUT</span>
            <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{lastLog.clock_out}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0047B8', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.25rem' }}>
          <MdMyLocation /> Verified at Branch: {branchName}
        </div>
      </div>
    );
  }

  // CHECK OUT PENDING: Checked In, but Check Out is empty
  if (lastLog && lastLog.clock_in && !lastLog.clock_out) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Short info card */}
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(0, 71, 184, 0.04)', border: '1px solid rgba(0, 71, 184, 0.1)', borderRadius: '12px' }}>
          <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(0, 71, 184, 0.08)', color: '#0047B8' }}>
            <MdAccessTime size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>ACTIVE SHIFT STARTED</span>
            <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>
              Clocked in today at <strong style={{ color: '#0047B8' }}>{lastLog.clock_in}</strong>
            </span>
          </div>
        </div>

        {/* Camera check out view */}
        <CameraCheckIn 
          token={token}
          actionType="checkout"
          officeLat={officeLat}
          officeLng={officeLng}
          radiusMeters={radiusMeters}
          onSuccess={onClockIn}
        />
      </div>
    );
  }

  // CHECK IN PENDING: No shifts logged today yet
  return (
    <CameraCheckIn 
      token={token}
      actionType="checkin"
      officeLat={officeLat}
      officeLng={officeLng}
      radiusMeters={radiusMeters}
      onSuccess={onClockIn}
    />
  );
}
