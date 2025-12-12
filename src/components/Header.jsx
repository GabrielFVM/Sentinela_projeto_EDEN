import React, { useState, useEffect } from 'react';
import Profile from './Profile';
import EditUser from './editUser';
import { useLocation } from 'react-router-dom';

// Header Component
export default function Header({ onLogout, username = 'Usuário', cargo= 'membro' }) {
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Easter egg states
  const [easterEggActive, setEasterEggActive] = useState(false);
  const [easterEggPhase, setEasterEggPhase] = useState(0); // 0=idle, 1=center, 2=glow, 3=minimize, 4=show text
  
  // User management modal (Seraphim only)
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userGrupo, setUserGrupo] = useState('Observador');
  
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
        {/* Botão de Gerenciar Usuários - Apenas Seraphim */}
        {userGrupo === 'Serafim' && !isLoginPage && (
          <button
            onClick={() => setUserModalOpen(true)}
            style={{
              position: 'fixed',
              right: '120px',
              top: buttonTop,
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
              zIndex: 1000,
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
        
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              position: 'fixed',
              right: '20px',
              top: buttonTop,
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
              transition: 'all 0.3s ease',
              zIndex: 1000
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
