import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    // Simulate a network request for OAuth
    setTimeout(() => {
      login({
        id: 'u-12345',
        name: 'Developer',
        email: 'developer@example.com',
        avatar: 'D'
      });
    }, 1200);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-family)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div style={{ width: 48, height: 48, backgroundColor: '#E03E3E', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 24, marginBottom: 24, boxShadow: '0 4px 12px rgba(224, 62, 62, 0.3)' }}>
          S
        </div>
        
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Log in to Workspace</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
          Continue with Google to access your documents and workflows.
        </p>

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#ffffff',
            color: '#3c4043',
            border: '1px solid #dadce0',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: isLoggingIn ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            opacity: isLoggingIn ? 0.7 : 1
          }}
        >
          {isLoggingIn ? (
            <span>Connecting securely...</span>
          ) : (
            <>
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Login;
