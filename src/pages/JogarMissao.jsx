import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

// Cores de patente dos itens
const PATENTE_CORES = {
  1: { cor: '#9e9e9e', nome: 'Comum', glow: 'rgba(158, 158, 158, 0.4)' },
  2: { cor: '#4caf50', nome: 'Incomum', glow: 'rgba(76, 175, 80, 0.4)' },
  3: { cor: '#2196f3', nome: 'Raro', glow: 'rgba(33, 150, 243, 0.4)' },
  4: { cor: '#9c27b0', nome: 'Épico', glow: 'rgba(156, 39, 176, 0.4)' }
};

export default function JogarMissaoPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [missao, setMissao] = useState(null);
  const [agente, setAgente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ficha'); // 'ficha', 'anotacoes', 'itens', 'dados'
  
  // Campos editáveis
  const [anotacoes, setAnotacoes] = useState('');
  const [descricao, setDescricao] = useState('');
  
  // Modo de edição da ficha
  const [editMode, setEditMode] = useState(false);
  const [editedAgente, setEditedAgente] = useState(null);
  
  // Determinação atual (local state)
  const [determinacaoAtual, setDeterminacaoAtual] = useState(0);
  
  // Estilo de ficha: 'empenho' ou 'determinacao'
  const [fichaStyle, setFichaStyle] = useState('empenho');
  
  // Itens
  const [itens, setItens] = useState([]);
  
  // Histórico de rolagens de dados
  const [rolagens, setRolagens] = useState([]);
  const [ultimaRolagem, setUltimaRolagem] = useState(null);
  const [minhaUltimaRolagem, setMinhaUltimaRolagem] = useState(null);
  const [rolagensNaoVistas, setRolagensNaoVistas] = useState(0);
  const minhaRolagemTimeoutRef = useRef(null);
  const rolagensCountRef = useRef(0);
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [novoItem, setNovoItem] = useState({
    nome: '',
    patente: 1,
    espaco: 1,
    tipo: ''
  });

  const token = localStorage.getItem('authToken');
  const currentUserId = token ? decodeToken(token)?.user_id : null;

  useEffect(() => {
    if (id) {
      loadMissao();
      loadAgente();
      loadItens();
      loadRolagens();
      
      // Polling para atualizar rolagens a cada 3 segundos
      const interval = setInterval(() => {
        loadRolagens();
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [id]);

  const loadMissao = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/missoes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMissao(data);
      }
    } catch (err) {
      console.error('Erro ao carregar missão:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAgente = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/agentes/${currentUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAgente(data);
        // Inicializar determinação atual com o máximo calculado
        const empenhoPorDivisao = { 'Vanguarda': 2, 'Serafim': 3, 'Irmandade': 4 };
        const empenhoDivisao = empenhoPorDivisao[data.grupo] || 2;
        const nivel = Math.floor((data.nex || 0) / 5);
        const empenhoMax = (empenhoDivisao * nivel) + (2 * nivel);
        const detMax = empenhoMax + (1 * nivel);
        setDeterminacaoAtual(detMax);
      }
    } catch (err) {
      console.error('Erro ao carregar agente:', err);
    }
  };

  const loadItens = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/missoes/${id}/itens`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItens(data);
      }
    } catch (err) {
      console.error('Erro ao carregar itens:', err);
    }
  };

  const handleCreateItem = async () => {
    if (!novoItem.nome.trim()) {
      alert('Nome do item é obrigatório');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/missoes/${id}/itens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(novoItem)
      });

      if (res.ok) {
        setShowCreateItemModal(false);
        setNovoItem({ nome: '', patente: 1, espaco: 1, tipo: '' });
        loadItens();
      } else {
        const err = await res.json();
        alert(err.erro || 'Erro ao criar item');
      }
    } catch (err) {
      console.error('Erro ao criar item:', err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Remover este item?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/missoes/${id}/itens/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        loadItens();
      }
    } catch (err) {
      console.error('Erro ao remover item:', err);
    }
  };

  // Carregar rolagens do servidor
  const loadRolagens = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/missoes/${id}/rolagens`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        
        // Verificar se há novas rolagens (comparando com a ref)
        if (data.length > rolagensCountRef.current && activeTab !== 'dados') {
          const novasRolagens = data.length - rolagensCountRef.current;
          setRolagensNaoVistas(prev => prev + novasRolagens);
        }
        
        // Atualizar a ref com a contagem atual
        rolagensCountRef.current = data.length;
        
        setRolagens(data);
        if (data.length > 0) {
          setUltimaRolagem(data[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar rolagens:', err);
    }
  };

  // Limpar rolagens no servidor
  const limparRolagens = async () => {
    if (!confirm('Limpar todo o histórico de rolagens?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/missoes/${id}/rolagens`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setRolagens([]);
        setUltimaRolagem(null);
      } else {
        const err = await res.json();
        alert(err.erro || 'Erro ao limpar rolagens');
      }
    } catch (err) {
      console.error('Erro ao limpar rolagens:', err);
    }
  };

  // Função para rolar dados
  const rolarDados = async (atributoNome, quantidade, cor) => {
    let resultados = [];
    let melhor;
    let tipo = 'normal';
    
    if (quantidade <= 0) {
      // Se o atributo for 0, rola 2d20 e pega o menor
      const dado1 = Math.floor(Math.random() * 20) + 1;
      const dado2 = Math.floor(Math.random() * 20) + 1;
      resultados = [dado1, dado2];
      melhor = Math.min(...resultados);
      tipo = 'desvantagem';
      quantidade = 2;
    } else {
      // Rola X dados de 20 lados
      for (let i = 0; i < quantidade; i++) {
        resultados.push(Math.floor(Math.random() * 20) + 1);
      }
      melhor = Math.max(...resultados);
    }
    
    // Salvar no servidor
    try {
      const res = await fetch(`${API_BASE_URL}/missoes/${id}/rolagens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          atributo: atributoNome,
          quantidade,
          resultados,
          melhor,
          cor,
          tipo
        })
      });
      
      if (res.ok) {
        const novaRolagem = await res.json();
        setUltimaRolagem(novaRolagem);
        setRolagens(prev => [novaRolagem, ...prev]);
        
        // Incrementar contador se não estiver na aba dados
        if (activeTab !== 'dados') {
          setRolagensNaoVistas(prev => prev + 1);
        }
        
        // Mostrar minha última rolagem na ficha por 10 segundos
        setMinhaUltimaRolagem(novaRolagem);
        
        // Limpar timeout anterior se existir
        if (minhaRolagemTimeoutRef.current) {
          clearTimeout(minhaRolagemTimeoutRef.current);
        }
        
        // Esconder após 10 segundos
        minhaRolagemTimeoutRef.current = setTimeout(() => {
          setMinhaUltimaRolagem(null);
        }, 10000);
      }
    } catch (err) {
      console.error('Erro ao salvar rolagem:', err);
    }
  };

  // Função para entrar/sair do modo de edição e salvar
  const toggleEditMode = async () => {
    if (editMode) {
      // Está saindo do modo de edição - salvar alterações
      try {
        const res = await fetch(`${API_BASE_URL}/agentes/${currentUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            agi: editedAgente.agi,
            forca: editedAgente.forca,
            inteligencia: editedAgente.inteligencia,
            pre: editedAgente.pre,
            vig: editedAgente.vig,
            vida_atual: editedAgente.vida_atual,
            vida_max: editedAgente.vida_max,
            sanidade_atual: editedAgente.sanidade_atual,
            sanidade_max: editedAgente.sanidade_max,
            esforco_atual: editedAgente.esforco_atual,
            esforco_max: editedAgente.esforco_max,
            defesa: editedAgente.defesa,
            bloqueio: editedAgente.bloqueio,
            esquiva: editedAgente.esquiva,
            protecao: editedAgente.protecao,
            nex: editedAgente.nex,
            classe: editedAgente.classe,
            origem: editedAgente.origem
          })
        });
        
        if (res.ok) {
          setAgente({ ...editedAgente });
          setEditMode(false);
        } else {
          alert('Erro ao salvar alterações');
        }
      } catch (err) {
        console.error('Erro ao salvar ficha:', err);
        alert('Erro ao salvar alterações');
      }
    } else {
      // Entrando no modo de edição
      setEditedAgente({ ...agente });
      setEditMode(true);
    }
  };

  // Função para atualizar campo editável
  const updateEditedField = (field, value) => {
    setEditedAgente(prev => ({ ...prev, [field]: value }));
  };

  // Função para atualizar valor atual em tempo real (salva no servidor)
  const updateValorAtual = async (field, delta) => {
    const currentValue = agente[field] || 0;
    const maxField = field.replace('_atual', '_max');
    const maxValue = agente[maxField] || 999;
    const newValue = Math.max(0, Math.min(maxValue, currentValue + delta));
    
    // Atualizar localmente primeiro
    setAgente(prev => ({ ...prev, [field]: newValue }));
    
    // Salvar no servidor
    try {
      await fetch(`${API_BASE_URL}/agentes/${currentUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: newValue })
      });
    } catch (err) {
      console.error('Erro ao salvar valor:', err);
    }
  };

  // Função para atualizar determinação atual (local, sem salvar no servidor)
  const updateDeterminacaoAtual = (delta) => {
    const maxDet = calcularDeterminacao();
    setDeterminacaoAtual(prev => Math.max(0, Math.min(maxDet, prev + delta)));
  };

  // Função para calcular Empenho
  // Fórmula: (empenho_divisao × nivel) + (2 × nivel)
  // Nivel = NEX / 5
  // Empenhos: Vanguarda = 2, Serafim = 3, Irmandade = 4
  const calcularEmpenho = () => {
    const agenteData = editMode ? editedAgente : agente;
    if (!agenteData) return 0;
    
    const empenhoPorDivisao = {
      'Vanguarda': 2,
      'Serafim': 3,
      'Irmandade': 4
    };
    
    const empenhoDivisao = empenhoPorDivisao[agenteData.grupo] || 2;
    const nex = agenteData.nex || 0;
    const nivel = Math.floor(nex / 5);
    
    // Fórmula: (empenho_divisao × nivel) + (2 × nivel)
    return (empenhoDivisao * nivel) + (2 * nivel);
  };

  // Função para calcular Determinação
  // Fórmula: Empenho + (1 × nivel)
  const calcularDeterminacao = () => {
    const agenteData = editMode ? editedAgente : agente;
    if (!agenteData) return 0;
    
    const nex = agenteData.nex || 0;
    const nivel = Math.floor(nex / 5);
    
    // Fórmula: Empenho + (1 × nivel)
    return calcularEmpenho() + (1 * nivel);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666'
      }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
      padding: '20px',
      paddingTop: '200px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
          <button
            onClick={() => navigate(`/missao/${id}`)}
            style={{
              background: 'transparent',
              border: '1px solid #444',
              color: '#999',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            ← Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '2rem' }}>🎮</span>
            <div>
              <h1 style={{
                color: '#4a90d9',
                fontSize: '1.8rem',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                Mesa
              </h1>
              <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
                {missao?.nome || 'Carregando...'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {['ficha', 'anotacoes', 'itens', 'dados'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'dados') {
                  setRolagensNaoVistas(0);
                }
              }}
              style={{
                background: activeTab === tab ? '#4a90d9' : 'rgba(30, 30, 30, 0.8)',
                border: activeTab === tab ? '2px solid #4a90d9' : '2px solid #333',
                color: activeTab === tab ? '#fff' : '#888',
                padding: '12px 25px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                textTransform: 'capitalize',
                transition: 'all 0.3s',
                position: 'relative'
              }}
            >
              {tab === 'ficha' && '📋 '}
              {tab === 'anotacoes' && '📝 '}
              {tab === 'itens' && '🎒 '}
              {tab === 'dados' && '🎲 '}
              {tab}
              {tab === 'dados' && rolagensNaoVistas > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#e74c3c',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {rolagensNaoVistas > 99 ? '99+' : rolagensNaoVistas}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Tab Ficha */}
        {activeTab === 'ficha' && agente && (
          <div style={{
            background: 'rgba(20, 20, 30, 0.9)',
            border: '2px solid #4a90d9',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 0 40px rgba(74, 144, 217, 0.2)',
            position: 'relative'
          }}>
            {/* Botão de Edição (Lápis) - Canto Superior Direito */}
            <button
              onClick={toggleEditMode}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: editMode ? 'rgba(46, 204, 113, 0.3)' : 'rgba(74, 144, 217, 0.2)',
                border: `2px solid ${editMode ? '#2ecc71' : '#4a90d9'}`,
                borderRadius: '10px',
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: editMode ? '#2ecc71' : '#4a90d9',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: editMode ? 1 : 0.6
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = editMode ? '1' : '0.6';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={editMode ? 'Salvar alterações' : 'Editar ficha'}
            >
              {editMode ? '💾' : '✏️'}
            </button>

            {/* Botão de Alternar Estilo de Ficha - Ao lado do lápis */}
            <button
              onClick={() => setFichaStyle(fichaStyle === 'empenho' ? 'determinacao' : 'empenho')}
              style={{
                position: 'absolute',
                top: '20px',
                right: '90px',
                background: fichaStyle === 'determinacao' ? 'rgba(155, 89, 182, 0.3)' : 'rgba(74, 144, 217, 0.2)',
                border: `2px solid ${fichaStyle === 'determinacao' ? '#9b59b6' : '#4a90d9'}`,
                borderRadius: '10px',
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: fichaStyle === 'determinacao' ? '#9b59b6' : '#4a90d9',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: 0.6
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.6';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={fichaStyle === 'empenho' ? 'Mudar para Determinação' : 'Mudar para Empenho'}
            >
              {fichaStyle === 'determinacao' ? 'Determinação 🔥' : 'Empenho ⚡'}
            </button>

            {/* Cabeçalho da Ficha */}
            <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
              {/* Foto */}
              <div style={{
                width: '150px',
                height: '150px',
                borderRadius: '15px',
                background: '#333',
                overflow: 'hidden',
                border: '3px solid #4a90d9',
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
                    fontSize: '4rem'
                  }}>
                    👤
                  </div>
                )}
              </div>

              {/* Info básica */}
              <div style={{ flex: 1 }}>
                <h2 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '1.8rem' }}>
                  {agente.display_name || agente.username}
                </h2>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ color: '#888' }}>
                    <span style={{ color: '#4a90d9' }}>Classe:</span> {agente.classe || 'N/A'}
                  </div>
                  <div style={{ color: '#888' }}>
                    <span style={{ color: '#4a90d9' }}>NEX:</span> {agente.nex || 0}%
                  </div>
                  <div style={{ color: '#888' }}>
                    <span style={{ color: '#4a90d9' }}>Origem:</span> {agente.origem || 'N/A'}
                  </div>
                  <div style={{ color: '#888' }}>
                    <span style={{ color: '#4a90d9' }}>Divisão:</span> {agente.grupo || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Barras de Status */}
            {fichaStyle === 'empenho' ? (
              /* Estilo Empenho - 3 barras: Vida, Sanidade, Empenho */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                {/* Vida */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#e74c3c', fontWeight: '600' }}>❤️ Vida</span>
                    {editMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                          type="number"
                          value={editedAgente?.vida_atual || 0}
                          onChange={(e) => updateEditedField('vida_atual', parseInt(e.target.value) || 0)}
                          style={{ width: '50px', background: 'rgba(0,0,0,0.5)', border: '1px solid #e74c3c', borderRadius: '5px', color: '#fff', textAlign: 'center', padding: '2px' }}
                        />
                        <span style={{ color: '#fff' }}>/</span>
                        <input
                          type="number"
                          value={editedAgente?.vida_max || 0}
                          onChange={(e) => updateEditedField('vida_max', parseInt(e.target.value) || 0)}
                          style={{ width: '50px', background: 'rgba(0,0,0,0.5)', border: '1px solid #e74c3c', borderRadius: '5px', color: '#fff', textAlign: 'center', padding: '2px' }}
                        />
                      </div>
                    ) : (
                      <span style={{ color: '#fff' }}>{agente.vida_atual || 0}/{agente.vida_max || 0}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => updateValorAtual('vida_atual', -5)} style={{ background: 'rgba(231,76,60,0.3)', border: '1px solid #e74c3c', borderRadius: '4px', color: '#e74c3c', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>«</button>
                      <button onClick={() => updateValorAtual('vida_atual', -1)} style={{ background: 'rgba(231,76,60,0.3)', border: '1px solid #e74c3c', borderRadius: '4px', color: '#e74c3c', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}>‹</button>
                    </div>
                    <div style={{ flex: 1, background: '#333', borderRadius: '10px', height: '20px', overflow: 'hidden' }}>
                      <div style={{ width: `${((editMode ? editedAgente?.vida_atual : agente.vida_atual) / ((editMode ? editedAgente?.vida_max : agente.vida_max) || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #c0392b, #e74c3c)', borderRadius: '10px', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => updateValorAtual('vida_atual', 1)} style={{ background: 'rgba(231,76,60,0.3)', border: '1px solid #e74c3c', borderRadius: '4px', color: '#e74c3c', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}>›</button>
                      <button onClick={() => updateValorAtual('vida_atual', 5)} style={{ background: 'rgba(231,76,60,0.3)', border: '1px solid #e74c3c', borderRadius: '4px', color: '#e74c3c', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>»</button>
                    </div>
                  </div>
                </div>

                {/* Sanidade */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#3498db', fontWeight: '600' }}>🧠 Sanidade</span>
                    {editMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                          type="number"
                          value={editedAgente?.sanidade_atual || 0}
                          onChange={(e) => updateEditedField('sanidade_atual', parseInt(e.target.value) || 0)}
                          style={{ width: '50px', background: 'rgba(0,0,0,0.5)', border: '1px solid #3498db', borderRadius: '5px', color: '#fff', textAlign: 'center', padding: '2px' }}
                        />
                        <span style={{ color: '#fff' }}>/</span>
                        <input
                          type="number"
                          value={editedAgente?.sanidade_max || 0}
                          onChange={(e) => updateEditedField('sanidade_max', parseInt(e.target.value) || 0)}
                          style={{ width: '50px', background: 'rgba(0,0,0,0.5)', border: '1px solid #3498db', borderRadius: '5px', color: '#fff', textAlign: 'center', padding: '2px' }}
                        />
                      </div>
                    ) : (
                      <span style={{ color: '#fff' }}>{agente.sanidade_atual || 0}/{agente.sanidade_max || 0}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => updateValorAtual('sanidade_atual', -5)} style={{ background: 'rgba(52,152,219,0.3)', border: '1px solid #3498db', borderRadius: '4px', color: '#3498db', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>«</button>
                      <button onClick={() => updateValorAtual('sanidade_atual', -1)} style={{ background: 'rgba(52,152,219,0.3)', border: '1px solid #3498db', borderRadius: '4px', color: '#3498db', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}>‹</button>
                    </div>
                    <div style={{ flex: 1, background: '#333', borderRadius: '10px', height: '20px', overflow: 'hidden' }}>
                      <div style={{ width: `${((editMode ? editedAgente?.sanidade_atual : agente.sanidade_atual) / ((editMode ? editedAgente?.sanidade_max : agente.sanidade_max) || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #2980b9, #3498db)', borderRadius: '10px', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => updateValorAtual('sanidade_atual', 1)} style={{ background: 'rgba(52,152,219,0.3)', border: '1px solid #3498db', borderRadius: '4px', color: '#3498db', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}>›</button>
                      <button onClick={() => updateValorAtual('sanidade_atual', 5)} style={{ background: 'rgba(52,152,219,0.3)', border: '1px solid #3498db', borderRadius: '4px', color: '#3498db', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>»</button>
                    </div>
                  </div>
                </div>

                {/* Empenho */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#f39c12', fontWeight: '600' }}>⚡ Empenho</span>
                    {editMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                          type="number"
                          value={editedAgente?.esforco_atual || 0}
                          onChange={(e) => updateEditedField('esforco_atual', parseInt(e.target.value) || 0)}
                          style={{ width: '50px', background: 'rgba(0,0,0,0.5)', border: '1px solid #f39c12', borderRadius: '5px', color: '#fff', textAlign: 'center', padding: '2px' }}
                        />
                        <span style={{ color: '#fff' }}>/</span>
                        <input
                          type="number"
                          value={editedAgente?.esforco_max || 0}
                          onChange={(e) => updateEditedField('esforco_max', parseInt(e.target.value) || 0)}
                          style={{ width: '50px', background: 'rgba(0,0,0,0.5)', border: '1px solid #f39c12', borderRadius: '5px', color: '#fff', textAlign: 'center', padding: '2px' }}
                        />
                      </div>
                    ) : (
                      <span style={{ color: '#fff' }}>{agente.esforco_atual || 0}/{agente.esforco_max || 0}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => updateValorAtual('esforco_atual', -5)} style={{ background: 'rgba(243,156,18,0.3)', border: '1px solid #f39c12', borderRadius: '4px', color: '#f39c12', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>«</button>
                      <button onClick={() => updateValorAtual('esforco_atual', -1)} style={{ background: 'rgba(243,156,18,0.3)', border: '1px solid #f39c12', borderRadius: '4px', color: '#f39c12', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}>‹</button>
                    </div>
                    <div style={{ flex: 1, background: '#333', borderRadius: '10px', height: '20px', overflow: 'hidden' }}>
                      <div style={{ width: `${((editMode ? editedAgente?.esforco_atual : agente.esforco_atual) / ((editMode ? editedAgente?.esforco_max : agente.esforco_max) || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #e67e22, #f39c12)', borderRadius: '10px', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => updateValorAtual('esforco_atual', 1)} style={{ background: 'rgba(243,156,18,0.3)', border: '1px solid #f39c12', borderRadius: '4px', color: '#f39c12', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}>›</button>
                      <button onClick={() => updateValorAtual('esforco_atual', 5)} style={{ background: 'rgba(243,156,18,0.3)', border: '1px solid #f39c12', borderRadius: '4px', color: '#f39c12', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>»</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Estilo Determinação - 2 barras: Vida e Determinação */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px' }}>
                {/* Vida */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#e74c3c', fontWeight: '600' }}>❤️ Vida</span>
                    {editMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                          type="number"
                          value={editedAgente?.vida_atual || 0}
                          onChange={(e) => updateEditedField('vida_atual', parseInt(e.target.value) || 0)}
                          style={{ width: '50px', background: 'rgba(0,0,0,0.5)', border: '1px solid #e74c3c', borderRadius: '5px', color: '#fff', textAlign: 'center', padding: '2px' }}
                        />
                        <span style={{ color: '#fff' }}>/</span>
                        <input
                          type="number"
                          value={editedAgente?.vida_max || 0}
                          onChange={(e) => updateEditedField('vida_max', parseInt(e.target.value) || 0)}
                          style={{ width: '50px', background: 'rgba(0,0,0,0.5)', border: '1px solid #e74c3c', borderRadius: '5px', color: '#fff', textAlign: 'center', padding: '2px' }}
                        />
                      </div>
                    ) : (
                      <span style={{ color: '#fff' }}>{agente.vida_atual || 0}/{agente.vida_max || 0}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => updateValorAtual('vida_atual', -5)} style={{ background: 'rgba(231,76,60,0.3)', border: '1px solid #e74c3c', borderRadius: '4px', color: '#e74c3c', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>«</button>
                      <button onClick={() => updateValorAtual('vida_atual', -1)} style={{ background: 'rgba(231,76,60,0.3)', border: '1px solid #e74c3c', borderRadius: '4px', color: '#e74c3c', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}>‹</button>
                    </div>
                    <div style={{ flex: 1, background: '#333', borderRadius: '10px', height: '20px', overflow: 'hidden' }}>
                      <div style={{ width: `${((editMode ? editedAgente?.vida_atual : agente.vida_atual) / ((editMode ? editedAgente?.vida_max : agente.vida_max) || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #c0392b, #e74c3c)', borderRadius: '10px', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => updateValorAtual('vida_atual', 1)} style={{ background: 'rgba(231,76,60,0.3)', border: '1px solid #e74c3c', borderRadius: '4px', color: '#e74c3c', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}>›</button>
                      <button onClick={() => updateValorAtual('vida_atual', 5)} style={{ background: 'rgba(231,76,60,0.3)', border: '1px solid #e74c3c', borderRadius: '4px', color: '#e74c3c', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>»</button>
                    </div>
                  </div>
                </div>

                {/* Determinação */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#3498db', fontWeight: '600' }}>🔥 Determinação</span>
                    <span style={{ color: '#fff' }}>{determinacaoAtual}/{calcularDeterminacao()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => updateDeterminacaoAtual(-5)} style={{ background: 'rgba(52,152,219,0.3)', border: '1px solid #3498db', borderRadius: '4px', color: '#3498db', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>«</button>
                      <button onClick={() => updateDeterminacaoAtual(-1)} style={{ background: 'rgba(52,152,219,0.3)', border: '1px solid #3498db', borderRadius: '4px', color: '#3498db', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}>‹</button>
                    </div>
                    <div style={{ flex: 1, background: '#333', borderRadius: '10px', height: '20px', overflow: 'hidden' }}>
                      <div style={{ width: `${(determinacaoAtual / (calcularDeterminacao() || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #2980b9, #3498db)', borderRadius: '10px', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button onClick={() => updateDeterminacaoAtual(1)} style={{ background: 'rgba(52,152,219,0.3)', border: '1px solid #3498db', borderRadius: '4px', color: '#3498db', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}>›</button>
                      <button onClick={() => updateDeterminacaoAtual(5)} style={{ background: 'rgba(52,152,219,0.3)', border: '1px solid #3498db', borderRadius: '4px', color: '#3498db', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>»</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Atributos */}
            <h3 style={{ color: '#4a90d9', marginBottom: '15px' }}>
              Atributos 
              <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 'normal' }}>
                {editMode ? '(clique para editar)' : '(clique para rolar)'}
              </span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '30px' }}>
              {[
                { nome: 'AGI', campo: 'agi', valor: editMode ? editedAgente?.agi : agente.agi, cor: '#27ae60' },
                { nome: 'FOR', campo: 'forca', valor: editMode ? editedAgente?.forca : agente.forca, cor: '#e74c3c' },
                { nome: 'INT', campo: 'inteligencia', valor: editMode ? editedAgente?.inteligencia : agente.inteligencia, cor: '#3498db' },
                { nome: 'PRE', campo: 'pre', valor: editMode ? editedAgente?.pre : agente.pre, cor: '#9b59b6' },
                { nome: 'VIG', campo: 'vig', valor: editMode ? editedAgente?.vig : agente.vig, cor: '#f39c12' }
              ].map(attr => (
                <div 
                  key={attr.nome} 
                  onClick={() => !editMode && rolarDados(attr.nome, attr.valor || 0, attr.cor)}
                  style={{
                    background: editMode ? 'rgba(46, 204, 113, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                    border: `2px solid ${editMode ? '#2ecc71' : attr.cor}`,
                    borderRadius: '10px',
                    padding: '15px',
                    textAlign: 'center',
                    cursor: editMode ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!editMode) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = `0 0 20px ${attr.cor}66`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ color: attr.cor, fontWeight: '700', fontSize: '0.9rem' }}>{attr.nome}</div>
                  {editMode ? (
                    <input
                      type="number"
                      value={attr.valor || 0}
                      onChange={(e) => updateEditedField(attr.campo, parseInt(e.target.value) || 0)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '60px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: `1px solid ${attr.cor}`,
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        textAlign: 'center',
                        padding: '5px',
                        marginTop: '5px'
                      }}
                    />
                  ) : (
                    <>
                      <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '700' }}>{attr.valor || 0}</div>
                      <div style={{ color: '#666', fontSize: '0.7rem', marginTop: '5px' }}>🎲 {attr.valor || 0}d20</div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Última rolagem inline - apenas do usuário atual, desaparece após 10s */}
            {minhaUltimaRolagem && (
              <div style={{
                background: `linear-gradient(135deg, ${minhaUltimaRolagem.cor}22 0%, rgba(20, 20, 30, 0.9) 100%)`,
                border: `2px solid ${minhaUltimaRolagem.cor}`,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '30px',
                animation: 'fadeIn 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Foto do agente */}
                    <div style={{
                      width: '35px',
                      height: '35px',
                      borderRadius: '50%',
                      background: '#333',
                      overflow: 'hidden',
                      border: `2px solid ${minhaUltimaRolagem.cor}`,
                      flexShrink: 0
                    }}>
                      {minhaUltimaRolagem.foto ? (
                        <img
                          src={`data:image/png;base64,${minhaUltimaRolagem.foto}`}
                          alt={minhaUltimaRolagem.display_name}
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
                          fontSize: '0.9rem'
                        }}>
                          👤
                        </div>
                      )}
                    </div>
                    <span style={{ color: '#fff', fontWeight: '600' }}>{minhaUltimaRolagem.display_name || 'Agente'}</span>
                    <span style={{ fontSize: '1.2rem' }}>🎲</span>
                    <span style={{ color: minhaUltimaRolagem.cor, fontWeight: '700' }}>{minhaUltimaRolagem.atributo}</span>
                    <span style={{ color: '#666', fontSize: '0.85rem' }}>({minhaUltimaRolagem.quantidade}d20{minhaUltimaRolagem.tipo === 'desvantagem' ? ' - Desvantagem' : ''})</span>
                  </div>
                  <span style={{ color: '#666', fontSize: '0.8rem' }}>{minhaUltimaRolagem.data_criacao ? new Date(minhaUltimaRolagem.data_criacao).toLocaleTimeString() : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {/* Resultado principal */}
                  <div style={{
                    background: minhaUltimaRolagem.melhor === 20 ? 'linear-gradient(135deg, #f39c12, #e67e22)' : minhaUltimaRolagem.melhor === 1 ? 'linear-gradient(135deg, #e74c3c, #c0392b)' : minhaUltimaRolagem.cor,
                    color: '#fff',
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    width: '80px',
                    height: '80px',
                    borderRadius: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: minhaUltimaRolagem.melhor === 20 ? '0 0 30px rgba(243, 156, 18, 0.6)' : minhaUltimaRolagem.melhor === 1 ? '0 0 30px rgba(231, 76, 60, 0.6)' : `0 0 20px ${minhaUltimaRolagem.cor}66`,
                    position: 'relative'
                  }}>
                    {minhaUltimaRolagem.melhor}
                    {minhaUltimaRolagem.melhor === 20 && <span style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '1.2rem' }}>⭐</span>}
                    {minhaUltimaRolagem.melhor === 1 && <span style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '1.2rem' }}>💀</span>}
                  </div>
                  {/* Outros resultados */}
                  {minhaUltimaRolagem.resultados && minhaUltimaRolagem.resultados.length > 1 && (
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '8px' }}>Outros resultados:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {minhaUltimaRolagem.resultados.filter(r => r !== minhaUltimaRolagem.melhor || minhaUltimaRolagem.resultados.filter(x => x === minhaUltimaRolagem.melhor).length > 1).map((resultado, idx) => {
                          // Skip the first occurrence of melhor if there's only one
                          if (resultado === minhaUltimaRolagem.melhor && minhaUltimaRolagem.resultados.indexOf(minhaUltimaRolagem.melhor) === minhaUltimaRolagem.resultados.lastIndexOf(minhaUltimaRolagem.melhor)) {
                            if (idx === minhaUltimaRolagem.resultados.indexOf(minhaUltimaRolagem.melhor)) return null;
                          }
                          return (
                            <span
                              key={idx}
                              style={{
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid #444',
                                color: '#888',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                opacity: 0.7
                              }}
                            >
                              {resultado}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Defesas */}
            <h3 style={{ color: '#4a90d9', marginBottom: '15px' }}>Defesas</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              {[
                { nome: 'Defesa', campo: 'defesa', valor: editMode ? editedAgente?.defesa : agente.defesa },
                { nome: 'Bloqueio', campo: 'bloqueio', valor: editMode ? editedAgente?.bloqueio : agente.bloqueio },
                { nome: 'Esquiva', campo: 'esquiva', valor: editMode ? editedAgente?.esquiva : agente.esquiva },
                { nome: 'Proteção', campo: 'protecao', valor: editMode ? editedAgente?.protecao : agente.protecao }
              ].map(def => (
                <div key={def.nome} style={{
                  background: editMode ? 'rgba(46, 204, 113, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${editMode ? '#2ecc71' : '#555'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#888', fontSize: '0.8rem' }}>{def.nome}</div>
                  {editMode ? (
                    <input
                      type="number"
                      value={def.valor || 0}
                      onChange={(e) => updateEditedField(def.campo, parseInt(e.target.value) || 0)}
                      style={{
                        width: '60px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid #555',
                        borderRadius: '5px',
                        color: '#fff',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        textAlign: 'center',
                        padding: '5px',
                        marginTop: '5px'
                      }}
                    />
                  ) : (
                    <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '600' }}>{def.valor || 0}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Anotações */}
        {activeTab === 'anotacoes' && (
          <div style={{
            background: 'rgba(20, 20, 30, 0.9)',
            border: '2px solid #f39c12',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 0 40px rgba(243, 156, 18, 0.2)'
          }}>
            <h2 style={{ color: '#f39c12', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📝 Anotações e Descrições
            </h2>

            {/* Descrição da cena */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ color: '#ccc', display: 'block', marginBottom: '10px', fontWeight: '600' }}>
                Descrição da Cena Atual
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o que está acontecendo na cena..."
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '15px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #555',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1rem',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Anotações pessoais */}
            <div>
              <label style={{ color: '#ccc', display: 'block', marginBottom: '10px', fontWeight: '600' }}>
                Anotações Pessoais
              </label>
              <textarea
                value={anotacoes}
                onChange={(e) => setAnotacoes(e.target.value)}
                placeholder="Suas anotações pessoais sobre a missão..."
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '15px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #555',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1rem',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}

        {/* Tab Itens */}
        {activeTab === 'itens' && (
          <div style={{
            background: 'rgba(20, 20, 30, 0.9)',
            border: '2px solid #9b59b6',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 0 40px rgba(155, 89, 182, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ color: '#9b59b6', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                🎒 Inventário
              </h2>
              <button
                onClick={() => setShowCreateItemModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
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
                  boxShadow: '0 4px 15px rgba(155, 89, 182, 0.4)'
                }}
              >
                + Novo Item
              </button>
            </div>

            {/* Lista de Itens */}
            {itens.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px',
                color: '#666',
                border: '2px dashed #444',
                borderRadius: '15px'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎒</div>
                <div>Nenhum item no inventário</div>
                <div style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                  Clique em "+ Novo Item" para adicionar
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '15px'
              }}>
                {itens.map(item => {
                  const patente = PATENTE_CORES[item.patente] || PATENTE_CORES[1];
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: `linear-gradient(135deg, ${patente.cor}15 0%, rgba(30, 30, 40, 0.9) 100%)`,
                        border: `2px solid ${patente.cor}`,
                        borderRadius: '12px',
                        padding: '15px',
                        boxShadow: `0 0 20px ${patente.glow}`,
                        position: 'relative'
                      }}
                    >
                      {/* Badge de patente */}
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: patente.cor,
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '15px',
                        fontSize: '0.7rem',
                        fontWeight: '700'
                      }}>
                        {patente.nome}
                      </div>

                      <div style={{ color: '#fff', fontWeight: '600', fontSize: '1.1rem', marginBottom: '10px' }}>
                        {item.nome}
                      </div>

                      <div style={{ display: 'flex', gap: '15px', color: '#888', fontSize: '0.85rem' }}>
                        <span>📦 Espaço: {item.espaco}</span>
                        {item.tipo && <span>🏷️ {item.tipo}</span>}
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          right: '10px',
                          background: 'rgba(231, 76, 60, 0.2)',
                          border: '1px solid #e74c3c',
                          color: '#e74c3c',
                          padding: '5px 10px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Dados */}
        {activeTab === 'dados' && (
          <div style={{
            background: 'rgba(20, 20, 30, 0.9)',
            border: '2px solid #e74c3c',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 0 40px rgba(231, 76, 60, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ color: '#e74c3c', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                🎲 Histórico de Rolagens
                <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 'normal' }}>(atualiza automaticamente)</span>
              </h2>
              {rolagens.length > 0 && (
                <button
                  onClick={limparRolagens}
                  style={{
                    background: 'rgba(231, 76, 60, 0.2)',
                    border: '1px solid #e74c3c',
                    color: '#e74c3c',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Limpar Histórico
                </button>
              )}
            </div>

            {rolagens.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px',
                color: '#666',
                border: '2px dashed #444',
                borderRadius: '15px'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎲</div>
                <div>Nenhuma rolagem ainda</div>
                <div style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                  Clique em um atributo na aba Ficha para rolar dados
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rolagens.map((rolagem, index) => (
                  <div
                    key={rolagem.id}
                    style={{
                      background: index === 0 ? `linear-gradient(135deg, ${rolagem.cor}22 0%, rgba(30, 30, 40, 0.9) 100%)` : 'rgba(30, 30, 40, 0.6)',
                      border: `1px solid ${index === 0 ? rolagem.cor : '#333'}`,
                      borderRadius: '10px',
                      padding: '15px',
                      opacity: index === 0 ? 1 : 0.7,
                      transform: index === 0 ? 'scale(1)' : 'scale(0.98)',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {/* Foto do agente */}
                        <div style={{
                          width: index === 0 ? '50px' : '40px',
                          height: index === 0 ? '50px' : '40px',
                          borderRadius: '50%',
                          background: '#333',
                          overflow: 'hidden',
                          border: `2px solid ${rolagem.cor}`,
                          flexShrink: 0
                        }}>
                          {rolagem.foto ? (
                            <img
                              src={`data:image/png;base64,${rolagem.foto}`}
                              alt={rolagem.display_name}
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
                              fontSize: index === 0 ? '1.2rem' : '1rem'
                            }}>
                              👤
                            </div>
                          )}
                        </div>
                        
                        {/* Resultado principal */}
                        <div style={{
                          background: rolagem.melhor === 20 ? 'linear-gradient(135deg, #f39c12, #e67e22)' : rolagem.melhor === 1 ? 'linear-gradient(135deg, #e74c3c, #c0392b)' : rolagem.cor,
                          color: '#fff',
                          fontSize: index === 0 ? '1.8rem' : '1.4rem',
                          fontWeight: '700',
                          width: index === 0 ? '60px' : '50px',
                          height: index === 0 ? '60px' : '50px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          boxShadow: rolagem.melhor === 20 ? '0 0 20px rgba(243, 156, 18, 0.5)' : rolagem.melhor === 1 ? '0 0 20px rgba(231, 76, 60, 0.5)' : 'none'
                        }}>
                          {rolagem.melhor}
                          {rolagem.melhor === 20 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '0.9rem' }}>⭐</span>}
                          {rolagem.melhor === 1 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', fontSize: '0.9rem' }}>💀</span>}
                        </div>
                        
                        {/* Info */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#fff', fontWeight: '600' }}>{rolagem.display_name || 'Agente'}</span>
                            <span style={{ color: rolagem.cor, fontWeight: '600' }}>• {rolagem.atributo}</span>
                            <span style={{ color: '#666', fontSize: '0.8rem' }}>({rolagem.quantidade}d20{rolagem.tipo === 'desvantagem' ? ' - Desv.' : ''})</span>
                          </div>
                          <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '3px' }}>
                            {rolagem.data_criacao ? new Date(rolagem.data_criacao).toLocaleString() : ''}
                          </div>
                        </div>
                      </div>
                      
                      {/* Outros resultados */}
                      {rolagem.resultados && rolagem.resultados.length > 1 && (
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', maxWidth: '200px', justifyContent: 'flex-end' }}>
                          {rolagem.resultados.map((resultado, idx) => {
                            const isMelhor = resultado === rolagem.melhor && rolagem.resultados.indexOf(rolagem.melhor) === idx;
                            if (isMelhor && rolagem.resultados.filter(x => x === rolagem.melhor).length === 1) return null;
                            return (
                              <span
                                key={idx}
                                style={{
                                  background: resultado === rolagem.melhor ? `${rolagem.cor}33` : 'rgba(0, 0, 0, 0.3)',
                                  border: resultado === rolagem.melhor ? `1px solid ${rolagem.cor}` : '1px solid #333',
                                  color: resultado === rolagem.melhor ? rolagem.cor : '#666',
                                  padding: '3px 8px',
                                  borderRadius: '5px',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {resultado}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Criar Item */}
      {showCreateItemModal && (
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
          onClick={() => setShowCreateItemModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d15 100%)',
              border: `2px solid ${PATENTE_CORES[novoItem.patente].cor}`,
              borderRadius: '15px',
              width: '90%',
              maxWidth: '500px',
              padding: '30px',
              boxShadow: `0 0 50px ${PATENTE_CORES[novoItem.patente].glow}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ 
              color: PATENTE_CORES[novoItem.patente].cor, 
              marginBottom: '25px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🎒 Novo Item
            </h2>

            {/* Nome */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#999', display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                Nome do Item *
              </label>
              <input
                type="text"
                value={novoItem.nome}
                onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
                placeholder="Ex: Espada Longa, Poção de Cura..."
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Patente */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#999', display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                Patente (Raridade)
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3, 4].map(p => (
                  <button
                    key={p}
                    onClick={() => setNovoItem({ ...novoItem, patente: p })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: novoItem.patente === p ? PATENTE_CORES[p].cor : 'rgba(0, 0, 0, 0.3)',
                      border: `2px solid ${PATENTE_CORES[p].cor}`,
                      borderRadius: '8px',
                      color: novoItem.patente === p ? '#fff' : PATENTE_CORES[p].cor,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    {PATENTE_CORES[p].nome}
                  </button>
                ))}
              </div>
            </div>

            {/* Espaço Ocupado */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#999', display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                Espaço Ocupado
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button
                  onClick={() => setNovoItem({ ...novoItem, espaco: Math.max(1, novoItem.espaco - 1) })}
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1.2rem',
                    cursor: 'pointer'
                  }}
                >
                  -
                </button>
                <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '600', minWidth: '40px', textAlign: 'center' }}>
                  {novoItem.espaco}
                </span>
                <button
                  onClick={() => setNovoItem({ ...novoItem, espaco: novoItem.espaco + 1 })}
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1.2rem',
                    cursor: 'pointer'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Tipo (dropdown - placeholder por agora) */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ color: '#999', display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                Tipo do Item
              </label>
              <select
                value={novoItem.tipo}
                onChange={(e) => setNovoItem({ ...novoItem, tipo: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">Selecione o tipo...</option>
                <option value="Arma">Arma</option>
                <option value="Armadura">Armadura</option>
                <option value="Consumível">Consumível</option>
                <option value="Equipamento">Equipamento</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => setShowCreateItemModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'transparent',
                  border: '1px solid #666',
                  borderRadius: '8px',
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateItem}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: `linear-gradient(135deg, ${PATENTE_CORES[novoItem.patente].cor}, ${PATENTE_CORES[novoItem.patente].cor}cc)`,
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: `0 4px 20px ${PATENTE_CORES[novoItem.patente].glow}`
                }}
              >
                Criar Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
