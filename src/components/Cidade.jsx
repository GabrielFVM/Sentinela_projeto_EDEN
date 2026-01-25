import React, { useState, useEffect } from 'react';
import PerfilCard from './PerfilCard';
import { API_BASE_URL } from '../config';

// Cidade Component
export default function Cidade({ cidade, onUpdate }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [missoes, setMissoes] = useState([]);
  const [selectedMissaoId, setSelectedMissaoId] = useState(cidade?.missao_id || '');
  const [loading, setLoading] = useState(false);

  // Carregar missões quando o modal abrir
  useEffect(() => {
    if (showEditModal) {
      loadMissoes();
      setSelectedMissaoId(cidade?.missao_id || '');
    }
  }, [showEditModal, cidade?.missao_id]);

  const loadMissoes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/missoes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!data.erro) {
        setMissoes(data);
      }
    } catch (err) {
      console.error('Erro ao carregar missões:', err);
    }
  };

  const handleSaveMissao = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/perimetros/${cidade.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          missao_id: selectedMissaoId || null
        })
      });
      
      if (response.ok) {
        setShowEditModal(false);
        if (onUpdate) onUpdate();
        // Recarregar a página para atualizar os dados
        window.location.reload();
      }
    } catch (err) {
      console.error('Erro ao atualizar missão:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!cidade) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#667eea' }}>
        Carregando dados...
      </div>
    );
  }

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        padding: '40px',
        borderRadius: '8px',
        marginBottom: '40px',
        boxShadow: '0 8px 32px rgba(204, 0, 0, 0.15), inset 0 0 20px rgba(204, 0, 0, 0.05)',
        margin: '30px 20px',
        border: '1px solid rgba(204, 0, 0, 0.3)'
      }}>
        <h2 style={{ 
          color: '#ff6666',
          marginTop: 0,
          fontSize: '2rem',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          {cidade?.cidade || "Perimetro desconhecido"}
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '25px',
          marginTop: '20px'
        }}>
          <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '15px' }}>
            <strong style={{ color: '#ff6666', textTransform: 'uppercase', letterSpacing: '1px' }}>População:</strong>
            <p style={{ margin: '8px 0 0 0', color: '#cccccc', fontSize: '1.1rem' }}>{cidade.populacao == -1 ? "Desconhecida" : cidade.populacao}</p>
          </div>
          <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '15px' }}>
            <strong style={{ color: '#ff6666', textTransform: 'uppercase', letterSpacing: '1px' }}>Status:</strong>
            <p style={{ margin: '8px 0 0 0', color: '#cccccc', fontSize: '1.1rem' }}>{cidade.status}</p>
          </div>
          <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '15px' }}>
            <strong style={{ color: '#ff6666', textTransform: 'uppercase', letterSpacing: '1px' }}>Classe:</strong>
            <p style={{ margin: '8px 0 0 0', color: '#cccccc', fontSize: '1.1rem' }}>{cidade.class}</p>
          </div>
          <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '15px' }}>
            <strong style={{ color: '#ff6666', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin:</strong>
            <p style={{ margin: '8px 0 0 0', color: '#cccccc', fontSize: '1.1rem' }}>{cidade.admin_nome}</p>
          </div>
          <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '15px' }}>
            <strong style={{ color: '#ff6666', textTransform: 'uppercase', letterSpacing: '1px' }}>Missão Associada:</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
              <p style={{ margin: 0, color: cidade.missao_nome ? '#5bc0de' : '#666', fontSize: '1.1rem' }}>
                {cidade.missao_nome || 'Nenhuma missão vinculada'}
              </p>
              <button
                onClick={() => setShowEditModal(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid #cc0000',
                  borderRadius: '4px',
                  color: '#ff6666',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(204, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                ✎ Editar
              </button>
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ 
        color: '#ff6666',
        marginBottom: '30px',
        marginLeft: '20px',
        fontSize: '1.8rem',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        ◆ Homúnculos Registrados ({cidade.homunculos?.length || 0})
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '25px',
        padding: '0 20px'
      }}>
        {cidade.homunculos && cidade.homunculos.map((perfil) => (
            <PerfilCard key={perfil.id} perfil={perfil} />
        ))}
      </div>

      {/* Modal de Seleção de Missão */}
      {showEditModal && (
        <div
          onClick={() => setShowEditModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
              border: '2px solid #cc0000',
              borderRadius: '12px',
              padding: '30px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 0 40px rgba(204, 0, 0, 0.4)'
            }}
          >
            <h3 style={{
              color: '#ff6666',
              margin: '0 0 25px 0',
              fontSize: '1.3rem',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              Vincular Missão ao Perímetro
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#ff6666',
                marginBottom: '8px',
                fontSize: '0.9rem',
                textTransform: 'uppercase'
              }}>
                Selecione uma Missão
              </label>
              <select
                value={selectedMissaoId}
                onChange={(e) => setSelectedMissaoId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#1a1a1a',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              >
                <option value="">-- Nenhuma missão --</option>
                {missoes.map((missao) => (
                  <option key={missao.id} value={missao.id}>
                    {missao.nome} ({missao.status})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid #666',
                  borderRadius: '6px',
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMissao}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: loading ? '#333' : 'linear-gradient(135deg, #cc0000 0%, #990000 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
