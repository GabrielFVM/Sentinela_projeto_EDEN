import React, { useState, useEffect } from 'react';
import Profile from './Profile';
import EditUser from './editUser';
import { useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// Header Component
export default function Header({ onLogout, username = 'Usuário', cargo= 'membro' }) {
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Easter egg states
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [easterEggPhase, setEasterEggPhase] = useState(0); // 0=idle, 1=center, 2=glow, 3=minimize, 4=show text
  
  // User management modal (Seraphim only)
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userGrupo, setUserGrupo] = useState('Observador');
  
  // Notificações
  const [notificacoes, setNotificacoes] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  
  // Menu mobile/compacto (hamburger)
  const [isCompact, setIsCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Detectar tamanho da tela ou zoom (quando a largura fica pequena demais)
  useEffect(() => {
    const checkCompact = () => {
      // Usa window.innerWidth que considera o zoom do browser
      // Quando há zoom, innerWidth diminui proporcionalmente
      // Threshold: 900px para garantir espaço para título + botões
      const shouldBeCompact = window.innerWidth < 900;
      setIsCompact(shouldBeCompact);
      if (!shouldBeCompact) setMenuOpen(false); // Fecha o menu se voltar para desktop
    };
    
    checkCompact(); // Verificar no mount
    window.addEventListener('resize', checkCompact);
    return () => window.removeEventListener('resize', checkCompact);
  }, []);
  
  // Obter grupo do usuário do token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserGrupo(payload.grupo || 'Observador');
      } catch (e) {
        console.error('Erro ao decodificar token:', e);
      }
    }
  }, []);
  
  // Buscar contagem de notificações não lidas
  const fetchNotifCount = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/notificacoes/count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifCount(data.count);
      }
    } catch (err) {
      console.error('Erro ao buscar contagem de notificações:', err);
    }
  };
  
  // Buscar notificações completas
  const fetchNotificacoes = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/notificacoes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotificacoes(data);
      }
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    }
  };
  
  // Marcar notificação como lida
  const marcarComoLida = async (nid) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
      await fetch(`${API_BASE_URL}/notificacoes/${nid}/lida`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Atualizar lista e contagem
      fetchNotificacoes();
      fetchNotifCount();
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  };
  
  // Marcar todas como lidas
  const marcarTodasLidas = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
      await fetch(`${API_BASE_URL}/notificacoes/lidas`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotificacoes();
      fetchNotifCount();
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
    }
  };

  // Limpar todas as notificações
  const limparNotificacoes = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
      await fetch(`${API_BASE_URL}/notificacoes`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotificacoes();
      fetchNotifCount();
    } catch (err) {
      console.error('Erro ao limpar notificações:', err);
    }
  };
  
  // Buscar contagem periodicamente
  useEffect(() => {
    fetchNotifCount();
    const interval = setInterval(fetchNotifCount, 30000); // A cada 30 segundos
    return () => clearInterval(interval);
  }, []);
  
  // Quando abre o painel de notificações, busca as completas
  useEffect(() => {
    if (notifOpen) {
      fetchNotificacoes();
    }
  }, [notifOpen]);
  
  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if ((notifOpen || menuOpen) && !e.target.closest('[data-notif-dropdown]')) {
        setNotifOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [notifOpen]);

  useEffect(() => {
    const handleScroll = () => {
      // Se scrollou mais de 50px, muda para small
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Easter egg animation sequence
  useEffect(() => {
    if (!easterEggActive) return;

    // Phase 1: Move to center (immediate)
    setEasterEggPhase(1);
    
    // Phase 2: Glow effect after centering
    const glowTimer = setTimeout(() => setEasterEggPhase(2), 800);
    
    // Phase 3: Minimize and move to top
    const minimizeTimer = setTimeout(() => setEasterEggPhase(3), 3000);
    
    // Phase 4: Show text
    const textTimer = setTimeout(() => setEasterEggPhase(4), 3800);

    return () => {
      clearTimeout(glowTimer);
      clearTimeout(minimizeTimer);
      clearTimeout(textTimer);
    };
  }, [easterEggActive]);

  const handleGuardClick = () => {
    if (!easterEggActive) {
      setEasterEggActive(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const closeEasterEgg = () => {
    setEasterEggActive(false);
    setEasterEggPhase(0);
    document.body.style.overflow = 'unset';
  };

  const size = isScrolled ? 'small' : 'big';
  const buttonTop = isScrolled ? '12px' : '40px';
  const location = useLocation();
  const isLoginPage = location.pathname == '/login';
  const isPerimetroPage = location.pathname.startsWith('/perimetro/');
  
  // Texto do subtítulo baseado na rota
  const subtitulo = isPerimetroPage 
    ? 'Sistema de Monitoramento - Projeto EDEN'
    : 'Sistema Estratégico de Navegação, Triagem e Identificação de Núcleos Esotéricos, Litúrgicos e Anômalos';

  return (
    <>
      {!isLoginPage && (
        <Profile username={username} funcao={cargo} />
      )}
      <header className={`header ${size}`}>
        {/* Container de botões no canto direito */}
        {!isLoginPage && (
          <>
            {/* Versão Desktop - botões normais */}
            {!isCompact && (
              <div style={{
                position: 'fixed',
                right: '20px',
                top: buttonTop,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                zIndex: 1000
              }}>
                {/* Botão de Notificações */}
                <div data-notif-dropdown style={{ position: 'relative' }}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    style={{
                      background: 'rgba(255, 165, 0, 0.2)',
                      color: '#ffcc66',
                      border: '2px solid #ff9900',
                      padding: '8px 14px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 165, 0, 0.4)';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 153, 0, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 165, 0, 0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    🔔
                    {notifCount > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ff3333',
                        color: 'white',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 8px rgba(255, 51, 51, 0.6)'
                      }}>
                        {notifCount > 9 ? '9+' : notifCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Dropdown de Notificações */}
                  {notifOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '50px',
                      right: '0',
                      width: '360px',
                      maxHeight: '450px',
                      background: 'rgba(20, 20, 30, 0.98)',
                      border: '2px solid #ff9900',
                      borderRadius: '10px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                      overflow: 'hidden',
                      zIndex: 1002
                    }}>
                      {/* Header do dropdown */}
                      <div style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 153, 0, 0.2)',
                        borderBottom: '1px solid #ff9900',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ color: '#ffcc66', fontWeight: 'bold', fontSize: '0.95rem' }}>
                          🔔 Notificações
                        </span>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          {notifCount > 0 && (
                            <button
                              onClick={marcarTodasLidas}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#66ccff',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                textDecoration: 'underline'
                              }}
                            >
                              Marcar todas como lidas
                            </button>
                          )}
                          {notificacoes.length > 0 && (
                            <button
                              onClick={limparNotificacoes}
                              title="Limpar todas as notificações"
                              style={{
                                background: 'rgba(255, 100, 100, 0.2)',
                                border: '1px solid #ff6666',
                                color: '#ff6666',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 100, 100, 0.4)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 100, 100, 0.2)'}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Lista de notificações */}
                      <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {notificacoes.length === 0 ? (
                          <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#666'
                          }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📭</div>
                            <div>Nenhuma notificação</div>
                          </div>
                        ) : (
                          notificacoes.map(n => (
                            <div
                              key={n.id}
                              onClick={() => !n.lida && marcarComoLida(n.id)}
                              style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255, 153, 0, 0.2)',
                                background: n.lida ? 'transparent' : 'rgba(255, 153, 0, 0.1)',
                                cursor: n.lida ? 'default' : 'pointer',
                                display: 'flex',
                                gap: '12px',
                                transition: 'background 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!n.lida) e.currentTarget.style.background = 'rgba(255, 153, 0, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = n.lida ? 'transparent' : 'rgba(255, 153, 0, 0.1)';
                              }}
                            >
                              {/* Foto do remetente */}
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: n.remetente_foto 
                                  ? `url(data:image/jpeg;base64,${n.remetente_foto}) center/cover`
                                  : 'linear-gradient(135deg, #ff9900, #cc6600)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                border: '2px solid #ff9900'
                              }}>
                                {!n.remetente_foto && <span style={{ fontSize: '1.2rem' }}>👤</span>}
                              </div>
                              
                              {/* Conteúdo */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  marginBottom: '4px'
                                }}>
                                  <span style={{
                                    color: '#ffcc66',
                                    fontWeight: 'bold',
                                    fontSize: '0.85rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {n.titulo}
                                  </span>
                                  {!n.lida && (
                                    <span style={{
                                      width: '8px',
                                      height: '8px',
                                      background: '#ff9900',
                                      borderRadius: '50%',
                                      flexShrink: 0,
                                      marginLeft: '8px'
                                    }} />
                                  )}
                                </div>
                                <div style={{
                                  color: '#aaa',
                                  fontSize: '0.8rem',
                                  marginBottom: '4px'
                                }}>
                                  De: {n.remetente_nome || 'Sistema'}
                                </div>
                                <div style={{
                                  color: '#ccc',
                                  fontSize: '0.8rem',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  lineHeight: '1.4'
                                }}>
                                  {n.mensagem.length > 100 ? n.mensagem.substring(0, 100) + '...' : n.mensagem}
                                </div>
                                <div style={{
                                  color: '#666',
                                  fontSize: '0.7rem',
                                  marginTop: '6px'
                                }}>
                                  {new Date(n.data_criacao).toLocaleString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Botão de Gerenciar Usuários - Apenas Seraphim */}
                {userGrupo === 'Serafim' && (
                  <button
                    onClick={() => setUserModalOpen(true)}
                    style={{
                      background: 'rgba(100, 0, 150, 0.2)',
                      color: '#cc99ff',
                      border: '2px solid #9966cc',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(100, 0, 150, 0.4)';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(153, 102, 204, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(100, 0, 150, 0.2)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    👥 Usuários
                  </button>
                )}
                
                {/* Botão Sair */}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    style={{
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
                      transition: 'all 0.3s ease'
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
              </div>
            )}
            
            {/* Versão Compacta - Menu Hamburger (mobile ou zoom) */}
            {isCompact && (
              <div data-notif-dropdown style={{ position: 'fixed', right: '15px', top: buttonTop, zIndex: 1001 }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    background: 'rgba(204, 0, 0, 0.2)',
                    color: '#ff6666',
                    border: '2px solid #cc0000',
                    padding: '10px 12px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(204, 0, 0, 0.4)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(204, 0, 0, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(204, 0, 0, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Ícone de 3 traços */}
                  <span style={{ width: '20px', height: '2px', background: '#ff6666', borderRadius: '1px' }} />
                  <span style={{ width: '20px', height: '2px', background: '#ff6666', borderRadius: '1px' }} />
                  <span style={{ width: '20px', height: '2px', background: '#ff6666', borderRadius: '1px' }} />
                  
                  {/* Badge de notificações */}
                  {notifCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#ff3333',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(255, 51, 51, 0.6)'
                    }}>
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </button>
                
                {/* Menu Dropdown Mobile */}
                {menuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '55px',
                    right: '0',
                    width: '280px',
                    background: 'rgba(20, 20, 30, 0.98)',
                    border: '2px solid #cc0000',
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden',
                    zIndex: 1002
                  }}>
                    {/* Botão Notificações */}
                    <button
                      onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); }}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        color: '#ffcc66',
                        border: 'none',
                        borderBottom: '1px solid rgba(255, 153, 0, 0.3)',
                        padding: '14px 20px',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 165, 0, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      🔔 Notificações
                      {notifCount > 0 && (
                        <span style={{
                          background: '#ff3333',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          borderRadius: '10px',
                          padding: '2px 8px',
                          marginLeft: 'auto'
                        }}>
                          {notifCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Botão Usuários - Apenas Seraphim */}
                    {userGrupo === 'Serafim' && (
                      <button
                        onClick={() => { setUserModalOpen(true); setMenuOpen(false); }}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          color: '#cc99ff',
                          border: 'none',
                          borderBottom: '1px solid rgba(153, 102, 204, 0.3)',
                          padding: '14px 20px',
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(100, 0, 150, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        👥 Usuários
                      </button>
                    )}
                    
                    {/* Botão Sair */}
                    {onLogout && (
                      <button
                        onClick={() => { onLogout(); setMenuOpen(false); }}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          color: '#ff6666',
                          border: 'none',
                          padding: '14px 20px',
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 51, 51, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        🚪 Sair
                      </button>
                    )}
                  </div>
                )}
                
                {/* Dropdown de Notificações Mobile */}
                {notifOpen && (
                  <div style={{
                    position: 'fixed',
                    top: '60px',
                    right: '10px',
                    left: '10px',
                    maxHeight: 'calc(100vh - 80px)',
                    background: 'rgba(20, 20, 30, 0.98)',
                    border: '2px solid #ff9900',
                    borderRadius: '10px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    overflow: 'hidden',
                    zIndex: 1003
                  }}>
                    {/* Header do dropdown */}
                    <div style={{
                      padding: '12px 16px',
                      background: 'rgba(255, 153, 0, 0.2)',
                      borderBottom: '1px solid #ff9900',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: '#ffcc66', fontWeight: 'bold', fontSize: '0.95rem' }}>
                        🔔 Notificações
                      </span>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {notifCount > 0 && (
                          <button
                            onClick={marcarTodasLidas}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#66ccff',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              textDecoration: 'underline'
                            }}
                          >
                            Marcar todas
                          </button>
                        )}
                        {notificacoes.length > 0 && (
                          <button
                            onClick={limparNotificacoes}
                            title="Limpar todas"
                            style={{
                              background: 'rgba(255, 100, 100, 0.2)',
                              border: '1px solid #ff6666',
                              color: '#ff6666',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              width: '22px',
                              height: '22px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            🗑
                          </button>
                        )}
                        <button
                          onClick={() => setNotifOpen(false)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ff6666',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            padding: '0 5px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    {/* Lista de notificações */}
                    <div style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
                      {notificacoes.length === 0 ? (
                        <div style={{
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: '#666'
                        }}>
                          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📭</div>
                          <div>Nenhuma notificação</div>
                        </div>
                      ) : (
                        notificacoes.map(n => (
                          <div
                            key={n.id}
                            onClick={() => !n.lida && marcarComoLida(n.id)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid rgba(255, 153, 0, 0.2)',
                              background: n.lida ? 'transparent' : 'rgba(255, 153, 0, 0.1)',
                              cursor: n.lida ? 'default' : 'pointer',
                              display: 'flex',
                              gap: '12px',
                              transition: 'background 0.2s ease'
                            }}
                          >
                            {/* Foto do remetente */}
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: n.remetente_foto 
                                ? `url(data:image/jpeg;base64,${n.remetente_foto}) center/cover`
                                : 'linear-gradient(135deg, #ff9900, #cc6600)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              border: '2px solid #ff9900'
                            }}>
                              {!n.remetente_foto && <span style={{ fontSize: '1.2rem' }}>👤</span>}
                            </div>
                            
                            {/* Conteúdo */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '4px'
                              }}>
                                <span style={{
                                  color: '#ffcc66',
                                  fontWeight: 'bold',
                                  fontSize: '0.85rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {n.titulo}
                                </span>
                                {!n.lida && (
                                  <span style={{
                                    width: '8px',
                                    height: '8px',
                                    background: '#ff9900',
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    marginLeft: '8px'
                                  }} />
                                )}
                              </div>
                              <div style={{
                                color: '#aaa',
                                fontSize: '0.8rem',
                                marginBottom: '4px'
                              }}>
                                De: {n.remetente_nome || 'Sistema'}
                              </div>
                              <div style={{
                                color: '#ccc',
                                fontSize: '0.8rem',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: '1.4'
                              }}>
                                {n.mensagem.length > 80 ? n.mensagem.substring(0, 80) + '...' : n.mensagem}
                              </div>
                              <div style={{
                                color: '#666',
                                fontSize: '0.7rem',
                                marginTop: '6px'
                              }}>
                                {new Date(n.data_criacao).toLocaleString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px',
          marginRight: '50px'
        }}>
          <img 
            src={import.meta.env.BASE_URL + "guard.png"} 
            alt="Guard" 
            onClick={handleGuardClick}
            style={{
              height: isScrolled ? '35px' : '60px',
              width: 'auto',
              filter: 'drop-shadow(0 0 8px rgba(204, 0, 0, 0.5))',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
          />
          <h1 style={{
            margin: 0,
            fontSize: isScrolled ? '1.6rem' : '3rem',
          }}>S.E.N.T.I.N.E.L.A</h1>
        </div>
        <p style={{ fontSize: isPerimetroPage ? '1rem' : '0.75rem' }}>{subtitulo}</p>
      </header>

      {/* Easter Egg Overlay */}
      {easterEggActive && (
        <>
          {/* Background overlay */}
          <div
            onClick={easterEggPhase >= 4 ? closeEasterEgg : undefined}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: '#000000',
              zIndex: 9998,
              opacity: easterEggPhase >= 1 ? 1 : 0,
              transition: 'opacity 0.8s ease',
              cursor: easterEggPhase >= 4 ? 'pointer' : 'default'
            }}
          />

          {/* Guardian image with metallic shine */}
          <div
            style={{
              position: 'fixed',
              zIndex: 9999,
              top: easterEggPhase >= 3 ? '80px' : '50%',
              left: '50%',
              transform: easterEggPhase >= 3 
                ? 'translate(-50%, 0) scale(1)' 
                : 'translate(-50%, -50%) scale(1)',
              height: easterEggPhase >= 3 ? '120px' : '250px',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <img
              src={import.meta.env.BASE_URL + "guard.png"}
              alt="Guardian"
              style={{
                height: '100%',
                width: 'auto',
                filter: easterEggPhase >= 3
                  ? 'drop-shadow(0 0 15px rgba(204, 0, 0, 0.6))'
                  : 'drop-shadow(0 0 10px rgba(204, 0, 0, 0.5))'
              }}
            />
            {/* Metallic shine overlay - main layer */}
            {easterEggPhase === 2 && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(105deg, transparent 0%, transparent 25%, rgba(255, 220, 100, 1) 35%, rgba(255, 250, 180, 1) 45%, rgba(255, 255, 255, 1) 50%, rgba(255, 250, 180, 1) 55%, rgba(255, 220, 100, 1) 65%, transparent 75%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'metallicShine 1.5s ease-in-out infinite',
                    mixBlendMode: 'overlay',
                    filter: 'blur(2px)',
                    pointerEvents: 'none',
                    maskImage: `url(${import.meta.env.BASE_URL}guard.png)`,
                    WebkitMaskImage: `url(${import.meta.env.BASE_URL}guard.png)`,
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center'
                  }}
                />
                {/* Second brighter layer */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255, 240, 150, 0.9) 40%, rgba(255, 255, 255, 1) 50%, rgba(255, 240, 150, 0.9) 60%, transparent 70%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'metallicShine 1.5s ease-in-out infinite',
                    mixBlendMode: 'hard-light',
                    filter: 'blur(4px)',
                    pointerEvents: 'none',
                    maskImage: `url(${import.meta.env.BASE_URL}guard.png)`,
                    WebkitMaskImage: `url(${import.meta.env.BASE_URL}guard.png)`,
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center'
                  }}
                />
              </>
            )}
          </div>

          {/* Text description - scrolling container */}
          <div
            style={{
              position: 'fixed',
              top: '220px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '700px',
              maxHeight: 'calc(100vh - 320px)',
              zIndex: 9999,
              opacity: easterEggPhase >= 4 ? 1 : 0,
              transition: 'opacity 0.8s ease',
              textAlign: 'justify',
              padding: '0 30px',
              overflow: 'hidden',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            {/* Auto-scrolling text container */}
            <div
              style={{
                animation: easterEggPhase >= 4 ? 'autoScroll 120s linear infinite' : 'none',
                paddingTop: '100px',
                paddingBottom: '100px'
              }}
            >
              <h2 style={{
                color: '#cc0000',
                fontSize: '1.6rem',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '4px',
                textShadow: '0 0 20px rgba(204, 0, 0, 0.5)',
                textAlign: 'center'
              }}>
                GUARDIÃO
              </h2>
              <p style={{
                color: '#ff6666',
                fontSize: '0.75rem',
                lineHeight: '1.4',
                textAlign: 'center',
                marginBottom: '25px',
                fontStyle: 'italic'
              }}>
                (Grupo Unificado de Ações Rápidas para Defesa e Investigação de Anomalias Ocultas)
              </p>

              <p style={{
                color: '#aaaaaa',
                fontSize: '0.95rem',
                lineHeight: '1.9',
                marginBottom: '20px',
                textIndent: '2em'
              }}>
                Muito antes de receber seu nome atual, o GUARDIÃO já existia. Ele surgiu como uma sucessão de ordens, confrarias e pactos silenciosos formados por indivíduos que compreenderam, desde cedo, que a realidade possui limites frágeis e que algo além deles constantemente tenta atravessá-los. Ao longo das eras, esses vigilantes assumiram diferentes formas, escondendo-se por trás de religiões, academias, governos e sociedades secretas, adaptando-se às estruturas de poder e crenças de cada período histórico.
              </p>

              <p style={{
                color: '#aaaaaa',
                fontSize: '0.95rem',
                lineHeight: '1.9',
                marginBottom: '20px',
                textIndent: '2em'
              }}>
                Durante séculos, suas ações foram confundidas com superstição, heresia ou mito. Registros foram apagados, distorcidos ou deliberadamente enterrados para evitar pânico e preservar a estabilidade social. Ainda assim, em momentos de crise, guerras, colapsos políticos, epidemias e revoluções, a atuação do GUARDIÃO tornava-se mais intensa, sempre longe do olhar público.
              </p>

              <p style={{
                color: '#aaaaaa',
                fontSize: '0.95rem',
                lineHeight: '1.9',
                marginBottom: '20px',
                textIndent: '2em'
              }}>
                Com o fim da Guerra Fria e as mudanças estruturais do mundo moderno, a organização passou por sua mais profunda reformulação. Em 1996, diante do avanço tecnológico, da abertura de arquivos sigilosos e do aumento de padrões globais de atividade anômala, o GUARDIÃO abandonou antigos modelos fragmentados herdados de ordens e células históricas. Nesse período, consolidou-se uma estrutura unificada, com protocolos padronizados, hierarquia definida e integração entre inteligência, investigação e contenção. Foi também nesse momento que o nome GUARDIÃO passou a ser adotado oficialmente, reunindo séculos de atuação dispersa sob uma única identidade operacional.
              </p>

              <p style={{
                color: '#aaaaaa',
                fontSize: '0.95rem',
                lineHeight: '1.9',
                marginBottom: '20px',
                textIndent: '2em'
              }}>
                Atualmente, o GUARDIÃO opera em escala global, mantendo bases camufladas, divisões de fachada e acordos institucionais que lhe garantem acesso a áreas restritas, autoridade emergencial e liberdade de ação em cenários envolvendo civis. Em um mundo hiperconectado, onde informações não podem mais ser simplesmente apagadas, a organização atua priorizando o controle de danos, a desinformação estratégica e a contenção rápida de incidentes antes que se tornem públicos.
              </p>

              <p style={{
                color: '#aaaaaa',
                fontSize: '0.95rem',
                lineHeight: '1.9',
                marginBottom: '20px',
                textIndent: '2em'
              }}>
                Seus agentes são recrutados de forma reservada, normalmente entre pessoas comuns que sobreviveram a algum tipo de contato direto com o paranormal. Após avaliação rigorosa, esses indivíduos passam por treinamento conduzido por agentes veteranos antes de receberem autorização para atuar em campo. Poucos chegam a compreender a real extensão do GUARDIÃO — e isso faz parte do protocolo.
              </p>

              <p style={{
                color: '#aaaaaa',
                fontSize: '0.95rem',
                lineHeight: '1.9',
                marginBottom: '20px',
                textIndent: '2em'
              }}>
                Entre suas atribuições estão a investigação de ocorrências anômalas, a neutralização de entidades e criaturas hostis, o combate a grupos ocultistas, o registro e catalogação de fenômenos sobrenaturais e a limitação máxima da exposição civil ao paranormal. Equipes móveis são despachadas conforme o nível de risco, variando em tamanho e composição, sendo obrigatória a presença de membros experientes em casos de alta complexidade.
              </p>

              <p style={{
                color: '#aaaaaa',
                fontSize: '0.95rem',
                lineHeight: '1.9',
                marginBottom: '20px',
                textIndent: '2em'
              }}>
                O GUARDIÃO não se vê como herói ou salvador. Ele é uma estrutura antiga, adaptável e necessária, sustentada por gerações que jamais foram reconhecidas. Mudam-se os nomes, os métodos e as eras, mas a função permanece a mesma: vigiar as fronteiras da realidade e impedir que aquilo que observa do outro lado encontre passagem.
              </p>

              <p style={{
                color: '#cc0000',
                fontSize: '1rem',
                lineHeight: '1.9',
                marginBottom: '40px',
                textAlign: 'center',
                fontStyle: 'italic',
                textShadow: '0 0 10px rgba(204, 0, 0, 0.3)'
              }}>
                Enquanto o mundo segue em frente, alheio ao que foi evitado, o GUARDIÃO continua existindo...
              </p>

              {/* Spacer for seamless loop */}
              <div style={{ height: '200px' }} />
            </div>

            {/* Gradient fade at top and bottom */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(to bottom, #000000 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '80px',
              background: 'linear-gradient(to top, #000000 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />

            {/* Close hint */}
            <p style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#cc0000',
              fontSize: '0.75rem',
              opacity: 0.5,
              whiteSpace: 'nowrap'
            }}>
              [ Clique em qualquer lugar para fechar ]
            </p>
          </div>

          {/* CSS Keyframes */}
          <style>{`
            @keyframes metallicShine {
              0% {
                background-position: 200% 0;
              }
              100% {
                background-position: -200% 0;
              }
            }
            @keyframes autoScroll {
              0% {
                transform: translateY(0);
              }
              100% {
                transform: translateY(-100%);
              }
            }
          `}</style>
        </>
      )}

      {/* Modal de Gerenciamento de Usuários - Seraphim */}
      <EditUser 
        isOpen={userModalOpen} 
        onClose={() => setUserModalOpen(false)} 
      />
    </>
  );
}
