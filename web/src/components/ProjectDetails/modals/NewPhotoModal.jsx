import React from 'react';
import { HardHat, Building2 } from 'lucide-react';
import styles from '../../../Style/ProjectDetails.module.css';

const NewPhotoModal = ({ show, onClose, onPhotoUpload, uploadingPhoto, uploadProgress }) => {
  if (!show) {
    return null;
  }

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles.modal}>
        <h3>Nova Foto</h3>
        <p>Escolha a categoria da foto que deseja adicionar:</p>
        
        <div className={styles['capture-type-options']}>
          <div className={styles['capture-option']}>
            <h4><HardHat size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Fotos da Obra</h4>
            <p>Imagens do progresso da construção</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) onPhotoUpload(file, 'categoria1');
              }}
              style={{ display: 'none' }}
              id="photo-categoria1-upload"
            />
            <button 
              className={`${styles['action-button']} ${styles.primary}`}
              onClick={() => document.getElementById('photo-categoria1-upload').click()}
              disabled={uploadingPhoto}
            >
              Selecionar Foto
            </button>
          </div>
          
          <div className={styles['capture-option']}>
            <h4><Building2 size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Fotos do BIM</h4>
            <p>Imagens de modelos e desenhos técnicos</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) onPhotoUpload(file, 'categoria2');
              }}
              style={{ display: 'none' }}
              id="photo-categoria2-upload"
            />
            <button 
              className={`${styles['action-button']} ${styles.primary}`}
              onClick={() => document.getElementById('photo-categoria2-upload').click()}
              disabled={uploadingPhoto}
            >
              Selecionar Foto
            </button>
          </div>
        </div>

        {uploadingPhoto && (
          <div className={styles['upload-progress']}>
            <p>Enviando foto... {uploadProgress}%</p>
            <div className={styles['progress-bar']}>
              <div 
                className={styles['progress-fill']} 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className={styles['modal-actions']}>
          <button 
            className={`${styles['action-button']} ${styles.secondary}`}
            onClick={onClose}
            disabled={uploadingPhoto}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPhotoModal;
