import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './PageResume.css';
import Stepper from '../Stepper/Stepper';
import mammoth from 'mammoth';

const PageResume = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [candidatePosition, setCandidatePosition] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Состояния: 'idle' | 'loading' | 'success'
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  
  // --- ДОБАВЛЕНО: Состояние для модального окна ---
  const [showModal, setShowModal] = useState(false);
  // ------------------------------------------------

  const handleUploadClick = () => fileInputRef.current?.click();

  const removeFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- ИСПРАВЛЕНО: Логика проверки данных ---
  const handleStartAnalysis = () => {
    // 1. Проверяем, введена ли должность (удаляем пробелы по краям)
    if (!candidatePosition.trim()) {
      setShowModal(true); // Показываем окно
      // Скрываем окно через 3 секунды
      setTimeout(() => setShowModal(false), 3000);
      return; // Прерываем выполнение
    }

    // 2. Если всё ок, переходим дальше
    navigate('/analyzer/resume/interview'); 
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch (err) {
          console.error('Ошибка чтения файла:', err);
          resolve('');
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('loading');

      const text = await extractTextFromFile(file);
      console.log('Extracted text:', text); // проверяем в консоли
      localStorage.setItem('analysis_resume_text', text);
      localStorage.setItem('analysis_resume_filename', file.name);

      setTimeout(() => setUploadStatus('success'), 2000);
    }
  };
  // ------------------------------------------
  return (
    <main className="main-frame">
      <div className="content-wrapper">
        <Stepper currentStep={2} />

        <section className="main-content-frame">
          <div className="text-info-block">
            <h1 className="vacancy-title">Загрузить резюме</h1>
            <p className="vacancy-description">Достаточно загрузить резюме на платформу — система структурирует информацию, подсветит сильные и слабые стороны кандидата, найдёт пересечения с профилем должности и предложит предварительную оценку. Это сокращает время на первичный скрининг, снижает риск пропустить подходящего кандидата и освобождает HR от рутинных задач, позволяя сфокусироваться на общении и качественной оценке соискателей.</p>
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
            <input type="file" ref={fileInputRef} onChange={handleFileChange} 
                accept=".pdf,.doc,.docx" style={{ display: 'none' }} />

            {/* СОСТОЯНИЕ 1: IDLE */}
            {uploadStatus === 'idle' && (
              <div className="upload-center-content">
                <button className="btn-upload-resume-xl" onClick={handleUploadClick}>
                  <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.75 0.75H2.75C2.21957 0.75 1.71086 0.960714 1.33579 1.33579C0.960714 1.71086 0.75 2.21957 0.75 2.75V18.75C0.75 19.2804 0.960714 19.7891 1.33579 20.1642C1.71086 20.5393 2.21957 20.75 2.75 20.75H14.75C15.2804 20.75 15.7891 20.5393 16.1642 20.1642C16.5393 19.7891 16.75 19.2804 16.75 18.75V6.75M10.75 0.75L16.75 6.75M10.75 0.75V6.75H16.75M12.75 11.75H4.75M12.75 15.75H4.75M6.75 7.75H4.75" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
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

                    <button className="btn-next-step" onClick={() => {
                      localStorage.setItem('analysis_resume_filename', selectedFile?.name || '');
                      localStorage.setItem('analysis_candidate_position', candidatePosition);
                      handleStartAnalysis();
                    }}>
                      <span>Далее</span>
                      <span className="icon-chevron">›</span>
                    </button>
                </div>
                )}
          </section>

          <footer className="home-bottom-nav">
             <div className="bottom-buttons-container-resume">
                <button className="btn-resume-back" onClick={() => navigate('/analyzer')}>
                  <span className="btn-resume-text">‹ Загрузить вакансию</span>
                </button>
                <button className={`btn-resume-save ${uploadStatus === 'success' ? 'active' : ''}`} disabled={uploadStatus !== 'success'}>
                  <span className="btn-resume-text">Сохранить черновик</span>
                </button>
             </div>
          </footer>
        </section>
      </div>
    </main>
  );
};

export default PageResume;