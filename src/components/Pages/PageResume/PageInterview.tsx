import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './PageResume.css'; 
import Stepper from '../Stepper/Stepper';

const PageInterview = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('loading');
      setTimeout(() => setUploadStatus('success'), 2000);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <main className="main-frame">
      <div className="content-wrapper">
        <Stepper currentStep={3} />

        <section className="main-content-frame">
          <div className="text-info-block">
            <h1 className="vacancy-title">Загрузить запись собеседования</h1>
            <p className="vacancy-description">Загрузите запись собеседования, чтобы платформа автоматически извлекла ключевые моменты общения с кандидатом. Система проанализирует ответы, выделит сильные и слабые стороны, зафиксирует риски и несоответствия, а также сформирует краткое резюме встречи.Это помогает HR и нанимающим менеджерам не переслушивать длинные записи, быстрее сравнивать кандидатов между собой и принимать более взвешенные решения по найму.</p>
          </div>

          {/* ЗОНА ЗАГРУЗКИ */}
          <section className={`upload-drop-zone-resume ${uploadStatus}`} style={{ 
                                                                                  minHeight: '400px', 
                                                                                  maxHeight: '400px' 
                                                                                }}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".mp3,.mp4,.mov" style={{ display: 'none' }} />

            {uploadStatus === 'idle' && (
              <div className="upload-center-content">
                <button className="btn-upload-resume-xl" onClick={handleUploadClick}>
                  <div className="icon-wrapper">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                  </div>
                 <span className="btn-upload-text" style={{ width: 'auto', lineHeight: '1.2' }}>Загрузить запись собеседования</span>
                </button>
                
                <div className="formats-container-row">
                  <span className="formats-label">в формате</span>
                  <div className="format-badges-group">
                    {/* Бадж MP3 */}
                    <div className="format-badge-item">
                      <span className="format-badge-text">MP3</span>
                    </div>
                    <span className="format-divider">/</span>
                    {/* Бадж MP4 */}
                    <div className="format-badge-item">
                      <span className="format-badge-text">MP4</span>
                    </div>
                    <span className="format-divider">/</span>
                    {/* Бадж MOV */}
                    <div className="format-badge-item">
                      <span className="format-badge-text">MOV</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {uploadStatus === 'loading' && (
              <div className="upload-center-content loading-state">
                 <div className="file-preview-card">
                   <div className="file-icon-placeholder">🎬</div>
                   <span className="file-name-info">{selectedFile?.name}</span>
                </div>
                <div className="loading-row">
                  <div className="spinner-icon"></div>
                  <span className="loading-text">Загрузка файла</span>
                </div>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="upload-center-content success-state">
                <div className="file-preview-card">
                   <button className="remove-file-btn" onClick={removeFile}>×</button>
                   <div className="file-icon-placeholder">🎬</div>
                   <span className="file-name-info">{selectedFile?.name}</span>
                </div>
                <div className="success-row">
                  <span className="check-icon">✓</span>
                  <span className="success-text">Запись загружена</span>
                </div>
                <button className="btn-next-step" onClick={() => navigate('/analyzer/result')}>
                  Далее <span className="icon-chevron">›</span>
                </button>
              </div>
            )}
          </section>

          <footer className="home-bottom-nav">
             <div className="bottom-buttons-container-resume">
                <button className="btn-resume-back" onClick={() => navigate('/analyzer/resume')}>
                  <span className="btn-resume-text">‹ Загрузить резюме</span>
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

export default PageInterview;