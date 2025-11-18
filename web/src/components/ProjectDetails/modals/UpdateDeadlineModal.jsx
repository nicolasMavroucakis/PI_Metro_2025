import React from 'react';
import styles from '../../../Style/ProjectDetails.module.css';

const UpdateDeadlineModal = ({
  show,
  onClose,
  onUpdate,
  updating,
  newDeadline,
  setNewDeadline
}) => {
  if (!show) {
    return null;
  }

  const handleClose = () => {
    onClose();
  };

  // Converter data ISO para formato de input date (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className={styles['modal-overlay']}>
      <div className={`${styles.modal} ${styles.updateDeadlineModal}`}>
        <div className={styles['modal-header']}>
          <h3>Alterar Prazo Final</h3>
          <button 
            className={styles['close-button']}
            onClick={handleClose}
            disabled={updating}
          >
            ✕
          </button>
        </div>

        <div className={styles['modal-content']}>
          <div className={styles['form-group']}>
            <label htmlFor="deadline">
              Novo Prazo Final:
            </label>
            <input
              id="deadline"
              type="date"
              value={newDeadline ? formatDateForInput(newDeadline) : ''}
              onChange={(e) => {
                const selectedDate = e.target.value;
                if (selectedDate) {
                  // Converter para ISO string (incluindo hora 00:00:00)
                  const date = new Date(selectedDate + 'T00:00:00');
                  setNewDeadline(date.toISOString());
                } else {
                  setNewDeadline('');
                }
              }}
              className={styles.formInput}
              min={formatDateForInput(new Date().toISOString())}
            />
            <small className={styles['form-hint']}>
              Selecione uma data futura para o prazo final do projeto.
            </small>
          </div>
        </div>

        <div className={styles['modal-actions']}>
          <button
            onClick={handleClose}
            disabled={updating}
            className={styles['btn-secondary']}
          >
            Cancelar
          </button>
          <button
            onClick={onUpdate}
            disabled={updating || !newDeadline}
            className={styles['btn-primary']}
          >
            {updating ? 'Atualizando...' : 'Atualizar Prazo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateDeadlineModal;

