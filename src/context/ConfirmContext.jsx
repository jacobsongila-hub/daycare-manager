import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { useLanguage } from './LanguageContext';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    resolve: null,
    danger: false
  });
  const { t } = useLanguage();

  const confirm = useCallback((message, title = 'Confirm', danger = false) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: t(title) || title,
        message: t(message) || message,
        resolve,
        danger
      });
    });
  }, [t]);

  const handleConfirm = () => {
    if (modalState.resolve) modalState.resolve(true);
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (modalState.resolve) modalState.resolve(false);
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal 
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        danger={modalState.danger}
        confirmText={t('confirm') || 'Confirm'}
        cancelText={t('cancel') || 'Cancel'}
      />
    </ConfirmContext.Provider>
  );
};
