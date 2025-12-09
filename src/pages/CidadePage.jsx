import React, { useEffect, useState } from "react";
import Cidade from "../components/Cidade";
import "../styles/cidade.css";

export default function CidadePage() {
  const [cidade, setCidade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Token não encontrado');
      setLoading(false);
      return;
    }

    fetch("http://127.0.0.1:2025/", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setCidade(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar cidade:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="cidade-container" style={{ paddingTop: '200px' }}>
      <h1>Cidade</h1>
      {loading && <p style={{ color: '#0099ff', textAlign: 'center', marginTop: '200px' }}>Carregando dados...</p>}
      {error && <p style={{ color: '#ff6666', textAlign: 'center', marginTop: '200px' }}>Erro: {error}</p>}
      {!loading && !error && <Cidade cidade={cidade} />}
    </div>
  );
}
