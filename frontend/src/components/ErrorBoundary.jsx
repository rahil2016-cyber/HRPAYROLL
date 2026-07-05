import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 71, 184, 0.04)',
          margin: '2rem auto',
          maxWidth: '600px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ color: '#E30613', marginBottom: '1rem', fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            We've encountered an unexpected UI error. Please refresh the page or try navigating elsewhere.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              backgroundColor: '#0047B8',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
