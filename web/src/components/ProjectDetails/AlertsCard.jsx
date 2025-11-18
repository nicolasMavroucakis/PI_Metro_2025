import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import styles from '../../Style/ProjectDetails.module.css';

const AlertsCard = ({ alerts, onAddAlert, onDeleteAlert }) => {
  return (
    <div className={styles['alerts-card']}>
      <div className={styles['card-header']}>
        <h3 className={styles['card-title']}>Alertas</h3>
        <span className={styles['alert-icon']}><AlertTriangle size={20} /></span>
      </div>
      <div className={styles['alerts-content']}>
        {alerts.length === 0 ? (
          <div className={styles['no-alerts']}>
            <p className={styles['alert-description']}>Nenhum alerta no momento</p>
          </div>
        ) : (
          <div className={styles['alerts-list']}>
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className={`${styles['alert-item']} ${styles[`alert-${alert.level}`]}`}>
                <div className={styles['alert-indicator']}></div>
                <div className={styles['alert-text']}>{alert.text}</div>
                {onDeleteAlert && (
                  <button
                    className={styles['delete-alert-btn']}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAlert(alert);
                    }}
                    title="Deletar alerta"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            {alerts.length > 3 && (
              <p className={styles['more-alerts']}>+{alerts.length - 3} mais alerta(s)</p>
            )}
          </div>
        )}
      </div>
      <div className={styles['alerts-actions']}>
        <button className={styles['add-alert-btn']} onClick={onAddAlert}>
          + Adicionar Alerta
        </button>
      </div>
    </div>
  );
};

export default AlertsCard;
