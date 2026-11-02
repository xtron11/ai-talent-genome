import React, { useState, useRef } from 'react';
import { useNavigate, useLocation  } from 'react-router-dom';
import './UploadPage.css';


const UploadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Определяем откуда пришли
  const from = location.state?.from || '/SelectionPage';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [candidatePosition, setCandidatePosition] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Состояния: 'idle' | 'loading' | 'success'
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  
  // --- ДОБАВЛЕНО: Состояние для модального окна ---
  const [showModal, setShowModal] = useState(false);
  // ------------------------------------------------

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('loading'); // Включаем режим загрузки
      
      // Имитируем загрузку 2 секунды
      setTimeout(() => {
        setUploadStatus('success');
      }, 2000);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- ИСПРАВЛЕНО: Логика проверки данных ---
  const handleStartAnalysis = () => {
    if (!candidatePosition.trim()) {
      setShowModal(true);
      setTimeout(() => setShowModal(false), 3000);
      return;
    }

    const newVacancy = {
      id: `manual_${Date.now()}`,
      name: candidatePosition.trim(),
      area: { name: '—' },
      counters: { responses: 0 },
    };
    const stored = localStorage.getItem('created_vacancies');
    const existing = stored ? JSON.parse(stored) : [];
    localStorage.setItem('created_vacancies', JSON.stringify([...existing, newVacancy]));

    navigate(from); // ← возвращаемся туда откуда пришли
  };
  // ------------------------------------------

  const StarIcon = ({ active, completed }: { active?: boolean; completed?: boolean }) => (
    <div className={`hh-star-icon ${active || completed ? 'active' : ''}`}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M20 0L24.4902 15.5098L40 20L24.4902 24.4902L20 40L15.5098 24.4902L0 20L15.5098 15.5098L20 0Z" fill={active || completed ? "#2494B3" : "#E5E8E8"} />
      </svg>
    </div>
  );
  return (
    <main className="main-frame">
      <div className="content-wrapper">
        <section className="stepper-container">
          <div className="stepper-inner">
            <div className="step-item"><StarIcon completed /><p className="step-label completed">1. Загрузить вакансию</p></div>
            <div className="dots-divider active"><span></span><span></span><span></span><span></span><span></span></div>
            <div className="step-item"><StarIcon active /><p className="step-label active">2. Загрузить резюме</p></div>
            <div className="dots-divider"><span></span><span></span><span></span><span></span><span></span></div>
            <div className="step-item"><StarIcon /><p className="step-label">3. Загрузить запись собеседования</p></div>
            <div className="dots-divider"><span></span><span></span><span></span><span></span><span></span></div>
            <div className="step-item"><StarIcon /><p className="step-label">4. Итоговый анализ</p></div>
          </div>
        </section>

        <section className="main-content-frame">
          <div className="text-info-block">
            <h1 className="vacancy-title">Загрузить резюме</h1>
          </div>

          <div className="candidate-input-container">
            {/* ВАЖНО: candidate-input-field должен иметь position: relative в CSS */}
            <div className="candidate-input-field">
                <input type="text" className="candidate-input-native" placeholder="Введите должность кандидата" value={candidatePosition} onChange={(e) => setCandidatePosition(e.target.value)} />
                
                {/* --- ПЕРЕНЕСЕНО СЮДА --- */}
                {showModal && (
                  <div className="resume-modal-overlay"> 
                    <div className="resume-modal-content">
                      Укажите должность кандидата, чтобы продолжить
                    </div>
                  </div>
                )}
                {/* ----------------------- */}
            </div>
            <p className="candidate-input-label">Под этой должностью будет отображаться кандидат в общем списке</p>
          </div>

          <section className={`upload-drop-zone-resume ${uploadStatus}`}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx" style={{ display: 'none' }} />

            {/* СОСТОЯНИЕ 1: IDLE */}
            {uploadStatus === 'idle' && (
              <div className="upload-center-content">
                <button className="btn-upload-resume-xl" onClick={handleUploadClick}>
                  <div className="icon-wrapper">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <span className="btn-upload-text">Загрузить резюме</span>
                </button>
                <div className="formats-frame">
                  <span className="formats-text-main">в формате</span>
                  <div className="badge-pdf-frame"><span className="badge-text">PDF</span></div>
                  <span className="formats-text-main">или</span>
                  <div className="badge-word-frame"><span className="badge-text">WORD</span></div>
                </div>
              </div>
            )}

            {/* СОСТОЯНИЕ 2: LOADING */}
            {uploadStatus === 'loading' && (
              <div className="upload-center-content loading-state">
                <div className="file-preview-card">
                   <div className="file-icon-placeholder">📄</div>
                   <span className="file-name-info">{selectedFile?.name}</span>
                </div>
                <div className="loading-row">
                  <div className="spinner-icon"></div>
                  <span className="loading-text">Загрузка файла</span>
                </div>
              </div>
            )}

            {/* СОСТОЯНИЕ 3: SUCCESS */}
            {uploadStatus === 'success' && (
                <div className="upload-center-content success-state">
                    <div className="file-preview-card">
                    <button className="remove-file-btn" onClick={removeFile}>×</button>
                    <div className="file-icon-placeholder">
                        {/* Иконка документа */}
                        <svg width="48" height="56" viewBox="0 0 48 56" fill="none">
                        <path d="M0 6C0 2.68629 2.68629 0 6 0H30L48 18V50C48 53.3137 45.3137 56 42 56H6C2.68629 56 0 53.3137 0 50V6Z" fill="#F2F5F5"/>
                        <path d="M30 0V18H48L30 0Z" fill="#D1D9D9"/>
                        </svg>
                    </div>
                    <span className="file-name-info">{selectedFile?.name}</span>
                    </div>
                    
                    <div className="success-row">
                    <span className="check-icon">✓</span>
                    <span className="success-text">Резюме загружено</span>
                    </div>

                    <button className="btn-next-step" onClick={handleStartAnalysis}>
                    <span>Вернуться к анализу кандидатов</span>
                    <span className="icon-chevron">›</span>
                    </button>
                </div>
                )}
          </section>

          <footer className="home-bottom-nav">
             <div className="bottom-buttons-container-resume">
              <button className="btn-resume-back" onClick={() => navigate(from)}>
                <span className="btn-resume-text">‹ Назад</span>
              </button>
             </div>
          </footer>
        </section>
      </div>
    </main>
  );
};

export default UploadPage;