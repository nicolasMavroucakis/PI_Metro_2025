import React from 'react';
import { Camera } from 'lucide-react';
import styles from '../../Style/ProjectDetails.module.css';

const CapturesCard = ({ loadingPhotos, capturePhotos, onViewMore, onNewCapture }) => {
  return (
    <div className={styles['captures-card']}>
      <div className={styles['card-header']}>
        <h3 className={styles['card-title']}>Últimas Capturas</h3>
        <span className={styles['camera-icon']}><Camera size={20} /></span>
      </div>
      
      {loadingPhotos ? (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <p>Carregando fotos...</p>
        </div>
      ) : capturePhotos.length > 0 ? (
        <>
          <div className={styles['captures-grid']}>
            {capturePhotos.slice(0, 3).map((photoUrl, index) => (
              <div key={index} className={styles['capture-item']}>
                <img 
                  src={photoUrl} 
                  alt={`Captura ${index + 1}`}
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/120x90/9E9E9E/white?text=Erro+Carregamento`;
                  }}
                />
              </div>
            ))}
          </div>
          
          <p className={styles['last-capture']}>
            {capturePhotos.length} {capturePhotos.length !== 1 ? 'fotos' : 'foto'} {capturePhotos.length !== 1 ? 'disponíveis' : 'disponível'}
          </p>
        </>
      ) : (
        <div className={styles['captures-empty-state']}>
          <p>Nenhuma captura adicionada ainda</p>
        </div>
      )}
      
      <div className={styles['captures-buttons']}>
        <button className={styles['view-more-btn']} onClick={() => onViewMore('capturas')}>
          Ver Mais
        </button>
        <button className={styles['new-capture-btn-small']} onClick={onNewCapture}>
          Nova Captura
        </button>
      </div>
    </div>
  );
};

export default CapturesCard;
