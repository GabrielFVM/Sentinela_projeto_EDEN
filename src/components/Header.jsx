import React, { useState, useEffect } from 'react';
import Profile from './Profile';
import { useLocation } from 'react-router-dom';

// Header Component
export default function Header({ onLogout, username = 'Usuário' }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Se scrollou mais de 50px, muda para small
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const size = isScrolled ? 'small' : 'big';
  const buttonTop = isScrolled ? '12px' : '40px';
  const location = useLocation();
  const isLoginPage = location.pathname == '/login';

  return (
    <>
      {!isLoginPage && (
        <Profile username={username} funcao="admin" />
      )}
      <header className={`header ${size}`}>
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              position: 'fixed',
              right: '20px',
              top: buttonTop,
              background: 'rgba(255, 51, 51, 0.2)',
              color: '#ff6666',
              border: '2px solid #ff6666',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'all 0.3s ease',
              zIndex: 1000
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 51, 51, 0.3)';
              e.target.style.boxShadow = '0 0 12px rgba(204, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 51, 51, 0.2)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Sair
          </button>
        )}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px',
          marginRight: '50px'
        }}>
          <img 
            src="/guard.png" 
            alt="Guard" 
            style={{
              height: isScrolled ? '35px' : '60px',
              width: 'auto',
              filter: 'drop-shadow(0 0 8px rgba(204, 0, 0, 0.5))',
              transition: 'all 0.3s ease'
            }}
          />
          <h1 style={{
            margin: 0,
            fontSize: isScrolled ? '1.6rem' : '3rem',
          }}>S.E.N.T.I.N.E.L.A</h1>
        </div>
        <p>Sistema de Monitoramento - Projeto EDEN</p>
      </header>
    </>
  );
}
