import React from 'react';
import styles from './ConfirmationModal.module.css';
import { AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => {
  if (!show) {
    return null;
  }

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles.modal}>
        <div className={styles['modal-header']}>
          <AlertTriangle size={24} className={styles['header-icon']} />
          <h3>{title}</h3>
        </div>
        <div className={styles['modal-body']}>
          <p>{message}</p>
        </div>
        <div className={styles['modal-footer']}>
          <button
            className={`${styles['footer-button']} ${styles.cancel}`}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className={`${styles['footer-button']} ${styles.confirm}`}
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
