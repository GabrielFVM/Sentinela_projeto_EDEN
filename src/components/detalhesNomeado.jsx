import React, { useEffect, useState, useRef } from 'react';
import { API_BASE_URL } from '../config';

export default function DetalhesNomeado({ nomeado, isOpen, onClose }) {
  const [isReady, setIsReady] = useState(false);
  const [scrapeData, setScrapeData] = useState(null);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeError, setScrapeError] = useState(null);
  const hasAnimated = useRef(false);
  console.log('nomeado recebido: ', nomeado)
  useEffect(() => {
    if (isOpen && !hasAnimated.current) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        setIsReady(true);
        hasAnimated.current = true;
      }, 10);
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      document.body.style.overflow = 'unset';
      setIsReady(false);
      hasAnimated.current = false;
      setScrapeData(null);
      setScrapeError(null);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Busca dados via web scraping quando o modal abre
  useEffect(() => {
    if (isOpen && nomeado?.id && nomeado?.ficha) {
      setScrapeLoading(true);
      setScrapeError(null);
      
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setScrapeError('Token não encontrado. Faça login novamente.');
        setScrapeLoading(false);
        return;
      }
      
      fetch(`${API_BASE_URL}/scrape/${nomeado.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (res.status === 401) throw new Error('Sessão expirada. Faça login novamente.');
          if (!res.ok) throw new Error('dados inconclusivos');
          return res.json();
        })
        .then(data => {
          setScrapeData(data);
          setScrapeLoading(false);
        })
        .catch(err => {
          setScrapeError(err.message);
          setScrapeLoading(false);
        });
    }
  }, [isOpen, nomeado?.id, nomeado?.ficha]);

  if (!isOpen || !nomeado) return null;
  if (!isReady) return null;

  // Se tem ficha e ainda está carregando, mostra tela de loading
  const showLoadingScreen = nomeado.ficha && scrapeLoading;

  // Foto do nomeado (base64 ou placeholder)
  const fotoSrc = nomeado.foto 
    ? `data:image/png;base64,${nomeado.foto}` 
    : null;

  return (
    <>
      {/* Overlay */}
      <div
        key={`overlay-${nomeado.id}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'auto'
        }}
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Modal Container - Layout de Experimento */}
      <div
        key={`modal-${nomeado.id}`}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2001,
          display: 'flex',
          flexDirection: 'row',
          background: '#0a0a0a',
          border: '3px solid #cc0000',
          borderRadius: '0',
          maxWidth: '900px',
          width: '95%',
          height: '85vh',
          boxShadow: '0 0 60px rgba(204, 0, 0, 0.5), inset 0 0 100px rgba(0, 0, 0, 0.5)',
          animation: 'experimentOpen 0.5s ease-out forwards',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Painel Esquerdo - Foto Fixa (Visualização do Experimento) */}
        <div
          style={{
            flex: '0 0 45%',
            position: 'relative',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '3px solid #cc0000',
            overflow: 'hidden'
          }}
        >
          {/* Grid de fundo estilo laboratório */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(rgba(204, 0, 0, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(204, 0, 0, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              opacity: 0.5
            }}
          />

          {/* Cantos decorativos */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', width: '30px', height: '30px', borderTop: '2px solid #cc0000', borderLeft: '2px solid #cc0000' }} />
          <div style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', borderTop: '2px solid #cc0000', borderRight: '2px solid #cc0000' }} />
          <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '30px', height: '30px', borderBottom: '2px solid #cc0000', borderLeft: '2px solid #cc0000' }} />
          <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '30px', height: '30px', borderBottom: '2px solid #cc0000', borderRight: '2px solid #cc0000' }} />

          {/* Label "SPECIMEN" no topo */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(204, 0, 0, 0.8)',
              padding: '5px 20px',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              fontFamily: 'monospace'
            }}
          >
            SPECIMEN
          </div>

          {/* Foto ou Placeholder */}
          {fotoSrc ? (
            <img
              src={fotoSrc}
              alt={nomeado.nome}
              style={{
                maxWidth: '85%',
                maxHeight: '70%',
                objectFit: 'contain',
                filter: 'contrast(1.1) saturate(0.9)',
                border: '2px solid #333',
                boxShadow: '0 0 30px rgba(204, 0, 0, 0.3)',
                animation: 'photoReveal 0.8s ease-out 0.3s both'
              }}
            />
          ) : (
            <div
              style={{
                width: '200px',
                height: '250px',
                background: 'linear-gradient(135deg, #1a1a1a, #0d0d0d)',
                border: '2px dashed #cc0000',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                animation: 'photoReveal 0.8s ease-out 0.3s both'
              }}
            >
              <span style={{ fontSize: '3rem', marginBottom: '10px', opacity: 0.5 }}>👤</span>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Sem Registro
              </span>
            </div>
          )}

          {/* ID do Nomeado no canto inferior */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#cc0000',
              fontSize: '0.7rem',
              fontFamily: 'monospace',
              letterSpacing: '2px',
              opacity: 0.8
            }}
          >
            ID: {String(nomeado.id).padStart(4, '0')}
          </div>

          {/* Linha de scan animada */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #cc0000, transparent)',
              animation: 'scanLine 3s linear infinite',
              opacity: 0.6
            }}
          />
        </div>

        {/* Painel Direito - Informações Scrolláveis */}
        <div
          style={{
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #0d0d0d 0%, #1a1a1a 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Header Fixo */}
          <div
            style={{
              padding: '20px 25px',
              borderBottom: '2px solid #cc0000',
              background: 'rgba(0, 0, 0, 0.5)',
              position: 'relative',
              zIndex: 10
            }}
          >
            {/* Botão de fechar */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                color: '#cc0000',
                border: '2px solid #cc0000',
                width: '32px',
                height: '32px',
                borderRadius: '0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                fontFamily: 'monospace'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#cc0000';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#cc0000';
              }}
            >
              ✕
            </button>

            <div
              style={{
                color: '#666',
                fontSize: '0.65rem',
                fontFamily: 'monospace',
                letterSpacing: '3px',
                marginBottom: '5px',
                textTransform: 'uppercase'
              }}
            >
              ARQUIVO CONFIDENCIAL
            </div>
            <h2
              style={{
                margin: 0,
                color: '#ff6666',
                fontSize: '1.5rem',
                textTransform: 'uppercase',
                letterSpacing: '3px',
                fontWeight: '400',
                fontFamily: 'monospace'
              }}
            >
              {nomeado.homunculo}
            </h2>
            <p
              style={{
                margin: '5px 0 0 0',
                color: '#888',
                fontSize: '0.8rem',
                fontFamily: 'monospace'
              }}
            >
              Simulacro: {nomeado.simulacro}
            </p>
          </div>

          {/* Área de Conteúdo Scrollável */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 25px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cc0000 #1a1a1a'
            }}
          >
            {/* Tela de Loading */}
            {showLoadingScreen ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '300px',
                  gap: '25px'
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    border: '3px solid rgba(204, 0, 0, 0.2)',
                    borderTop: '3px solid #cc0000',
                    borderRadius: '0',
                    animation: 'spin 1s linear infinite'
                  }}
                />
                <div style={{ textAlign: 'center' }}>
                  <p
                    style={{
                      color: '#cc0000',
                      fontSize: '0.9rem',
                      fontWeight: '400',
                      textTransform: 'uppercase',
                      letterSpacing: '4px',
                      margin: '0 0 10px 0',
                      fontFamily: 'monospace',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}
                  >
                    PROCESSANDO
                  </p>
                  <p
                    style={{
                      color: '#555',
                      fontSize: '0.75rem',
                      margin: 0,
                      fontFamily: 'monospace'
                    }}
                  >
                    Acessando dados do nomeado...
                  </p>
                </div>
                <div
                  style={{
                    width: '80%',
                    height: '3px',
                    background: 'rgba(204, 0, 0, 0.2)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: '30%',
                      height: '100%',
                      background: '#cc0000',
                      animation: 'loadingBar 1.5s ease-in-out infinite'
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Grid de Informações */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Status */}
                  <DataField 
                    label="STATUS" 
                    value={nomeado.status || 'Ativo'} 
                    delay="0.4s"
                    highlight
                  />

                  {/* Saúde */}
                  <DataField 
                    label="ESTADO FÍSICO" 
                    value={nomeado.saude || 'Não informado'} 
                    delay="0.5s"
                  />

                  {/* Mental */}
                  <DataField 
                    label="ESTADO MENTAL" 
                    value={nomeado.mental || 'Não informado'} 
                    delay="0.6s"
                  />

                  {/* Origem */}
                  <DataField 
                    label="ORIGEM" 
                    value={scrapeData?.origem || 'Não informado'} 
                    delay="0.7s"
                  />

                  {/* Classe */}
                  <DataField 
                    label="CLASSE" 
                    value={scrapeData?.classe || 'Não informado'} 
                    delay="0.8s"
                  />

                  {/* Exposição */}
                  <DataField 
                    label="EXPOSIÇÃO PARANORMAL" 
                    value={nomeado.exposicao} 
                    delay="0.9s"
                    warning={parseFloat((nomeado.exposicao || '0').replace(/[^0-9.,]/g, '').replace(',', '.')) >= 50}
                  />

                  {/* Afinidade - só aparece se exposição >= 50% */}
                  {(() => {
                    const exposicaoNum = parseFloat((nomeado.exposicao || '0').replace(/[^0-9.,]/g, '').replace(',', '.'));
                    return exposicaoNum >= 50;
                  })() && (
                    <DataField 
                      label="AFINIDADE ELEMENTAL" 
                      value={nomeado.afinidade} 
                      delay="1s"
                      highlight
                    />
                  )}

                  {/* Erro do Web Scraping */}
                  {nomeado.ficha && scrapeError && (
                    <div
                      style={{
                        marginTop: '15px',
                        padding: '15px',
                        background: 'rgba(255, 0, 0, 0.1)',
                        border: '1px solid #660000',
                        animation: 'fadeInContent 0.3s ease-in 1.1s both',
                        fontFamily: 'monospace'
                      }}
                    >
                      <p style={{ margin: 0, color: '#cc0000', fontSize: '0.75rem' }}>
                        ⚠ ERRO DE ACESSO: {scrapeError}
                      </p>
                    </div>
                  )}
                </div>

                {/* Botão de Ação */}
                <button
                  onClick={onClose}
                  style={{
                    marginTop: '30px',
                    width: '100%',
                    padding: '14px',
                    background: 'transparent',
                    color: '#cc0000',
                    border: '2px solid #cc0000',
                    borderRadius: '0',
                    fontSize: '0.85rem',
                    fontWeight: '400',
                    textTransform: 'uppercase',
                    letterSpacing: '3px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontFamily: 'monospace'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#cc0000';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#cc0000';
                  }}
                >
                  FECHAR ARQUIVO
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes experimentOpen {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
            filter: brightness(2);
          }
          50% {
            filter: brightness(1.5);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            filter: brightness(1);
          }
        }

        @keyframes scanLine {
          0% {
            top: 0;
          }
          100% {
            top: 100%;
          }
        }

        @keyframes photoReveal {
          0% {
            opacity: 0;
            filter: brightness(3) contrast(0.5);
          }
          100% {
            opacity: 1;
            filter: contrast(1.1) saturate(0.9);
          }
        }

        @keyframes fadeInContent {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }

        /* Scrollbar customizada */
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        div::-webkit-scrollbar-thumb {
          background: #cc0000;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #ff3333;
        }
      `}</style>
    </>
  );
}

// Componente auxiliar para campos de dados
function DataField({ label, value, delay = '0s', highlight = false, warning = false }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 15px',
        background: warning 
          ? 'rgba(255, 100, 0, 0.1)' 
          : highlight 
            ? 'rgba(204, 0, 0, 0.15)' 
            : 'rgba(255, 255, 255, 0.03)',
        borderLeft: `3px solid ${warning ? '#ff6600' : highlight ? '#cc0000' : '#333'}`,
        animation: `fadeInContent 0.3s ease-in ${delay} both`,
        fontFamily: 'monospace'
      }}
    >
      <span
        style={{
          color: warning ? '#ff6600' : '#666',
          fontSize: '0.65rem',
          letterSpacing: '2px',
          marginBottom: '5px'
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: warning ? '#ff9933' : highlight ? '#ff6666' : '#ccc',
          fontSize: '0.95rem'
        }}
      >
        {value}
      </span>
    </div>
  );
}
