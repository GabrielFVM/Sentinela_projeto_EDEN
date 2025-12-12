import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';
import EditPerfil from './editPerfil';

export default function Profile({ username = 'Usuário', funcao = 'Sentinela' }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isHoveringContainer, setIsHoveringContainer] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editPerfilOpen, setEditPerfilOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const fileInputRef = useRef(null);

  // Estado do editor de imagem
  const [editorOpen, setEditorOpen] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Configurações
  const OUTPUT_SIZE = 200;
  const QUALITY = 0.9;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Carregar dados do usuário e foto ao iniciar
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Carregar dados do usuário
    fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.erro) {
          setUserData(data);
        }
      })
      .catch(err => console.error('Erro ao carregar dados:', err));

    // Carregar foto
    fetch(`${API_BASE_URL}/users/me/foto`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.foto) {
          setProfilePhoto(`data:image/png;base64,${data.foto}`);
        }
      })
      .catch(err => console.error('Erro ao carregar foto:', err));
  }, []);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target.result);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setEditorOpen(true);
    };
    reader.readAsDataURL(file);
    
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  // Handlers do editor
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleScaleChange = (e) => {
    setScale(parseFloat(e.target.value));
  };

  const handleCancel = () => {
    setEditorOpen(false);
    setOriginalImage(null);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Você precisa estar logado para alterar a foto');
      return;
    }

    setIsUploading(true);

    try {
      // Criar canvas para crop
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');

      // Carregar imagem
      const img = new Image();
      img.src = originalImage;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Calcular dimensões da imagem escalada
      const imgAspect = img.width / img.height;
      let drawWidth, drawHeight;
      
      if (imgAspect > 1) {
        drawHeight = OUTPUT_SIZE * scale;
        drawWidth = drawHeight * imgAspect;
      } else {
        drawWidth = OUTPUT_SIZE * scale;
        drawHeight = drawWidth / imgAspect;
      }

      // Calcular posição centralizada + offset do usuário
      const drawX = (OUTPUT_SIZE - drawWidth) / 2 + (position.x * OUTPUT_SIZE / 200);
      const drawY = (OUTPUT_SIZE - drawHeight) / 2 + (position.y * OUTPUT_SIZE / 200);

      // Desenhar imagem recortada
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Converter para blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', QUALITY);
      });

      const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
      setProfilePhoto(dataUrl);

      // Enviar para servidor
      const formData = new FormData();
      formData.append('foto', new File([blob], 'profile.jpg', { type: 'image/jpeg' }));

      const response = await fetch(`${API_BASE_URL}/users/me/foto`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar foto');
      }

      setEditorOpen(false);
      setOriginalImage(null);
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      alert('Erro ao salvar foto no servidor');
    } finally {
      setIsUploading(false);
    }
  };

  const initial = username.charAt(0).toUpperCase();
  const topPosition = isScrolled ? '5px' : '30px';

  return (
    <>
      <div 
        onMouseEnter={() => setIsHoveringContainer(true)}
        onMouseLeave={() => setIsHoveringContainer(false)}
        style={{
          position: isScrolled ? 'fixed' : 'absolute',
          top: topPosition,
          left: '20px',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: isScrolled ? 'transparent' : 'rgba(26, 26, 26, 0.95)',
          padding: isScrolled ? '0px' : '12px',
          paddingRight: isHoveringContainer ? (isScrolled ? '45px' : '55px') : (isScrolled ? '0px' : '12px'),
          borderRadius: '12px',
          border: isScrolled ? 'none' : '2px solid #cc0000',
          boxShadow: isScrolled ? 'none' : '0 4px 16px rgba(204, 0, 0, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
        {/* Avatar com funcionalidade de upload */}
        <div 
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: profilePhoto 
              ? `url(${profilePhoto}) center/cover no-repeat` 
              : 'linear-gradient(135deg, #cc0000 0%, #ff3333 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 0 12px rgba(204, 0, 0, 0.4)',
            flexShrink: 0,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={handlePhotoClick}
        >
          {/* Inicial (só aparece se não tem foto) */}
          {!profilePhoto && !isUploading && initial}
          
          {/* Overlay com câmera no hover ou spinner de loading */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isHovering || isUploading ? 1 : 0,
              transition: 'opacity 0.2s ease',
              borderRadius: '50%'
            }}
          >
            {isUploading ? (
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}
              />
            ) : (
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
          </div>
        </div>

        {/* Input de arquivo oculto */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />

        {/* Informações */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <p style={{
            margin: 0,
            color: '#ff6666',
            fontSize: '0.95rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {userData?.display_name || username}
          </p>
          {!isScrolled && (
            <>
              <p style={{
                margin: 0,
                color: '#999999',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {userData?.cargo || funcao}
              </p>
              {userData?.grupo && (
                <p style={{
                  margin: 0,
                  color: userData.grupo === 'Serafim' ? '#ffcc00' : '#666666',
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  fontWeight: userData.grupo === 'Serafim' ? '600' : '400',
                  textShadow: userData.grupo === 'Serafim' ? '0 0 8px rgba(255, 204, 0, 0.5)' : 'none'
                }}>
                  {userData.grupo}
                </p>
              )}
            </>
          )}
        </div>

        {/* Botão de Editar Perfil - Aparece no hover */}
        <button
          onClick={() => setEditPerfilOpen(true)}
          style={{
            position: 'absolute',
            right: isScrolled ? '0px' : '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'rgba(204, 0, 0, 0.9)',
            border: '2px solid #ff3333',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isHoveringContainer ? 1 : 0,
            pointerEvents: isHoveringContainer ? 'auto' : 'none',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 10px rgba(204, 0, 0, 0.5)'
          }}
          title="Editar Perfil"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>

      {/* Modal Editor de Imagem */}
      {editorOpen && (
        <>
          {/* Overlay */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              zIndex: 3000,
              backdropFilter: 'blur(4px)'
            }}
            onClick={handleCancel}
          />
          
          {/* Editor */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 3001,
              background: '#1a1a1a',
              border: '2px solid #cc0000',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              boxShadow: '0 0 40px rgba(204, 0, 0, 0.4)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              margin: 0, 
              color: '#ff6666', 
              fontSize: '1rem', 
              textTransform: 'uppercase', 
              letterSpacing: '2px' 
            }}>
              Ajustar Foto
            </h3>

            {/* Área de preview com crop circular */}
            <div
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid #cc0000',
                cursor: isDragging ? 'grabbing' : 'grab',
                position: 'relative',
                background: '#000'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {originalImage && (
                <img
                  ref={imageRef}
                  src={originalImage}
                  alt="Preview"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    maxWidth: 'none',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                />
              )}
            </div>

            {/* Instruções */}
            <p style={{ 
              margin: 0, 
              color: '#666', 
              fontSize: '0.75rem', 
              textAlign: 'center' 
            }}>
              Arraste para posicionar • Scroll para zoom
            </p>

            {/* Controle de Zoom */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              width: '100%' 
            }}>
              <span style={{ color: '#666', fontSize: '0.8rem' }}>-</span>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={scale}
                onChange={handleScaleChange}
                style={{
                  flex: 1,
                  accentColor: '#cc0000',
                  cursor: 'pointer'
                }}
              />
              <span style={{ color: '#666', fontSize: '0.8rem' }}>+</span>
              <span style={{ 
                color: '#999', 
                fontSize: '0.75rem', 
                minWidth: '45px', 
                textAlign: 'right' 
              }}>
                {Math.round(scale * 100)}%
              </span>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: 'transparent',
                  color: '#999',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#666';
                  e.currentTarget.style.color = '#ccc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#444';
                  e.currentTarget.style.color = '#999';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isUploading}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: isUploading ? '#660000' : 'linear-gradient(135deg, #cc0000, #ff3333)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(204, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isUploading) {
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(204, 0, 0, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(204, 0, 0, 0.3)';
                }}
              >
                {isUploading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal de Edição de Perfil */}
      <EditPerfil 
        isOpen={editPerfilOpen}
        onClose={() => setEditPerfilOpen(false)}
        userData={userData || { username, cargo: funcao }}
        onUpdate={(newData) => setUserData(prev => ({ ...prev, ...newData }))}
      />

      {/* CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
