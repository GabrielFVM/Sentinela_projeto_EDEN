import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { API_BASE_URL } from '../config';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [banAlert, setBanAlert] = useState(false);
  const [meltingScreen, setMeltingScreen] = useState(false);
  const [showZ, setShowZ] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Login realizado com sucesso!');
        setUsername('');
        setPassword('');
        // Chama a função de callback para atualizar autenticação
        if (onLoginSuccess) {
          onLoginSuccess(data.token);
          // Redireciona para /perimetro após 500ms
          setTimeout(() => navigate('/perimetro'), 500);
        }
      } else if (data.banido) {
        // Usuário banido - tela preta
        setBanAlert(true);
        setError('');
      } else {
        setError(data.erro || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      
      {/* Tela preta de fundo + Alerta de Banimento */}
      {banAlert && (
        <>
          {/* Fundo preto que cobre o login */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: '#000',
              zIndex: 99998
            }}
          />
          
          {/* Alerta de Banimento na frente */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'transparent',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              animation: meltingScreen ? 'meltScreen 4s ease-in forwards' : 'none',
              overflow: 'hidden'
            }}
          >
            <style>
              {`
                @keyframes banPulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.05); opacity: 0.9; }
                }
                @keyframes banGlitch {
                  0%, 100% { transform: translateX(0); }
                  10% { transform: translateX(-2px); }
                  20% { transform: translateX(2px); }
                  30% { transform: translateX(-2px); }
                  40% { transform: translateX(2px); }
                  50% { transform: translateX(0); }
                }
                @keyframes meltScreen {
                  0% { 
                    filter: blur(0) saturate(1);
                    transform: scale(1) translateY(0);
                    opacity: 1;
                  }
                  20% {
                    filter: blur(2px) saturate(1.5);
                    transform: scale(1.02) translateY(10px);
                  }
                  40% {
                    filter: blur(5px) saturate(2);
                    transform: scale(1.05, 0.95) translateY(50px);
                  }
                  60% {
                    filter: blur(10px) saturate(2.5);
                    transform: scale(1.1, 0.8) translateY(150px);
                  }
                  80% {
                    filter: blur(20px) saturate(3);
                    transform: scale(1.2, 0.5) translateY(300px);
                    opacity: 0.5;
                  }
                  100% { 
                    filter: blur(30px) saturate(0);
                    transform: scale(1.5, 0.1) translateY(500px);
                    opacity: 0;
                  }
                }
                @keyframes meltDrip {
                  0% {
                    transform: translateY(0) scaleY(1);
                    opacity: 1;
                  }
                  100% {
                    transform: translateY(100vh) scaleY(3);
                    opacity: 0;
                  }
                }
              `}
            </style>
            
            {/* Dripping pixels effect when melting */}
            {meltingScreen && (
              <>
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      top: `${Math.random() * 50}%`,
                      left: `${Math.random() * 100}%`,
                      width: `${10 + Math.random() * 30}px`,
                      height: `${50 + Math.random() * 100}px`,
                      background: `linear-gradient(180deg, #ff0000 0%, #660000 50%, transparent 100%)`,
                      borderRadius: '0 0 50% 50%',
                      animation: `meltDrip ${1 + Math.random() * 3}s ease-in forwards`,
                      animationDelay: `${Math.random() * 1}s`,
                      opacity: 0.8,
                      filter: 'blur(2px)'
                    }}
                  />
                ))}
              </>
            )}
            
            {/* Glowing red border */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              bottom: '10px',
              border: '3px solid #ff0000',
              borderRadius: '5px',
              boxShadow: '0 0 30px #ff0000, inset 0 0 30px rgba(255, 0, 0, 0.1)',
              animation: meltingScreen ? 'meltDrip 2.5s ease-in forwards' : 'banPulse 1s ease-in-out infinite',
              transition: 'all 0.3s',
              pointerEvents: 'none'
            }} />
            
            {/* Warning Icon */}
            <div style={{
              fontSize: '8rem',
              marginBottom: '30px',
              animation: meltingScreen ? 'meltDrip 1.6s ease-in forwards' : 'banGlitch 0.3s ease-in-out infinite',
              textShadow: '0 0 20px #ff0000, 0 0 40px #ff0000, 0 0 60px #ff0000'
            }}>
              ⚠️
            </div>
            
            {/* Alert Title */}
            <div style={{
              color: '#ff0000',
              fontSize: '2.5rem',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '8px',
              marginBottom: '20px',
              textShadow: '0 0 10px #ff0000, 0 0 20px #ff0000',
              animation: meltingScreen ? 'meltDrip 1.8s ease-in forwards' : 'banPulse 0.8s ease-in-out infinite',
              animationDelay: meltingScreen ? '0.2s' : '0s'
            }}>
              ⛔ ACESSO NEGADO ⛔
            </div>
            
            {/* Alert Message */}
            <div style={{
              background: 'rgba(255, 0, 0, 0.1)',
              border: '2px solid #ff0000',
              borderRadius: '10px',
              padding: '30px 50px',
              maxWidth: '700px',
              textAlign: 'center',
              boxShadow: '0 0 30px rgba(255, 0, 0, 0.3)',
              animation: meltingScreen ? 'meltDrip 2s ease-in forwards' : 'none',
              animationDelay: meltingScreen ? '0.4s' : '0s'
            }}>
              <div style={{
                color: '#ff3333',
                fontSize: '1.3rem',
                fontWeight: '600',
                marginBottom: '15px',
                fontFamily: 'monospace'
              }}>
                TENTATIVA DE ACESSO EM CONTA BANIDA DETECTADA
              </div>
              <div style={{
                color: '#ff6666',
                fontSize: '1.1rem',
                lineHeight: '1.8',
                fontFamily: 'monospace'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  🔴 Sua localização foi <span style={{ color: '#ff0000', fontWeight: 'bold' }}>EXPOSTA</span> para o G.U.A.R.D.I.A.O
                </div>
                <div style={{ marginBottom: '10px' }}>
                  🔴 Endereço IP: <span style={{ color: '#ff0000' }}>{Math.floor(Math.random()*255)}.{Math.floor(Math.random()*255)}.{Math.floor(Math.random()*255)}.{Math.floor(Math.random()*255)}</span>
                </div>
                <div>
                  🔴 Coordenadas registradas no banco de dados
                </div>
              </div>
            </div>
            
            {/* Warning Text */}
            <div style={{
              color: '#990000',
              fontSize: '0.9rem',
              marginTop: '40px',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              animation: meltingScreen ? 'meltDrip 2.2s ease-in forwards' : 'none',
              animationDelay: meltingScreen ? '0.6s' : '0s'
            }}>
              Esta tentativa será investigada
            </div>
            
            {/* Close button */}
            {!meltingScreen && (
              <button
                onClick={() => {
                  setMeltingScreen(true);
                  setTimeout(() => {
                    setBanAlert(false);
                    setShowZ(true);
                  }, 4000);
                }}
                style={{
                  marginTop: '30px',
                  background: 'transparent',
                  border: '2px solid #ff0000',
                  color: '#ff0000',
                  padding: '12px 40px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  borderRadius: '5px',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  position: 'relative',
                  zIndex: 10000
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 0, 0, 0.2)';
                  e.target.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Fechar
              </button>
            )}
          </div>
        </>
      )}

      {/* Tela Z - Após derretimento */}
      {showZ && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#000',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');
              
              @keyframes zAppear {
                0% { 
                  opacity: 0; 
                  transform: scale(5) rotate(180deg);
                  filter: blur(30px);
                }
                60% {
                  opacity: 1;
                  transform: scale(0.8) rotate(-10deg);
                  filter: blur(0);
                }
                80% {
                  transform: scale(1.1) rotate(5deg);
                }
                100% { 
                  opacity: 1; 
                  transform: scale(1) rotate(0deg);
                  filter: blur(0);
                }
              }
            `}
          </style>
          
          {/* The Z - estático com glow roxo */}
          <div style={{
            fontSize: '20rem',
            fontWeight: '900',
            color: '#000000',
            fontFamily: "'Orbitron', 'Courier New', monospace",
            animation: 'zAppear 1.5s ease-out forwards',
            textShadow: '0 0 20px #8b00ff, 0 0 40px #8b00ff, 0 0 60px #8b00ff, 0 0 80px #8b00ff, 0 0 100px #9400d3, 0 0 150px #9400d3',
            userSelect: 'none',
            letterSpacing: '-10px',
            WebkitTextStroke: '2px #8b00ff'
          }}>
            Z
          </div>
        </div>
      )}

      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        {/* Login Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          borderRadius: '10px',
          padding: '50px 35px 30px',
          boxShadow: '0 16px 48px rgba(204, 0, 0, 0.3), inset 0 0 20px rgba(204, 0, 0, 0.05)',
          border: '2px solid #cc0000',
          width: '100%',
          maxWidth: '380px',
          marginTop: '200px'
        }}>
        <h2 style={{
          color: '#ff6666',
          marginTop: 0,
          marginBottom: '25px',
          fontSize: '1.5rem',
          textAlign: 'center',
          textTransform: 'uppercase',
          letterSpacing: '1.5px'
        }}>
          Acesso Restrito
        </h2>

        {error && (
          <div style={{
            background: 'rgba(204, 0, 0, 0.2)',
            border: '1px solid #ff3333',
            color: '#ff6666',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '18px',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(0, 100, 0, 0.2)',
            border: '1px solid #00ff00',
            color: '#66ff66',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '18px',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: '#ff6666',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '6px',
              fontWeight: '600'
            }}>
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid #cc0000',
                borderRadius: '5px',
                color: '#cccccc',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ff3333';
                e.target.style.boxShadow = '0 0 12px rgba(204, 0, 0, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cc0000';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#ff6666',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '6px',
              fontWeight: '600'
            }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid #cc0000',
                borderRadius: '5px',
                color: '#cccccc',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ff3333';
                e.target.style.boxShadow = '0 0 12px rgba(204, 0, 0, 0.3)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cc0000';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #cc0000 0%, #ff3333 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '0.95rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: loading ? 0.6 : 1,
              boxShadow: '0 4px 15px rgba(204, 0, 0, 0.3)',
              transform: loading ? 'scale(1)' : 'scale(1)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.boxShadow = '0 8px 25px rgba(204, 0, 0, 0.5)';
                e.target.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.boxShadow = '0 4px 15px rgba(204, 0, 0, 0.3)';
                e.target.style.transform = 'scale(1)';
              }
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Footer Info */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(204, 0, 0, 0.2)',
          textAlign: 'center',
          color: '#999999',
          fontSize: '0.8rem'
        }}>
          <p style={{ margin: 0 }}>
            🔒 Acesso autorizado apenas para Seraphins
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#666666', fontSize: '0.75rem' }}>
            Contate o administrador para suporte
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
