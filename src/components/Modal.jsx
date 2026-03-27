import React from 'react';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="modal-content" style={{
        background: 'white',
        padding: '25px',
        borderRadius: '20px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        position: 'relative',
        animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
          paddingBottom: '15px'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1a1a1a', fontWeight: 800 }}>{title}</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              color: '#999',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.color = '#333'}
            onMouseOut={(e) => e.target.style.color = '#999'}
          >✕</button>
        </div>
        <div className="modal-body" style={{ marginBottom: footer ? '20px' : 0 }}>
          {children}
        </div>
        {footer && (
          <div className="modal-footer" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid #eee',
            paddingTop: '20px'
          }}>
            {footer}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Modal;
