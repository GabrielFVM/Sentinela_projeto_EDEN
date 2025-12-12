import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';

// Textos hacker para a animação
const hackerTexts = [
  'INICIANDO PROTOCOLO DE ACESSO...',
  'BYPASS DE SEGURANÇA: NÍVEL 3',
  'DESCRIPTOGRAFANDO DADOS DO USUÁRIO...',
  'ACESSANDO NÚCLEO DO SISTEMA...',
  'CARREGANDO PERFIL CLASSIFICADO...',
  'CONEXÃO ESTABELECIDA'
];

// Textos de encerramento
const closeTexts = [
  'ENCERRANDO SESSÃO...',
  'LIMPANDO RASTROS...',
  'CONEXÃO ENCERRADA'
];

const matrixChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

export default function EditPerfil({ isOpen, onClose, userData, onUpdate }) {
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    password: '',
    confirmPassword: '',
    cargo: ''
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [originalPhoto, setOriginalPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('dados');
  const fileInputRef = useRef(null);

  // Estados da animação hacker
  const [hackerPhase, setHackerPhase] = useState(0); // 0 = animando entrada, 1 = pronto, 2 = animando saída
  const [currentHackerText, setCurrentHackerText] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [glitchActive, setGlitchActive] = useState(false);
  const [matrixRain, setMatrixRain] = useState([]);
  const [scanlinePos, setScanlinePos] = useState(0);
  const [showContent, setShowContent] = useState(false);
  
  // Estados da animação de fechamento
  const [isClosing, setIsClosing] = useState(false);
  const [closeTextIndex, setCloseTextIndex] = useState(0);
  const [closeDisplayedText, setCloseDisplayedText] = useState('');
  
  // Flag para controlar se deve mostrar animação (só na primeira abertura)
  const [hasAnimated, setHasAnimated] = useState(false);

  // Editor de imagem
  const [editorOpen, setEditorOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Função para iniciar animação de fechamento
  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setShowContent(false);
    setCloseTextIndex(0);
    setCloseDisplayedText('');
  };

  // Animação de fechamento
  useEffect(() => {
    if (!isClosing) return;

    let textIndex = 0;
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      if (textIndex < closeTexts.length) {
        const currentText = closeTexts[textIndex];
        if (charIndex <= currentText.length) {
          setCloseDisplayedText(currentText.substring(0, charIndex));
          charIndex++;
        } else {
          setCloseTextIndex(textIndex);
          textIndex++;
          charIndex = 0;
          setGlitchActive(true);
          setTimeout(() => setGlitchActive(false), 100);
        }
      } else {
        clearInterval(typeInterval);
        // Finalizar e fechar de verdade
        setTimeout(() => {
          setIsClosing(false);
          onClose();
        }, 300);
      }
    }, 35);

    return () => clearInterval(typeInterval);
  }, [isClosing, onClose]);

  // Animação de matrix rain e scanline durante fechamento
  useEffect(() => {
    if (!isClosing) return;

    // Reiniciar matrix rain se necessário
    if (matrixRain.length === 0) {
      const cols = 40;
      const initialMatrix = Array(cols).fill(0).map(() => ({
        chars: Array(20).fill('').map(() => matrixChars[Math.floor(Math.random() * matrixChars.length)]),
        speed: Math.random() * 50 + 30,
        y: Math.random() * -500
      }));
      setMatrixRain(initialMatrix);
    }

    // Scanline animation
    const scanInterval = setInterval(() => {
      setScanlinePos(prev => (prev + 3) % 100);
    }, 30);

    // Matrix rain animation (mais rápida durante fechamento)
    const matrixInterval = setInterval(() => {
      setMatrixRain(prev => prev.map(col => ({
        ...col,
        y: col.y > 600 ? -200 : col.y + col.speed / 8,
        chars: col.chars.map(() => 
          Math.random() > 0.85 ? matrixChars[Math.floor(Math.random() * matrixChars.length)] : col.chars[0]
        )
      })));
    }, 40);

    return () => {
      clearInterval(scanInterval);
      clearInterval(matrixInterval);
    };
  }, [isClosing]);

  // Animação hacker de abertura
  useEffect(() => {
    if (isOpen && hackerPhase === 0) {
      // Iniciar matrix rain
      const cols = 40;
      const initialMatrix = Array(cols).fill(0).map(() => ({
        chars: Array(20).fill('').map(() => matrixChars[Math.floor(Math.random() * matrixChars.length)]),
        speed: Math.random() * 50 + 30,
        y: Math.random() * -500
      }));
      setMatrixRain(initialMatrix);

      // Animação de texto typewriter
      let textIndex = 0;
      let charIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (textIndex < hackerTexts.length) {
          const currentText = hackerTexts[textIndex];
          if (charIndex <= currentText.length) {
            setDisplayedText(currentText.substring(0, charIndex));
            charIndex++;
          } else {
            setCurrentHackerText(textIndex);
            textIndex++;
            charIndex = 0;
            
            // Glitch effect entre textos
            setGlitchActive(true);
            setTimeout(() => setGlitchActive(false), 150);
          }
        } else {
          clearInterval(typeInterval);
          // Transição para o conteúdo
          setTimeout(() => {
            setHackerPhase(1);
            setTimeout(() => setShowContent(true), 300);
          }, 500);
        }
      }, 40);

      // Scanline animation
      const scanInterval = setInterval(() => {
        setScanlinePos(prev => (prev + 2) % 100);
      }, 30);

      // Matrix rain animation
      const matrixInterval = setInterval(() => {
        setMatrixRain(prev => prev.map(col => ({
          ...col,
          y: col.y > 600 ? -200 : col.y + col.speed / 10,
          chars: col.chars.map(() => 
            Math.random() > 0.9 ? matrixChars[Math.floor(Math.random() * matrixChars.length)] : col.chars[0]
          )
        })));
      }, 50);

      return () => {
        clearInterval(typeInterval);
        clearInterval(scanInterval);
        clearInterval(matrixInterval);
      };
    }
  }, [isOpen, hackerPhase]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsClosing(false);
      setCloseTextIndex(0);
      setCloseDisplayedText('');
      
      // Só mostrar animação se ainda não foi mostrada nesta sessão
      if (!hasAnimated) {
        setHackerPhase(0);
        setShowContent(false);
        setCurrentHackerText(0);
        setDisplayedText('');
        setHasAnimated(true);
      } else {
        // Pular animação - ir direto pro conteúdo
        setHackerPhase(1);
        setShowContent(true);
      }
      
      if (userData) {
        setFormData(prev => ({
          ...prev,
          username: userData.username || '',
          display_name: userData.display_name || '',
          cargo: userData.cargo || ''
        }));
      }
      loadCurrentPhoto();
    } else {
      document.body.style.overflow = 'unset';
      setError('');
      setSuccess('');
      setActiveTab('dados');
      setEditorOpen(false);
      setHackerPhase(0);
      setShowContent(false);
      setIsClosing(false);
    }

    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, userData]);

  const loadCurrentPhoto = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/me/foto`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.foto) {
        const photoUrl = `data:image/png;base64,${data.foto}`;
        setProfilePhoto(photoUrl);
        setOriginalPhoto(photoUrl);
      }
    } catch (err) {
      console.error('Erro ao carregar foto:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSaveDados = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Sessão expirada');
      setIsLoading(false);
      return;
    }

    try {
      // Usar o ID do userData (vem da API /users/me) ao invés do token
      const userId = userData?.id;
      if (!userId) {
        setError('ID do usuário não encontrado');
        setIsLoading(false);
        return;
      }
      
      // Construir dados para enviar
      const dataToSend = { 
        username: formData.username || '',
        display_name: formData.display_name || formData.username || ''
      };
      
      // Incluir cargo se for Serafim ou X (id 2)
      if (userData?.grupo === 'Serafim' || userData?.id === 2) {
        dataToSend.cargo = formData.cargo || '';
      }
      
      console.log('Enviando dados:', dataToSend, 'para user_id:', userId);
      
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Dados atualizados com sucesso!');
        if (onUpdate) onUpdate(data);
      } else {
        setError(data.erro || 'Erro ao atualizar dados');
      }
    } catch (err) {
      console.error('Erro ao salvar dados:', err);
      setError('Erro de conexão: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSenha = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Sessão expirada');
      setIsLoading(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: formData.password })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Senha alterada com sucesso!');
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        setError(data.erro || 'Erro ao alterar senha');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers de foto
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setTempImage(event.target.result);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setEditorOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSavePhoto = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Sessão expirada');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Criar canvas para crop
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.src = tempImage;
      
      await new Promise(resolve => { img.onload = resolve; });

      const imgAspect = img.width / img.height;
      let drawWidth, drawHeight;
      
      if (imgAspect > 1) {
        drawHeight = 200 * scale;
        drawWidth = drawHeight * imgAspect;
      } else {
        drawWidth = 200 * scale;
        drawHeight = drawWidth / imgAspect;
      }

      const drawX = (200 - drawWidth) / 2 + (position.x * 200 / 200);
      const drawY = (200 - drawHeight) / 2 + (position.y * 200 / 200);

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, 200, 200);
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setProfilePhoto(dataUrl);

      // Upload
      const formDataUpload = new FormData();
      formDataUpload.append('foto', new File([blob], 'profile.jpg', { type: 'image/jpeg' }));

      const response = await fetch(`${API_BASE_URL}/users/me/foto`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });

      if (response.ok) {
        setSuccess('Foto atualizada com sucesso!');
        setEditorOpen(false);
        setTempImage(null);
      } else {
        throw new Error('Erro ao salvar foto');
      }
    } catch (err) {
      setError('Erro ao salvar foto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    // Por enquanto só remove visualmente
    setProfilePhoto(null);
    setSuccess('Foto removida');
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid #cc0000',
    borderRadius: '6px',
    color: '#cccccc',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const selectStyle = {
    width: '100%',
    padding: '12px 14px',
    background: 'linear-gradient(135deg, rgba(20, 0, 0, 0.9) 0%, rgba(40, 0, 0, 0.8) 100%)',
    border: '2px solid #cc0000',
    borderRadius: '6px',
    color: '#ff6666',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23cc0000' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: '40px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const labelStyle = {
    display: 'block',
    color: '#ff6666',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
    fontWeight: '600'
  };

  const buttonStyle = {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #cc0000 0%, #990000 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const tabStyle = (active) => ({
    padding: '12px 20px',
    background: active ? 'rgba(204, 0, 0, 0.3)' : 'transparent',
    color: active ? '#ff6666' : '#888888',
    border: 'none',
    borderBottom: active ? '2px solid #cc0000' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'all 0.3s ease'
  });

  return (
    <>
      {/* Overlay */}
      <div
        onClick={hackerPhase === 1 && !isClosing ? handleClose : undefined}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: (hackerPhase === 0 || isClosing) ? 'rgba(0, 0, 0, 0.98)' : 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 9998,
          transition: 'all 0.5s ease',
          overflow: 'hidden'
        }}
      >
        {/* Matrix Rain Background */}
        {(hackerPhase === 0 || isClosing) && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            opacity: 0.3
          }}>
            {matrixRain.map((col, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${(i / matrixRain.length) * 100}%`,
                  top: col.y,
                  color: isClosing ? '#ff0000' : '#00ff00',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  textShadow: isClosing ? '0 0 8px #ff0000' : '0 0 8px #00ff00',
                  writingMode: 'vertical-rl',
                  whiteSpace: 'nowrap',
                  transition: 'top 0.05s linear, color 0.3s ease'
                }}
              >
                {col.chars.join('')}
              </div>
            ))}
          </div>
        )}

        {/* Scanlines */}
        {(hackerPhase === 0 || isClosing) && (
          <>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: `${scanlinePos}%`,
              left: 0,
              right: 0,
              height: '2px',
              background: isClosing ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)',
              boxShadow: isClosing ? '0 0 20px 5px rgba(255, 0, 0, 0.3)' : '0 0 20px 5px rgba(0, 255, 0, 0.3)',
              transition: 'top 0.03s linear'
            }} />
          </>
        )}

        {/* Hacker Terminal Animation */}
        {hackerPhase === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 10
          }}>
            {/* Logo/Icon */}
            <div style={{
              fontSize: '60px',
              marginBottom: '30px',
              animation: 'pulse 0.5s infinite alternate',
              filter: glitchActive ? 'hue-rotate(180deg)' : 'none',
              transition: 'filter 0.1s'
            }}>
              🔓
            </div>

            {/* Terminal Box */}
            <div style={{
              background: 'rgba(0, 20, 0, 0.9)',
              border: '2px solid #00ff00',
              borderRadius: '8px',
              padding: '30px 50px',
              minWidth: '400px',
              boxShadow: '0 0 30px rgba(0, 255, 0, 0.3), inset 0 0 20px rgba(0, 255, 0, 0.1)',
              transform: glitchActive ? `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)` : 'none'
            }}>
              {/* Previous completed texts */}
              {hackerTexts.slice(0, currentHackerText).map((text, i) => (
                <div
                  key={i}
                  style={{
                    color: '#00aa00',
                    fontFamily: '"Courier New", monospace',
                    fontSize: '14px',
                    marginBottom: '8px',
                    textAlign: 'left',
                    opacity: 0.6
                  }}
                >
                  {'>'} {text} <span style={{ color: '#00ff00' }}>✓</span>
                </div>
              ))}

              {/* Current typing text */}
              <div style={{
                color: '#00ff00',
                fontFamily: '"Courier New", monospace',
                fontSize: '16px',
                textAlign: 'left',
                textShadow: '0 0 10px #00ff00',
                minHeight: '24px'
              }}>
                {'>'} {displayedText}
                <span style={{
                  animation: 'blink 0.5s infinite',
                  marginLeft: '2px'
                }}>█</span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              marginTop: '20px',
              width: '400px',
              height: '4px',
              background: 'rgba(0, 255, 0, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(currentHackerText / hackerTexts.length) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00ff00, #00aa00)',
                boxShadow: '0 0 10px #00ff00',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Closing Animation */}
        {isClosing && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 10
          }}>
            {/* Lock Icon */}
            <div style={{
              fontSize: '60px',
              marginBottom: '30px',
              animation: 'pulse 0.3s infinite alternate',
              filter: glitchActive ? 'hue-rotate(180deg)' : 'none'
            }}>
              🔒
            </div>

            {/* Terminal Box */}
            <div style={{
              background: 'rgba(20, 0, 0, 0.9)',
              border: '2px solid #ff0000',
              borderRadius: '8px',
              padding: '30px 50px',
              minWidth: '350px',
              boxShadow: '0 0 30px rgba(255, 0, 0, 0.3), inset 0 0 20px rgba(255, 0, 0, 0.1)',
              transform: glitchActive ? `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)` : 'none'
            }}>
              {/* Previous completed texts */}
              {closeTexts.slice(0, closeTextIndex).map((text, i) => (
                <div
                  key={i}
                  style={{
                    color: '#aa0000',
                    fontFamily: '"Courier New", monospace',
                    fontSize: '14px',
                    marginBottom: '8px',
                    textAlign: 'left',
                    opacity: 0.6
                  }}
                >
                  {'>'} {text} <span style={{ color: '#ff0000' }}>✓</span>
                </div>
              ))}

              {/* Current typing text */}
              <div style={{
                color: '#ff0000',
                fontFamily: '"Courier New", monospace',
                fontSize: '16px',
                textAlign: 'left',
                textShadow: '0 0 10px #ff0000',
                minHeight: '24px'
              }}>
                {'>'} {closeDisplayedText}
                <span style={{
                  animation: 'blink 0.5s infinite',
                  marginLeft: '2px'
                }}>█</span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              marginTop: '20px',
              width: '350px',
              height: '4px',
              background: 'rgba(255, 0, 0, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(closeTextIndex / closeTexts.length) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ff0000, #aa0000)',
                boxShadow: '0 0 10px #ff0000',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes pulse {
          0% { transform: scale(1); filter: brightness(1); }
          100% { transform: scale(1.1); filter: brightness(1.3); }
        }
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, -45%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${showContent ? 1 : 0.9})`,
          width: '90%',
          maxWidth: '500px',
          maxHeight: '85vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(204, 0, 0, 0.4), inset 0 0 30px rgba(204, 0, 0, 0.05)',
          border: '2px solid #cc0000',
          zIndex: 9999,
          opacity: showContent ? 1 : 0,
          transition: 'all 0.4s ease',
          display: showContent ? 'flex' : 'none',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: showContent ? 'fadeInUp 0.4s ease' : 'none'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 25px',
          borderBottom: '1px solid rgba(204, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            color: '#ff6666',
            fontSize: '1.3rem',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Editar Perfil
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff6666',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '5px',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(204, 0, 0, 0.2)'
        }}>
          <button style={tabStyle(activeTab === 'dados')} onClick={() => setActiveTab('dados')}>
            Dados
          </button>
          <button style={tabStyle(activeTab === 'senha')} onClick={() => setActiveTab('senha')}>
            Senha
          </button>
          <button style={tabStyle(activeTab === 'foto')} onClick={() => setActiveTab('foto')}>
            Foto
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '25px',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Mensagens */}
          {error && (
            <div style={{
              background: 'rgba(204, 0, 0, 0.2)',
              border: '1px solid #ff3333',
              color: '#ff6666',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              background: 'rgba(0, 100, 0, 0.2)',
              border: '1px solid #00ff00',
              color: '#66ff66',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '0.9rem'
            }}>
              {success}
            </div>
          )}

          {/* Tab: Dados */}
          {activeTab === 'dados' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Nome de Login</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder={userData?.username || "Digite seu nome de login"}
                />
                <small style={{ color: '#666', fontSize: '0.75rem', marginTop: '5px', display: 'block' }}>
                  Este é o nome usado para entrar no sistema
                </small>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Nome de Exibição</label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder={userData?.display_name || "Digite o nome que aparecerá na interface"}
                />
                <small style={{ color: '#00ff00', fontSize: '0.75rem', marginTop: '5px', display: 'block' }}>
                  Este é o nome que aparece na interface
                </small>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Cargo</label>
                {(userData?.grupo === 'Serafim' || userData?.id === 2) ? (
                  <>
                    <select
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleInputChange}
                      style={selectStyle}
                    >
                      <option value="administrador">Administrador</option>
                      <option value="membro">Membro</option>
                      <option value="lider">Líder</option>
                    </select>
                    <small style={{ color: '#ffcc00', fontSize: '0.75rem', marginTop: '5px', display: 'block' }}>
                      ⚡ Você pode alterar o cargo
                    </small>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={formData.cargo}
                      disabled
                      style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
                    />
                    <small style={{ color: '#666', fontSize: '0.75rem', marginTop: '5px', display: 'block' }}>
                      O cargo não pode ser alterado
                    </small>
                  </>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Grupo</label>
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '2px solid #cc0000',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{
                    color: userData?.grupo === 'Serafim' ? '#ffcc00' : '#cccccc',
                    fontWeight: userData?.grupo === 'Serafim' ? '600' : '400',
                    textShadow: userData?.grupo === 'Serafim' ? '0 0 10px rgba(255, 204, 0, 0.5)' : 'none'
                  }}>
                    {userData?.grupo || 'Observador'}
                  </span>
                  {userData?.grupo === 'Serafim' && (
                    <span style={{
                      fontSize: '0.7rem',
                      background: 'rgba(255, 204, 0, 0.2)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      color: '#ffcc00',
                      border: '1px solid rgba(255, 204, 0, 0.3)'
                    }}>
                      ⚡ ACESSO ELEVADO
                    </span>
                  )}
                  {userData?.id === 2 && (
                    <span style={{
                      fontSize: '0.7rem',
                      background: 'rgba(138, 43, 226, 0.2)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      color: '#da70d6',
                      border: '1px solid rgba(138, 43, 226, 0.3)'
                    }}>
                      👁️ OMNISCIENTE
                    </span>
                  )}
                </div>
                <small style={{ color: '#666', fontSize: '0.75rem', marginTop: '5px', display: 'block' }}>
                  {userData?.id === 2 
                    ? 'Você possui controle total sobre o sistema'
                    : userData?.grupo === 'Serafim' 
                      ? 'Você pode editar cargos de usuários'
                      : 'Grupo define suas permissões no sistema'}
                </small>
              </div>

              <button
                onClick={handleSaveDados}
                disabled={isLoading}
                style={{ ...buttonStyle, width: '100%', opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          )}

          {/* Tab: Senha */}
          {activeTab === 'senha' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Nova Senha</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="Digite a nova senha"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Confirmar Senha</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  style={inputStyle}
                  placeholder="Confirme a nova senha"
                />
              </div>

              <button
                onClick={handleSaveSenha}
                disabled={isLoading || !formData.password}
                style={{ ...buttonStyle, width: '100%', opacity: (isLoading || !formData.password) ? 0.7 : 1 }}
              >
                {isLoading ? 'Salvando...' : 'Alterar Senha'}
              </button>
            </div>
          )}

          {/* Tab: Foto */}
          {activeTab === 'foto' && !editorOpen && (
            <div style={{ textAlign: 'center' }}>
              <div
                onClick={handlePhotoClick}
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: profilePhoto 
                    ? `url(${profilePhoto}) center/cover`
                    : 'linear-gradient(135deg, #333 0%, #222 100%)',
                  border: '3px solid #cc0000',
                  margin: '0 auto 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                {!profilePhoto && (
                  <span style={{ color: '#666', fontSize: '3rem' }}>👤</span>
                )}
                <div style={{
                  position: 'absolute',
                  bottom: '5px',
                  right: '5px',
                  background: '#cc0000',
                  borderRadius: '50%',
                  width: '35px',
                  height: '35px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem'
                }}>
                  📷
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '20px' }}>
                Clique na foto para alterar
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={handlePhotoClick}
                  style={buttonStyle}
                >
                  Escolher Foto
                </button>
                {profilePhoto && (
                  <button
                    onClick={handleRemovePhoto}
                    style={{
                      ...buttonStyle,
                      background: 'transparent',
                      border: '2px solid #cc0000',
                      color: '#ff6666'
                    }}
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Editor de Imagem */}
          {activeTab === 'foto' && editorOpen && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#ff6666', marginBottom: '15px', fontSize: '0.9rem' }}>
                Arraste para posicionar • Use o slider para zoom
              </p>

              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 20px',
                  border: '3px solid #cc0000',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  position: 'relative',
                  background: '#1a1a1a'
                }}
              >
                {tempImage && (
                  <img
                    src={tempImage}
                    alt="Preview"
                    draggable={false}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                      maxWidth: 'none',
                      height: '100%',
                      objectFit: 'contain',
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </div>

              {/* Zoom Slider */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#888', fontSize: '0.8rem' }}>Zoom: {Math.round(scale * 100)}%</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    accentColor: '#cc0000'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => { setEditorOpen(false); setTempImage(null); }}
                  style={{
                    ...buttonStyle,
                    background: 'transparent',
                    border: '2px solid #666',
                    color: '#888'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePhoto}
                  disabled={isLoading}
                  style={{ ...buttonStyle, opacity: isLoading ? 0.7 : 1 }}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Foto'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
