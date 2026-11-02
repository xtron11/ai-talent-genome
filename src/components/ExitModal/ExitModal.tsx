import React, { useState } from 'react';
import './ExitModal.css';

interface ExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExit: () => void;
}

const ExitModal: React.FC<ExitModalProps> = ({ isOpen, onClose, onExit }) => {
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    // Здесь будет логика сохранения на бэкенд, если нужно
    setIsSaved(true);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-x" onClick={onClose}>×</button>
        
        {!isSaved ? (
          /* Окно 1: Предупреждение (image_619bf9.png) */
          <div className="modal-step">
            <h2 className="modal-title">Вы покидаете страницу анализа</h2>
            <p className="modal-text">Сохраните черновик, чтобы продолжить позднее</p>
            <div className="modal-buttons">
              <button className="btn-modal-save" onClick={handleSave}>
                Сохранить черновик
              </button>
              <button className="btn-modal-exit" onClick={onExit}>
                Выйти
              </button>
            </div>
          </div>
        ) : (
          /* Окно 2: Успех (image_619b7b.png) */
          <div className="modal-step">
            <h2 className="modal-title">Черновик сохранен</h2>
            <p className="modal-text">
              Вы сможете найти сохраненный черновик в личном кабинете и продолжить анализ позднее
            </p>
            <div className="modal-buttons">
              <button className="btn-modal-save" onClick={onClose}>
                Продолжить
              </button>
              <button className="btn-modal-exit" onClick={onExit}>
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExitModal;