import React from 'react';
import styles from '../../../Style/ProjectDetails.module.css';

const AddAlertModal = ({
  show,
  onClose,
  onAdd,
  adding,
  newAlertText,
  setNewAlertText,
  newAlertLevel,
  setNewAlertLevel
}) => {
  if (!show) {
    return null;
  }

  const handleClose = () => {
    setNewAlertText('');
    setNewAlertLevel('amarelo');
    onClose();
  };

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles.modal}>
        <div className={styles['modal-header']}>
          <h3>Adicionar Novo Alerta</h3>
          <button 
            className={styles['close-button']}
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        <div className={styles['modal-content']}>
          <div className={styles['form-group']}>
            <label>Nível do Alerta:</label>
            <div className={styles['alert-level-options']}>
              <button
                className={`${styles['alert-level-btn']} ${styles['alert-level-verde']} ${newAlertLevel === 'verde' ? styles.selected : ''}`}
                onClick={() => setNewAlertLevel('verde')}
              >
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#43a047', marginRight: 8 }} /> Verde
                <span className={styles['level-description']}>Informativo</span>
              </button>
              <button
                className={`${styles['alert-level-btn']} ${styles['alert-level-amarelo']} ${newAlertLevel === 'amarelo' ? styles.selected : ''}`}
                onClick={() => setNewAlertLevel('amarelo')}
              >
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#fbc02d', marginRight: 8 }} /> Amarelo
                <span className={styles['level-description']}>Atenção</span>
              </button>
              <button
                className={`${styles['alert-level-btn']} ${styles['alert-level-vermelho']} ${newAlertLevel === 'vermelho' ? styles.selected : ''}`}
                onClick={() => setNewAlertLevel('vermelho')}
              >
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#e53935', marginRight: 8 }} /> Vermelho
                <span className={styles['level-description']}>Crítico</span>
              </button>
            </div>
          </div>

          <div className={styles['form-group']}>
            <label>Descrição do Alerta:</label>
            <textarea
              className={styles['alert-textarea']}
              value={newAlertText}
              onChange={(e) => setNewAlertText(e.target.value)}
              placeholder="Digite a descrição do alerta..."
              rows={4}
              maxLength={200}
            />
            <small className={styles['char-counter']}>
              {newAlertText.length}/200 caracteres
            </small>
          </div>
        </div>

        <div className={styles['modal-actions']}>
          <button
            onClick={handleClose}
            disabled={adding}
            className={styles['btn-secondary']}
          >
            Cancelar
          </button>
          <button
            onClick={onAdd}
            disabled={adding || !newAlertText.trim()}
            className={styles['btn-primary']}
          >
            {adding ? 'Adicionando...' : 'Adicionar Alerta'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAlertModal;
