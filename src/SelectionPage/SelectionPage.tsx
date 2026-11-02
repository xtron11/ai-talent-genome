import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCollectionsForVacancy, fetchNegotiationsPage, fetchHHVacanciesFromBackend } from '../api';
import './SelectionPage.css';

type Vacancy = { id: string; name: string };
type Collection = { id: string; name: string; count: number; url: string };
type Candidate = { 
  id: string; 
  name?: string; 
  resume?: { 
    title: string;
    url?: string;           // ← прямая ссылка на резюме
    alternate_url?: string; // ← публичная ссылка (обычно она и нужна)
  } | null 
};

const SelectionPage = () => {
  const navigate = useNavigate();
  
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isStatusesOpen, setIsStatusesOpen] = useState(true);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState('');

  // Выбранные кандидаты (чекбоксы в списке)
  const [checkedCandidateIds, setCheckedCandidateIds] = useState<Set<string>>(new Set());

  const statusCollections = collections.filter(c => c.url !== 'VIRTUAL' && c.id !== 'response');
  const statusIds = statusCollections.map(c => c.id);
  const allStatusChecked = statusIds.length > 0 && statusIds.every(id => selectedCollectionIds.has(id));
  const someStatusChecked = statusIds.some(id => selectedCollectionIds.has(id));

  const checkedCount = checkedCandidateIds.size;
  const allCandidatesChecked = candidates.length > 0 && candidates.every(c => checkedCandidateIds.has(c.id));

  const [isAdditionalCriteria, setIsAdditionalCriteria] = useState(false);

  const [candidateCount, setCandidateCount] = useState('');
  const handleCountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 99)) setCandidateCount(val);
  };
  // 1. Вакансии
  useEffect(() => {
    fetchHHVacanciesFromBackend()
      .then(data => {
        setVacancies(data.items || []);
        if (data.items?.length > 0) setSelectedVacancyId(data.items[0].id);
      })
      .catch(err => console.error('Ошибка загрузки вакансий:', err));
  }, []);

  // 2. Коллекции
  useEffect(() => {
    if (!selectedVacancyId) return;
    fetchCollectionsForVacancy(selectedVacancyId)
      .then(data => {
        const realCollections: Collection[] = data.collections || [];
        const totalCount = realCollections.reduce((sum, c) => sum + c.count, 0);
        const allResponsesCollection: Collection = {
          id: 'all_responses', name: 'Все отклики', count: totalCount, url: 'VIRTUAL',
        };
        const finalCollections = [allResponsesCollection, ...realCollections];
        setCollections(finalCollections);
        setSelectedCollectionIds(new Set(['all_responses']));
      })
      .catch(err => console.error('Ошибка загрузки коллекций:', err));
  }, [selectedVacancyId]);

  // 3. Кандидаты
  useEffect(() => {
    if (!selectedVacancyId || collections.length === 0 || selectedCollectionIds.size === 0) return;
    const selectedCols = collections.filter(c => selectedCollectionIds.has(c.id));

    const loadFromCollection = async (url: string, target: Candidate[]) => {
      let page = 0, hasMore = true;
      while (hasMore) {
        const data = await fetchNegotiationsPage(url, page);
        if (data.items?.length > 0) {
          target.push(...data.items);
          page++;
          if (data.items.length < 50) hasMore = false;
        } else hasMore = false;
      }
    };

    const load = async () => {
      setIsLoading(true);
      setCheckedCandidateIds(new Set()); // сбрасываем выбор при смене категории
      const all: Candidate[] = [];
      for (const col of selectedCols) {
        if (col.url === 'VIRTUAL') {
          for (const rc of collections.filter(c => c.url !== 'VIRTUAL')) {
            setLoadProgress(`Загрузка: ${rc.name}...`);
            await loadFromCollection(rc.url, all);
          }
        } else {
          setLoadProgress(`Загрузка: ${col.name}...`);
          await loadFromCollection(col.url, all);
        }
      }
      const unique = Array.from(new Map(all.map(c => [c.id, c])).values());
      setCandidates(unique);
      setIsLoading(false);
      setLoadProgress(`Найдено: ${unique.length}`);
    };

    load();
  }, [selectedVacancyId, selectedCollectionIds, collections]);

  const toggleCollection = (id: string) => {
    setSelectedCollectionIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllStatuses = () => {
    setSelectedCollectionIds(prev => {
      const next = new Set(prev);
      if (allStatusChecked) statusIds.forEach(id => next.delete(id));
      else statusIds.forEach(id => next.add(id));
      return next;
    });
  };

  // Тоггл одного кандидата
  const toggleCandidate = (id: string) => {
    setCheckedCandidateIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Снять все отметки
  const clearAllChecked = () => setCheckedCandidateIds(new Set());

  // Выбрать всех
  const selectAllCandidates = () => setCheckedCandidateIds(new Set(candidates.map(c => c.id)));

  return (
    <main className="main-frame">
      <div className="content-wrapper-selection">

        {/* ХЕДЕР ВАКАНСИИ */}
        <div className="header-frame">
          {checkedCount > 0 ? (
            // Растягиваем на 100% — до края панели критериев
            <div className="selector-bar">
              <div className="vacancy-title-compact-wrapper">
                <span className="vacancy-title-compact">
                  {vacancies.find(v => v.id === selectedVacancyId)?.name || ''}
                </span>
                <select
                  className="vacancy-title-compact-select"
                  value={selectedVacancyId}
                  onChange={e => setSelectedVacancyId(e.target.value)}
                >
                  {vacancies.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="selection-tags-row">
                <div className="selection-tag">
                  <button className="selection-tag-close" onClick={clearAllChecked}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <span className="selection-tag-count">{checkedCount}</span>
                  <span className="selection-tag-text">откликов выбрано</span>
                </div>
                {!allCandidatesChecked && (
                  <div className="selection-tag" onClick={selectAllCandidates} style={{cursor:'pointer'}}>
                    <button className="selection-tag-close" onClick={e=>{e.stopPropagation();clearAllChecked();}}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <span className="selection-tag-text">выбраны все в этой категории</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="header-inner">
              <select className="vacancy-title-main" value={selectedVacancyId}
                onChange={e => setSelectedVacancyId(e.target.value)}>
                {vacancies.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <button className="btn-add-candidate" onClick={() => navigate('/upload-candidate', { state: { from: '/SelectionPage' } })}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="#323333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="btn-add-text">Добавить кандидата вручную</span>
              </button>
            </div>
          )}
        </div>

        {/* ОСНОВНОЙ КОНТЕНТ */}
        <div className="selection-content-area">

          {/* СОРТИРОВКА */}
          <aside className="sorting-panel">
            <div className="sort-header-frame">
              <h2 className="sort-title">Сортировка</h2>
            </div>
            <div className="sort-categories-list">

              {collections.filter(c => c.url === 'VIRTUAL').map(col => (
                <div
                  key={col.id}
                  className={`sort-item-sidebar ${selectedCollectionIds.has(col.id) ? 'active' : ''}`}
                  onClick={() => toggleCollection(col.id)}
                >
                  <input type="checkbox" checked={selectedCollectionIds.has(col.id)}
                    onChange={() => toggleCollection(col.id)} onClick={e => e.stopPropagation()} />
                  <span>{col.name}</span>
                </div>
              ))}

              {collections.filter(c => c.id === 'response').map(col => (
                <div
                  key={col.id}
                  className={`sort-item-sidebar ${selectedCollectionIds.has(col.id) ? 'active' : ''}`}
                  onClick={() => toggleCollection(col.id)}
                >
                  <input type="checkbox" checked={selectedCollectionIds.has(col.id)}
                    onChange={() => toggleCollection(col.id)} onClick={e => e.stopPropagation()} />
                  <span>{col.name}</span>
                </div>
              ))}

              <div className="status-group-container">
                <div className="status-group-header">
                  <input
                    type="checkbox"
                    checked={allStatusChecked}
                    ref={el => { if (el) el.indeterminate = someStatusChecked && !allStatusChecked; }}
                    onChange={toggleAllStatuses}
                    onClick={e => e.stopPropagation()}
                  />
                  <span onClick={() => setIsStatusesOpen(!isStatusesOpen)} style={{ flex: 1, cursor: 'pointer' }}>
                    Статус
                  </span>
                  <span
                    className={`chevron ${isStatusesOpen ? 'up' : 'down'}`}
                    onClick={() => setIsStatusesOpen(!isStatusesOpen)}
                  />
                </div>
                {isStatusesOpen && (
                  <div className="status-group-content">
                    {statusCollections.map(col => (
                      <div
                        key={col.id}
                        className={`sort-item-status ${selectedCollectionIds.has(col.id) ? 'active' : ''}`}
                        onClick={() => toggleCollection(col.id)}
                      >
                        <input type="checkbox" checked={selectedCollectionIds.has(col.id)}
                          onChange={() => toggleCollection(col.id)} onClick={e => e.stopPropagation()} />
                        <span>{col.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </aside>

          {/* СПИСОК КАНДИДАТОВ */}
          <section className="candidates-list-panel">
            <div className="table-inner-frame">
              {isLoading && (
                <div className="loading-spinner">
                  <p>⏳ Загрузка откликов...</p>
                  <p>{loadProgress}</p>
                </div>
              )}
              {!isLoading && candidates.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontFamily: 'Manrope, sans-serif' }}>
                  Кандидаты не найдены.
                </div>
              )}
              {!isLoading && candidates.map(cand => (
                <div
                  key={cand.id}
                  className={`table-row-component ${checkedCandidateIds.has(cand.id) ? 'checked' : ''}`}
                  onClick={() => toggleCandidate(cand.id)}
                >
                  <div className="resume-text-frame">
                    <input
                      type="checkbox"
                      className="table-checkbox"
                      checked={checkedCandidateIds.has(cand.id)}
                      onChange={() => toggleCandidate(cand.id)}
                      onClick={e => e.stopPropagation()}
                    />
                    <span
                      className="candidate-name-link"
                      onClick={(e) => {
                        e.stopPropagation(); // чтобы не тригерить toggleCandidate
                        const link = cand.resume?.alternate_url || cand.resume?.url;
                        if (link) window.open(link, '_blank', 'noopener,noreferrer');
                      }}
                      style={{ cursor: cand.resume?.alternate_url || cand.resume?.url ? 'pointer' : 'default' }}
                    >
                      {cand.resume?.title || cand.name || 'Без названия'}
                    </span>
                  </div>
                  <div className="status-badge">статус</div>
                </div>
              ))}
            </div>
          </section>

          {/* КРИТЕРИИ АНАЛИЗА */}
          <aside className="criteria-panel-main">
          <h2 className="criteria-title">Критерии анализа</h2>

          <div className="criteria-row-frame">
            <span className="criteria-label-text">Количество финально отобранных кандидатов</span>
            <input
              className="criteria-input-field"
              type="text"
              inputMode="numeric"
              value={candidateCount}
              onChange={handleCountInput}
              placeholder="от 1 до 99"
              maxLength={2}
            />
          </div>

          <div className="additional-criteria-frame">
            <div className="toggle-row">
              {/* Кликабельный toggle */}
              <div
                className={`toggle-component ${isAdditionalCriteria ? 'toggle-on' : ''}`}
                onClick={() => setIsAdditionalCriteria(prev => !prev)}
              />
              <span className="additional-label">Дополнительные критерии</span>
            </div>

            <p className="additional-description">
              Эти критерии повышают приоритет и влияют на попадание кандидатов в топ
            </p>

            {/* Textarea — только когда toggle включён */}
            {isAdditionalCriteria && (
              <textarea
                className="additional-criteria-textarea"
                placeholder="Пример: английский B2+, опыт работы в горнодобывающих компаниях, не менее 1 года в среднем на местах работ"
              />
            )}
          </div>

          {/* Кнопка станет активной, если выбран хотя бы 1 кандидат И введено число */}
          <button 
            className="btn-start-analysis" 
            disabled={checkedCandidateIds.size === 0 || candidateCount === ''}
            onClick={() => {
              if (checkedCandidateIds.size > 0 && candidateCount !== '') {
                console.log("Запуск анализа для:", Array.from(checkedCandidateIds));
              }
            }}
          >
            Начать анализ
          </button>
        </aside>

        </div>
      </div>
    </main>
  );
};

export default SelectionPage;