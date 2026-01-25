import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// Função para decodificar token JWT
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
};

export default function SentinelaPage() {
  const [mteModalOpen, setMteModalOpen] = useState(false);
  const [missoesModalOpen, setMissoesModalOpen] = useState(false);
  const [bestiarioModalOpen, setBestiarioModalOpen] = useState(false);
  const [agentesModalOpen, setAgentesModalOpen] = useState(false);
  const [perimetros, setPerimetros] = useState([]);
  const [missoes, setMissoes] = useState([]);
  const [criaturas, setCriaturas] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [elementos, setElementos] = useState([]);
  
  // Estados para navegação de agentes
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [selectedAgente, setSelectedAgente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddCriatura, setShowAddCriatura] = useState(false);
  const [imagemPreview, setImagemPreview] = useState(null);
  
  // Estado para visualização de criatura
  const [selectedCriatura, setSelectedCriatura] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [addingFoto, setAddingFoto] = useState(false);
  const [novaFotoPreview, setNovaFotoPreview] = useState(null);
  const [novaFotoBase64, setNovaFotoBase64] = useState('');
  const [editingCriatura, setEditingCriatura] = useState(false);
  const [editCriaturaData, setEditCriaturaData] = useState(null);
  
  const [novaCriatura, setNovaCriatura] = useState({
    nome: '',
    elemento: '',
    elementos_adicionais: [],
    deslocamento_metros: '',
    deslocamento_quadrados: '',
    escalada_metros: '',
    escalada_quadrados: '',
    voo_metros: '',
    voo_quadrados: '',
    agi: 0,
    forca: 0,
    int: 0,
    pre: 0,
    vig: 0,
    descricao: '',
    imagem: ''
  });
  const navigate = useNavigate();

  // Carregar perímetros quando o modal abrir
  useEffect(() => {
    if (mteModalOpen) {
      loadPerimetros();
    }
  }, [mteModalOpen]);

  // Carregar missões quando o modal abrir
  useEffect(() => {
    if (missoesModalOpen) {
      loadMissoes();
    }
  }, [missoesModalOpen]);

  // Carregar criaturas quando o modal abrir
  useEffect(() => {
    if (bestiarioModalOpen) {
      loadCriaturas();
      loadElementos();
    }
  }, [bestiarioModalOpen]);

  // Carregar agentes quando selecionar um grupo
  useEffect(() => {
    if (selectedGrupo) {
      loadAgentes(selectedGrupo);
    }
  }, [selectedGrupo]);

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

  const loadMissoes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/missoes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const loadCriaturas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/criaturas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!data.erro) {
        setCriaturas(data);
      }
    } catch (err) {
      console.error('Erro ao carregar criaturas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadElementos = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/elementos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!data.erro) {
        setElementos(data);
      }
    } catch (err) {
      console.error('Erro ao carregar elementos:', err);
    }
  };

  const loadAgentes = async (grupo) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/agentes?grupo=${encodeURIComponent(grupo)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!data.erro) {
        setAgentes(data);
      }
    } catch (err) {
      console.error('Erro ao carregar agentes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCriatura = async () => {
    if (!novaCriatura.nome.trim()) {
      alert('Nome da criatura é obrigatório');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      // Converter array de elementos adicionais para string separada por vírgula
      const criaturaData = {
        ...novaCriatura,
        elementos_adicionais: novaCriatura.elementos_adicionais.join(',')
      };
      const response = await fetch(`${API_BASE_URL}/criaturas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(criaturaData)
      });
      
      if (response.ok) {
        setShowAddCriatura(false);
        setImagemPreview(null);
        setNovaCriatura({
          nome: '',
          elemento: '',
          elementos_adicionais: [],
          deslocamento_metros: '',
          deslocamento_quadrados: '',
          escalada_metros: '',
          escalada_quadrados: '',
          voo_metros: '',
          voo_quadrados: '',
          agi: 0,
          forca: 0,
          int: 0,
          pre: 0,
          vig: 0,
          descricao: '',
          imagem: ''
        });
        loadCriaturas();
      }
    } catch (err) {
      console.error('Erro ao adicionar criatura:', err);
    }
  };

  const handleImagemChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]; // Remove o prefixo data:image/...
        setNovaCriatura({ ...novaCriatura, imagem: base64 });
        setImagemPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Verificar se o usuário é admin ou superior
  const isAdminOrAbove = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    const payload = decodeToken(token);
    if (!payload) return false;
    const cargo = payload.cargo?.toLowerCase() || '';
    return cargo === 'administrador' || cargo === 'admin' || cargo === 'lider' || cargo === 'líder';
  };

  // Deletar criatura
  const handleDeleteCriatura = async () => {
    if (!selectedCriatura) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/criaturas/${selectedCriatura.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setSelectedCriatura(null);
        setShowDeleteConfirm(false);
        setDeleteConfirmText('');
        loadCriaturas();
      } else {
        alert('Erro ao deletar criatura');
      }
    } catch (err) {
      console.error('Erro ao deletar criatura:', err);
    }
  };

  // Iniciar edição de criatura
  const startEditCriatura = () => {
    if (!selectedCriatura) return;
    setEditCriaturaData({
      nome: selectedCriatura.nome || '',
      elemento: selectedCriatura.elemento || '',
      elementos_adicionais: selectedCriatura.elementos_adicionais ? selectedCriatura.elementos_adicionais.split(',').map(e => e.trim()).filter(e => e) : [],
      deslocamento_metros: selectedCriatura.deslocamento_metros || '',
      deslocamento_quadrados: selectedCriatura.deslocamento_quadrados || '',
      escalada_metros: selectedCriatura.escalada_metros || '',
      escalada_quadrados: selectedCriatura.escalada_quadrados || '',
      voo_metros: selectedCriatura.voo_metros || '',
      voo_quadrados: selectedCriatura.voo_quadrados || '',
      agi: selectedCriatura.agi || 0,
      forca: selectedCriatura.forca || 0,
      int: selectedCriatura.int || 0,
      pre: selectedCriatura.pre || 0,
      vig: selectedCriatura.vig || 0,
      descricao: selectedCriatura.descricao || ''
    });
    setEditingCriatura(true);
  };

  // Salvar edição de criatura
  const handleSaveEditCriatura = async () => {
    if (!selectedCriatura || !editCriaturaData) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/criaturas/${selectedCriatura.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editCriaturaData,
          elementos_adicionais: editCriaturaData.elementos_adicionais.join(',')
        })
      });
      
      if (response.ok) {
        setEditingCriatura(false);
        setEditCriaturaData(null);
        loadCriaturas();
        // Atualizar a criatura selecionada
        const updatedResponse = await fetch(`${API_BASE_URL}/criaturas/${selectedCriatura.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (updatedResponse.ok) {
          const updated = await updatedResponse.json();
          setSelectedCriatura(updated);
        }
      } else {
        const err = await response.json();
        alert(err.erro || 'Erro ao salvar criatura');
      }
    } catch (err) {
      console.error('Erro ao salvar criatura:', err);
    }
  };

  // Adicionar/atualizar foto da criatura
  const handleNovaFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        setNovaFotoBase64(base64);
        setNovaFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvarFoto = async () => {
    if (!selectedCriatura || !novaFotoBase64) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/criaturas/${selectedCriatura.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imagem: novaFotoBase64 })
      });
      
      if (response.ok) {
        // Atualizar a criatura selecionada com a nova imagem
        setSelectedCriatura({ ...selectedCriatura, imagem: novaFotoBase64 });
        setAddingFoto(false);
        setNovaFotoPreview(null);
        setNovaFotoBase64('');
        loadCriaturas();
      }
    } catch (err) {
      console.error('Erro ao salvar foto:', err);
    }
  };

  const handlePerimetroClick = (perimetroId) => {
    setMteModalOpen(false);
    navigate(`/perimetro/${perimetroId}`);
  };

  const handleMissaoClick = (missaoId) => {
    setMissoesModalOpen(false);
    navigate(`/missao/${missaoId}`);
  };

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

        {/* Pasta Missões */}
        <div
          onClick={() => setMissoesModalOpen(true)}
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
            e.currentTarget.style.borderColor = '#4a90d9';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(74, 144, 217, 0.3)';
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
            background: 'linear-gradient(135deg, #1a3a5c 0%, #0d2840 50%, #081c30 100%)',
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
              background: 'linear-gradient(135deg, #2a5a8c 0%, #1a3a5c 100%)',
              borderRadius: '3px 3px 0 0'
            }} />
            {/* Símbolo na pasta */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#4a90d9',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(74, 144, 217, 0.5)'
            }}>
              🎯
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
            Missões
          </span>
          
          {/* Descrição */}
          <span style={{
            color: '#666',
            fontSize: '0.7rem',
            textAlign: 'center',
            padding: '0 10px'
          }}>
            Operações de Campo
          </span>
        </div>

        {/* Pasta Bestiário */}
        <div
          onClick={() => setBestiarioModalOpen(true)}
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
            e.currentTarget.style.borderColor = '#9b59b6';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(155, 89, 182, 0.3)';
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
            background: 'linear-gradient(135deg, #4a1a5c 0%, #2d0d40 50%, #1c0830 100%)',
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
              background: 'linear-gradient(135deg, #6a2a8c 0%, #4a1a5c 100%)',
              borderRadius: '3px 3px 0 0'
            }} />
            {/* Símbolo na pasta */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#9b59b6',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(155, 89, 182, 0.5)'
            }}>
              ☠️
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
            Bestiário
          </span>
          
          {/* Descrição */}
          <span style={{
            color: '#666',
            fontSize: '0.7rem',
            textAlign: 'center',
            padding: '0 10px'
          }}>
            Criaturas Paranormais
          </span>
        </div>

        {/* Pasta Agentes */}
        <div
          onClick={() => setAgentesModalOpen(true)}
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
            e.currentTarget.style.borderColor = '#27ae60';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(39, 174, 96, 0.3)';
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
            background: 'linear-gradient(135deg, #1a5c3a 0%, #0d4028 50%, #082d1c 100%)',
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
              background: 'linear-gradient(135deg, #2a8c5a 0%, #1a5c3a 100%)',
              borderRadius: '3px 3px 0 0'
            }} />
            {/* Símbolo na pasta */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#27ae60',
              fontSize: '1.8rem',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(39, 174, 96, 0.5)'
            }}>
              👤
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
            Agentes
          </span>
          
          {/* Descrição */}
          <span style={{
            color: '#666',
            fontSize: '0.7rem',
            textAlign: 'center',
            padding: '0 10px'
          }}>
            Fichas de Personagens
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

      {/* Modal Missões */}
      {missoesModalOpen && (
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
          onClick={() => setMissoesModalOpen(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: '2px solid #4a90d9',
              borderRadius: '15px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(74, 144, 217, 0.3)'
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
                  color: '#4a90d9',
                  fontSize: '1.4rem',
                  textTransform: 'uppercase',
                  letterSpacing: '3px'
                }}>
                  Missões
                </h2>
                <p style={{
                  margin: '8px 0 0 0',
                  color: '#666',
                  fontSize: '0.85rem'
                }}>
                  Selecione uma missão para gerenciar
                </p>
              </div>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setMissoesModalOpen(false);
                    navigate('/missoes');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #4a90d9 0%, #357abd 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  + Nova Missão
                </button>
                <button
                  onClick={() => setMissoesModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '5px 10px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#4a90d9'}
                  onMouseLeave={(e) => e.target.style.color = '#666'}
                >
                  ✕
                </button>
              </div>
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
                  Carregando missões...
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  {missoes.map((missao) => (
                    <div
                      key={missao.id}
                      onClick={() => handleMissaoClick(missao.id)}
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
                        e.currentTarget.style.borderColor = '#4a90d9';
                        e.currentTarget.style.background = 'rgba(74, 144, 217, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#333';
                        e.currentTarget.style.background = 'rgba(30, 30, 30, 0.8)';
                      }}
                    >
                      {/* Status badge */}
                      <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        border: `2px solid ${getStatusColor(missao.status)}`
                      }}>
                        🎯
                      </div>

                      {/* Info da missão */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{
                            margin: 0,
                            color: '#4a90d9',
                            fontSize: '1.1rem',
                            fontWeight: '600'
                          }}>
                            {missao.nome}
                          </h3>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            background: `${getStatusColor(missao.status)}33`,
                            color: getStatusColor(missao.status),
                            border: `1px solid ${getStatusColor(missao.status)}`
                          }}>
                            {missao.status}
                          </span>
                        </div>
                        <p style={{
                          margin: '5px 0 0 0',
                          color: '#888',
                          fontSize: '0.85rem'
                        }}>
                          {missao.descricao || 'Sem descrição'}
                        </p>
                        <div style={{
                          display: 'flex',
                          gap: '20px',
                          marginTop: '10px',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            color: '#666',
                            fontSize: '0.75rem'
                          }}>
                            👤 Agentes: {missao.agentes_count || 0}
                          </span>
                          {/* Avatares dos agentes */}
                          <div style={{ display: 'flex', marginLeft: '10px' }}>
                            {missao.agentes && missao.agentes.slice(0, 5).map((agente, idx) => (
                              <div
                                key={agente.id}
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  border: '2px solid #1a1a1a',
                                  marginLeft: idx > 0 ? '-10px' : '0',
                                  background: agente.foto ? `url(data:image/jpeg;base64,${agente.foto}) center/cover` : '#333',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#888',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold'
                                }}
                                title={agente.display_name}
                              >
                                {!agente.foto && (agente.display_name?.[0] || '?')}
                              </div>
                            ))}
                            {missao.agentes && missao.agentes.length > 5 && (
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                border: '2px solid #1a1a1a',
                                marginLeft: '-10px',
                                background: '#444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ccc',
                                fontSize: '0.6rem',
                                fontWeight: 'bold'
                              }}>
                                +{missao.agentes.length - 5}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Seta */}
                      <div style={{
                        color: '#4a90d9',
                        fontSize: '1.5rem'
                      }}>
                        →
                      </div>
                    </div>
                  ))}

                  {missoes.length === 0 && !loading && (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#666'
                    }}>
                      Nenhuma missão cadastrada
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Bestiário */}
      {bestiarioModalOpen && (
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
          onClick={() => { setBestiarioModalOpen(false); setShowAddCriatura(false); }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: '2px solid #9b59b6',
              borderRadius: '15px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '85vh',
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(155, 89, 182, 0.3)'
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '2rem' }}>☠️</span>
                <div>
                  <h2 style={{
                    margin: 0,
                    color: '#9b59b6',
                    fontSize: '1.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                  }}>
                    Bestiário
                  </h2>
                  <span style={{ color: '#666', fontSize: '0.8rem' }}>
                    Criaturas Paranormais Reconhecidas
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowAddCriatura(true)}
                  style={{
                    background: 'linear-gradient(135deg, #9b59b6 0%, #6a2a8c 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  + Nova Criatura
                </button>
                <button
                  onClick={() => setBestiarioModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #666',
                    borderRadius: '8px',
                    color: '#999',
                    padding: '10px 15px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div style={{
              padding: '20px 30px',
              maxHeight: 'calc(85vh - 100px)',
              overflowY: 'auto'
            }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9b59b6' }}>
                  Carregando criaturas...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {criaturas.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '60px',
                      color: '#666'
                    }}>
                      <div style={{ fontSize: '4rem', marginBottom: '15px', opacity: 0.5 }}>☠️</div>
                      <div>Nenhuma criatura registrada no bestiário.</div>
                      <div style={{ fontSize: '0.85rem', marginTop: '10px', color: '#555' }}>
                        Clique em "Nova Criatura" para adicionar.
                      </div>
                    </div>
                  )}
                  
                  {criaturas.map((criatura) => (
                    <div
                      key={criatura.id}
                      onClick={() => setSelectedCriatura(criatura)}
                      style={{
                        background: 'rgba(155, 89, 182, 0.1)',
                        border: '1px solid #9b59b6',
                        borderRadius: '10px',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(155, 89, 182, 0.2)';
                        e.currentTarget.style.transform = 'translateX(5px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(155, 89, 182, 0.1)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {/* Imagem da criatura */}
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '10px',
                        background: criatura.imagem 
                          ? `url(data:image/jpeg;base64,${criatura.imagem}) center/cover` 
                          : 'linear-gradient(135deg, #9b59b6 0%, #6a2a8c 100%)',
                        border: '2px solid #9b59b6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {!criatura.imagem && <span style={{ fontSize: '1.5rem' }}>☠️</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, color: '#9b59b6', fontSize: '1.2rem' }}>
                          {criatura.nome}
                        </h3>
                        {/* Atributos */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                          {[
                            { label: 'AGI', value: criatura.agi, color: '#3498db' },
                            { label: 'FOR', value: criatura.forca, color: '#e74c3c' },
                            { label: 'INT', value: criatura.int, color: '#9b59b6' },
                            { label: 'PRE', value: criatura.pre, color: '#f39c12' },
                            { label: 'VIG', value: criatura.vig, color: '#27ae60' }
                          ].map((attr) => (
                            <span
                              key={attr.label}
                              style={{
                                background: attr.color,
                                color: '#fff',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {attr.label} {attr.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Criatura */}
      {showAddCriatura && (
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
            zIndex: 10000
          }}
          onClick={() => setShowAddCriatura(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: '2px solid #9b59b6',
              borderRadius: '15px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 0 50px rgba(155, 89, 182, 0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 25px',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#9b59b6', fontSize: '1.2rem' }}>
                ➕ Nova Criatura
              </h3>
              <button
                onClick={() => setShowAddCriatura(false)}
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

            {/* Formulário */}
            <div style={{
              padding: '25px',
              maxHeight: 'calc(90vh - 140px)',
              overflowY: 'auto'
            }}>
              {/* Nome */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#9b59b6', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                  Nome da Criatura *
                </label>
                <input
                  type="text"
                  value={novaCriatura.nome}
                  onChange={(e) => setNovaCriatura({ ...novaCriatura, nome: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#222',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                  placeholder="Ex: Zumbi de Sangue"
                />
              </div>

              {/* Elemento Principal */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#9b59b6', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                  Elemento Principal
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {elementos.map((elem) => (
                    <button
                      key={elem.id}
                      type="button"
                      onClick={() => setNovaCriatura({ ...novaCriatura, elemento: elem.nome })}
                      style={{
                        padding: '10px 18px',
                        background: novaCriatura.elemento === elem.nome ? '#9b59b6' : 'rgba(50, 50, 50, 0.8)',
                        border: novaCriatura.elemento === elem.nome ? '2px solid #9b59b6' : '2px solid #444',
                        borderRadius: '8px',
                        color: novaCriatura.elemento === elem.nome ? '#fff' : '#888',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {elem.imagem ? (
                        <img 
                          src={`data:image/png;base64,${elem.imagem}`} 
                          alt={elem.nome}
                          style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                        />
                      ) : (
                        <span>⚡</span>
                      )}
                      {elem.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Elementos Adicionais */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#9b59b6', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                  Elementos Adicionais
                </label>
                
                {/* Tags selecionadas */}
                {novaCriatura.elementos_adicionais.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {novaCriatura.elementos_adicionais.map((elemNome) => {
                      const elem = elementos.find(e => e.nome === elemNome);
                      if (!elem) return null;
                      return (
                        <div
                          key={elemNome}
                          style={{
                            padding: '6px 12px',
                            background: '#9b59b6',
                            borderRadius: '20px',
                            color: '#fff',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {elem.imagem ? (
                            <img 
                              src={`data:image/png;base64,${elem.imagem}`} 
                              alt={elem.nome}
                              style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                            />
                          ) : (
                            <span>⚡</span>
                          )}
                          {elem.nome}
                          <button
                            type="button"
                            onClick={() => setNovaCriatura({
                              ...novaCriatura,
                              elementos_adicionais: novaCriatura.elementos_adicionais.filter(e => e !== elemNome)
                            })}
                            style={{
                              background: 'rgba(0,0,0,0.3)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              marginLeft: '4px'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Botões para adicionar */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {elementos.filter(elem => 
                    elem.nome !== novaCriatura.elemento && 
                    !novaCriatura.elementos_adicionais.includes(elem.nome)
                  ).map((elem) => (
                    <button
                      key={elem.id}
                      type="button"
                      onClick={() => setNovaCriatura({
                        ...novaCriatura,
                        elementos_adicionais: [...novaCriatura.elementos_adicionais, elem.nome]
                      })}
                      style={{
                        padding: '8px 14px',
                        background: 'rgba(50, 50, 50, 0.8)',
                        border: '2px dashed #444',
                        borderRadius: '8px',
                        color: '#888',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#9b59b6';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#444';
                        e.currentTarget.style.color = '#888';
                      }}
                    >
                      <span>+</span>
                      {elem.imagem ? (
                        <img 
                          src={`data:image/png;base64,${elem.imagem}`} 
                          alt={elem.nome}
                          style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                        />
                      ) : (
                        <span>⚡</span>
                      )}
                      {elem.nome}
                    </button>
                  ))}
                  {novaCriatura.elementos_adicionais.length === elementos.length - 1 || 
                   (novaCriatura.elemento && novaCriatura.elementos_adicionais.length === elementos.length - 1) ? (
                    <span style={{ color: '#666', fontSize: '0.85rem', padding: '8px' }}>
                      Todos os elementos selecionados
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Imagem */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#9b59b6', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                  Imagem da Criatura
                </label>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                  {/* Preview */}
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '12px',
                    border: '2px dashed #9b59b6',
                    background: imagemPreview ? `url(${imagemPreview}) center/cover` : 'rgba(155, 89, 182, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    {!imagemPreview && (
                      <span style={{ color: '#9b59b6', fontSize: '2rem' }}>☠️</span>
                    )}
                  </div>
                  
                  {/* Botões de upload */}
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImagemChange}
                      style={{ display: 'none' }}
                      id="criatura-imagem-input"
                    />
                    <label
                      htmlFor="criatura-imagem-input"
                      style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        background: 'rgba(155, 89, 182, 0.2)',
                        border: '1px solid #9b59b6',
                        borderRadius: '8px',
                        color: '#9b59b6',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                    >
                      📷 Escolher Imagem
                    </label>
                    {imagemPreview && (
                      <button
                        type="button"
                        onClick={() => { setImagemPreview(null); setNovaCriatura({ ...novaCriatura, imagem: '' }); }}
                        style={{
                          marginLeft: '10px',
                          padding: '10px 15px',
                          background: 'rgba(217, 83, 79, 0.2)',
                          border: '1px solid #d9534f',
                          borderRadius: '8px',
                          color: '#d9534f',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        ✕ Remover
                      </button>
                    )}
                    <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '10px' }}>
                      Formatos: JPG, PNG, GIF (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Deslocamento */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#9b59b6', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                  DESLOCAMENTO
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={novaCriatura.deslocamento_metros}
                    onChange={(e) => setNovaCriatura({ ...novaCriatura, deslocamento_metros: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#222',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    placeholder="Metros (ex: 12m)"
                  />
                  <input
                    type="text"
                    value={novaCriatura.deslocamento_quadrados}
                    onChange={(e) => setNovaCriatura({ ...novaCriatura, deslocamento_quadrados: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#222',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    placeholder="Quadrados (ex: 8□)"
                  />
                </div>
              </div>

              {/* Escalada */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#9b59b6', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                  ESCALADA
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={novaCriatura.escalada_metros}
                    onChange={(e) => setNovaCriatura({ ...novaCriatura, escalada_metros: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#222',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    placeholder="Metros (ex: 12m)"
                  />
                  <input
                    type="text"
                    value={novaCriatura.escalada_quadrados}
                    onChange={(e) => setNovaCriatura({ ...novaCriatura, escalada_quadrados: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#222',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    placeholder="Quadrados (ex: 8□)"
                  />
                </div>
              </div>

              {/* Voo */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#9b59b6', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                  VOO
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={novaCriatura.voo_metros}
                    onChange={(e) => setNovaCriatura({ ...novaCriatura, voo_metros: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#222',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    placeholder="Metros (ex: 9m)"
                  />
                  <input
                    type="text"
                    value={novaCriatura.voo_quadrados}
                    onChange={(e) => setNovaCriatura({ ...novaCriatura, voo_quadrados: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#222',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    placeholder="Quadrados (ex: 6□)"
                  />
                </div>
              </div>

              {/* Atributos */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#9b59b6', marginBottom: '12px', fontSize: '0.9rem', fontWeight: '600' }}>
                  ATRIBUTOS
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {[
                    { key: 'agi', label: 'AGI', color: '#3498db' },
                    { key: 'forca', label: 'FOR', color: '#e74c3c' },
                    { key: 'int', label: 'INT', color: '#9b59b6' },
                    { key: 'pre', label: 'PRE', color: '#f39c12' },
                    { key: 'vig', label: 'VIG', color: '#27ae60' }
                  ].map((attr) => (
                    <div key={attr.key} style={{ textAlign: 'center' }}>
                      <div style={{
                        background: attr.color,
                        color: '#fff',
                        padding: '5px 10px',
                        borderRadius: '4px 4px 0 0',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {attr.label}
                      </div>
                      <input
                        type="number"
                        value={novaCriatura[attr.key]}
                        onChange={(e) => setNovaCriatura({ ...novaCriatura, [attr.key]: parseInt(e.target.value) || 0 })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#222',
                          border: `1px solid ${attr.color}`,
                          borderTop: 'none',
                          borderRadius: '0 0 4px 4px',
                          color: '#fff',
                          textAlign: 'center',
                          fontSize: '1.1rem',
                          fontWeight: 'bold'
                        }}
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', color: '#9b59b6', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                  Descrição
                </label>
                <textarea
                  value={novaCriatura.descricao}
                  onChange={(e) => setNovaCriatura({ ...novaCriatura, descricao: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#222',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Descrição da criatura..."
                />
              </div>

              {/* Botões */}
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddCriatura(false)}
                  style={{
                    padding: '12px 25px',
                    background: 'transparent',
                    border: '1px solid #666',
                    borderRadius: '8px',
                    color: '#999',
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddCriatura}
                  style={{
                    padding: '12px 25px',
                    background: 'linear-gradient(135deg, #9b59b6 0%, #6a2a8c 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '600'
                  }}
                >
                  Criar Criatura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualização da Criatura */}
      {selectedCriatura && (
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
            zIndex: 10001
          }}
          onClick={() => { setSelectedCriatura(null); setShowDeleteConfirm(false); setAddingFoto(false); }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: '2px solid #9b59b6',
              borderRadius: '15px',
              width: '95%',
              maxWidth: '1000px',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 0 50px rgba(155, 89, 182, 0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 25px',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Elementos com imagens */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {selectedCriatura.elementos && selectedCriatura.elementos.length > 0 ? (
                    selectedCriatura.elementos.map((elem) => {
                      // Cores de brilho por elemento
                      const glowColors = {
                        'Sangue': '#e74c3c',
                        'Conhecimento': '#f39c12',
                        'Energia': '#9b59b6',
                        'Morte': '#2c3e50',
                        'Medo': '#ecf0f1'
                      };
                      const glowColor = glowColors[elem.nome] || '#9b59b6';
                      
                      return (
                        <img
                          key={elem.id}
                          src={`data:image/png;base64,${elem.imagem}`}
                          alt={elem.nome}
                          title={elem.nome}
                          style={{
                            width: elem.is_principal ? '32px' : '24px',
                            height: elem.is_principal ? '32px' : '24px',
                            objectFit: 'contain',
                            filter: elem.is_principal 
                              ? `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 15px ${glowColor})` 
                              : 'brightness(0.7)',
                            opacity: elem.is_principal ? 1 : 0.7
                          }}
                        />
                      );
                    })
                  ) : (
                    <span style={{ fontSize: '1.5rem' }}>☠️</span>
                  )}
                </div>
                <h3 style={{ margin: 0, color: '#9b59b6', fontSize: '1.3rem' }}>
                  {selectedCriatura.nome}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedCriatura(null); setShowDeleteConfirm(false); setAddingFoto(false); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#666',
                  fontSize: '1.4rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Conteúdo */}
            <div style={{
              padding: '25px',
              maxHeight: 'calc(90vh - 80px)',
              overflowY: 'auto',
              display: 'flex',
              gap: '30px'
            }}>
              {/* LADO ESQUERDO - Imagem */}
              <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column' }}>
                  {selectedCriatura.imagem ? (
                    <div style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: 'calc(90vh - 130px)',
                      borderRadius: '15px',
                      border: '3px solid #9b59b6',
                      boxShadow: '0 0 30px rgba(155, 89, 182, 0.3)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#0a0a0a'
                    }}>
                      <img 
                        src={`data:image/jpeg;base64,${selectedCriatura.imagem}`}
                        alt={selectedCriatura.nome}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          maxHeight: 'calc(90vh - 140px)'
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '400px',
                      borderRadius: '15px',
                      background: 'rgba(155, 89, 182, 0.1)',
                      border: '3px dashed #9b59b6',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '20px'
                    }}>
                      <span style={{ fontSize: '6rem', opacity: 0.5 }}>☠️</span>
                      {!addingFoto ? (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleNovaFotoChange}
                            style={{ display: 'none' }}
                            id="registrar-aparencia-input"
                          />
                          <label
                            htmlFor="registrar-aparencia-input"
                            onClick={() => setAddingFoto(true)}
                            style={{
                              padding: '12px 24px',
                              background: 'rgba(155, 89, 182, 0.3)',
                              border: '1px solid #9b59b6',
                              borderRadius: '8px',
                              color: '#9b59b6',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              fontWeight: '600'
                            }}
                          >
                            📷 Registrar Aparência
                          </label>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleNovaFotoChange}
                            style={{ display: 'none' }}
                            id="registrar-aparencia-input-2"
                          />
                          <label
                            htmlFor="registrar-aparencia-input-2"
                            style={{
                              display: 'inline-block',
                              padding: '12px 24px',
                              background: 'rgba(155, 89, 182, 0.3)',
                              border: '1px solid #9b59b6',
                              borderRadius: '8px',
                              color: '#9b59b6',
                              cursor: 'pointer',
                              fontSize: '1rem'
                            }}
                          >
                            Escolher Foto
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Preview da nova foto */}
                  {novaFotoPreview && (
                    <div style={{ marginTop: '15px' }}>
                      <div style={{
                        width: '100%',
                        height: '200px',
                        borderRadius: '10px',
                        background: `url(${novaFotoPreview}) center/cover`,
                        border: '2px solid #27ae60',
                        marginBottom: '10px'
                      }} />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={handleSalvarFoto}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: '#27ae60',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                          }}
                        >
                          ✓ Salvar Foto
                        </button>
                        <button
                          onClick={() => { setNovaFotoPreview(null); setNovaFotoBase64(''); setAddingFoto(false); }}
                          style={{
                            padding: '10px 15px',
                            background: 'transparent',
                            border: '1px solid #666',
                            borderRadius: '6px',
                            color: '#666',
                            cursor: 'pointer'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
              </div>

              {/* LADO DIREITO - Informações */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Deslocamento */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '10px',
                    padding: '15px',
                    marginBottom: '15px',
                    border: '1px solid #444'
                  }}>
                    <div style={{ color: '#9b59b6', fontWeight: '700', marginBottom: '10px', fontSize: '0.9rem' }}>
                      DESLOCAMENTO
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc' }}>
                        <span>Normal:</span>
                        <span>{selectedCriatura.deslocamento_metros || '-'}m | {selectedCriatura.deslocamento_quadrados || '-'}□</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc' }}>
                        <span>Escalada:</span>
                        <span>{selectedCriatura.escalada_metros || '-'}m | {selectedCriatura.escalada_quadrados || '-'}□</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc' }}>
                        <span>Voo:</span>
                        <span>{selectedCriatura.voo_metros || '-'}m | {selectedCriatura.voo_quadrados || '-'}□</span>
                      </div>
                    </div>
                  </div>

                  {/* Atributos */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '10px'
                  }}>
                    {[
                      { label: 'AGI', value: selectedCriatura.agi, color: '#3498db' },
                      { label: 'FOR', value: selectedCriatura.forca, color: '#e74c3c' },
                      { label: 'INT', value: selectedCriatura.int, color: '#9b59b6' },
                      { label: 'PRE', value: selectedCriatura.pre, color: '#f39c12' },
                      { label: 'VIG', value: selectedCriatura.vig, color: '#27ae60' }
                    ].map((attr) => (
                      <div
                        key={attr.label}
                        style={{
                          background: attr.color,
                          borderRadius: '10px',
                          padding: '15px 8px',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: '600' }}>
                          {attr.label}
                        </div>
                        <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700' }}>
                          {attr.value}
                        </div>
                      </div>
                    ))}
                  </div>

                {/* Descrição */}
                {selectedCriatura.descricao && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '10px',
                    padding: '20px',
                    border: '1px solid #333'
                  }}>
                    <div style={{ color: '#9b59b6', fontWeight: '600', marginBottom: '10px', fontSize: '0.9rem' }}>
                      DESCRIÇÃO
                    </div>
                    <div style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {selectedCriatura.descricao}
                    </div>
                  </div>
                )}

                {/* Botões de Ação (só para admin/líder) */}
                {isAdminOrAbove() && !editingCriatura && (
                  <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: 'auto', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    {/* Botão Editar */}
                    <button
                      onClick={startEditCriatura}
                      style={{
                        padding: '12px 25px',
                        background: 'rgba(155, 89, 182, 0.2)',
                        border: '1px solid #9b59b6',
                        borderRadius: '8px',
                        color: '#9b59b6',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      ✏️ Editar Criatura
                    </button>
                    
                    {/* Botão Deletar */}
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{
                          padding: '12px 25px',
                          background: 'rgba(217, 83, 79, 0.2)',
                          border: '1px solid #d9534f',
                          borderRadius: '8px',
                          color: '#d9534f',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        🗑️ Deletar Criatura
                      </button>
                    ) : (
                      <div style={{
                        background: 'rgba(217, 83, 79, 0.1)',
                        border: '1px solid #d9534f',
                        borderRadius: '10px',
                        padding: '20px'
                      }}>
                        <div style={{ color: '#d9534f', fontWeight: '700', marginBottom: '15px' }}>
                          ⚠️ Confirmação de Exclusão
                        </div>
                        <div style={{ color: '#ccc', marginBottom: '15px', fontSize: '0.9rem' }}>
                          Para deletar <strong style={{ color: '#9b59b6' }}>{selectedCriatura.nome}</strong>, digite o nome da criatura abaixo:
                        </div>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder={selectedCriatura.nome}
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: '#1a1a1a',
                            border: '1px solid #444',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '1rem',
                            marginBottom: '15px'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                            style={{
                              padding: '10px 20px',
                              background: 'transparent',
                              border: '1px solid #666',
                              borderRadius: '8px',
                              color: '#999',
                              cursor: 'pointer'
                            }}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleDeleteCriatura}
                            disabled={deleteConfirmText !== selectedCriatura.nome}
                            style={{
                              padding: '10px 20px',
                              background: deleteConfirmText === selectedCriatura.nome ? '#d9534f' : '#333',
                              border: 'none',
                              borderRadius: '8px',
                              color: deleteConfirmText === selectedCriatura.nome ? '#fff' : '#666',
                              cursor: deleteConfirmText === selectedCriatura.nome ? 'pointer' : 'not-allowed',
                              fontWeight: '600'
                            }}
                          >
                            Confirmar Exclusão
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Formulário de Edição */}
                {editingCriatura && editCriaturaData && (
                  <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: 'auto' }}>
                    <div style={{ color: '#9b59b6', fontWeight: '600', marginBottom: '15px', fontSize: '1rem' }}>
                      ✏️ EDITANDO CRIATURA
                    </div>
                    
                    {/* Nome */}
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', color: '#888', marginBottom: '5px', fontSize: '0.85rem' }}>Nome</label>
                      <input
                        type="text"
                        value={editCriaturaData.nome}
                        onChange={(e) => setEditCriaturaData({...editCriaturaData, nome: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#222',
                          border: '1px solid #444',
                          borderRadius: '6px',
                          color: '#fff'
                        }}
                      />
                    </div>

                    {/* Elemento Principal */}
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', color: '#888', marginBottom: '5px', fontSize: '0.85rem' }}>Elemento Principal</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {elementos.map((elem) => (
                          <button
                            key={elem.id}
                            type="button"
                            onClick={() => setEditCriaturaData({...editCriaturaData, elemento: elem.nome})}
                            style={{
                              padding: '8px 15px',
                              background: editCriaturaData.elemento === elem.nome ? '#9b59b6' : 'rgba(50, 50, 50, 0.8)',
                              border: editCriaturaData.elemento === elem.nome ? '2px solid #9b59b6' : '2px solid #444',
                              borderRadius: '6px',
                              color: editCriaturaData.elemento === elem.nome ? '#fff' : '#888',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            {elem.imagem && <img src={`data:image/png;base64,${elem.imagem}`} alt={elem.nome} style={{ width: '16px', height: '16px' }} />}
                            {elem.nome}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Atributos */}
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', color: '#888', marginBottom: '5px', fontSize: '0.85rem' }}>Atributos</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                        {['agi', 'forca', 'int', 'pre', 'vig'].map((attr) => (
                          <div key={attr}>
                            <label style={{ display: 'block', color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '3px' }}>
                              {attr === 'forca' ? 'FOR' : attr === 'int' ? 'INT' : attr.toUpperCase()}
                            </label>
                            <input
                              type="number"
                              value={editCriaturaData[attr]}
                              onChange={(e) => setEditCriaturaData({...editCriaturaData, [attr]: parseInt(e.target.value) || 0})}
                              style={{
                                width: '100%',
                                padding: '8px',
                                background: '#222',
                                border: '1px solid #444',
                                borderRadius: '6px',
                                color: '#fff',
                                textAlign: 'center'
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Descrição */}
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', color: '#888', marginBottom: '5px', fontSize: '0.85rem' }}>Descrição</label>
                      <textarea
                        value={editCriaturaData.descricao}
                        onChange={(e) => setEditCriaturaData({...editCriaturaData, descricao: e.target.value})}
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#222',
                          border: '1px solid #444',
                          borderRadius: '6px',
                          color: '#fff',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    {/* Botões */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => { setEditingCriatura(false); setEditCriaturaData(null); }}
                        style={{
                          padding: '10px 20px',
                          background: 'transparent',
                          border: '1px solid #666',
                          borderRadius: '8px',
                          color: '#999',
                          cursor: 'pointer'
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveEditCriatura}
                        style={{
                          padding: '10px 20px',
                          background: '#9b59b6',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        💾 Salvar Alterações
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agentes */}
      {agentesModalOpen && (
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
          onClick={() => {
            setAgentesModalOpen(false);
            setSelectedGrupo(null);
            setSelectedAgente(null);
            setAgentes([]);
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: '2px solid #27ae60',
              borderRadius: '15px',
              width: '95%',
              maxWidth: selectedAgente ? '1200px' : (selectedGrupo ? '1000px' : '700px'),
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(39, 174, 96, 0.3)',
              transition: 'max-width 0.3s ease'
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {(selectedGrupo || selectedAgente) && (
                  <button
                    onClick={() => {
                      if (selectedAgente) {
                        setSelectedAgente(null);
                      } else {
                        setSelectedGrupo(null);
                        setAgentes([]);
                      }
                    }}
                    style={{
                      background: 'rgba(39, 174, 96, 0.2)',
                      border: '1px solid #27ae60',
                      borderRadius: '8px',
                      color: '#27ae60',
                      cursor: 'pointer',
                      padding: '8px 15px',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    ← Voltar
                  </button>
                )}
                <div>
                  <h2 style={{
                    margin: 0,
                    color: '#27ae60',
                    fontSize: '1.4rem',
                    textTransform: 'uppercase',
                    letterSpacing: '3px'
                  }}>
                    {selectedAgente ? selectedAgente.display_name : 
                     selectedGrupo ? `Agentes - ${selectedGrupo}` : 'Agentes'}
                  </h2>
                  <p style={{
                    margin: '8px 0 0 0',
                    color: '#666',
                    fontSize: '0.85rem'
                  }}>
                    {selectedAgente ? 'Ficha do Agente' :
                     selectedGrupo ? 'Selecione um agente' : 'Selecione uma divisão'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAgentesModalOpen(false);
                  setSelectedGrupo(null);
                  setSelectedAgente(null);
                  setAgentes([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '5px 10px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#27ae60'}
                onMouseLeave={(e) => e.target.style.color = '#666'}
              >
                ✕
              </button>
            </div>

            {/* Conteúdo do modal */}
            <div style={{
              padding: '25px 30px',
              maxHeight: 'calc(90vh - 100px)',
              overflowY: 'auto'
            }}>
              {!selectedGrupo && !selectedAgente && (
                /* Seleção de Grupo/Divisão */
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '20px'
                }}>
                  {/* Serafins */}
                  <div
                    onClick={() => setSelectedGrupo('Serafim')}
                    style={{
                      background: 'rgba(39, 174, 96, 0.1)',
                      border: '2px solid #333',
                      borderRadius: '15px',
                      padding: '30px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#27ae60';
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(39, 174, 96, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#333';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
                      <img 
                        src={`${import.meta.env.BASE_URL}serafins2.png`} 
                        alt="Serafins" 
                        style={{ 
                          width: '90px', 
                          height: '90px', 
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 0 12px rgba(39, 174, 96, 0.6)) drop-shadow(0 0 25px rgba(39, 174, 96, 0.4))'
                        }} 
                      />
                    </div>
                    <div style={{ color: '#27ae60', fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>
                      SERAFINS
                    </div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>
                      Elite Paranormal
                    </div>
                  </div>

                  {/* Placeholder 2 */}
                  <div
                    style={{
                      background: 'rgba(100, 100, 100, 0.1)',
                      border: '2px dashed #333',
                      borderRadius: '15px',
                      padding: '30px 20px',
                      textAlign: 'center',
                      opacity: 0.5
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>❓</div>
                    <div style={{ color: '#666', fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>
                      ???
                    </div>
                    <div style={{ color: '#444', fontSize: '0.8rem' }}>
                      Em desenvolvimento
                    </div>
                  </div>

                  {/* Placeholder 3 */}
                  <div
                    style={{
                      background: 'rgba(100, 100, 100, 0.1)',
                      border: '2px dashed #333',
                      borderRadius: '15px',
                      padding: '30px 20px',
                      textAlign: 'center',
                      opacity: 0.5
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>❓</div>
                    <div style={{ color: '#666', fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>
                      ???
                    </div>
                    <div style={{ color: '#444', fontSize: '0.8rem' }}>
                      Em desenvolvimento
                    </div>
                  </div>
                </div>
              )}

              {selectedGrupo && !selectedAgente && (
                /* Lista de Agentes do Grupo */
                <div>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                      Carregando agentes...
                    </div>
                  ) : agentes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                      Nenhum agente encontrado nesta divisão
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '20px'
                    }}>
                      {agentes.map((agente) => (
                        <div
                          key={agente.id}
                          onClick={() => setSelectedAgente(agente)}
                          style={{
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid #333',
                            borderRadius: '12px',
                            padding: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#27ae60';
                            e.currentTarget.style.transform = 'translateY(-3px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#333';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            {/* Avatar */}
                            <div style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              background: agente.foto 
                                ? `url(data:image/jpeg;base64,${agente.foto}) center/cover`
                                : 'linear-gradient(135deg, #27ae60 0%, #1a5c3a 100%)',
                              border: '2px solid #27ae60',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.5rem',
                              flexShrink: 0
                            }}>
                              {!agente.foto && '👤'}
                            </div>
                            
                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                color: '#fff', 
                                fontWeight: '700', 
                                fontSize: '1.1rem',
                                marginBottom: '4px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {agente.display_name}
                              </div>
                              <div style={{ color: '#888', fontSize: '0.85rem' }}>
                                {agente.classe || 'Classe não definida'}
                              </div>
                              <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                marginTop: '8px',
                                flexWrap: 'wrap'
                              }}>
                                <span style={{
                                  background: 'rgba(39, 174, 96, 0.2)',
                                  color: '#27ae60',
                                  padding: '3px 8px',
                                  borderRadius: '5px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  NEX {agente.nex || 5}%
                                </span>
                                {agente.vida_max > 0 && (
                                  <span style={{
                                    background: 'rgba(231, 76, 60, 0.2)',
                                    color: '#e74c3c',
                                    padding: '3px 8px',
                                    borderRadius: '5px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                  }}>
                                    ❤️ {agente.vida_atual}/{agente.vida_max}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedAgente && (
                /* Ficha do Agente */
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                  {/* Coluna Esquerda - Avatar e Info Básica */}
                  <div style={{ flex: '0 0 300px' }}>
                    {/* Avatar */}
                    <div style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: '15px',
                      background: selectedAgente.foto 
                        ? `url(data:image/jpeg;base64,${selectedAgente.foto}) center/cover`
                        : 'linear-gradient(135deg, #27ae60 0%, #1a5c3a 100%)',
                      border: '3px solid #27ae60',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '6rem'
                    }}>
                      {!selectedAgente.foto && '👤'}
                    </div>

                    {/* Info Básica */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '10px',
                      padding: '15px',
                      marginBottom: '15px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                        <div>
                          <div style={{ color: '#666', marginBottom: '3px' }}>ORIGEM</div>
                          <div style={{ color: '#fff', fontWeight: '600' }}>{selectedAgente.origem || '-'}</div>
                        </div>
                        <div>
                          <div style={{ color: '#666', marginBottom: '3px' }}>CLASSE</div>
                          <div style={{ color: '#fff', fontWeight: '600' }}>{selectedAgente.classe || '-'}</div>
                        </div>
                      </div>
                    </div>

                    {/* NEX e Deslocamento */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <div style={{
                        flex: 1,
                        background: 'rgba(39, 174, 96, 0.2)',
                        border: '1px solid #27ae60',
                        borderRadius: '10px',
                        padding: '15px',
                        textAlign: 'center'
                      }}>
                        <div style={{ color: '#27ae60', fontSize: '0.75rem', fontWeight: '600' }}>NEX</div>
                        <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700' }}>{selectedAgente.nex || 5}%</div>
                      </div>
                      <div style={{
                        flex: 1,
                        background: 'rgba(52, 152, 219, 0.2)',
                        border: '1px solid #3498db',
                        borderRadius: '10px',
                        padding: '15px',
                        textAlign: 'center'
                      }}>
                        <div style={{ color: '#3498db', fontSize: '0.75rem', fontWeight: '600' }}>PE/TURNO</div>
                        <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '700' }}>{selectedAgente.pe_turno || 1}</div>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '10px',
                      padding: '15px',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '5px' }}>DESLOCAMENTO</div>
                      <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>{selectedAgente.deslocamento || '9m / 6q'}</div>
                    </div>
                  </div>

                  {/* Coluna Direita - Stats */}
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    {/* Atributos */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '15px',
                      padding: '20px',
                      marginBottom: '20px'
                    }}>
                      <div style={{ color: '#27ae60', fontWeight: '600', marginBottom: '15px', fontSize: '0.9rem' }}>
                        ATRIBUTOS
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '10px'
                      }}>
                        {[
                          { label: 'AGI', value: selectedAgente.agi, color: '#3498db' },
                          { label: 'FOR', value: selectedAgente.forca, color: '#e74c3c' },
                          { label: 'INT', value: selectedAgente.inteligencia, color: '#9b59b6' },
                          { label: 'PRE', value: selectedAgente.pre, color: '#f39c12' },
                          { label: 'VIG', value: selectedAgente.vig, color: '#27ae60' }
                        ].map((attr) => (
                          <div
                            key={attr.label}
                            style={{
                              background: attr.color,
                              borderRadius: '12px',
                              padding: '15px 8px',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ color: '#fff', fontSize: '0.75rem', fontWeight: '600', opacity: 0.9 }}>
                              {attr.label}
                            </div>
                            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: '700' }}>
                              {attr.value || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Barras de Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                      {/* VIDA */}
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '10px',
                        padding: '12px 15px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ color: '#e74c3c', fontWeight: '600', fontSize: '0.85rem' }}>VIDA</span>
                          <span style={{ color: '#fff', fontWeight: '700' }}>{selectedAgente.vida_atual || 0}/{selectedAgente.vida_max || 0}</span>
                        </div>
                        <div style={{
                          height: '20px',
                          background: '#1a1a1a',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: '1px solid #333'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${selectedAgente.vida_max > 0 ? (selectedAgente.vida_atual / selectedAgente.vida_max * 100) : 0}%`,
                            background: 'linear-gradient(90deg, #c0392b, #e74c3c)',
                            borderRadius: '10px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      {/* SANIDADE */}
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '10px',
                        padding: '12px 15px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ color: '#3498db', fontWeight: '600', fontSize: '0.85rem' }}>SANIDADE</span>
                          <span style={{ color: '#fff', fontWeight: '700' }}>{selectedAgente.sanidade_atual || 0}/{selectedAgente.sanidade_max || 0}</span>
                        </div>
                        <div style={{
                          height: '20px',
                          background: '#1a1a1a',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: '1px solid #333'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${selectedAgente.sanidade_max > 0 ? (selectedAgente.sanidade_atual / selectedAgente.sanidade_max * 100) : 0}%`,
                            background: 'linear-gradient(90deg, #2980b9, #3498db)',
                            borderRadius: '10px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      {/* ESFORÇO */}
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '10px',
                        padding: '12px 15px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ color: '#f39c12', fontWeight: '600', fontSize: '0.85rem' }}>ESFORÇO</span>
                          <span style={{ color: '#fff', fontWeight: '700' }}>{selectedAgente.esforco_atual || 0}/{selectedAgente.esforco_max || 0}</span>
                        </div>
                        <div style={{
                          height: '20px',
                          background: '#1a1a1a',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: '1px solid #333'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${selectedAgente.esforco_max > 0 ? (selectedAgente.esforco_atual / selectedAgente.esforco_max * 100) : 0}%`,
                            background: 'linear-gradient(90deg, #d68910, #f39c12)',
                            borderRadius: '10px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Defesa, Bloqueio, Esquiva */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '15px',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        border: '1px solid #333'
                      }}>
                        <div style={{ 
                          fontSize: '2.5rem', 
                          fontWeight: '700', 
                          color: '#fff',
                          marginBottom: '5px'
                        }}>
                          {selectedAgente.defesa || 10}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.75rem', fontWeight: '600' }}>DEFESA</div>
                      </div>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        border: '1px solid #333'
                      }}>
                        <div style={{ 
                          fontSize: '2.5rem', 
                          fontWeight: '700', 
                          color: '#fff',
                          marginBottom: '5px'
                        }}>
                          {selectedAgente.bloqueio || 0}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.75rem', fontWeight: '600' }}>BLOQUEIO</div>
                      </div>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        border: '1px solid #333'
                      }}>
                        <div style={{ 
                          fontSize: '2.5rem', 
                          fontWeight: '700', 
                          color: '#fff',
                          marginBottom: '5px'
                        }}>
                          {selectedAgente.esquiva || 0}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.75rem', fontWeight: '600' }}>ESQUIVA</div>
                      </div>
                    </div>

                    {/* Proteção, Resistências, Proficiências */}
                    {(selectedAgente.protecao || selectedAgente.resistencias || selectedAgente.proficiencias) && (
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '10px',
                        padding: '15px'
                      }}>
                        {selectedAgente.protecao && (
                          <div style={{ marginBottom: '10px' }}>
                            <span style={{ color: '#666', fontSize: '0.8rem' }}>PROTEÇÃO: </span>
                            <span style={{ color: '#fff', fontSize: '0.9rem' }}>{selectedAgente.protecao}</span>
                          </div>
                        )}
                        {selectedAgente.resistencias && (
                          <div style={{ marginBottom: '10px' }}>
                            <span style={{ color: '#666', fontSize: '0.8rem' }}>RESISTÊNCIAS: </span>
                            <span style={{ color: '#fff', fontSize: '0.9rem' }}>{selectedAgente.resistencias}</span>
                          </div>
                        )}
                        {selectedAgente.proficiencias && (
                          <div>
                            <span style={{ color: '#666', fontSize: '0.8rem' }}>PROFICIÊNCIAS: </span>
                            <span style={{ color: '#fff', fontSize: '0.9rem' }}>{selectedAgente.proficiencias}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
