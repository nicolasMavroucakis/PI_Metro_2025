import React from 'react';
import { HardHat, Building2, Trash2 } from 'lucide-react';
import { formatFileSize } from '../../../utils/formatters';
import styles from '../../../Style/ProjectDetails.module.css';

const ViewMorePhotosModal = ({ 
  show, 
  onClose, 
  photoCategory, 
  onFilterPhotos, 
  loadingAllPhotos, 
  allPhotos,
  getCategoryName,
  onDeletePhoto
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className={styles['modal-overlay']}>
      <div className={`${styles.modal} ${styles.large} ${styles.photoModal}`}>
        <div className={styles['modal-header']}>
          <h3>Todas as Fotos</h3>
          <button 
            className={styles['close-button']}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className={styles['capture-filters']}>
          <button 
            className={`${styles['filter-button']} ${photoCategory === 'all' ? styles.active : ''}`}
            onClick={() => onFilterPhotos('all')}
          >
            Todas
          </button>
          <button 
            className={`${styles['filter-button']} ${photoCategory === 'categoria1' ? styles.active : ''}`}
            onClick={() => onFilterPhotos('categoria1')}
          >
            <HardHat size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Fotos da Obra
          </button>
          <button 
            className={`${styles['filter-button']} ${photoCategory === 'categoria2' ? styles.active : ''}`}
            onClick={() => onFilterPhotos('categoria2')}
          >
            <Building2 size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Fotos do BIM
          </button>
        </div>

        <div className={styles['captures-content']}>
          {loadingAllPhotos ? (
            <div className={styles['loading-captures']}>
              <p>Carregando fotos...</p>
            </div>
          ) : allPhotos.length === 0 ? (
            <div className={styles['empty-captures']}>
              <p>Nenhuma foto encontrada.</p>
            </div>
          ) : (
            <div className={styles['captures-grid-large']}>
              {allPhotos.map((photo, index) => (
                <div key={index} className={styles['capture-item-large']}>
                  <div className={styles['capture-preview']}>
                    <img 
                      src={photo.url} 
                      alt={photo.fileName}
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/150x100/9E9E9E/white?text=Erro`;
                      }}
                    />
                  </div>
                  <div className={styles['capture-info']}>
                    <h5 className={styles['capture-name']} title={photo.fileName}>
                      {photo.fileName}
                    </h5>
                    <p className={styles['capture-details']}>
                      {getCategoryName(photo.category)} • {formatFileSize(photo.size)} • {new Date(photo.lastModified).toLocaleDateString('pt-BR')}
                    </p>
                    <div className={styles['capture-actions']}>
                      <button 
                        className={`${styles['action-button']} ${styles.small}`}
                        onClick={() => window.open(photo.url, '_blank')}
                      >
                        Ver Foto
                      </button>
                      <button 
                        className={`${styles['action-button']} ${styles.small} ${styles.danger}`}
                        onClick={() => onDeletePhoto(photo)}
                      >
                        <Trash2 size={14} style={{ marginRight: '4px' }} />
                        Apagar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewMorePhotosModal;
