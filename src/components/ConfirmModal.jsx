import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div className="modal-content" style={{ background: 'white', padding: 25, borderRadius: 16, width: '90%', maxWidth: 400, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: danger ? '#d32f2f' : '#333' }}>{title}</h3>
        <p style={{ margin: '0 0 20px 0', color: '#555', lineHeight: 1.5 }}>{message}</p>
        
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button 
            onClick={onCancel}
            style={{ padding: '8px 16px', border: '1px solid #ddd', background: 'transparent', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: '#666' }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            style={{ padding: '8px 16px', border: 'none', background: danger ? '#d32f2f' : '#1565c0', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
