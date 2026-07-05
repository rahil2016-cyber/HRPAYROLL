import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, trendColor = '#0047B8', description }) {
  return (
    <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>{title}</span>
        {Icon && (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 71, 184, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0047B8'
          }}>
            <Icon size={20} />
          </div>
        )}
      </div>
      
      <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', margin: '0.25rem 0' }}>
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
        {trend && (
          <span style={{ color: trendColor, fontWeight: 700 }}>
            {trend}
          </span>
        )}
        {description && <span>{description}</span>}
      </div>
    </div>
  );
}
