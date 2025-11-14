import React from 'react';
import styles from '../../../Style/ProjectDetails.module.css';

const UpdateProgressModal = ({
  show,
  onClose,
  onUpdate,
  updating,
  newProgress,
  setNewProgress,
  progressObservation,
  setProgressObservation
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className={styles['modal-overlay']}>
      <div className={`${styles.modal} ${styles.updateProgressModal}`}>
        <h3>Atualizar Progresso do Projeto</h3>
        
        <div className={styles.progressModalForm}>
          <div className={styles.progressFormGroup}>
            <label htmlFor="progress">
              Novo Progresso (0-100%):
            </label>
            <input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={newProgress}
              onChange={(e) => setNewProgress(e.target.value)}
              placeholder="Ex: 75"
              className={styles.formInput}
            />
          </div>

          <div className={styles.progressFormGroup}>
            <label htmlFor="observation">
              Observação (opcional):
            </label>
            <textarea
              id="observation"
              value={progressObservation}
              onChange={(e) => setProgressObservation(e.target.value)}
              placeholder="Descreva as mudanças ou observações sobre o progresso..."
              className={styles.formTextarea}
            />
          </div>
        </div>

        <div className={styles['modal-actions']}>
          <button
            onClick={onClose}
            disabled={updating}
            className={styles['btn-secondary']}
          >
            Cancelar
          </button>
          <button
            onClick={onUpdate}
            disabled={updating}
            className={styles['btn-primary']}
          >
            {updating ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateProgressModal;
