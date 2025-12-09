import React from 'react';

export default function AimeCard({ perfil }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(204, 0, 0, 0.2), inset 0 0 20px rgba(204, 0, 0, 0.05)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      border: '2px solid #cc0000',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = '0 16px 48px rgba(204, 0, 0, 0.4), inset 0 0 20px rgba(204, 0, 0, 0.1)';
      e.currentTarget.style.borderColor = '#ff3333';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(204, 0, 0, 0.2), inset 0 0 20px rgba(204, 0, 0, 0.05)';
      e.currentTarget.style.borderColor = '#cc0000';
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #cc0000 0%, #ff3333 100%)',
        color: 'white',
        padding: '16px',
        borderRadius: '6px',
        marginBottom: '16px',
        textAlign: 'center',
        boxShadow: '0 4px 15px rgba(204, 0, 0, 0.3)'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '1.4rem',
          fontWeight: '600',
          letterSpacing: '1px'
        }}>
          {perfil.nome}
        </h3>
      </div>
      
      <div style={{ marginBottom: '14px' }}>
        <strong style={{ 
          color: '#ff6666',
          fontSize: '0.95rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Humano:
        </strong>
        <p style={{ 
          margin: '6px 0 0 0', 
          color: '#cccccc',
          fontSize: '0.95rem',
          lineHeight: '1.5'
        }}>
          {perfil.funcao}
        </p>
      </div>
      
      <div style={{ marginBottom: '14px' }}>
        <strong style={{ 
          color: '#ff6666',
          fontSize: '0.95rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Saúde:
        </strong>
        <p style={{ 
          margin: '6px 0 0 0', 
          color: '#cccccc',
          fontSize: '0.95rem',
          lineHeight: '1.5'
        }}>
          {perfil.saude}
        </p>
      </div>
      
      <div style={{
        display: 'inline-block',
        padding: '8px 16px',
        borderRadius: '24px',
        background: perfil.status === 'Ativo' ? 'rgba(204, 0, 0, 0.2)' : 'rgba(100, 100, 100, 0.2)',
        color: perfil.status === 'Ativo' ? '#ff6666' : '#999999',
        fontSize: '0.85rem',
        fontWeight: '600',
        border: `1px solid ${perfil.status === 'Ativo' ? '#ff3333' : '#666666'}`,
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        ● {perfil.status}
      </div>
    </div>
  );
}
