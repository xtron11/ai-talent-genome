import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PageAnalyzer.css';
import Stepper from './Stepper/Stepper';
import { fetchHHVacanciesFromBackend, fetchHHVacancyDetailsFromBackend } from '../../api'; 

const PageAnalyzer = () => {
  const navigate = useNavigate();
  const [isAddingVacancy, setIsAddingVacancy] = useState(false);
  const [vacancyName, setVacancyName] = useState('');
  const [isNameConfirmed, setIsNameConfirmed] = useState(false);
  const [resumeText, setResumeText] = useState('');
  
  // --- СОСТОЯНИЯ ---
  const [hhVacancies, setHhVacancies] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingVacancies, setIsLoadingVacancies] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // -----------------------

  // Закрытие выпадающего списка при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && vacancyName.trim() !== '') {
      setIsNameConfirmed(true);
    }
  };

  // --- ЛОГИКА ЗАГРУЗКИ ВАКАНСИЙ ---
  const loadHHVacancies = async () => {
    setIsDropdownOpen(true);
    if (hhVacancies.length > 0) return; // Уже загружены

    setIsLoadingVacancies(true);
    try {
      // Здесь вызываем ваш бэкенд, который делает запрос к HH API
      const data = await fetchHHVacanciesFromBackend(); 
      setHhVacancies(data.items || []);
    } catch (error) {
      console.error("Ошибка загрузки вакансий", error);
    } finally {
      setIsLoadingVacancies(false);
    }
  };

  // Вспомогательная функция для очистки HTML из описания HH
  const stripHtml = (html: string) => {
    if (!html) return "";
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      // Добавляем переносы строк для списков и параграфов, чтобы текст был читаемым
      doc.querySelectorAll('p, li, br').forEach(el => el.after('\n'));
      return doc.body.textContent?.trim() || "";
    } catch (e) {
      // Если парсер упал, просто чистим регуляркой (план Б)
      return html.replace(/<[^>]+>/g, '').trim();
    }
  };

  // --- ФУНКЦИЯ ВЫБОРА ВАКАНСИИ ---
  const handleSelectHHVacancy = async (vac: any) => {
    // 1. Сразу подставляем название и короткий текст из списка (сниппет)
    setVacancyName(vac.name);
    setIsNameConfirmed(true);
    setIsDropdownOpen(false);
    setIsAddingVacancy(false);
    
    const shortText = stripHtml(`${vac.snippet?.responsibility || ''}\n${vac.snippet?.requirement || ''}`);
    setResumeText(shortText);

    try {
      // 2. Запрашиваем полный текст через твой бэкенд
      const details = await fetchHHVacancyDetailsFromBackend(vac.id);
      
      // Проверяем, что details — это объект и там есть description
      if (details && typeof details === 'object' && details.description) {
        setResumeText(stripHtml(details.description));
      }
    } catch (error) {
      console.error("Не удалось загрузить детали:", error);
      // Если ошибка — у нас в поле уже лежит shortText, так что юзер не увидит пустоты
    }
  };
  // --------------------------------

  const resetVacancyName = () => {
    setVacancyName('');
    setIsNameConfirmed(false);
    setIsAddingVacancy(false);
    setResumeText('');
    setHhVacancies([]); // Сбросить список при сбросе формы
  };

  return (
    <main className="main-frame">
      <div className="content-wrapper">
        <Stepper currentStep={1} />

        <section className="main-content-frame">
          <div className="text-info-block">
            <h1 className="vacancy-title">Загрузить вакансию</h1>
            <p className="vacancy-description">
              Достаточно загрузить резюме на платформу — система структурирует информацию, подсветит сильные и слабые стороны кандидата, найдёт пересечения с профилем должности и предложит предварительную оценку. Это сокращает время на первичный скрининг, снижает риск пропустить подходящего кандидата и освобождает HR от рутинных задач, позволяя сфокусироваться на общении и качественной оценке соискателей.
            </p>
          </div>

          <div className="action-buttons-container">
            {!isNameConfirmed && (
              <div className="action-buttons-frame">
                <button className="btn-add-new" onClick={() => setIsAddingVacancy(true)}>
                  Добавить новую вакансию <span className="icon-plus">+</span>
                </button>
                
                {/* --- ВЫПАДАЮЩИЙ СПИСОК --- */}
                <div className="dropdown-container" ref={dropdownRef}>
                  <div 
                    className="dropdown-my-vacancies" 
                    onClick={loadHHVacancies}
                  >
                    <span>Выбрать из моих вакансий</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>

                  {isDropdownOpen && (
                    <div className="vacancies-dropdown-menu">
                      {isLoadingVacancies && <div className="dropdown-item">Загрузка...</div>}
                      {!isLoadingVacancies && hhVacancies.length === 0 && <div className="dropdown-item">Нет вакансий</div>}
                      {hhVacancies.map((vac) => (
                        <div 
                          key={vac.id} 
                          className="dropdown-item" 
                          onClick={() => handleSelectHHVacancy(vac)}
                        >
                          {vac.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* ------------------------- */}
              </div>
            )}
            
            {/* ... rest of the code ... */}
            {isAddingVacancy && !isNameConfirmed && (
              <div className="vacancy-input-wrapper">
                <input 
                  type="text" 
                  className="vacancy-name-input"
                  placeholder="Введите название вакансии"
                  value={vacancyName}
                  onChange={(e) => setVacancyName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>
            )}
            
            {isNameConfirmed && (
              <div className="confirmed-vacancy-tag">
                <span className="tag-text">{vacancyName}</span>
                <button className="tag-remove-btn" onClick={resetVacancyName}>×</button>
              </div>
            )}
          </div>
          
          <section className="upload-drop-zone">
            {!resumeText && (
              <span className="textarea-placeholder">Введите описание вакансии...</span>
            )}
            <textarea
              className="resume-textarea"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </section>

          <footer className="home-bottom-nav">
            <div className="bottom-buttons-container">
              <button 
                className={`btn-footer btn-width-155 ${(vacancyName || resumeText) ? 'active-secondary' : 'disabled'}`}
                onClick={resetVacancyName}
                disabled={!vacancyName && !resumeText}
              >
                <span>Очистить</span>
                <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.75 5.75L11.75 11.75M11.75 5.75L17.75 11.75M20.75 0.75H7.75L0.75 8.75L7.75 16.75H20.75C21.2804 16.75 21.7891 16.5393 22.1642 16.1642C22.5393 15.7891 22.75 15.2804 22.75 14.75V2.75C22.75 2.21957 22.5393 1.71086 22.1642 1.33579C21.7891 0.960714 21.2804 0.75 20.75 0.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <button 
                className={`btn-footer btn-width-212 ${(vacancyName || resumeText) ? 'active-primary' : 'disabled'}`}
                disabled={!vacancyName && !resumeText}
              >
                <span>Сохранить черновик</span>
              </button>

              <button 
                className={`btn-footer btn-width-126 ${(isNameConfirmed && resumeText) ? 'active-accent' : 'disabled'}`}
                disabled={!isNameConfirmed || !resumeText}
                onClick={() => {
                  localStorage.setItem('analysis_vacancy_name', vacancyName);
                  localStorage.setItem('analysis_vacancy_description', resumeText);
                  navigate('/analyzer/resume');
                }} 
              >
                <span>Далее</span> <span className="icon-chevron">›</span>
              </button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
};

export default PageAnalyzer;