import React from 'react';
import PerfilCard from './PerfilCard';
import AimeCard from './AimeCard';

// Cidade Component
export default function Cidade({ cidade }) {
  if (!cidade) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#667eea' }}>
        Carregando dados...
      </div>
    );
  }

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
        padding: '40px',
        borderRadius: '8px',
        marginBottom: '40px',
        boxShadow: '0 8px 32px rgba(204, 0, 0, 0.15), inset 0 0 20px rgba(204, 0, 0, 0.05)',
        margin: '30px 20px',
        border: '1px solid rgba(204, 0, 0, 0.3)'
      }}>
        <h2 style={{ 
          color: '#ff6666',
          marginTop: 0,
          fontSize: '2rem',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          {cidade.cidade}
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '25px',
          marginTop: '20px'
        }}>
          <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '15px' }}>
            <strong style={{ color: '#ff6666', textTransform: 'uppercase', letterSpacing: '1px' }}>População:</strong>
            <p style={{ margin: '8px 0 0 0', color: '#cccccc', fontSize: '1.1rem' }}>{cidade.populacao}</p>
          </div>
          <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '15px' }}>
            <strong style={{ color: '#ff6666', textTransform: 'uppercase', letterSpacing: '1px' }}>Status:</strong>
            <p style={{ margin: '8px 0 0 0', color: '#cccccc', fontSize: '1.1rem' }}>{cidade.status}</p>
          </div>
          <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '15px' }}>
            <strong style={{ color: '#ff6666', textTransform: 'uppercase', letterSpacing: '1px' }}>Classe:</strong>
            <p style={{ margin: '8px 0 0 0', color: '#cccccc', fontSize: '1.1rem' }}>{cidade.classe}</p>
          </div>
          <div style={{ borderLeft: '3px solid #cc0000', paddingLeft: '15px' }}>
            <strong style={{ color: '#ff6666', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin:</strong>
            <p style={{ margin: '8px 0 0 0', color: '#cccccc', fontSize: '1.1rem' }}>{cidade.admin}</p>
          </div>
        </div>
      </div>

      <h2 style={{ 
        color: '#ff6666',
        marginBottom: '30px',
        marginLeft: '20px',
        fontSize: '1.8rem',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        ◆ Homúnculos Registrados ({cidade.perfis?.length || 0})
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '25px',
        padding: '0 20px'
      }}>
        {cidade.perfis && cidade.perfis.map((perfil) => (
          perfil.funcao === 'Aimê' ? (
            <AimeCard key={perfil.id} perfil={perfil} />
          ) : (
            <PerfilCard key={perfil.id} perfil={perfil} />
          )
        ))}
      </div>
    </>
  );
}
