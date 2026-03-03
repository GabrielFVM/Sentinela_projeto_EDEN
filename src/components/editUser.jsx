import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';

// Estilos
const selectStyle = {
  width: '100%',
  padding: '12px 15px',
  background: 'linear-gradient(135deg, rgba(20, 0, 0, 0.9) 0%, rgba(40, 0, 0, 0.8) 100%)',
  border: '2px solid #cc0000',
  borderRadius: '8px',
  color: '#ff6666',
  fontSize: '1rem',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cc0000' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: '40px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  transition: 'all 0.3s ease',
  outline: 'none',
  boxShadow: '0 0 10px rgba(204, 0, 0, 0.1)'
};

const inputStyle = {
  width: '100%',
  padding: '12px 15px',
  background: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(204, 0, 0, 0.3)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '1rem'
};

const labelStyle = {
  color: '#cc0000',
  fontSize: '0.85rem',
  display: 'block',
  marginBottom: '5px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

export default function EditUser({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal de Divisões
  const [showDivisoesModal, setShowDivisoesModal] = useState(false);
  const [draggingUser, setDraggingUser] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [cardRotation, setCardRotation] = useState(0);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [hoveredDivisao, setHoveredDivisao] = useState(null);
  const [expandedDivisao, setExpandedDivisao] = useState(null);
  const divisaoRefs = useRef({});
  
  // Form data para edição
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    password: '',
    cargo: '',
    ativo: 1
  });

  // Carregar usuários quando abrir
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // Atualizar form quando selecionar usuário
  useEffect(() => {
    if (selectedUser) {
      setFormData({
        username: selectedUser.username || '',
        display_name: selectedUser.display_name || '',
        password: '',
        cargo: selectedUser.cargo || '',
        ativo: selectedUser.ativo ?? 1
      });
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Mostra todos os usuários incluindo X
        setUsers(data);
      }
    } catch (err) {
      setError('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('authToken');
      const updateData = { ...formData };
      
      // Não enviar senha se estiver vazia
      if (!updateData.password) {
        delete updateData.password;
      }
      
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        setSuccess('Usuário atualizado com sucesso!');
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.erro || 'Erro ao atualizar usuário');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    if (!confirm(`Tem certeza que deseja excluir o usuário "${selectedUser.display_name || selectedUser.username}"?`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setSuccess('Usuário excluído!');
        setSelectedUser(null);
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.erro || 'Erro ao excluir usuário');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: 'Novo Usuário',
          display_name: 'Novo Usuário',
          password: '123456',
          cargo: 'administrador',
          ativo: 1,
          grupo: 'Observador'
        })
      });
      
      if (response.ok) {
        setSuccess('Usuário criado! Senha padrão: 123456');
        loadUsers();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.erro || 'Erro ao criar usuário');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Banir usuário
  const handleBanirUsuario = async (userId, motivo) => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/usuarios/${userId}/banir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ motivo })
      });
      
      if (response.ok) {
        setSuccess('Usuário banido com sucesso!');
        setSelectedUser(null);
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.erro || 'Erro ao banir usuário');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar usuários pela busca
  const filteredUsers = users.filter(u => 
    (u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Lista de divisões disponíveis
  const DIVISOES = [
    { id: 'Vanguarda', nome: 'Vanguarda', cor: '#e74c3c', icone: '⚔️', desc: 'Linha de frente em operações' },
    { id: 'Irmandade', nome: 'Irmandade', cor: '#9b59b6', icone: '🤝', desc: 'Apoio e cooperação mútua' },
    { id: 'Serafim', nome: 'Serafim', cor: '#f39c12', icone: '👑', desc: 'Administração suprema' }
  ];

  // IDs das divisões válidas
  const divisoesValidas = DIVISOES.map(d => d.id);

  // Usuários sem divisão (inclui quem tem divisão que não existe mais na lista)
  const usuariosSemDivisao = users.filter(u => 
    !u.grupo || u.grupo === '' || u.grupo === 'null' || !divisoesValidas.includes(u.grupo)
  );

  // Usuários por divisão
  const usuariosPorDivisao = (divisaoId) => users.filter(u => u.grupo === divisaoId);

  // Handler para iniciar drag de usuário
  const handleUserDragStart = (e, user) => {
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
    setDraggingUser(user);
    setCardRotation(0);
  };

  // Handler para atualizar divisão do usuário
  const handleUpdateDivisao = async (userId, novaDivisao) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/agentes/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ grupo: novaDivisao })
      });
      
      if (response.ok) {
        loadUsers();
        setSuccess(`Divisão atualizada!`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Erro ao atualizar divisão');
    }
  };

  // Effect para drag and drop de divisões
  useEffect(() => {
    if (!draggingUser) return;

    const handleMouseMove = (e) => {
      const velocityX = e.clientX - lastMousePos.x;
      const targetRotation = Math.max(-20, Math.min(20, velocityX * 0.6));
      setCardRotation(prev => prev + (targetRotation - prev) * 0.3);
      setDragPosition({ x: e.clientX, y: e.clientY });
      setLastMousePos({ x: e.clientX, y: e.clientY });

      // Verificar qual divisão está em hover
      let foundDivisao = null;
      Object.entries(divisaoRefs.current).forEach(([divisaoId, ref]) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right &&
              e.clientY >= rect.top && e.clientY <= rect.bottom) {
            foundDivisao = divisaoId;
          }
        }
      });
      setHoveredDivisao(foundDivisao);
    };

    const handleMouseUp = () => {
      if (draggingUser && hoveredDivisao) {
        // Atualizar divisão do usuário
        handleUpdateDivisao(draggingUser.id, hoveredDivisao);
      }
      setDraggingUser(null);
      setHoveredDivisao(null);
      setCardRotation(0);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingUser, lastMousePos, hoveredDivisao]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          zIndex: 10000,
          backdropFilter: 'blur(5px)'
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '85vh',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%)',
          border: '2px solid #cc0000',
          borderRadius: '15px',
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 0 50px rgba(204, 0, 0, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(204, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(204, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '1.8rem' }}>👥</span>
            <div>
              <h2 style={{ 
                margin: 0, 
                color: '#ff6666',
                fontSize: '1.4rem',
                textShadow: '0 0 10px rgba(204, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                GERENCIAMENTO DE USUÁRIOS
                <button
                  onClick={() => setShowDivisoesModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.3) 0%, rgba(52, 152, 219, 0.1) 100%)',
                    border: '1px solid #3498db',
                    color: '#3498db',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(52, 152, 219, 0.4)';
                    e.target.style.boxShadow = '0 0 15px rgba(52, 152, 219, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(52, 152, 219, 0.3) 0%, rgba(52, 152, 219, 0.1) 100%)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  🏢 Divisões
                </button>
              </h2>
              <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>
                Acesso restrito ao grupo Serafim
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ff6666',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '5px 10px',
              borderRadius: '5px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(204, 0, 0, 0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            padding: '10px 20px',
            background: 'rgba(255, 0, 0, 0.2)',
            color: '#ff6666',
            borderBottom: '1px solid rgba(255, 0, 0, 0.3)'
          }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{
            padding: '10px 20px',
            background: 'rgba(0, 255, 0, 0.2)',
            color: '#66ff66',
            borderBottom: '1px solid rgba(0, 255, 0, 0.3)'
          }}>
            ✓ {success}
          </div>
        )}

        {/* Content */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Lista de usuários */}
          <div style={{
            width: '300px',
            borderRight: '1px solid rgba(204, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Search */}
            <div style={{ padding: '15px' }}>
              <input
                type="text"
                placeholder="🔍 Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 15px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(204, 0, 0, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* User List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 15px 15px'
            }}>
              {isLoading && !users.length ? (
                <p style={{ color: '#888', textAlign: 'center' }}>Carregando...</p>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    style={{
                      padding: '12px 15px',
                      marginBottom: '8px',
                      background: selectedUser?.id === user.id 
                        ? 'rgba(204, 0, 0, 0.3)' 
                        : 'rgba(0, 0, 0, 0.2)',
                      border: selectedUser?.id === user.id 
                        ? '1px solid #cc0000' 
                        : '1px solid rgba(204, 0, 0, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedUser?.id !== user.id) {
                        e.currentTarget.style.background = 'rgba(204, 0, 0, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedUser?.id !== user.id) {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                      }
                    }}
                  >
                    <div style={{ 
                      color: '#fff', 
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: user.ativo ? '#66ff66' : '#ff6666'
                      }} />
                      {user.display_name || user.username}
                    </div>
                    <div style={{ 
                      color: '#888', 
                      fontSize: '0.75rem',
                      marginTop: '4px'
                    }}>
                      @{user.username} • {user.grupo || 'Observador'}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add User Button */}
            <div style={{ padding: '15px', borderTop: '1px solid rgba(204, 0, 0, 0.2)' }}>
              <button
                onClick={handleCreateUser}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(0, 150, 0, 0.3)',
                  border: '1px solid #66ff66',
                  borderRadius: '8px',
                  color: '#66ff66',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(0, 150, 0, 0.5)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(0, 150, 0, 0.3)'}
              >
                + Novo Usuário
              </button>
            </div>
          </div>

          {/* Editor de usuário */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto'
          }}>
            {selectedUser ? (
              <>
                <h3 style={{ 
                  color: '#ff6666', 
                  marginTop: 0,
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>{selectedUser.id === 2 ? '🔒' : '✏️'}</span>
                  {selectedUser.id === 2 ? 'Visualizando' : 'Editando'}: {selectedUser.display_name || selectedUser.username}
                </h3>

                {/* Aviso para X */}
                {selectedUser.id === 2 && (
                  <div style={{
                    background: 'rgba(255, 200, 0, 0.1)',
                    border: '1px solid #ffcc00',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '20px',
                    color: '#ffcc00',
                    fontSize: '0.9rem'
                  }}>
                    ⚠️ Este usuário é protegido e não pode ser editado.
                  </div>
                )}

                {/* Form */}
                <div style={{ display: 'grid', gap: '15px' }}>
                  {/* Username */}
                  <div>
                    <label style={labelStyle}>
                      Nome de Login
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={selectedUser.id === 2}
                      style={{
                        ...inputStyle,
                        ...(selectedUser.id === 2 && { opacity: 0.5, cursor: 'not-allowed' })
                      }}
                    />
                  </div>

                  {/* Display Name */}
                  <div>
                    <label style={labelStyle}>
                      Nome de Exibição
                    </label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      disabled={selectedUser.id === 2}
                      style={{
                        ...inputStyle,
                        ...(selectedUser.id === 2 && { opacity: 0.5, cursor: 'not-allowed' })
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={labelStyle}>
                      Nova Senha (deixe vazio para manter)
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      disabled={selectedUser.id === 2}
                      style={{
                        ...inputStyle,
                        ...(selectedUser.id === 2 && { opacity: 0.5, cursor: 'not-allowed' })
                      }}
                    />
                  </div>

                  {/* Cargo */}
                  <div>
                    <label style={labelStyle}>
                      Cargo
                    </label>
                    <select
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      disabled={selectedUser.id === 2}
                      style={{
                        ...selectStyle,
                        ...(selectedUser.id === 2 && { opacity: 0.5, cursor: 'not-allowed' })
                      }}
                    >
                      <option value="administrador">Administrador</option>
                      <option value="membro">Membro</option>
                      <option value="lider">Líder</option>
                    </select>
                  </div>

                  {/* Ativo */}
                  <div>
                    <label style={labelStyle}>
                      Status
                    </label>
                    <select
                      value={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: parseInt(e.target.value) })}
                      disabled={selectedUser.id === 2}
                      style={{
                        ...selectStyle,
                        ...(selectedUser.id === 2 && { opacity: 0.5, cursor: 'not-allowed' })
                      }}
                    >
                      <option value={1}>Ativo</option>
                      <option value={0}>Inativo</option>
                    </select>
                  </div>

                  {/* Grupo (read-only) */}
                  <div>
                    <label style={{ ...labelStyle, color: '#666' }}>
                      Grupo (não editável)
                    </label>
                    <input
                      type="text"
                      value={selectedUser.grupo || 'Observador'}
                      disabled
                      style={{
                        ...inputStyle,
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(100, 100, 100, 0.3)',
                        color: '#666',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                </div>

                {/* Actions - esconder para X */}
                {selectedUser.id !== 2 && (
                  <div style={{
                    display: 'flex',
                    gap: '15px',
                    marginTop: '30px'
                  }}>
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      style={{
                        flex: 1,
                        padding: '15px',
                        background: 'rgba(204, 0, 0, 0.3)',
                        border: '2px solid #cc0000',
                        borderRadius: '8px',
                        color: '#ff6666',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(204, 0, 0, 0.5)';
                        e.target.style.boxShadow = '0 0 20px rgba(204, 0, 0, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(204, 0, 0, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      {isLoading ? 'Salvando...' : '💾 Salvar Alterações'}
                    </button>
                    
                    <button
                      onClick={handleDelete}
                      disabled={isLoading}
                      style={{
                        padding: '15px 25px',
                        background: 'rgba(150, 0, 0, 0.3)',
                        border: '2px solid #990000',
                        borderRadius: '8px',
                        color: '#ff4444',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(150, 0, 0, 0.5)';
                      }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(150, 0, 0, 0.3)';
                    }}
                  >
                    🗑️ Excluir
                  </button>
                  </div>
                )}

                {/* Botão Banir - Separado abaixo */}
                {selectedUser.id !== 2 && !selectedUser.banido && (
                  <div style={{ marginTop: '20px' }}>
                    <button
                      onClick={() => {
                        const motivo = prompt('Digite o motivo do banimento:');
                        if (motivo !== null && motivo.trim()) {
                          if (window.confirm(`Tem certeza que deseja banir ${selectedUser.display_name || selectedUser.username}?\n\nMotivo: ${motivo}`)) {
                            handleBanirUsuario(selectedUser.id, motivo);
                          }
                        }
                      }}
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '15px 20px',
                        background: 'linear-gradient(135deg, rgba(192, 57, 43, 0.3) 0%, rgba(139, 26, 26, 0.3) 100%)',
                        border: '2px solid #c0392b',
                        borderRadius: '10px',
                        color: '#ff6666',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(192, 57, 43, 0.5) 0%, rgba(139, 26, 26, 0.5) 100%)';
                        e.currentTarget.style.boxShadow = '0 5px 20px rgba(192, 57, 43, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(192, 57, 43, 0.3) 0%, rgba(139, 26, 26, 0.3) 100%)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      ⛔ BANIR USUÁRIO
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
              }}>
                <span style={{ fontSize: '4rem', marginBottom: '20px' }}>👤</span>
                <p style={{ fontSize: '1.1rem' }}>Selecione um usuário para editar</p>
                <p style={{ fontSize: '0.85rem', color: '#555' }}>
                  Ou clique em "Novo Usuário" para criar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Divisões */}
      {showDivisoesModal && (
        <>
          {/* Overlay do Modal de Divisões */}
          <div
            onClick={() => {
              if (!draggingUser) {
                setShowDivisoesModal(false);
                setExpandedDivisao(null);
              }
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.95)',
              zIndex: 10002,
              backdropFilter: 'blur(8px)'
            }}
          />

          {/* Modal de Divisões */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '900px',
              maxHeight: '85vh',
              background: 'linear-gradient(135deg, #0a0a15 0%, #1a1a2e 50%, #0d0d1a 100%)',
              border: '2px solid #3498db',
              borderRadius: '15px',
              zIndex: 10003,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 0 60px rgba(52, 152, 219, 0.3)',
              userSelect: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid rgba(52, 152, 219, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(52, 152, 219, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '1.8rem' }}>🏢</span>
                <div>
                  <h2 style={{ 
                    margin: 0, 
                    color: '#3498db',
                    fontSize: '1.4rem',
                    textShadow: '0 0 10px rgba(52, 152, 219, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                  }}>
                    GERENCIAMENTO DE DIVISÕES
                    <button
                      onClick={() => setShowDivisoesModal(false)}
                      style={{
                        background: 'linear-gradient(135deg, rgba(204, 0, 0, 0.3) 0%, rgba(204, 0, 0, 0.1) 100%)',
                        border: '1px solid #cc0000',
                        color: '#ff6666',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(204, 0, 0, 0.4)';
                        e.target.style.boxShadow = '0 0 15px rgba(204, 0, 0, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'linear-gradient(135deg, rgba(204, 0, 0, 0.3) 0%, rgba(204, 0, 0, 0.1) 100%)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      👥 Usuários
                    </button>
                  </h2>
                  <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>
                    Arraste os agentes para as divisões
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDivisoesModal(false);
                  setExpandedDivisao(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3498db',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '5px 10px',
                  borderRadius: '5px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Conteúdo */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: expandedDivisao ? '250px 1fr 280px' : '280px 1fr', 
              height: 'calc(85vh - 80px)',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}>
              {/* Coluna Esquerda - Agentes Sem Divisão */}
              <div style={{ 
                padding: '20px', 
                borderRight: '1px solid rgba(52, 152, 219, 0.2)',
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.3)'
              }}>
                <h3 style={{ 
                  color: '#999', 
                  margin: '0 0 15px 0', 
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  👤 Sem Divisão ({usuariosSemDivisao.length})
                </h3>
                
                {usuariosSemDivisao.length === 0 ? (
                  <div style={{ 
                    color: '#555', 
                    textAlign: 'center', 
                    padding: '40px 20px',
                    border: '1px dashed #333',
                    borderRadius: '10px'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✓</div>
                    Todos os agentes estão alocados
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {usuariosSemDivisao.map(user => (
                      <div
                        key={user.id}
                        onMouseDown={(e) => handleUserDragStart(e, user)}
                        style={{
                          background: 'rgba(40, 40, 50, 0.9)',
                          border: '2px solid #444',
                          borderRadius: '10px',
                          padding: '12px',
                          cursor: 'grab',
                          transition: 'all 0.2s',
                          opacity: draggingUser?.id === user.id ? 0.3 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!draggingUser) {
                            e.currentTarget.style.borderColor = '#3498db';
                            e.currentTarget.style.transform = 'scale(1.02)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#444';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#333',
                            overflow: 'hidden',
                            border: '2px solid #555',
                            flexShrink: 0
                          }}>
                            {user.foto ? (
                              <img
                                src={`data:image/png;base64,${user.foto}`}
                                alt={user.display_name}
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
                              fontSize: '0.9rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {user.display_name || user.username}
                            </div>
                            <div style={{ color: '#666', fontSize: '0.75rem' }}>
                              {user.cargo || 'Sem cargo'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Coluna Central - Grid de Divisões */}
              <div style={{ 
                padding: '20px', 
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.2)'
              }}>
                <h3 style={{ 
                  color: '#ccc', 
                  margin: '0 0 20px 0', 
                  fontSize: '1rem',
                  textAlign: 'center'
                }}>
                  Arraste os agentes para as divisões abaixo
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '15px'
                }}>
                  {DIVISOES.map(divisao => {
                    const membros = usuariosPorDivisao(divisao.id);
                    const isHovered = hoveredDivisao === divisao.id;
                    const isExpanded = expandedDivisao === divisao.id;
                    
                    return (
                      <div
                        key={divisao.id}
                        ref={el => divisaoRefs.current[divisao.id] = el}
                        onClick={() => setExpandedDivisao(isExpanded ? null : divisao.id)}
                        style={{
                          background: isHovered 
                            ? `linear-gradient(135deg, ${divisao.cor}40 0%, ${divisao.cor}20 100%)`
                            : isExpanded
                              ? `linear-gradient(135deg, ${divisao.cor}30 0%, ${divisao.cor}15 100%)`
                              : 'rgba(30, 30, 40, 0.9)',
                          border: `2px solid ${isHovered || isExpanded ? divisao.cor : '#333'}`,
                          borderRadius: '12px',
                          padding: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'center',
                          boxShadow: isHovered ? `0 0 30px ${divisao.cor}50` : 'none',
                          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                        }}
                      >
                        <div style={{
                          width: '60px',
                          height: '60px',
                          margin: '0 auto 12px',
                          borderRadius: '50%',
                          background: divisao.cor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.8rem',
                          boxShadow: `0 0 20px ${divisao.cor}60`
                        }}>
                          {divisao.icone}
                        </div>
                        <div style={{ 
                          color: divisao.cor, 
                          fontWeight: '700', 
                          fontSize: '1rem',
                          marginBottom: '5px'
                        }}>
                          {divisao.nome}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '8px' }}>
                          {divisao.desc}
                        </div>
                        <div style={{
                          background: `${divisao.cor}30`,
                          color: divisao.cor,
                          padding: '4px 12px',
                          borderRadius: '15px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          display: 'inline-block'
                        }}>
                          {membros.length} {membros.length === 1 ? 'membro' : 'membros'}
                        </div>
                        
                        {isHovered && draggingUser && (
                          <div style={{
                            marginTop: '10px',
                            color: '#27ae60',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            ✓ Solte para adicionar
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coluna Direita - Membros da Divisão Expandida */}
              {expandedDivisao && (
                <div style={{ 
                  padding: '20px', 
                  borderLeft: '1px solid rgba(52, 152, 219, 0.2)',
                  overflowY: 'auto',
                  background: 'rgba(0,0,0,0.3)'
                }}>
                  {(() => {
                    const divisao = DIVISOES.find(d => d.id === expandedDivisao);
                    const membros = usuariosPorDivisao(expandedDivisao);
                    
                    return (
                      <>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          marginBottom: '20px'
                        }}>
                          <h3 style={{ 
                            color: divisao.cor, 
                            margin: 0, 
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            <span style={{ fontSize: '1.3rem' }}>{divisao.icone}</span>
                            {divisao.nome}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedDivisao(null);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#666',
                              fontSize: '1.2rem',
                              cursor: 'pointer'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        
                        {membros.length === 0 ? (
                          <div style={{ 
                            color: '#555', 
                            textAlign: 'center', 
                            padding: '40px 20px',
                            border: '1px dashed #333',
                            borderRadius: '10px'
                          }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📭</div>
                            Nenhum membro nesta divisão
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {membros.map(user => (
                              <div
                                key={user.id}
                                style={{
                                  background: `linear-gradient(135deg, ${divisao.cor}15 0%, rgba(30,30,40,0.9) 100%)`,
                                  border: `2px solid ${divisao.cor}50`,
                                  borderRadius: '10px',
                                  padding: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px'
                                }}
                              >
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: '#333',
                                  overflow: 'hidden',
                                  border: `2px solid ${divisao.cor}`,
                                  flexShrink: 0
                                }}>
                                  {user.foto ? (
                                    <img
                                      src={`data:image/png;base64,${user.foto}`}
                                      alt={user.display_name}
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
                                    fontSize: '0.9rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                    {user.display_name || user.username}
                                  </div>
                                  <div style={{ color: '#888', fontSize: '0.75rem' }}>
                                    {user.cargo || 'Sem cargo'}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateDivisao(user.id, '');
                                  }}
                                  style={{
                                    background: 'rgba(231, 76, 60, 0.2)',
                                    border: '1px solid #e74c3c',
                                    color: '#e74c3c',
                                    padding: '6px 10px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = 'rgba(231, 76, 60, 0.4)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = 'rgba(231, 76, 60, 0.2)';
                                  }}
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Card sendo arrastado (Ghost) */}
          {draggingUser && (
            <div
              style={{
                position: 'fixed',
                left: dragPosition.x - dragOffset.x,
                top: dragPosition.y - dragOffset.y,
                width: '200px',
                background: 'rgba(40, 40, 60, 0.95)',
                border: '2px solid #3498db',
                borderRadius: '10px',
                padding: '12px',
                pointerEvents: 'none',
                zIndex: 10010,
                boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 25px rgba(52, 152, 219, 0.5)',
                transform: `rotate(${cardRotation}deg) scale(1.05)`,
                transition: 'transform 0.05s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#333',
                  overflow: 'hidden',
                  border: '2px solid #3498db',
                  flexShrink: 0
                }}>
                  {draggingUser.foto ? (
                    <img
                      src={`data:image/png;base64,${draggingUser.foto}`}
                      alt={draggingUser.display_name}
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
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {draggingUser.display_name || draggingUser.username}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.75rem' }}>
                    {draggingUser.cargo || 'Sem cargo'}
                  </div>
                </div>
              </div>
              
              {/* Indicador de ação */}
              <div style={{
                marginTop: '10px',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: hoveredDivisao ? '#27ae60' : '#666',
                fontWeight: hoveredDivisao ? '600' : '400'
              }}>
                {hoveredDivisao 
                  ? `✓ Solte em ${DIVISOES.find(d => d.id === hoveredDivisao)?.nome}`
                  : '↔ Arraste até uma divisão...'}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
