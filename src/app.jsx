import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import CidadePage from "./pages/CidadePage";
import Login from "./pages/Login";

// Função para decodificar JWT e extrair payload
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

// Função para verificar se o token está expirado
function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  // exp está em segundos, Date.now() está em milissegundos
  return Date.now() >= payload.exp * 1000;
}

// Função para extrair username do token
function getUsernameFromToken(token) {
  const payload = decodeToken(token);
  return payload?.username || 'Usuário';
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  // Função de logout que pode ser chamada de qualquer lugar
  const handleLogout = useCallback(() => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUsername('');
  }, []);

  // Função para validar token com o servidor
  const validateToken = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      handleLogout();
      return false;
    }

    // Primeiro verifica se está expirado localmente
    if (isTokenExpired(token)) {
      console.log('Token expirado localmente');
      handleLogout();
      return false;
    }

    // Valida com o servidor fazendo uma requisição simples
    try {
      const response = await fetch('http://127.0.0.1:2025/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401 || response.status === 403) {
        console.log('Token rejeitado pelo servidor');
        handleLogout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.log('Erro ao validar token:', error);
      return true; // Não faz logout se for erro de conexão
    }
  }, [handleLogout]);

  // Verificação inicial ao carregar
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
      setUsername(getUsernameFromToken(token));
    } else if (token) {
      // Token existe mas está expirado
      localStorage.removeItem('authToken');
    }
    setLoading(false);
  }, []);

  // Validação periódica do token (a cada 30 segundos)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      validateToken();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [isAuthenticated, validateToken]);

  const handleLogin = (token) => {
    // Remove token antigo se existir
    localStorage.removeItem('authToken');
    // Salva novo token
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);
    setUsername(getUsernameFromToken(token));
  };

  if (loading) {
    return <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cccccc' }}>Carregando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota de login */}
        <Route path="/login" element={<Login onLoginSuccess={handleLogin} />} />

        {/* Rota protegida da cidade */}
        <Route
          path="/perimetro"
          element={
            isAuthenticated ? (
              <>
                <Header onLogout={handleLogout} username={username} />
                <CidadePage />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Rota raiz redireciona para login */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/perimetro" : "/login"} replace />} />

        {/* Rota coringa para 404 */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/perimetro" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}