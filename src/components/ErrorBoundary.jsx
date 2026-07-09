import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log for debugging; in production this could be sent to a monitoring service.
    console.error('Uncaught application error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-color, #191919)',
          color: 'var(--text-primary, #fff)',
          fontFamily: 'var(--font-family, sans-serif)',
          textAlign: 'center',
          padding: 24
        }}>
          <AlertTriangle size={40} color="#E03E3E" style={{ marginBottom: 16 }} />
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary, #9B9B9B)', fontSize: 14, marginBottom: 24, maxWidth: 480 }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering the app.'}
          </p>
          <button
            onClick={this.handleReload}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              backgroundColor: '#2383E2', color: 'white', border: 'none',
              padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500
            }}
          >
            <RefreshCw size={14} /> Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
