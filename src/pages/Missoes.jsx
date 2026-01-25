import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';

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

const STATUS_OPTIONS = [
  'Não Iniciada',
  'Fase de Preparação',
  'Em Andamento',
  'Concluída',
  'Falha'
];

const getStatusColor = (status) => {
  switch (status) {
    case 'Não Iniciada': return '#666';
    case 'Fase de Preparação': return '#f0ad4e';
    case 'Em Andamento': return '#5bc0de';
    case 'Concluída': return '#5cb85c';
    case 'Falha': return '#d9534f';
    default: return '#666';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Não Iniciada': return '⏸️';
    case 'Fase de Preparação': return '🔧';
    case 'Em Andamento': return '▶️';
    case 'Concluída': return '✅';
    case 'Falha': return '❌';
    default: return '❓';
  }
};

export default function MissoesPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [missoes, setMissoes] = useState([]);
  const [missaoSelecionada, setMissaoSelecionada] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [newMissao, setNewMissao] = useState({ nome: '', descricao: '', briefing: '', nex: 0, status: 'Não Iniciada', comandante_id: '' });
  
  // Modal de visualização detalhada
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailAnimPhase, setDetailAnimPhase] = useState(0); // 0=fechado, 1=linha, 2=expandindo, 3=aberto
  const [detailTab, setDetailTab] = useState('overview'); // 'overview' ou 'agents'
  const [selectedAgent, setSelectedAgent] = useState(null); // Agente selecionado para ver detalhes
  
  // Modal de edição da missão
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMissao, setEditMissao] = useState({ nome: '', descricao: '', briefing: '', nex: 0, status: '', comandante_id: '' });

  const token = localStorage.getItem('authToken');
  const currentUserId = token ? decodeToken(token)?.user_id : null;

  // Bloquear scroll do body quando qualquer modal estiver aberto
  useEffect(() => {
    if (showCreateModal || showAddAgentModal || showNotifyModal || showDetailModal || showEditModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showCreateModal, showAddAgentModal, showNotifyModal, showDetailModal, showEditModal]);

  useEffect(() => {
    loadMissoes();
    loadUsers();
  }, []);

  useEffect(() => {
    if (id && missoes.length > 0) {
      const missao = missoes.find(m => m.id === parseInt(id));
      if (missao) {
        setMissaoSelecionada(missao);
      }
    }
  }, [id, missoes]);

  const loadMissoes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/missoes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!data.erro) {
        setMissoes(data);
      }
    } catch (err) {
      console.error('Erro ao carregar missões:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!data.erro) {
        // Carregar fotos de cada usuário
        const usersWithPhotos = await Promise.all(data.map(async (user) => {
          try {
            const fotoRes = await fetch(`${API_BASE_URL}/users/${user.id}/foto`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const fotoData = await fotoRes.json();
            return { ...user, foto: fotoData.foto };
          } catch {
            return { ...user, foto: null };
          }
        }));
        setUsers(usersWithPhotos);
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  const handleCreateMissao = async () => {
    if (!newMissao.nome.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    if (!newMissao.comandante_id) {
      alert('Comandante da missão é obrigatório');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/missoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newMissao)
      });
      const data = await response.json();
      if (!data.erro) {
        setMissoes([data, ...missoes]);
        setShowCreateModal(false);
        setNewMissao({ nome: '', descricao: '', briefing: '', nex: 0, status: 'Não Iniciada', comandante_id: '' });
        setMissaoSelecionada(data);
      } else {
        alert(data.erro);
      }
    } catch (err) {
      console.error('Erro ao criar missão:', err);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!missaoSelecionada) return;

    try {
      const response = await fetch(`${API_BASE_URL}/missoes/${missaoSelecionada.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (!data.erro) {
        loadMissoes();
        setMissaoSelecionada({ ...missaoSelecionada, status: newStatus });
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const handleEditMissao = async () => {
    if (!missaoSelecionada) return;
    if (!editMissao.nome.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/missoes/${missaoSelecionada.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: editMissao.nome,
          descricao: editMissao.descricao,
          briefing: editMissao.briefing,
          nex: editMissao.nex,
          status: editMissao.status,
          comandante_id: editMissao.comandante_id
        })
      });
      const data = await response.json();
      if (!data.erro) {
        loadMissoes();
        setMissaoSelecionada({ 
          ...missaoSelecionada, 
          nome: editMissao.nome,
          descricao: editMissao.descricao,
          briefing: editMissao.briefing,
          nex: editMissao.nex,
          status: editMissao.status,
          comandante_id: editMissao.comandante_id
        });
        setShowEditModal(false);
      } else {
        alert(data.erro);
      }
    } catch (err) {
      console.error('Erro ao editar missão:', err);
    }
  };

  const handleDeleteMissao = async () => {
    if (!missaoSelecionada) return;
    if (!confirm('Tem certeza que deseja deletar esta missão?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/missoes/${missaoSelecionada.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setMissoes(missoes.filter(m => m.id !== missaoSelecionada.id));
        setMissaoSelecionada(null);
        navigate('/missoes');
      }
    } catch (err) {
      console.error('Erro ao deletar missão:', err);
    }
  };

  const handleAddAgente = async (userId) => {
    if (!missaoSelecionada) return;

    try {
      const response = await fetch(`${API_BASE_URL}/missoes/${missaoSelecionada.id}/agentes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await response.json();
      if (!data.erro) {
        loadMissoes();
        setShowAddAgentModal(false);
      } else {
        alert(data.erro);
      }
    } catch (err) {
      console.error('Erro ao adicionar agente:', err);
    }
  };

  const handleRemoveAgente = async (userId) => {
    if (!missaoSelecionada) return;
    if (!confirm('Remover este agente da missão?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/missoes/${missaoSelecionada.id}/agentes/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        loadMissoes();
      }
    } catch (err) {
      console.error('Erro ao remover agente:', err);
    }
  };

  const handleNotifyAgentes = async () => {
    if (!missaoSelecionada || !notifyMessage.trim()) {
      alert('Digite uma mensagem para enviar aos agentes');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/missoes/${missaoSelecionada.id}/notificar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mensagem: notifyMessage })
      });
      const data = await response.json();
      if (!data.erro) {
        alert('Notificação enviada aos agentes!');
        setShowNotifyModal(false);
        setNotifyMessage('');
      } else {
        alert(data.erro);
      }
    } catch (err) {
      console.error('Erro ao notificar agentes:', err);
      alert('Erro ao enviar notificação');
    }
  };

  // Verificar se o usuário atual é o comandante da missão selecionada
  const isComandante = missaoSelecionada && currentUserId === missaoSelecionada.comandante_id;

  // Atualizar missaoSelecionada quando missoes mudar
  useEffect(() => {
    if (missaoSelecionada) {
      const updated = missoes.find(m => m.id === missaoSelecionada.id);
      if (updated) {
        setMissaoSelecionada(updated);
      }
    }
  }, [missoes]);

  const agentesNaoNaMissao = users.filter(
    user => !missaoSelecionada?.agentes?.some(a => a.id === user.id)
  );

  // Funções para o modal de detalhes com animação
  const openDetailModal = () => {
    setDetailTab('overview'); // Reset para aba inicial
    setSelectedAgent(null); // Reset agente selecionado
    setShowDetailModal(true);
    setDetailAnimPhase(1); // Inicia linha horizontal (simula com scaleY pequeno)
    setTimeout(() => setDetailAnimPhase(2), 100); // Expande verticalmente
    setTimeout(() => setDetailAnimPhase(3), 600); // Aberto completo
  };

  const closeDetailModal = () => {
    setDetailAnimPhase(1); // Contraindo
    setTimeout(() => {
      setDetailAnimPhase(0);
      setShowDetailModal(false);
      setDetailTab('overview');
      setSelectedAgent(null);
    }, 400);
  };

  // Função para cor do NEX (nível de perigo)
  const getNexColor = (nex) => {
    if (nex === null || nex === undefined) return '#666';
    if (nex <= 20) return '#5cb85c'; // Verde - Baixo
    if (nex <= 40) return '#8bc34a'; // Verde claro
    if (nex <= 60) return '#f0ad4e'; // Amarelo - Moderado
    if (nex <= 80) return '#ff9800'; // Laranja - Alto
    return '#d9534f'; // Vermelho - Crítico
  };

  const getNexLabel = (nex) => {
    if (nex === null || nex === undefined) return 'N/A';
    if (nex <= 20) return 'Baixo';
    if (nex <= 40) return 'Moderado';
    if (nex <= 60) return 'Elevado';
    if (nex <= 80) return 'Alto';
    return 'Crítico';
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      padding: '30px',
      paddingTop: '250px',
      display: 'flex',
      gap: '30px'
    }}>
      {/* Sidebar - Lista de Missões */}
      <div style={{
        width: '350px',
        background: 'rgba(20, 20, 20, 0.9)',
        borderRadius: '15px',
        border: '1px solid #333',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header da sidebar */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            color: '#4a90d9',
            fontSize: '1.2rem',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Missões
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #4a90d9 0%, #357abd 100%)',
              border: 'none',
              color: '#fff',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '8px 15px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
          >
            +
          </button>
        </div>

        {/* Lista de missões */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              Carregando...
            </div>
          ) : missoes.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              Nenhuma missão criada
            </div>
          ) : (
            missoes.map(missao => (
              <div
                key={missao.id}
                onClick={() => {
                  setMissaoSelecionada(missao);
                  navigate(`/missao/${missao.id}`);
                }}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  background: missaoSelecionada?.id === missao.id ? 'rgba(74, 144, 217, 0.2)' : 'rgba(30, 30, 30, 0.8)',
                  border: `1px solid ${missaoSelecionada?.id === missao.id ? '#4a90d9' : '#333'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{getStatusIcon(missao.status)}</span>
                  <span style={{ color: '#fff', fontWeight: '600', flex: 1 }}>{missao.nome}</span>
                </div>
                <div style={{
                  marginTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.65rem',
                    background: `${getStatusColor(missao.status)}33`,
                    color: getStatusColor(missao.status),
                    border: `1px solid ${getStatusColor(missao.status)}`
                  }}>
                    {missao.status}
                  </span>
                  <span style={{ color: '#666', fontSize: '0.75rem' }}>
                    {missao.agentes_count || 0} agentes
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Botão voltar */}
        <div style={{ padding: '15px', borderTop: '1px solid #333' }}>
          <button
            onClick={() => navigate('/sentinela')}
            style={{
              width: '100%',
              background: 'rgba(50, 50, 50, 0.8)',
              border: '1px solid #444',
              color: '#888',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ← Voltar à Central
          </button>
        </div>
      </div>

      {/* Área principal - Detalhes da Missão */}
      <div style={{
        flex: 1,
        background: 'rgba(20, 20, 20, 0.9)',
        borderRadius: '15px',
        border: '1px solid #333',
        overflow: 'hidden'
      }}>
        {missaoSelecionada ? (
          <>
            {/* Header da missão */}
            <div style={{
              padding: '25px 30px',
              borderBottom: '1px solid #333',
              background: 'linear-gradient(180deg, rgba(74, 144, 217, 0.1) 0%, transparent 100%)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{
                    margin: 0,
                    color: '#fff',
                    fontSize: '1.8rem',
                    fontWeight: '600'
                  }}>
                    {missaoSelecionada.nome}
                  </h1>
                  <p style={{
                    margin: '10px 0 0 0',
                    color: '#888',
                    fontSize: '0.95rem'
                  }}>
                    {missaoSelecionada.descricao || 'Sem descrição'}
                  </p>
                  {/* Comandante da missão */}
                  <div style={{
                    marginTop: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ color: '#f0ad4e', fontSize: '0.9rem', fontWeight: '600' }}>
                      👑 Comandante:
                    </span>
                    {missaoSelecionada.comandante_id ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(240, 173, 78, 0.15)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid #f0ad4e'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: missaoSelecionada.comandante_foto 
                            ? `url(data:image/jpeg;base64,${missaoSelecionada.comandante_foto}) center/cover` 
                            : 'linear-gradient(135deg, #f0ad4e 0%, #d68f3a 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          {!missaoSelecionada.comandante_foto && (missaoSelecionada.comandante_nome?.[0] || '?')}
                        </div>
                        <span style={{ color: '#f0ad4e', fontWeight: '600', fontSize: '0.85rem' }}>
                          {missaoSelecionada.comandante_nome || 'Desconhecido'}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#666', fontSize: '0.85rem' }}>Não definido</span>
                    )}
                  </div>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '10px',
                  minWidth: '280px'
                }}>
                  {/* Linha 1: Notificar Agentes | Ver Detalhes */}
                  {isComandante ? (
                    <button
                      onClick={() => setShowNotifyModal(true)}
                      style={{
                        background: 'linear-gradient(135deg, #5cb85c 0%, #449d44 100%)',
                        border: 'none',
                        color: '#fff',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      📢 Notificar Agentes
                    </button>
                  ) : (
                    <div></div>
                  )}
                  <button
                    onClick={openDetailModal}
                    style={{
                      background: 'linear-gradient(135deg, #4a90d9 0%, #357abd 100%)',
                      border: 'none',
                      color: '#fff',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    📋 Ver Detalhes
                  </button>
                  
                  {/* Linha 2: Editar Missão | Deletar Missão */}
                  {isComandante ? (
                    <button
                      onClick={() => {
                        setEditMissao({
                          nome: missaoSelecionada.nome,
                          descricao: missaoSelecionada.descricao || '',
                          briefing: missaoSelecionada.briefing || '',
                          nex: missaoSelecionada.nex || 0,
                          status: missaoSelecionada.status,
                          comandante_id: missaoSelecionada.comandante_id
                        });
                        setShowEditModal(true);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #f0ad4e 0%, #d68f3a 100%)',
                        border: 'none',
                        color: '#000',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      ✏️ Editar Missão
                    </button>
                  ) : (
                    <div></div>
                  )}
                  <button
                    onClick={handleDeleteMissao}
                    style={{
                      background: 'rgba(217, 83, 79, 0.2)',
                      border: '1px solid #d9534f',
                      color: '#d9534f',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    🗑️ Deletar Missão
                  </button>
                </div>
              </div>

              {/* Status selector */}
              <div style={{ marginTop: '20px' }}>
                <label style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                  Status da Missão:
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {STATUS_OPTIONS.map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(status)}
                      style={{
                        padding: '8px 15px',
                        borderRadius: '20px',
                        border: `2px solid ${getStatusColor(status)}`,
                        background: missaoSelecionada.status === status 
                          ? getStatusColor(status) 
                          : 'transparent',
                        color: missaoSelecionada.status === status 
                          ? '#fff' 
                          : getStatusColor(status),
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                    >
                      {getStatusIcon(status)} {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Agentes da missão */}
            <div style={{ padding: '25px 30px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  margin: 0,
                  color: '#4a90d9',
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}>
                  Agentes Designados ({missaoSelecionada.agentes?.length || 0})
                </h3>
                <button
                  onClick={() => setShowAddAgentModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #4a90d9 0%, #357abd 100%)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  + Adicionar Agente
                </button>
              </div>

              {/* Grid de agentes */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '15px'
              }}>
                {missaoSelecionada.agentes?.map(agente => (
                  <div
                    key={agente.id}
                    style={{
                      background: 'rgba(30, 30, 30, 0.8)',
                      border: '1px solid #444',
                      borderRadius: '12px',
                      padding: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      position: 'relative'
                    }}
                  >
                    {/* Foto do agente */}
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: agente.foto 
                        ? `url(data:image/jpeg;base64,${agente.foto}) center/cover` 
                        : 'linear-gradient(135deg, #4a90d9 0%, #357abd 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {!agente.foto && (agente.display_name?.[0] || '?')}
                    </div>

                    {/* Info do agente */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: '#fff',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {agente.display_name}
                      </div>
                      <div style={{
                        color: '#666',
                        fontSize: '0.75rem',
                        marginTop: '3px'
                      }}>
                        {agente.cargo || 'Agente'}
                      </div>
                    </div>

                    {/* Botão remover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAgente(agente.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(217, 83, 79, 0.3)',
                        border: 'none',
                        color: '#d9534f',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {(!missaoSelecionada.agentes || missaoSelecionada.agentes.length === 0) && (
                  <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '40px',
                    color: '#666'
                  }}>
                    Nenhum agente designado para esta missão
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#666',
            fontSize: '1.1rem'
          }}>
            Selecione uma missão para ver os detalhes
          </div>
        )}
      </div>

      {/* Modal Criar Missão */}
      {showCreateModal && (
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
            zIndex: 9999,
            overflow: 'hidden'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: '2px solid #4a90d9',
              borderRadius: '15px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '85vh',
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '30px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              margin: '0 0 25px 0',
              color: '#4a90d9',
              fontSize: '1.3rem',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              Nova Missão
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                Nome da Missão *
              </label>
              <input
                type="text"
                value={newMissao.nome}
                onChange={(e) => setNewMissao({ ...newMissao, nome: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  background: 'rgba(30, 30, 30, 0.8)',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                placeholder="Digite o nome da missão"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                Descrição
              </label>
              <textarea
                value={newMissao.descricao}
                onChange={(e) => setNewMissao({ ...newMissao, descricao: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  background: 'rgba(30, 30, 30, 0.8)',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Digite a descrição da missão"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                Briefing da Missão
              </label>
              <textarea
                value={newMissao.briefing}
                onChange={(e) => setNewMissao({ ...newMissao, briefing: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  background: 'rgba(30, 30, 30, 0.8)',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  minHeight: '120px',
                  resize: 'vertical'
                }}
                placeholder="Descreva o briefing detalhado da missão..."
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                Nível NEX (0-99) - Perigo
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <input
                  type="range"
                  min="0"
                  max="99"
                  step="1"
                  value={newMissao.nex || 0}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    // Arredondar para múltiplo de 5, exceto se >= 95 (permite 99)
                    if (val >= 95) {
                      val = val >= 97 ? 99 : 95;
                    } else {
                      val = Math.round(val / 5) * 5;
                    }
                    setNewMissao({ ...newMissao, nex: val });
                  }}
                  style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    accentColor: getNexColor(newMissao.nex || 0)
                  }}
                />
                <div style={{
                  minWidth: '80px',
                  padding: '8px 15px',
                  background: `${getNexColor(newMissao.nex || 0)}22`,
                  border: `2px solid ${getNexColor(newMissao.nex || 0)}`,
                  borderRadius: '8px',
                  color: getNexColor(newMissao.nex || 0),
                  fontWeight: '700',
                  textAlign: 'center'
                }}>
                  {newMissao.nex || 0}
                </div>
              </div>
              <div style={{ 
                marginTop: '8px', 
                color: getNexColor(newMissao.nex || 0), 
                fontSize: '0.8rem',
                fontWeight: '600' 
              }}>
                ⚠️ Nível: {getNexLabel(newMissao.nex || 0)}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                Comandante da Missão *
              </label>
              <select
                value={newMissao.comandante_id}
                onChange={(e) => setNewMissao({ ...newMissao, comandante_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  background: 'rgba(30, 30, 30, 0.8)',
                  border: newMissao.comandante_id ? '1px solid #4a90d9' : '1px solid #d9534f',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              >
                <option value="">Selecione o comandante...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.display_name || user.username} {user.cargo ? `(${user.cargo})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                Status Inicial
              </label>
              <select
                value={newMissao.status}
                onChange={(e) => setNewMissao({ ...newMissao, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  background: 'rgba(30, 30, 30, 0.8)',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'rgba(50, 50, 50, 0.8)',
                  border: '1px solid #444',
                  color: '#888',
                  padding: '12px 25px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateMissao}
                style={{
                  background: 'linear-gradient(135deg, #4a90d9 0%, #357abd 100%)',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 25px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Criar Missão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL DE EDIÇÃO DA MISSÃO ==================== */}
      {showEditModal && missaoSelecionada && (
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
            zIndex: 10000,
            overflow: 'hidden'
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: '2px solid #f0ad4e',
              borderRadius: '15px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '85vh',
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '30px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              margin: '0 0 25px 0',
              color: '#f0ad4e',
              fontSize: '1.3rem',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              ✏️ Editar Missão
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                Nome da Missão *
              </label>
              <input
                type="text"
                value={editMissao.nome}
                onChange={(e) => setEditMissao({ ...editMissao, nome: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  background: 'rgba(30, 30, 30, 0.8)',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                placeholder="Digite o nome da missão"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                Descrição
              </label>
              <textarea
                value={editMissao.descricao}
                onChange={(e) => setEditMissao({ ...editMissao, descricao: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  background: 'rgba(30, 30, 30, 0.8)',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Digite a descrição da missão"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                Briefing da Missão
              </label>
              <textarea
                value={editMissao.briefing}
                onChange={(e) => setEditMissao({ ...editMissao, briefing: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  background: 'rgba(30, 30, 30, 0.8)',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  minHeight: '120px',
                  resize: 'vertical'
                }}
                placeholder="Descreva o briefing detalhado da missão..."
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                Nível NEX (0-99) - Perigo
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <input
                  type="range"
                  min="0"
                  max="99"
                  step="1"
                  value={editMissao.nex || 0}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    // Arredondar para múltiplo de 5, exceto se >= 95 (permite 99)
                    if (val >= 95) {
                      val = val >= 97 ? 99 : 95;
                    } else {
                      val = Math.round(val / 5) * 5;
                    }
                    setEditMissao({ ...editMissao, nex: val });
                  }}
                  style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    accentColor: getNexColor(editMissao.nex || 0)
                  }}
                />
                <div style={{
                  minWidth: '80px',
                  padding: '8px 15px',
                  background: `${getNexColor(editMissao.nex || 0)}22`,
                  border: `2px solid ${getNexColor(editMissao.nex || 0)}`,
                  borderRadius: '8px',
                  color: getNexColor(editMissao.nex || 0),
                  fontWeight: '700',
                  textAlign: 'center'
                }}>
                  {editMissao.nex || 0}
                </div>
              </div>
              <div style={{ 
                marginTop: '8px', 
                color: getNexColor(editMissao.nex || 0), 
                fontSize: '0.8rem',
                fontWeight: '600' 
              }}>
                ⚠️ Nível: {getNexLabel(editMissao.nex || 0)}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                Comandante da Missão
              </label>
              <select
                value={editMissao.comandante_id}
                onChange={(e) => setEditMissao({ ...editMissao, comandante_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  background: 'rgba(30, 30, 30, 0.8)',
                  border: '1px solid #f0ad4e',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              >
                <option value="">Selecione o comandante...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.display_name || user.username} {user.cargo ? `(${user.cargo})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                Status da Missão
              </label>
              <select
                value={editMissao.status}
                onChange={(e) => setEditMissao({ ...editMissao, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  background: 'rgba(30, 30, 30, 0.8)',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'rgba(50, 50, 50, 0.8)',
                  border: '1px solid #444',
                  color: '#888',
                  padding: '12px 25px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEditMissao}
                style={{
                  background: 'linear-gradient(135deg, #f0ad4e 0%, #d68f3a 100%)',
                  border: 'none',
                  color: '#000',
                  padding: '12px 25px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Agente */}
      {showAddAgentModal && (
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
          onClick={() => setShowAddAgentModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: '2px solid #4a90d9',
              borderRadius: '15px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '25px 30px',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                margin: 0,
                color: '#4a90d9',
                fontSize: '1.2rem',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                Adicionar Agente
              </h2>
              <button
                onClick={() => setShowAddAgentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              padding: '20px 30px',
              maxHeight: 'calc(80vh - 100px)',
              overflowY: 'auto'
            }}>
              {agentesNaoNaMissao.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  Todos os agentes já estão nesta missão
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '15px'
                }}>
                  {agentesNaoNaMissao.map(user => (
                    <div
                      key={user.id}
                      onClick={() => handleAddAgente(user.id)}
                      style={{
                        background: 'rgba(30, 30, 30, 0.8)',
                        border: '1px solid #444',
                        borderRadius: '12px',
                        padding: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#4a90d9';
                        e.currentTarget.style.background = 'rgba(74, 144, 217, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#444';
                        e.currentTarget.style.background = 'rgba(30, 30, 30, 0.8)';
                      }}
                    >
                      {/* Foto */}
                      <div style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        background: user.foto 
                          ? `url(data:image/jpeg;base64,${user.foto}) center/cover` 
                          : 'linear-gradient(135deg, #4a90d9 0%, #357abd 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {!user.foto && (user.display_name?.[0] || '?')}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: '600' }}>
                          {user.display_name || user.username}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '2px' }}>
                          {user.cargo || 'Agente'} • {user.grupo || 'Observador'}
                        </div>
                      </div>

                      {/* Ícone adicionar */}
                      <div style={{ color: '#4a90d9', fontSize: '1.2rem' }}>
                        +
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Notificar Agentes */}
      {showNotifyModal && (
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
          onClick={() => setShowNotifyModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: '2px solid #5cb85c',
              borderRadius: '15px',
              width: '90%',
              maxWidth: '500px',
              padding: '30px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              margin: '0 0 10px 0',
              color: '#5cb85c',
              fontSize: '1.3rem',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📢 Notificar Agentes
            </h2>
            <p style={{
              margin: '0 0 20px 0',
              color: '#666',
              fontSize: '0.85rem'
            }}>
              Envie uma mensagem para todos os agentes designados nesta missão
            </p>

            {/* Lista de agentes que receberão */}
            <div style={{
              background: 'rgba(30, 30, 30, 0.8)',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <span style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '10px' }}>
                Destinatários ({missaoSelecionada?.agentes?.length || 0}):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {missaoSelecionada?.agentes?.map(agente => (
                  <div
                    key={agente.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(92, 184, 92, 0.15)',
                      padding: '4px 10px',
                      borderRadius: '15px',
                      border: '1px solid #5cb85c'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: agente.foto 
                        ? `url(data:image/jpeg;base64,${agente.foto}) center/cover` 
                        : '#5cb85c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.6rem',
                      fontWeight: 'bold'
                    }}>
                      {!agente.foto && (agente.display_name?.[0] || '?')}
                    </div>
                    <span style={{ color: '#5cb85c', fontSize: '0.75rem' }}>
                      {agente.display_name}
                    </span>
                  </div>
                ))}
                {(!missaoSelecionada?.agentes || missaoSelecionada.agentes.length === 0) && (
                  <span style={{ color: '#666', fontSize: '0.8rem' }}>
                    Nenhum agente designado
                  </span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#888', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                Mensagem *
              </label>
              <textarea
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  background: 'rgba(30, 30, 30, 0.8)',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  minHeight: '120px',
                  resize: 'vertical'
                }}
                placeholder="Digite a mensagem para os agentes..."
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowNotifyModal(false);
                  setNotifyMessage('');
                }}
                style={{
                  background: 'rgba(50, 50, 50, 0.8)',
                  border: '1px solid #444',
                  color: '#888',
                  padding: '12px 25px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleNotifyAgentes}
                disabled={!missaoSelecionada?.agentes?.length}
                style={{
                  background: missaoSelecionada?.agentes?.length 
                    ? 'linear-gradient(135deg, #5cb85c 0%, #449d44 100%)' 
                    : '#444',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 25px',
                  borderRadius: '8px',
                  cursor: missaoSelecionada?.agentes?.length ? 'pointer' : 'not-allowed',
                  fontWeight: '600'
                }}
              >
                Enviar Notificação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL DE DETALHES DA MISSÃO ==================== */}
      {showDetailModal && missaoSelecionada && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: detailAnimPhase >= 2 ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            transition: 'background 0.4s ease',
            overflow: 'hidden'
          }}
          onClick={closeDetailModal}
        >
          {/* Container do Modal com efeito de abertura vertical */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: detailAnimPhase >= 1 ? '94%' : '0%',
              maxWidth: '1100px',
              maxHeight: '85vh',
              background: 'linear-gradient(180deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 25, 0.98) 100%)',
              border: '2px solid #4a90d9',
              borderRadius: '20px',
              overflow: 'hidden',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: detailAnimPhase >= 2 ? 1 : 0,
              transform: detailAnimPhase >= 2 
                ? 'scaleY(1) scaleX(1)' 
                : 'scaleY(0.02) scaleX(0.8)',
              transformOrigin: 'center center',
              boxShadow: detailAnimPhase >= 2 
                ? '0 0 50px rgba(74, 144, 217, 0.3), 0 0 100px rgba(0, 255, 204, 0.1), 0 0 0 2px rgba(0, 255, 204, 0.2)' 
                : '0 0 30px rgba(74, 144, 217, 0.8), 0 0 60px rgba(0, 255, 204, 0.4)'
            }}
          >
            {/* Header do Modal */}
            <div style={{
              padding: '25px 30px',
              background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.2) 0%, rgba(0, 255, 204, 0.1) 100%)',
              borderBottom: '1px solid rgba(74, 144, 217, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${getStatusColor(missaoSelecionada.status)} 0%, ${getStatusColor(missaoSelecionada.status)}88 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  boxShadow: `0 0 20px ${getStatusColor(missaoSelecionada.status)}44`
                }}>
                  {getStatusIcon(missaoSelecionada.status)}
                </div>
                <div>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '1.6rem', fontWeight: '700' }}>
                    {missaoSelecionada.nome}
                  </h2>
                  <span style={{
                    color: getStatusColor(missaoSelecionada.status),
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {missaoSelecionada.status}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Botão Editar - só aparece para o comandante */}
                {currentUserId === missaoSelecionada.comandante_id && (
                  <button
                    onClick={() => {
                      setEditMissao({
                        nome: missaoSelecionada.nome,
                        descricao: missaoSelecionada.descricao || '',
                        briefing: missaoSelecionada.briefing || '',
                        nex: missaoSelecionada.nex || 0,
                        status: missaoSelecionada.status,
                        comandante_id: missaoSelecionada.comandante_id
                      });
                      setShowEditModal(true);
                    }}
                    style={{
                      background: 'rgba(240, 173, 78, 0.2)',
                      border: '1px solid #f0ad4e',
                      color: '#f0ad4e',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(240, 173, 78, 0.4)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(240, 173, 78, 0.2)'}
                  >
                    ✏️ Editar Missão
                  </button>
                )}
                <button
                  onClick={closeDetailModal}
                  style={{
                    background: 'rgba(255, 100, 100, 0.2)',
                    border: '1px solid #ff6666',
                    color: '#ff6666',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 100, 100, 0.4)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 100, 100, 0.2)'}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Abas de Navegação */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #333',
              background: 'rgba(0, 0, 0, 0.3)'
            }}>
              <button
                onClick={() => { setDetailTab('overview'); setSelectedAgent(null); }}
                style={{
                  flex: 1,
                  padding: '15px 20px',
                  background: detailTab === 'overview' ? 'rgba(74, 144, 217, 0.2)' : 'transparent',
                  border: 'none',
                  borderBottom: detailTab === 'overview' ? '3px solid #4a90d9' : '3px solid transparent',
                  color: detailTab === 'overview' ? '#4a90d9' : '#888',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                📋 Visão Geral
              </button>
              <button
                onClick={() => { setDetailTab('agents'); setSelectedAgent(null); }}
                style={{
                  flex: 1,
                  padding: '15px 20px',
                  background: detailTab === 'agents' ? 'rgba(74, 144, 217, 0.2)' : 'transparent',
                  border: 'none',
                  borderBottom: detailTab === 'agents' ? '3px solid #4a90d9' : '3px solid transparent',
                  color: detailTab === 'agents' ? '#4a90d9' : '#888',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                👥 Agentes ({missaoSelecionada.agentes?.length || 0})
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div style={{ 
              padding: '30px', 
              overflowY: 'auto', 
              maxHeight: 'calc(85vh - 160px)',
              opacity: detailAnimPhase >= 3 ? 1 : 0,
              transform: detailAnimPhase >= 3 ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.3s ease 0.2s'
            }}>

              {/* === ABA VISÃO GERAL === */}
              {detailTab === 'overview' && (
                <>
              {/* Grid de informações */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                {/* NEX - Nível de Perigo */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: `2px solid ${getNexColor(missaoSelecionada.nex || 0)}`,
                  boxShadow: `0 0 20px ${getNexColor(missaoSelecionada.nex || 0)}22`
                }}>
                  <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Nível NEX
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{
                      fontSize: '2.5rem',
                      fontWeight: '700',
                      color: getNexColor(missaoSelecionada.nex || 0),
                      textShadow: `0 0 20px ${getNexColor(missaoSelecionada.nex || 0)}`
                    }}>
                      {missaoSelecionada.nex || 0}
                    </span>
                    <span style={{ color: '#666', fontSize: '1rem' }}>/99</span>
                  </div>
                  <div style={{
                    marginTop: '10px',
                    padding: '5px 12px',
                    background: `${getNexColor(missaoSelecionada.nex || 0)}22`,
                    borderRadius: '20px',
                    display: 'inline-block',
                    color: getNexColor(missaoSelecionada.nex || 0),
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    ⚠️ {getNexLabel(missaoSelecionada.nex || 0)}
                  </div>
                  {/* Barra de progresso NEX */}
                  <div style={{
                    marginTop: '15px',
                    height: '8px',
                    background: 'rgba(50, 50, 50, 0.8)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${((missaoSelecionada.nex || 0) / 99) * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${getNexColor(missaoSelecionada.nex || 0)}, ${getNexColor(missaoSelecionada.nex || 0)}88)`,
                      borderRadius: '4px',
                      transition: 'width 0.5s ease',
                      boxShadow: `0 0 10px ${getNexColor(missaoSelecionada.nex || 0)}`
                    }} />
                  </div>
                </div>

                {/* Contagem de Agentes */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '2px solid #4a90d9'
                }}>
                  <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Agentes Envolvidos
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: '700', color: '#4a90d9' }}>
                      {missaoSelecionada.agentes?.length || 0}
                    </span>
                    <span style={{ color: '#666', fontSize: '1rem' }}>agentes</span>
                  </div>
                  {/* Avatares dos agentes */}
                  <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {missaoSelecionada.agentes?.slice(0, 8).map((agente, idx) => (
                      <div
                        key={agente.id}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: agente.foto 
                            ? `url(data:image/jpeg;base64,${agente.foto}) center/cover` 
                            : 'linear-gradient(135deg, #4a90d9, #357abd)',
                          border: '2px solid #4a90d9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}
                        title={agente.display_name}
                      >
                        {!agente.foto && (agente.display_name?.[0] || '?')}
                      </div>
                    ))}
                    {(missaoSelecionada.agentes?.length || 0) > 8 && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(74, 144, 217, 0.3)',
                        border: '2px solid #4a90d9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#4a90d9',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        +{(missaoSelecionada.agentes?.length || 0) - 8}
                      </div>
                    )}
                  </div>
                </div>

                {/* Comandante */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: '2px solid #f0ad4e'
                }}>
                  <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    👑 Comandante
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: missaoSelecionada.comandante_foto 
                        ? `url(data:image/jpeg;base64,${missaoSelecionada.comandante_foto}) center/cover` 
                        : 'linear-gradient(135deg, #f0ad4e, #d68f3a)',
                      border: '3px solid #f0ad4e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      boxShadow: '0 0 15px rgba(240, 173, 78, 0.4)'
                    }}>
                      {!missaoSelecionada.comandante_foto && (missaoSelecionada.comandante_nome?.[0] || '?')}
                    </div>
                    <div>
                      <div style={{ color: '#f0ad4e', fontWeight: '700', fontSize: '1.1rem' }}>
                        {missaoSelecionada.comandante_nome || 'Desconhecido'}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.8rem' }}>
                        Líder da Operação
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '15px',
                  padding: '20px',
                  border: `2px solid ${getStatusColor(missaoSelecionada.status)}`
                }}>
                  <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Status Atual
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '10px'
                  }}>
                    <span style={{ fontSize: '2rem' }}>{getStatusIcon(missaoSelecionada.status)}</span>
                    <span style={{
                      color: getStatusColor(missaoSelecionada.status),
                      fontSize: '1.2rem',
                      fontWeight: '700'
                    }}>
                      {missaoSelecionada.status}
                    </span>
                  </div>
                  {missaoSelecionada.data_criacao && (
                    <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '15px' }}>
                      📅 Criada em: {new Date(missaoSelecionada.data_criacao).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>

              {/* Briefing da Missão */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '15px',
                padding: '25px',
                border: '1px solid #333',
                marginBottom: '20px'
              }}>
                <h3 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#4a90d9', 
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  📝 Briefing da Missão
                </h3>
                <div style={{
                  color: '#ccc',
                  fontSize: '0.95rem',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-wrap',
                  padding: '15px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '10px',
                  border: '1px solid #222'
                }}>
                  {missaoSelecionada.briefing || missaoSelecionada.descricao || 'Nenhum briefing disponível para esta missão.'}
                </div>
              </div>

              {/* Perímetro Vinculado */}
              {missaoSelecionada.perimetro && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '15px',
                  padding: '25px',
                  border: '2px solid #cc0000',
                  boxShadow: '0 0 20px rgba(204, 0, 0, 0.15)'
                }}>
                  <h3 style={{ 
                    margin: '0 0 20px 0', 
                    color: '#ff6666', 
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    🎯 Perímetro da Operação
                  </h3>
                  
                  {/* Info Grid do Perímetro */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '15px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '12px' }}>
                      <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Nome</div>
                      <div style={{ color: '#ff6666', fontWeight: '600', fontSize: '1rem', marginTop: '4px' }}>
                        {missaoSelecionada.perimetro.nome}
                      </div>
                    </div>
                    <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '12px' }}>
                      <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Cidade</div>
                      <div style={{ color: '#ccc', fontWeight: '500', fontSize: '1rem', marginTop: '4px' }}>
                        {missaoSelecionada.perimetro.cidade || 'Não informada'}
                      </div>
                    </div>
                    <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '12px' }}>
                      <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Classe</div>
                      <div style={{ color: '#ccc', fontWeight: '500', fontSize: '1rem', marginTop: '4px' }}>
                        {missaoSelecionada.perimetro.class || '-'}
                      </div>
                    </div>
                    <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '12px' }}>
                      <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</div>
                      <div style={{ color: '#ccc', fontWeight: '500', fontSize: '1rem', marginTop: '4px' }}>
                        {missaoSelecionada.perimetro.status || '-'}
                      </div>
                    </div>
                    <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '12px' }}>
                      <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>População</div>
                      <div style={{ color: '#ccc', fontWeight: '500', fontSize: '1rem', marginTop: '4px' }}>
                        {missaoSelecionada.perimetro.populacao === -1 ? 'Desconhecida' : (missaoSelecionada.perimetro.populacao?.toLocaleString() || '0')}
                      </div>
                    </div>
                  </div>

                  {/* Homúnculos */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '10px',
                    padding: '15px',
                    border: '1px solid #444'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <span style={{ color: '#ff6666', fontSize: '0.9rem', fontWeight: '600' }}>
                        👥 Homúnculos Registrados
                      </span>
                      <span style={{
                        background: 'rgba(204, 0, 0, 0.3)',
                        color: '#ff6666',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        {missaoSelecionada.perimetro.homunculos_count || 0}
                      </span>
                    </div>
                    
                    {missaoSelecionada.perimetro.homunculos?.length > 0 ? (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {missaoSelecionada.perimetro.homunculos.map((h) => (
                          <div
                            key={h.id}
                            style={{
                              background: 'rgba(204, 0, 0, 0.15)',
                              border: '1px solid #cc0000',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <span style={{ color: '#ff6666', fontWeight: '600' }}>
                              {h.simulacro}
                            </span>
                            <span style={{ color: '#666', fontSize: '0.85rem' }}>
                              ({h.homunculo})
                            </span>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: h.status === 'Ativo' ? '#5cb85c' : '#d9534f'
                            }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#666', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        Nenhum homúnculo registrado neste perímetro.
                      </div>
                    )}
                  </div>
                </div>
              )}
                </>
              )}

              {/* === ABA AGENTES === */}
              {detailTab === 'agents' && (
                <div>
                  {/* Se nenhum agente selecionado, mostra grid de agentes */}
                  {!selectedAgent ? (
                    <>
                      <h3 style={{ 
                        margin: '0 0 20px 0', 
                        color: '#4a90d9', 
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        👥 Equipe da Missão
                      </h3>
                      
                      {missaoSelecionada.agentes?.length > 0 ? (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                          gap: '15px'
                        }}>
                          {missaoSelecionada.agentes.map((agente) => (
                            <div
                              key={agente.id}
                              onClick={() => setSelectedAgent(agente)}
                              style={{
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '2px solid #4a90d9',
                                borderRadius: '12px',
                                padding: '20px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(74, 144, 217, 0.15)';
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(74, 144, 217, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              {/* Avatar */}
                              <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: agente.foto 
                                  ? `url(data:image/jpeg;base64,${agente.foto}) center/cover` 
                                  : 'linear-gradient(135deg, #4a90d9, #357abd)',
                                border: '3px solid #4a90d9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                flexShrink: 0
                              }}>
                                {!agente.foto && (agente.display_name?.[0] || '?')}
                              </div>
                              
                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                  color: '#fff', 
                                  fontWeight: '700', 
                                  fontSize: '1.1rem',
                                  marginBottom: '4px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {agente.display_name}
                                </div>
                                <div style={{ color: '#888', fontSize: '0.85rem' }}>
                                  {agente.cargo || 'Agente'}
                                </div>
                                {agente.grupo && (
                                  <div style={{
                                    marginTop: '6px',
                                    display: 'inline-block',
                                    background: 'rgba(74, 144, 217, 0.2)',
                                    color: '#4a90d9',
                                    padding: '3px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                  }}>
                                    {agente.grupo}
                                  </div>
                                )}
                              </div>
                              
                              {/* Seta */}
                              <div style={{ color: '#4a90d9', fontSize: '1.2rem' }}>→</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '50px',
                          color: '#666'
                        }}>
                          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👤</div>
                          <div>Nenhum agente atribuído a esta missão.</div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Detalhes do agente selecionado */
                    <div>
                      {/* Botão voltar */}
                      <button
                        onClick={() => setSelectedAgent(null)}
                        style={{
                          background: 'rgba(74, 144, 217, 0.2)',
                          border: '1px solid #4a90d9',
                          color: '#4a90d9',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          marginBottom: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        ← Voltar para lista
                      </button>

                      {/* Card do Agente */}
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(74, 144, 217, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
                        border: '2px solid #4a90d9',
                        borderRadius: '20px',
                        padding: '30px',
                        boxShadow: '0 0 30px rgba(74, 144, 217, 0.2)'
                      }}>
                        {/* Header do perfil */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '25px',
                          marginBottom: '30px',
                          paddingBottom: '25px',
                          borderBottom: '1px solid #333'
                        }}>
                          {/* Avatar grande */}
                          <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: selectedAgent.foto 
                              ? `url(data:image/jpeg;base64,${selectedAgent.foto}) center/cover` 
                              : 'linear-gradient(135deg, #4a90d9, #357abd)',
                            border: '4px solid #4a90d9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            boxShadow: '0 0 25px rgba(74, 144, 217, 0.4)',
                            flexShrink: 0
                          }}>
                            {!selectedAgent.foto && (selectedAgent.display_name?.[0] || '?')}
                          </div>
                          
                          <div>
                            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem' }}>
                              {selectedAgent.display_name}
                            </h2>
                            <div style={{ color: '#4a90d9', fontSize: '1rem', marginTop: '5px' }}>
                              @{selectedAgent.username}
                            </div>
                          </div>
                        </div>

                        {/* Grid de informações */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '20px'
                        }}>
                          <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '12px',
                            padding: '18px',
                            border: '1px solid #333'
                          }}>
                            <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                              Cargo
                            </div>
                            <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>
                              {selectedAgent.cargo || 'Não definido'}
                            </div>
                          </div>

                          <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '12px',
                            padding: '18px',
                            border: '1px solid #333'
                          }}>
                            <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                              Grupo
                            </div>
                            <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>
                              {selectedAgent.grupo || 'Não definido'}
                            </div>
                          </div>

                          <div style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '12px',
                            padding: '18px',
                            border: '1px solid #333'
                          }}>
                            <div style={{ color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                              Atribuído em
                            </div>
                            <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>
                              {selectedAgent.data_atribuicao 
                                ? new Date(selectedAgent.data_atribuicao).toLocaleDateString('pt-BR')
                                : 'Data não registrada'}
                            </div>
                          </div>

                          {/* Indicador de comandante */}
                          {selectedAgent.id === missaoSelecionada.comandante_id && (
                            <div style={{
                              background: 'rgba(240, 173, 78, 0.2)',
                              borderRadius: '12px',
                              padding: '18px',
                              border: '2px solid #f0ad4e'
                            }}>
                              <div style={{ color: '#f0ad4e', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Função
                              </div>
                              <div style={{ color: '#f0ad4e', fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                👑 Comandante
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
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
