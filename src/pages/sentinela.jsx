import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function SentinelaPage() {
  const [mteModalOpen, setMteModalOpen] = useState(false);
  const [perimetros, setPerimetros] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Carregar perímetros quando o modal abrir
  useEffect(() => {
    if (mteModalOpen) {
      loadPerimetros();
    }
  }, [mteModalOpen]);

  const loadPerimetros = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/perimetros`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!data.erro) {
        setPerimetros(data);
      }
    } catch (err) {
      console.error('Erro ao carregar perímetros:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePerimetroClick = (perimetroId) => {
    setMteModalOpen(false);
    navigate(`/perimetro/${perimetroId}`);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      padding: '200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '30px'
    }}>
      {/* Título da página */}
      <h2 style={{
        color: '#ff6666',
        fontSize: '1.5rem',
        textTransform: 'uppercase',
        letterSpacing: '3px',
        marginBottom: '0px'
      }}>
        Central de Operações
      </h2>

      {/* Container de pastas */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '30px',
        justifyContent: 'center',
        maxWidth: '1200px'
      }}>
        {/* Pasta MTE */}
        <div
          onClick={() => setMteModalOpen(true)}
          style={{
            width: '180px',
            height: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px',
            cursor: 'pointer',
            background: 'rgba(20, 20, 20, 0.8)',
            border: '2px solid #333',
            borderRadius: '10px',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#cc0000';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(204, 0, 0, 0.3)';
            e.currentTarget.style.transform = 'translateY(-5px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* Ícone de pasta */}
          <div style={{
            width: '80px',
            height: '65px',
            background: 'linear-gradient(135deg, #8B4513 0%, #654321 50%, #4a3218 100%)',
            borderRadius: '3px 3px 8px 8px',
            position: 'relative',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Aba da pasta */}
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '0',
              width: '35px',
              height: '12px',
              background: 'linear-gradient(135deg, #9a5a2e 0%, #8B4513 100%)',
              borderRadius: '3px 3px 0 0'
            }} />
            {/* Símbolo na pasta */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#ffcc00',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(255, 204, 0, 0.5)'
            }}>
              ⚠
            </div>
          </div>
          
          {/* Nome da pasta */}
          <span style={{
            color: '#cccccc',
            fontSize: '1rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            MTE
          </span>
          
          {/* Descrição */}
          <span style={{
            color: '#666',
            fontSize: '0.7rem',
            textAlign: 'center',
            padding: '0 10px'
          }}>
            Manifestações Territoriais
          </span>
        </div>

        {/* Placeholder para futuras pastas */}
        <div
          style={{
            width: '180px',
            height: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px',
            background: 'rgba(20, 20, 20, 0.4)',
            border: '2px dashed #333',
            borderRadius: '10px',
            opacity: 0.5
          }}
        >
          <span style={{
            color: '#444',
            fontSize: '3rem'
          }}>
            +
          </span>
          <span style={{
            color: '#444',
            fontSize: '0.8rem'
          }}>
            Em breve...
          </span>
        </div>
      </div>

      {/* Modal MTE */}
      {mteModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={() => setMteModalOpen(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: '2px solid #cc0000',
              borderRadius: '15px',
              width: '90%',
              maxWidth: '700px',
              maxHeight: '80vh',
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(204, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do modal */}
            <div style={{
              padding: '25px 30px',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{
                  margin: 0,
                  color: '#ff6666',
                  fontSize: '1.4rem',
                  textTransform: 'uppercase',
                  letterSpacing: '3px'
                }}>
                  Manifestação Territorial de Entidade
                </h2>
                <p style={{
                  margin: '8px 0 0 0',
                  color: '#666',
                  fontSize: '0.85rem'
                }}>
                  Selecione um perímetro para monitoramento
                </p>
              </div>
              <button
                onClick={() => setMteModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '5px 10px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ff6666'}
                onMouseLeave={(e) => e.target.style.color = '#666'}
              >
                ✕
              </button>
            </div>

            {/* Conteúdo do modal */}
            <div style={{
              padding: '20px 30px',
              maxHeight: 'calc(80vh - 100px)',
              overflowY: 'auto'
            }}>
              {loading ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666'
                }}>
                  Carregando perímetros...
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  {perimetros.map((perimetro) => (
                    <div
                      key={perimetro.id}
                      onClick={() => handlePerimetroClick(perimetro.id)}
                      style={{
                        padding: '20px',
                        background: 'rgba(30, 30, 30, 0.8)',
                        border: '1px solid #333',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#cc0000';
                        e.currentTarget.style.background = 'rgba(204, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#333';
                        e.currentTarget.style.background = 'rgba(30, 30, 30, 0.8)';
                      }}
                    >
                      {/* Ícone de cidade */}
                      <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        border: '1px solid #444'
                      }}>
                        🏙️
                      </div>

                      {/* Info do perímetro */}
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          margin: 0,
                          color: '#ff6666',
                          fontSize: '1.1rem',
                          fontWeight: '600'
                        }}>
                          {perimetro.nome}
                        </h3>
                        <p style={{
                          margin: '5px 0 0 0',
                          color: '#888',
                          fontSize: '0.85rem'
                        }}>
                          {perimetro.descricao || 'Sem descrição'}
                        </p>
                        <div style={{
                          display: 'flex',
                          gap: '20px',
                          marginTop: '10px'
                        }}>
                          <span style={{
                            color: '#666',
                            fontSize: '0.75rem'
                          }}>
                            👤 Admin: {perimetro.admin_nome || 'Não definido'}
                          </span>
                          <span style={{
                            color: '#666',
                            fontSize: '0.75rem'
                          }}>
                            🎭 Homúnculos: {perimetro.homunculos_count || 0}
                          </span>
                        </div>
                      </div>

                      {/* Seta */}
                      <div style={{
                        color: '#cc0000',
                        fontSize: '1.5rem'
                      }}>
                        →
                      </div>
                    </div>
                  ))}

                  {perimetros.length === 0 && !loading && (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#666'
                    }}>
                      Nenhum perímetro cadastrado
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
