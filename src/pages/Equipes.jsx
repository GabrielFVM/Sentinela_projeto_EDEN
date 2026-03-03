import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// Função para decodificar JWT
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

const ICONES_DISPONIVEIS = ['👥', '⚔️', '🛡️', '🎯', '💀', '🔥', '⚡', '🌙', '☀️', '🌟', '🦅', '🐺', '🦁', '🐉', '👁️', '💎', '🗡️', '🏹', '🔮', '⚗️'];

const CORES_DISPONIVEIS = [
  '#4a90d9', '#e74c3c', '#27ae60', '#9b59b6', '#f39c12', 
  '#1abc9c', '#e67e22', '#3498db', '#2ecc71', '#8e44ad',
  '#c0392b', '#16a085', '#d35400', '#2980b9', '#27ae60'
];

export default function EquipesPage() {
  const navigate = useNavigate();
  
  const [equipes, setEquipes] = useState([]);
  const [equipeSelecionada, setEquipeSelecionada] = useState(null);
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [novaEquipe, setNovaEquipe] = useState({
    nome: '',
    descricao: '',
    cor: '#4a90d9',
    icone: '👥',
    lider_id: null,
    membros: []
  });
  
  const [editEquipe, setEditEquipe] = useState({
    nome: '',
    descricao: '',
    cor: '#4a90d9',
    icone: '👥',
    lider_id: null,
    membros: []
  });

  const token = localStorage.getItem('authToken');
  const currentUserId = token ? decodeToken(token)?.user_id : null;
  const currentUserCargo = token ? decodeToken(token)?.cargo : null;
  
  // Verificar se é admin/líder (pode criar equipes)
  const isAdmin = ['administrador', 'Lider'].includes(currentUserCargo);
  
  // Verificar se é líder da equipe selecionada (pode editar a própria equipe)
  const isLiderEquipe = equipeSelecionada && currentUserId === equipeSelecionada.lider_id;
  
  // Pode editar equipe se for admin/líder OU se for líder da equipe selecionada
  const canEditEquipe = isAdmin || isLiderEquipe;

  // Estados para Drag and Drop com física
  const [draggingAgent, setDraggingAgent] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragVelocity, setDragVelocity] = useState({ x: 0, y: 0 });
  const [cardRotation, setCardRotation] = useState(0);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isOverDropZone, setIsOverDropZone] = useState(false);
  const [isOverRemoveZone, setIsOverRemoveZone] = useState(false);
  const dropZoneRef = useRef(null);
  const removeZoneRef = useRef(null);

  // Handler para iniciar o drag
  const handleDragStart = (e, agente) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDragPosition({
      x: e.clientX,
      y: e.clientY
    });
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setDraggingAgent(agente);
    setCardRotation(0);
    setDragVelocity({ x: 0, y: 0 });
  };

  // Handler para movimento do mouse durante drag
  useEffect(() => {
    if (!draggingAgent) return;

    const handleMouseMove = (e) => {
      const velocityX = e.clientX - lastMousePos.x;
      const velocityY = e.clientY - lastMousePos.y;
      
      // Física de rotação baseada na velocidade horizontal (inclina na direção do movimento)
      const targetRotation = Math.max(-25, Math.min(25, velocityX * 0.8));
      setCardRotation(prev => prev + (targetRotation - prev) * 0.3);
      
      setDragVelocity({ x: velocityX, y: velocityY });
      setDragPosition({ x: e.clientX, y: e.clientY });
      setLastMousePos({ x: e.clientX, y: e.clientY });

      // Verificar se está sobre a zona de drop (membros selecionados)
      if (dropZoneRef.current) {
        const dropRect = dropZoneRef.current.getBoundingClientRect();
        const isOver = e.clientX >= dropRect.left && e.clientX <= dropRect.right &&
                       e.clientY >= dropRect.top && e.clientY <= dropRect.bottom;
        setIsOverDropZone(isOver);
      }

      // Verificar se está sobre a zona de remoção (agentes disponíveis)
      if (removeZoneRef.current) {
        const removeRect = removeZoneRef.current.getBoundingClientRect();
        const isOverRemove = e.clientX >= removeRect.left && e.clientX <= removeRect.right &&
                             e.clientY >= removeRect.top && e.clientY <= removeRect.bottom;
        setIsOverRemoveZone(isOverRemove);
      }
    };

    const handleMouseUp = () => {
      if (draggingAgent) {
        const isAlreadyMember = novaEquipe.membros.includes(draggingAgent.id);
        
        // Se está sobre a zona de drop e não é membro, adicionar
        if (isOverDropZone && !isAlreadyMember) {
          setNovaEquipe(prev => ({
            ...prev,
            membros: [...prev.membros, draggingAgent.id]
          }));
        }
        // Se está sobre a zona de remoção e é membro, remover
        else if (isOverRemoveZone && isAlreadyMember) {
          setNovaEquipe(prev => ({
            ...prev,
            membros: prev.membros.filter(id => id !== draggingAgent.id),
            lider_id: prev.lider_id === draggingAgent.id ? null : prev.lider_id
          }));
        }
      }
      
      setDraggingAgent(null);
      setIsOverDropZone(false);
      setIsOverRemoveZone(false);
      setCardRotation(0);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingAgent, lastMousePos, isOverDropZone, isOverRemoveZone, novaEquipe.membros]);

  // Bloquear scroll quando modal aberto
  useEffect(() => {
    if (showCreateModal || showEditModal || showAddMemberModal || showDeleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [showCreateModal, showEditModal, showAddMemberModal, showDeleteConfirm]);

  useEffect(() => {
    loadEquipes();
    loadAgentes();
  }, []);

  const loadEquipes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/equipes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEquipes(data);
      }
    } catch (err) {
      console.error('Erro ao carregar equipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAgentes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/agentes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAgentes(data);
      }
    } catch (err) {
      console.error('Erro ao carregar agentes:', err);
    }
  };

  const loadEquipeDetalhes = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/equipes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEquipeSelecionada(data);
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes da equipe:', err);
    }
  };

  const handleCreateEquipe = async () => {
    if (!novaEquipe.nome.trim()) {
      alert('Nome da equipe é obrigatório');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/equipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(novaEquipe)
      });
      
      if (res.ok) {
        setShowCreateModal(false);
        setNovaEquipe({ nome: '', descricao: '', cor: '#4a90d9', icone: '👥', lider_id: null, membros: [] });
        loadEquipes();
      } else {
        const err = await res.json();
        alert(err.erro || 'Erro ao criar equipe');
      }
    } catch (err) {
      console.error('Erro ao criar equipe:', err);
    }
  };

  const handleUpdateEquipe = async () => {
    if (!editEquipe.nome.trim()) {
      alert('Nome da equipe é obrigatório');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/equipes/${equipeSelecionada.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editEquipe)
      });
      
      if (res.ok) {
        setShowEditModal(false);
        loadEquipes();
        loadEquipeDetalhes(equipeSelecionada.id);
      } else {
        const err = await res.json();
        alert(err.erro || 'Erro ao atualizar equipe');
      }
    } catch (err) {
      console.error('Erro ao atualizar equipe:', err);
    }
  };

  const handleDeleteEquipe = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/equipes/${equipeSelecionada.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setShowDeleteConfirm(false);
        setEquipeSelecionada(null);
        loadEquipes();
      }
    } catch (err) {
      console.error('Erro ao deletar equipe:', err);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/equipes/${equipeSelecionada.id}/membros`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId })
      });
      
      if (res.ok) {
        loadEquipeDetalhes(equipeSelecionada.id);
        loadEquipes();
      }
    } catch (err) {
      console.error('Erro ao adicionar membro:', err);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/equipes/${equipeSelecionada.id}/membros/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        loadEquipeDetalhes(equipeSelecionada.id);
        loadEquipes();
      }
    } catch (err) {
      console.error('Erro ao remover membro:', err);
    }
  };

  const openEditModal = () => {
    setEditEquipe({
      nome: equipeSelecionada.nome,
      descricao: equipeSelecionada.descricao || '',
      cor: equipeSelecionada.cor || '#4a90d9',
      icone: equipeSelecionada.icone || '👥',
      lider_id: equipeSelecionada.lider_id,
      membros: equipeSelecionada.membros?.map(m => m.id) || []
    });
    setShowEditModal(true);
  };

  // Agentes que NÃO estão na equipe selecionada
  const agentesDisponiveis = agentes.filter(a => 
    !equipeSelecionada?.membros?.some(m => m.id === a.id)
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      padding: '20px',
      paddingTop: '200px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={() => navigate('/sentinela')}
            style={{
              background: 'transparent',
              border: '1px solid #444',
              color: '#999',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => { e.target.style.borderColor = '#666'; e.target.style.color = '#ccc'; }}
            onMouseLeave={(e) => { e.target.style.borderColor = '#444'; e.target.style.color = '#999'; }}
          >
            ← Voltar
          </button>
          <h1 style={{
            color: '#f39c12',
            fontSize: '2rem',
            fontWeight: '700',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '3px'
          }}>
            👥 Equipes
          </h1>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #f39c12, #e67e22)',
              border: 'none',
              color: '#fff',
              padding: '12px 25px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(243, 156, 18, 0.3)'
            }}
          >
            + Nova Equipe
          </button>
        )}
      </div>

      {/* Container principal */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: equipeSelecionada ? '350px 1fr' : '1fr',
        gap: '30px'
      }}>
        {/* Lista de Equipes */}
        <div style={{
          background: 'rgba(20, 20, 20, 0.9)',
          border: '2px solid #333',
          borderRadius: '15px',
          padding: '20px',
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto'
        }}>
          <h3 style={{ color: '#ccc', margin: '0 0 20px 0', fontSize: '1.1rem' }}>
            Equipes Registradas ({equipes.length})
          </h3>
          
          {loading ? (
            <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
              Carregando...
            </div>
          ) : equipes.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
              Nenhuma equipe cadastrada
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {equipes.map(equipe => (
                <div
                  key={equipe.id}
                  onClick={() => loadEquipeDetalhes(equipe.id)}
                  style={{
                    background: equipeSelecionada?.id === equipe.id ? 'rgba(243, 156, 18, 0.1)' : 'rgba(30, 30, 30, 0.8)',
                    border: `2px solid ${equipeSelecionada?.id === equipe.id ? equipe.cor : '#333'}`,
                    borderRadius: '10px',
                    padding: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                  }}
                  onMouseEnter={(e) => {
                    if (equipeSelecionada?.id !== equipe.id) {
                      e.currentTarget.style.borderColor = equipe.cor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (equipeSelecionada?.id !== equipe.id) {
                      e.currentTarget.style.borderColor = '#333';
                    }
                  }}
                >
                  {/* Ícone */}
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: equipe.cor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: `0 0 15px ${equipe.cor}40`
                  }}>
                    {equipe.icone}
                  </div>
                  
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: '600', fontSize: '1rem' }}>
                      {equipe.nome}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '5px' }}>
                      {equipe.total_membros || 0} membros
                      {equipe.lider_nome && ` • Líder: ${equipe.lider_nome}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detalhes da Equipe */}
        {equipeSelecionada && (
          <div style={{
            background: 'rgba(20, 20, 20, 0.9)',
            border: `2px solid ${equipeSelecionada.cor}`,
            borderRadius: '15px',
            padding: '30px',
            boxShadow: `0 0 30px ${equipeSelecionada.cor}20`
          }}>
            {/* Header da equipe */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '30px',
              paddingBottom: '20px',
              borderBottom: '1px solid #333'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: equipeSelecionada.cor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  boxShadow: `0 0 30px ${equipeSelecionada.cor}60`
                }}>
                  {equipeSelecionada.icone}
                </div>
                <div>
                  <h2 style={{ color: '#fff', margin: 0, fontSize: '1.8rem' }}>
                    {equipeSelecionada.nome}
                  </h2>
                  {equipeSelecionada.descricao && (
                    <p style={{ color: '#888', margin: '10px 0 0 0', fontSize: '0.95rem' }}>
                      {equipeSelecionada.descricao}
                    </p>
                  )}
                  {equipeSelecionada.lider_nome && (
                    <div style={{ color: equipeSelecionada.cor, marginTop: '8px', fontSize: '0.9rem' }}>
                      👑 Líder: {equipeSelecionada.lider_nome}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Ações - admin/líder ou líder da equipe */}
              {canEditEquipe && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={openEditModal}
                    style={{
                      background: 'transparent',
                      border: '1px solid #4a90d9',
                      color: '#4a90d9',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #e74c3c',
                      color: '#e74c3c',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              )}
            </div>

            {/* Membros da equipe */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: '#ccc', margin: 0, fontSize: '1.1rem' }}>
                  Membros ({equipeSelecionada.membros?.length || 0})
                </h3>
                {canEditEquipe && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    style={{
                      background: equipeSelecionada.cor,
                      border: 'none',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    + Adicionar Membro
                  </button>
                )}
              </div>

              {/* Lista de membros */}
              {equipeSelecionada.membros?.length === 0 ? (
                <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                  Nenhum membro na equipe
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '15px'
                }}>
                  {equipeSelecionada.membros?.map(membro => (
                    <div
                      key={membro.id}
                      style={{
                        background: 'rgba(30, 30, 30, 0.8)',
                        border: '1px solid #444',
                        borderRadius: '10px',
                        padding: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px'
                      }}
                    >
                      {/* Foto */}
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: '#333',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {membro.foto ? (
                          <img
                            src={`data:image/png;base64,${membro.foto}`}
                            alt={membro.display_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#666',
                            fontSize: '1.5rem'
                          }}>
                            👤
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          color: '#fff',
                          fontWeight: '600',
                          fontSize: '0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {membro.display_name || membro.username}
                          {equipeSelecionada.lider_id === membro.id && (
                            <span style={{ color: '#f39c12' }}>👑</span>
                          )}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '3px' }}>
                          {membro.classe || 'Sem classe'} • NEX {membro.nex || 0}%
                        </div>
                        <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '3px' }}>
                          {membro.grupo || 'Sem grupo'}
                        </div>
                      </div>
                      
                      {/* Remover - apenas admin/líder ou líder da equipe */}
                      {canEditEquipe && (
                        <button
                          onClick={() => handleRemoveMember(membro.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#e74c3c',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            padding: '5px'
                          }}
                          title="Remover da equipe"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Criar Equipe */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            userSelect: 'none'
          }}
          onClick={() => !draggingAgent && setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: `2px solid ${novaEquipe.cor}`,
              borderRadius: '15px',
              width: '95%',
              maxWidth: '1400px',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: `0 0 60px ${novaEquipe.cor}40`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 30px',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.3)'
            }}>
              <h2 style={{ margin: 0, color: novaEquipe.cor, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '2rem' }}>{novaEquipe.icone}</span>
                Nova Equipe
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ color: '#666', fontSize: '0.85rem' }}>
                  Arraste os agentes para adicionar à equipe →
                </span>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#666',
                    fontSize: '1.5rem',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Conteúdo - Três Seções */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 350px', 
              height: 'calc(90vh - 100px)',
              overflow: 'hidden'
            }}>
              {/* Seção Esquerda - Agentes Disponíveis */}
              <div 
                ref={removeZoneRef}
                style={{ 
                  padding: '20px', 
                  borderRight: '1px solid #333',
                  overflowY: 'auto',
                  background: isOverRemoveZone && draggingAgent && novaEquipe.membros.includes(draggingAgent.id) 
                    ? 'rgba(231, 76, 60, 0.1)' 
                    : 'rgba(0,0,0,0.2)',
                  transition: 'background 0.3s'
                }}
              >
                <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: '#ccc', margin: 0, fontSize: '1rem' }}>
                    📋 Agentes Disponíveis ({agentes.filter(a => !novaEquipe.membros.includes(a.id)).length})
                  </h3>
                </div>
                
                {/* Grid de Cards de Agentes Disponíveis */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '12px'
                }}>
                  {agentes.filter(a => !novaEquipe.membros.includes(a.id)).map(agente => (
                    <div
                      key={agente.id}
                      onMouseDown={(e) => handleDragStart(e, agente)}
                      style={{
                        background: 'rgba(30, 30, 30, 0.9)',
                        border: '2px solid #333',
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'grab',
                        transition: 'all 0.2s',
                        opacity: draggingAgent?.id === agente.id ? 0.3 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!draggingAgent) {
                          e.currentTarget.style.borderColor = novaEquipe.cor;
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#333';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {/* Foto e Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#333',
                          overflow: 'hidden',
                          border: '2px solid #444',
                          flexShrink: 0
                        }}>
                          {agente.foto ? (
                            <img
                              src={`data:image/png;base64,${agente.foto}`}
                              alt={agente.display_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              draggable={false}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#666',
                              fontSize: '1.2rem'
                            }}>
                              👤
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {agente.display_name || agente.username}
                          </div>
                          <div style={{ color: '#888', fontSize: '0.7rem' }}>
                            {agente.grupo || 'Sem divisão'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Especialização */}
                      <div style={{
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '5px',
                        padding: '6px 8px',
                        fontSize: '0.75rem',
                        color: '#999'
                      }}>
                        {agente.especializacao || 'Sem especialização'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção Central - Membros da Equipe (Drop Zone) */}
              <div 
                ref={dropZoneRef}
                style={{ 
                  padding: '20px', 
                  borderRight: '1px solid #333',
                  overflowY: 'auto',
                  background: isOverDropZone && draggingAgent && !novaEquipe.membros.includes(draggingAgent.id)
                    ? `${novaEquipe.cor}15`
                    : 'rgba(0,0,0,0.3)',
                  transition: 'background 0.3s',
                  position: 'relative'
                }}
              >
                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ color: novaEquipe.cor, margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {novaEquipe.icone} Membros da Equipe ({novaEquipe.membros.length})
                  </h3>
                </div>

                {novaEquipe.membros.length === 0 ? (
                  <div style={{
                    border: `2px dashed ${isOverDropZone ? novaEquipe.cor : '#444'}`,
                    borderRadius: '15px',
                    padding: '60px 30px',
                    textAlign: 'center',
                    color: '#666',
                    transition: 'all 0.3s',
                    background: isOverDropZone ? `${novaEquipe.cor}10` : 'transparent'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }}>
                      {isOverDropZone ? '✨' : '👥'}
                    </div>
                    <div style={{ fontSize: '1rem' }}>
                      {isOverDropZone ? 'Solte para adicionar!' : 'Arraste agentes aqui'}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '12px'
                  }}>
                    {agentes.filter(a => novaEquipe.membros.includes(a.id)).map(agente => {
                      const isLider = novaEquipe.lider_id === agente.id;
                      return (
                        <div
                          key={agente.id}
                          onMouseDown={(e) => handleDragStart(e, agente)}
                          style={{
                            background: `linear-gradient(135deg, ${novaEquipe.cor}20 0%, rgba(30,30,30,0.9) 100%)`,
                            border: `2px solid ${novaEquipe.cor}`,
                            borderRadius: '10px',
                            padding: '12px',
                            cursor: 'grab',
                            position: 'relative',
                            opacity: draggingAgent?.id === agente.id ? 0.3 : 1,
                            transition: 'opacity 0.2s'
                          }}
                        >
                          {/* Badge de Líder */}
                          {isLider && (
                            <div style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: '#f39c12',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem'
                            }}>
                              👑
                            </div>
                          )}
                          
                          {/* Foto e Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: '#333',
                              overflow: 'hidden',
                              border: `2px solid ${novaEquipe.cor}`,
                              flexShrink: 0
                            }}>
                              {agente.foto ? (
                                <img
                                  src={`data:image/png;base64,${agente.foto}`}
                                  alt={agente.display_name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  draggable={false}
                                />
                              ) : (
                                <div style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#666',
                                  fontSize: '1.2rem'
                                }}>
                                  👤
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                color: '#fff',
                                fontWeight: '600',
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {agente.display_name || agente.username}
                              </div>
                              <div style={{ color: novaEquipe.cor, fontSize: '0.7rem' }}>
                                {agente.grupo || 'Sem divisão'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Especialização */}
                          <div style={{
                            background: 'rgba(0,0,0,0.4)',
                            borderRadius: '5px',
                            padding: '6px 8px',
                            fontSize: '0.75rem',
                            color: '#ccc',
                            marginBottom: '8px'
                          }}>
                            {agente.especializacao || 'Sem especialização'}
                          </div>
                          
                          {/* Botão Líder */}
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => setNovaEquipe({ 
                              ...novaEquipe, 
                              lider_id: isLider ? null : agente.id 
                            })}
                            style={{
                              width: '100%',
                              padding: '5px',
                              background: isLider ? '#f39c12' : 'transparent',
                              border: `1px solid ${isLider ? '#f39c12' : '#555'}`,
                              borderRadius: '5px',
                              color: isLider ? '#000' : '#888',
                              fontSize: '0.7rem',
                              cursor: 'pointer'
                            }}
                          >
                            {isLider ? '👑 Líder' : 'Definir Líder'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seção Direita - Configurações da Equipe */}
              <div style={{ 
                padding: '20px', 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(0,0,0,0.2)'
              }}>
                <h3 style={{ color: '#ccc', margin: '0 0 15px 0', fontSize: '1rem' }}>
                  ⚙️ Configurações
                </h3>
                
                {/* Preview do Card da Equipe */}
                <div style={{
                  background: `linear-gradient(135deg, ${novaEquipe.cor}20 0%, rgba(0,0,0,0.5) 100%)`,
                  border: `2px solid ${novaEquipe.cor}`,
                  borderRadius: '12px',
                  padding: '15px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    margin: '0 auto 10px',
                    borderRadius: '50%',
                    background: novaEquipe.cor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: `0 0 20px ${novaEquipe.cor}60`
                  }}>
                    {novaEquipe.icone}
                  </div>
                  <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600', marginBottom: '3px' }}>
                    {novaEquipe.nome || 'Nome da Equipe'}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.8rem' }}>
                    {novaEquipe.membros.length} membros
                  </div>
                </div>

                {/* Nome */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ color: '#999', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={novaEquipe.nome}
                    onChange={(e) => setNovaEquipe({ ...novaEquipe, nome: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Ex: Esquadrão Alpha"
                  />
                </div>

                {/* Descrição */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ color: '#999', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                    Descrição
                  </label>
                  <textarea
                    value={novaEquipe.descricao}
                    onChange={(e) => setNovaEquipe({ ...novaEquipe, descricao: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '50px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Descrição..."
                  />
                </div>

                {/* Ícone */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ color: '#999', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                    Ícone
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {ICONES_DISPONIVEIS.map(icone => (
                      <button
                        key={icone}
                        onClick={() => setNovaEquipe({ ...novaEquipe, icone })}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: novaEquipe.icone === icone ? novaEquipe.cor : '#1a1a1a',
                          border: novaEquipe.icone === icone ? `2px solid ${novaEquipe.cor}` : '1px solid #333',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          cursor: 'pointer'
                        }}
                      >
                        {icone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cor */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ color: '#999', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>
                    Cor
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {CORES_DISPONIVEIS.map(cor => (
                      <button
                        key={cor}
                        onClick={() => setNovaEquipe({ ...novaEquipe, cor })}
                        style={{
                          width: '26px',
                          height: '26px',
                          background: cor,
                          border: novaEquipe.cor === cor ? '2px solid #fff' : '2px solid transparent',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          boxShadow: novaEquipe.cor === cor ? `0 0 10px ${cor}` : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Espaçador */}
                <div style={{ flex: 1 }} />

                {/* Botões */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: '1px solid #666',
                      color: '#999',
                      padding: '12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateEquipe}
                    style={{
                      flex: 1,
                      background: `linear-gradient(135deg, ${novaEquipe.cor}, ${novaEquipe.cor}cc)`,
                      border: 'none',
                      color: '#fff',
                      padding: '12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      boxShadow: `0 4px 15px ${novaEquipe.cor}40`
                    }}
                  >
                    Criar Equipe
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card sendo arrastado (Ghost) */}
          {draggingAgent && (
            <div
              style={{
                position: 'fixed',
                left: dragPosition.x - dragOffset.x,
                top: dragPosition.y - dragOffset.y,
                width: '180px',
                background: novaEquipe.membros.includes(draggingAgent.id) 
                  ? `linear-gradient(135deg, ${novaEquipe.cor}30 0%, rgba(30,30,30,0.95) 100%)`
                  : 'rgba(30, 30, 30, 0.95)',
                border: `2px solid ${novaEquipe.cor}`,
                borderRadius: '10px',
                padding: '12px',
                pointerEvents: 'none',
                zIndex: 10000,
                boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 20px ${novaEquipe.cor}50`,
                transform: `rotate(${cardRotation}deg) scale(1.05)`,
                transition: 'transform 0.05s ease-out',
                transformOrigin: 'center center'
              }}
            >
              {/* Foto e Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#333',
                  overflow: 'hidden',
                  border: `2px solid ${novaEquipe.cor}`,
                  flexShrink: 0
                }}>
                  {draggingAgent.foto ? (
                    <img
                      src={`data:image/png;base64,${draggingAgent.foto}`}
                      alt={draggingAgent.display_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      draggable={false}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      fontSize: '1.2rem'
                    }}>
                      👤
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {draggingAgent.display_name || draggingAgent.username}
                  </div>
                  <div style={{ color: novaEquipe.cor, fontSize: '0.7rem' }}>
                    {draggingAgent.grupo || 'Sem divisão'}
                  </div>
                </div>
              </div>
              
              {/* Especialização */}
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                borderRadius: '5px',
                padding: '6px 8px',
                fontSize: '0.75rem',
                color: '#ccc'
              }}>
                {draggingAgent.especializacao || 'Sem especialização'}
              </div>

              {/* Indicador de ação */}
              <div style={{
                marginTop: '8px',
                textAlign: 'center',
                fontSize: '0.7rem',
                color: isOverDropZone && !novaEquipe.membros.includes(draggingAgent.id) 
                  ? '#27ae60' 
                  : isOverRemoveZone && novaEquipe.membros.includes(draggingAgent.id)
                    ? '#e74c3c'
                    : '#666'
              }}>
                {isOverDropZone && !novaEquipe.membros.includes(draggingAgent.id) 
                  ? '✓ Solte para adicionar'
                  : isOverRemoveZone && novaEquipe.membros.includes(draggingAgent.id)
                    ? '✕ Solte para remover'
                    : '↔ Arraste...'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Editar Equipe */}
      {showEditModal && (
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
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: `2px solid ${editEquipe.cor}`,
              borderRadius: '15px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: `0 0 40px ${editEquipe.cor}40`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '25px 30px',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, color: editEquipe.cor, fontSize: '1.5rem' }}>
                Editar Equipe
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#666',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Conteúdo igual ao criar, mas com editEquipe */}
            <div style={{ padding: '30px' }}>
              {/* Nome */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#999', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                  Nome da Equipe *
                </label>
                <input
                  type="text"
                  value={editEquipe.nome}
                  onChange={(e) => setEditEquipe({ ...editEquipe, nome: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Descrição */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#999', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                  Descrição
                </label>
                <textarea
                  value={editEquipe.descricao}
                  onChange={(e) => setEditEquipe({ ...editEquipe, descricao: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                />
              </div>

              {/* Ícone */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#999', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                  Ícone
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ICONES_DISPONIVEIS.map(icone => (
                    <button
                      key={icone}
                      onClick={() => setEditEquipe({ ...editEquipe, icone })}
                      style={{
                        width: '45px',
                        height: '45px',
                        background: editEquipe.icone === icone ? editEquipe.cor : '#1a1a1a',
                        border: editEquipe.icone === icone ? `2px solid ${editEquipe.cor}` : '1px solid #333',
                        borderRadius: '8px',
                        fontSize: '1.3rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {icone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cor */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#999', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                  Cor da Equipe
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CORES_DISPONIVEIS.map(cor => (
                    <button
                      key={cor}
                      onClick={() => setEditEquipe({ ...editEquipe, cor })}
                      style={{
                        width: '35px',
                        height: '35px',
                        background: cor,
                        border: editEquipe.cor === cor ? '3px solid #fff' : '2px solid transparent',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: editEquipe.cor === cor ? `0 0 15px ${cor}` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Líder */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#999', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                  Líder da Equipe
                </label>
                <select
                  value={editEquipe.lider_id || ''}
                  onChange={(e) => setEditEquipe({ ...editEquipe, lider_id: e.target.value ? parseInt(e.target.value) : null })}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Sem líder definido</option>
                  {agentes.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.display_name || a.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botões */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #666',
                    color: '#999',
                    padding: '12px 25px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateEquipe}
                  style={{
                    background: `linear-gradient(135deg, ${editEquipe.cor}, ${editEquipe.cor}cc)`,
                    border: 'none',
                    color: '#fff',
                    padding: '12px 25px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Membro */}
      {showAddMemberModal && (
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
          onClick={() => setShowAddMemberModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: `2px solid ${equipeSelecionada?.cor || '#4a90d9'}`,
              borderRadius: '15px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflow: 'hidden',
              boxShadow: `0 0 40px ${equipeSelecionada?.cor || '#4a90d9'}40`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '25px 30px',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, color: equipeSelecionada?.cor || '#4a90d9', fontSize: '1.3rem' }}>
                Adicionar Membro
              </h2>
              <button
                onClick={() => setShowAddMemberModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#666',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Lista de agentes disponíveis */}
            <div style={{ padding: '20px', maxHeight: 'calc(80vh - 100px)', overflowY: 'auto' }}>
              {agentesDisponiveis.length === 0 ? (
                <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
                  Todos os agentes já estão na equipe
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {agentesDisponiveis.map(agente => (
                    <div
                      key={agente.id}
                      onClick={() => {
                        handleAddMember(agente.id);
                        setShowAddMemberModal(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        padding: '15px',
                        background: 'rgba(30, 30, 30, 0.8)',
                        border: '1px solid #333',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = equipeSelecionada?.cor || '#4a90d9';
                        e.currentTarget.style.background = 'rgba(40, 40, 40, 0.9)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#333';
                        e.currentTarget.style.background = 'rgba(30, 30, 30, 0.8)';
                      }}
                    >
                      {/* Foto */}
                      <div style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        background: '#333',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {agente.foto ? (
                          <img
                            src={`data:image/png;base64,${agente.foto}`}
                            alt={agente.display_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#666',
                            fontSize: '1.3rem'
                          }}>
                            👤
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: '600' }}>
                          {agente.display_name || agente.username}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '3px' }}>
                          {agente.grupo || 'Sem grupo'} • {agente.classe || 'Sem classe'}
                        </div>
                      </div>
                      
                      <div style={{ color: equipeSelecionada?.cor || '#4a90d9' }}>+</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {showDeleteConfirm && (
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
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: '2px solid #e74c3c',
              borderRadius: '15px',
              padding: '30px',
              maxWidth: '400px',
              textAlign: 'center',
              boxShadow: '0 0 40px rgba(231, 76, 60, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
            <h3 style={{ color: '#e74c3c', margin: '0 0 15px 0' }}>
              Excluir Equipe
            </h3>
            <p style={{ color: '#999', marginBottom: '25px' }}>
              Tem certeza que deseja excluir a equipe <strong style={{ color: '#fff' }}>{equipeSelecionada?.nome}</strong>?
              <br />Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #666',
                  color: '#999',
                  padding: '12px 25px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteEquipe}
                style={{
                  background: '#e74c3c',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 25px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
