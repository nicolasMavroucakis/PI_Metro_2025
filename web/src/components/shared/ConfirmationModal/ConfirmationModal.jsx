import React from 'react';
import '../../../Style/Modals.css'; // Usar estilos globais
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <AlertTriangle style={{ color: '#f59e0b' }} />
            {title}
          </h2>
          <button className="btn-close" onClick={onClose}><X /></button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="btn-primary danger"
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
