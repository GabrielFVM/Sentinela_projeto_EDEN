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

  // Filtrar usuários pela busca
  const filteredUsers = users.filter(u => 
    (u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                textShadow: '0 0 10px rgba(204, 0, 0, 0.5)'
              }}>
                GERENCIAMENTO DE USUÁRIOS
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
    </>
  );
}
