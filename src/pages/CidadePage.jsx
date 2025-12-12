import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cidade from "../components/Cidade";
import "../styles/cidade.css";
import { API_BASE_URL } from "../config";

export default function CidadePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cidade, setCidade] = useState(null);
  const [perimetro, setPerimetro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Token não encontrado');
      setLoading(false);
      return;
    }

    // Carregar dados do perímetro
    Promise.all([
      fetch(`${API_BASE_URL}/perimetros/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json())
    ])
      .then(([cidadeData]) => {
        setCidade(cidadeData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar dados:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="cidade-container" style={{ paddingTop: '200px' }}>
      {/* Botão Voltar */}
      <button
        onClick={() => navigate('/sentinela')}
        style={{
          background: 'rgba(30, 30, 30, 0.9)',
          border: '2px solid #cc0000',
          borderRadius: '8px',
          color: '#ff6666',
          padding: '10px 20px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease',
          marginBottom: '20px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(204, 0, 0, 0.2)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(204, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(30, 30, 30, 0.9)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        ← Voltar
      </button>

      <h1 style={{ marginLeft: '50px', WebkitTextStroke: '0.5px #ffffffff', color: '#cd1e1eff'}}>{cidade?.nome || 'Cidade'}</h1>
      {loading && <p style={{ color: '#0099ff', textAlign: 'center', marginTop: '200px'}}>Carregando dados...</p>}
      {error && <p style={{ color: '#ff6666', textAlign: 'center', marginTop: '200px' }}>Erro: {error}</p>}
      {!loading && !error && <Cidade cidade={cidade} />}
    </div>
  );
}
