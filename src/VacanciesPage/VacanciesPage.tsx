import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './VacanciesPage.css';
import { fetchHHVacanciesFromBackend } from '../api';

type Vacancy = {
  id: string;
  name: string;
  area?: { name: string };
  counters?: { responses: number };
};

// Степпер встроенный с правильными текстами
const VacancyStepper = () => {
  const steps = [
    '1. Выбрать вакансию',
    '2. Выбрать кандидатов',
    '3. Указать критерии',
    '4. Получить топ\nцелевых кандидатов',
  ];

  return (
    <section className="vac-stepper">
      <div className="vac-stepper-inner">
        {steps.map((label, i) => {
          const isActive = i === 0;
          const isInactive = i > 0;
          const isLast = i === steps.length - 1;
          return (
            <div key={i} className="vac-stepper-group">
              <div className="vac-step-item">
                <div className="vac-step-star">
                  <svg
                    width="32" height="32" viewBox="0 0 36 36" fill="none"
                    style={isActive ? { filter: 'drop-shadow(0px 0px 3px #00A0CC)' } : {}}
                  >
                    <path
                      d="M18 1L21.6 13.4L34 18L21.6 22.4L18 34L14.4 22.4L2 18L14.4 13.4L18 1Z"
                      fill={isActive ? '#1987A6' : '#ACBEBF'}
                      stroke={isActive ? '#E5FEFF' : 'none'}
                      strokeWidth="0.69"
                    />
                  </svg>
                </div>
                <p className={`vac-step-label ${isActive ? 'vac-step-active' : isInactive ? 'vac-step-inactive' : ''}`}>
                  {label}
                </p>
              </div>
              {!isLast && (
                <div className="vac-dots-divider">
                  <span/><span/><span/><span/><span/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

const VacanciesPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'hh' | 'created'>('hh');
  const [searchQuery, setSearchQuery] = useState('');
  const [hhVacancies, setHhVacancies] = useState<Vacancy[]>([]);
  const [createdVacancies, setCreatedVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Загружаем HH вакансии
  useEffect(() => {
    setIsLoading(true);
    fetchHHVacanciesFromBackend()
      .then(data => setHhVacancies(data.items || []))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  // Загружаем созданные вручную вакансии из localStorage
  useEffect(() => {
    const stored = localStorage.getItem('created_vacancies');
    if (stored) {
      try {
        setCreatedVacancies(JSON.parse(stored));
      } catch {
        setCreatedVacancies([]);
      }
    }

    // Слушаем изменения (когда UploadPage добавит вакансию)
    const handleStorage = () => {
      const updated = localStorage.getItem('created_vacancies');
      if (updated) setCreatedVacancies(JSON.parse(updated));
    };
    window.addEventListener('storage', handleStorage);
    // Также проверяем при фокусе вкладки
    window.addEventListener('focus', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleStorage);
    };
  }, []);

  const vacancies = activeTab === 'hh' ? hhVacancies : createdVacancies;

  const filtered = vacancies.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allChecked = filtered.length > 0 && filtered.every(v => checkedIds.has(v.id));

  const toggleAll = () => {
    if (allChecked) setCheckedIds(new Set());
    else setCheckedIds(new Set(filtered.map(v => v.id)));
  };

  const toggleOne = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <main className="main-frame">
      <div className="content-wrapper">
        <VacancyStepper />

        <div className="vac-page-content">

          {/* Заголовок + кнопка */}
          <div className="vac-header-row">
            <h1 className="vac-page-title">Мои вакансии</h1>
            <button className="btn-add-vacancy" onClick={() => navigate('/upload-candidate', { state: { from: '/vacancies' } })}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Добавить вакансию вручную
            </button>
          </div>

          {/* Табы + поиск */}
          <div className="vac-controls-row">
            <div className="vac-tabs">
              <button
                className={`vac-tab ${activeTab === 'hh' ? 'active' : ''}`}
                onClick={() => setActiveTab('hh')}
              >
                Вакансии с HH
              </button>
              <button
                className={`vac-tab ${activeTab === 'created' ? 'active' : ''}`}
                onClick={() => { setActiveTab('created'); }}
              >
                Созданные вакансии
              </button>
            </div>
            <div className="vac-search-wrapper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="vac-search-icon">
                <circle cx="11" cy="11" r="8" stroke="#BCC8CC" strokeWidth="1.5"/>
                <path d="M21 21l-4.35-4.35" stroke="#BCC8CC" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                className="vac-search-input"
                type="text"
                placeholder="Начните вводить название вакансии"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Таблица */}
          <div className="vac-table-wrapper">
            <div className="vac-table-head">
              <div className="vac-th vac-th-check">
                <input type="checkbox" className="vac-checkbox" checked={allChecked} onChange={toggleAll}/>
              </div>
              <div className="vac-th vac-th-name">
                название
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M6 10l6-6 6 6M6 14l6 6 6-6" stroke="#BCC8CC" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div className="vac-th vac-th-region">
                регион
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M6 10l6-6 6 6M6 14l6 6 6-6" stroke="#BCC8CC" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div className="vac-th vac-th-responses">
                отклики
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M6 10l6-6 6 6M6 14l6 6 6-6" stroke="#BCC8CC" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div className="vac-th vac-th-status">
                статус
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M6 10l6-6 6 6M6 14l6 6 6-6" stroke="#BCC8CC" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
            </div>

            <div className="vac-table-body">
              {isLoading && <div className="vac-empty">Загрузка...</div>}
              {!isLoading && filtered.length === 0 && (
                <div className="vac-empty">
                  {activeTab === 'created'
                    ? 'Нет созданных вакансий. Нажмите «Добавить вакансию вручную».'
                    : 'Вакансии не найдены'}
                </div>
              )}
              {!isLoading && filtered.map(vac => (
                <div
                  key={vac.id}
                  className={`vac-row ${checkedIds.has(vac.id) ? 'checked' : ''}`}
                  onClick={() => toggleOne(vac.id)}
                >
                  <div className="vac-td vac-td-check">
                    <input type="checkbox" className="vac-checkbox"
                      checked={checkedIds.has(vac.id)}
                      onChange={() => toggleOne(vac.id)}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  <div className="vac-td vac-td-name">{vac.name}</div>
                  <div className="vac-td vac-td-region">{vac.area?.name || '—'}</div>
                  <div className="vac-td vac-td-responses">{vac.counters?.responses ?? '—'}</div>
                  <div className="vac-td vac-td-status">
                    <span className="vac-status-badge">статус</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default VacanciesPage;