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
