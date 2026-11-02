import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AnalysisResultPage.css';

interface AnalysisData {
  vacancyName: string;
  vacancyDescription: string;
  resumeFileName: string;
  candidatePosition: string;
  analysisResult: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
}

interface AnalysisResult {
  candidateName: string;
  candidatePosition: string;
  score: number;
  keyCompetencies: string;
  education: string;
  workExperience: WorkExperience[];
  requirements: Requirement[];
  requirementsConclusion: string;
  interviewSummary: InterviewPoint[];
  interviewConclusion: string;
  valueAlignment: ValueAlignment;
  managementStyle: ManagementStyle;
  swot: SWOT;
  generalConclusion: GeneralConclusion;
}

interface WorkExperience { company: string; period: string; role: string; }
interface Requirement { text: string; status: 'positive' | 'neutral' | 'negative'; }
interface InterviewPoint { title: string; text: string; }
interface ValueAlignment { companyValues: string; candidateOpinion: string[]; matches: string[]; risks: string[]; conclusion: string; }
interface ManagementStyle { style: string[]; softSkills: string[]; conclusion: string; }
interface SWOT { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[]; }
interface GeneralConclusion { summary: string; pros: string[]; cons: string[]; recommendation: string; }

const AnalysisResultPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'summary' | 'psychological'>('summary');
  const [data, setData] = useState<AnalysisData>({
    vacancyName: '', vacancyDescription: '', resumeFileName: '',
    candidatePosition: '', analysisResult: null, isLoading: true, error: null,
  });

  useEffect(() => {
    const vacancyName = localStorage.getItem('analysis_vacancy_name') || '';
    const vacancyDescription = localStorage.getItem('analysis_vacancy_description') || '';
    const resumeFileName = localStorage.getItem('analysis_resume_filename') || '';
    const candidatePosition = localStorage.getItem('analysis_candidate_position') || '';
    const resumeText = localStorage.getItem('analysis_resume_text') || '';

    setData(prev => ({ ...prev, vacancyName, vacancyDescription, resumeFileName, candidatePosition }));

    const cached = localStorage.getItem('analysis_result');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setData(prev => ({ ...prev, analysisResult: parsed, isLoading: false }));
        return;
      } catch { /* broken cache */ }
    }

    runAnalysis(vacancyName, vacancyDescription, candidatePosition, resumeText);
  }, []);

  const filterStrings = (arr: any[]): string[] =>
    (arr || [])
      .map(item => typeof item === 'string' ? item : (item?.text || item?.value || ''))
      .filter((s: string) => s && s.trim() !== '');

  const filterWorkExp = (arr: any[]): WorkExperience[] =>
    (arr || [])
      .filter(item => item && typeof item === 'object' && (item.company || item.role))
      .map(item => ({ company: item.company || '—', period: item.period || '', role: item.role || '—' }));

  const filterRequirements = (arr: any[]): Requirement[] =>
    (arr || [])
      .filter(item => item && typeof item === 'object' && item.text && item.text.trim() !== '')
      .map(item => ({
        text: item.text,
        status: (['positive', 'neutral', 'negative'].includes(item.status) ? item.status : 'neutral') as 'positive' | 'neutral' | 'negative',
      }));

  const filterInterviewPoints = (arr: any[]): InterviewPoint[] =>
    (arr || [])
      .filter(item => item && typeof item === 'object' && item.text && item.text.trim() !== '')
      .map(item => ({ title: item.title || '', text: item.text }));

  const buildResult = (parsed: any, candidatePosition: string): AnalysisResult => ({
    candidateName: parsed.candidateName || '—',
    candidatePosition: parsed.candidatePosition || candidatePosition,
    score: typeof parsed.score === 'number' ? parsed.score : 0,
    keyCompetencies: parsed.keyCompetencies || '—',
    education: parsed.education || '—',
    workExperience: filterWorkExp(parsed.workExperience),
    requirements: filterRequirements(parsed.requirements),
    requirementsConclusion: parsed.requirementsConclusion || '—',
    interviewSummary: filterInterviewPoints(parsed.interviewSummary),
    interviewConclusion: parsed.interviewConclusion || '—',
    valueAlignment: {
      companyValues: parsed.valueAlignment?.companyValues || '—',
      candidateOpinion: filterStrings(parsed.valueAlignment?.candidateOpinion),
      matches: filterStrings(parsed.valueAlignment?.matches),
      risks: filterStrings(parsed.valueAlignment?.risks),
      conclusion: parsed.valueAlignment?.conclusion || '—',
    },
    managementStyle: {
      style: filterStrings(parsed.managementStyle?.style),
      softSkills: filterStrings(parsed.managementStyle?.softSkills),
      conclusion: parsed.managementStyle?.conclusion || '—',
    },
    swot: {
      strengths: filterStrings(parsed.swot?.strengths),
      weaknesses: filterStrings(parsed.swot?.weaknesses),
      opportunities: filterStrings(parsed.swot?.opportunities),
      threats: filterStrings(parsed.swot?.threats),
    },
    generalConclusion: {
      summary: parsed.generalConclusion?.summary || '—',
      pros: filterStrings(parsed.generalConclusion?.pros),
      cons: filterStrings(parsed.generalConclusion?.cons),
      recommendation: parsed.generalConclusion?.recommendation || '—',
    },
  });

  const runAnalysis = async (vacancyName: string, vacancyDescription: string, candidatePosition: string, resumeText: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Первый запрос — общая сводка
      const response1 = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama3:latest',
          prompt: buildPromptSummary(vacancyName, vacancyDescription, candidatePosition, resumeText),
          stream: false,
          format: 'json',
          options: { num_predict: 2048, num_ctx: 8192, temperature: 0.2 },
        }),
      });

      if (!response1.ok) throw new Error(`Ollama error: ${response1.status}`);
      const raw1 = await response1.json();
      console.log('Summary response:', raw1.response);
      const parsed1 = JSON.parse(raw1.response.replace(/```json/g, '').replace(/```/g, '').trim());

      // Второй запрос — психологический портрет
      const response2 = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama3:latest',
          prompt: buildPromptPsychological(vacancyName, candidatePosition, resumeText),
          stream: false,
          format: 'json',
          options: { num_predict: 2048, num_ctx: 8192, temperature: 0.2 },
        }),
      });

      clearTimeout(timeoutId);
      if (!response2.ok) throw new Error(`Ollama error: ${response2.status}`);
      const raw2 = await response2.json();
      console.log('Psychological response:', raw2.response);
      const parsed2 = JSON.parse(raw2.response.replace(/```json/g, '').replace(/```/g, '').trim());

      // Объединяем результаты
      const result = buildResult({ ...parsed1, ...parsed2 }, candidatePosition);

      setData(prev => ({ ...prev, analysisResult: result, isLoading: false }));
      localStorage.setItem('analysis_result', JSON.stringify(result));

    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Ошибка анализа:', err);
      const demo = getDemoResult(candidatePosition);
      setData(prev => ({ ...prev, analysisResult: demo, isLoading: false, error: err.message }));
      localStorage.setItem('analysis_result', JSON.stringify(demo));
    }
  };

  const buildPromptSummary = (vacancy: string, description: string, position: string, resumeText: string) => `
Ты HR-аналитик. Проанализируй резюме и верни ТОЛЬКО JSON на русском языке.
Используй ТОЛЬКО факты из резюме. Не придумывай.

ВАКАНСИЯ: ${vacancy}
ОПИСАНИЕ: ${description}
ДОЛЖНОСТЬ: ${position}
РЕЗЮМЕ: ${resumeText}

Верни JSON:
{
  "candidateName": "Полное имя из резюме",
  "candidatePosition": "Желаемая должность из резюме",
  "score": 75,
  "keyCompetencies": "2-3 предложения о реальных компетенциях из резюме",
  "education": "Образование из резюме",
  "workExperience": [
    {"company": "Реальная компания из резюме", "period": "Период", "role": "Должность и обязанности"}
  ],
  "requirements": [
    {"text": "Конкретный навык из вакансии — есть ли в резюме", "status": "positive"},
    {"text": "Второй навык — оценка по резюме", "status": "negative"},
    {"text": "Третий навык — оценка", "status": "neutral"}
  ],
  "requirementsConclusion": "Конкретный вывод на основе резюме",
  "interviewSummary": [
    {"title": "Карьерный путь", "text": "Реальное описание из опыта работы"},
    {"title": "Технические навыки", "text": "Реальный стек из резюме"},
    {"title": "Соответствие вакансии", "text": "Конкретное сравнение"}
  ],
  "interviewConclusion": "Конкретный вывод",
  "valueAlignment": {
    "companyValues": "Ценности из описания вакансии",
    "candidateOpinion": ["Реальное наблюдение из резюме", "Второе наблюдение"],
    "matches": ["Реальное совпадение навыков", "Второе совпадение"],
    "risks": ["Реальный риск из резюме", "Второй риск"],
    "conclusion": "Конкретный вывод"
  }
}`;

  const buildPromptPsychological = (vacancy: string, position: string, resumeText: string) => `
Ты HR-психолог. Проанализируй профессиональный стиль кандидата по его резюме.
Верни ТОЛЬКО JSON на русском языке. Используй ТОЛЬКО факты из резюме.

ВАКАНСИЯ: ${vacancy}
ДОЛЖНОСТЬ КАНДИДАТА: ${position}
РЕЗЮМЕ: ${resumeText}

Верни JSON:
{
  "managementStyle": {
    "style": [
      "Конкретный стиль работы выведенный из реальных обязанностей кандидата",
      "Второй аспект рабочего стиля на основе его опыта"
    ],
    "softSkills": [
      "Реальный soft skill проявленный в описанных задачах",
      "Второй навык из опыта работы"
    ],
    "conclusion": "Конкретный вывод о профессиональном стиле на основе резюме"
  },
  "swot": {
    "strengths": [
      "Реальная сильная сторона из резюме",
      "Вторая сильная сторона"
    ],
    "weaknesses": [
      "Реальная слабая сторона или пробел относительно вакансии",
      "Второй пробел"
    ],
    "opportunities": [
      "Реальная возможность роста в данной роли",
      "Вторая возможность"
    ],
    "threats": [
      "Реальный риск для успеха в роли",
      "Второй риск"
    ]
  },
  "generalConclusion": {
    "summary": "Итоговый вывод о кандидате на основе резюме",
    "pros": [
      "Конкретный плюс кандидата для данной вакансии",
      "Второй плюс",
      "Третий плюс"
    ],
    "cons": [
      "Конкретный минус или зона роста",
      "Второй минус"
    ],
    "recommendation": "Конкретная рекомендация — брать или нет, с обоснованием"
  }
}`;

  const getDemoResult = (position: string): AnalysisResult => ({
    candidateName: 'Кандидат', candidatePosition: position || 'Не указана', score: 0,
    keyCompetencies: 'Ollama не запущена. Запустите: ollama run llama3',
    education: '—', workExperience: [],
    requirements: [{ text: 'Запустите Ollama для анализа', status: 'neutral' }],
    requirementsConclusion: '—', interviewSummary: [], interviewConclusion: '—',
    valueAlignment: { companyValues: '—', candidateOpinion: [], matches: [], risks: [], conclusion: '—' },
    managementStyle: { style: [], softSkills: [], conclusion: '—' },
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    generalConclusion: { summary: '—', pros: [], cons: [], recommendation: '—' },
  });

  const r = data.analysisResult;
  const dateStr = new Date().toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const statusIcon = (status: 'positive' | 'neutral' | 'negative') => {
    if (status === 'positive') return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8.5" stroke="#24B3AC"/><path d="M5 9l3 3 5-5" stroke="#24B3AC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    if (status === 'negative') return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8.5" stroke="#E0736A"/><path d="M6 6l6 6M12 6l-6 6" stroke="#E0736A" strokeWidth="1.5" strokeLinecap="round"/></svg>;
    return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8.5" stroke="#BCC8CC"/><path d="M6 9h6" stroke="#BCC8CC" strokeWidth="1.5" strokeLinecap="round"/></svg>;
  };

  const swotIcon = (type: 'strength' | 'weakness' | 'opportunity' | 'threat') => {
    if (type === 'strength') return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8.5" stroke="#24B3AC"/><path d="M5 9l3 3 5-5" stroke="#24B3AC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    if (type === 'weakness') return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8.5" stroke="#BCC8CC"/><path d="M6 9h6" stroke="#BCC8CC" strokeWidth="1.5" strokeLinecap="round"/></svg>;
    if (type === 'opportunity') return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="0.5" y="0.5" width="17" height="17" rx="3.5" stroke="#E8A04A"/><path d="M5 9l3 3 5-5" stroke="#E8A04A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="0.5" y="0.5" width="17" height="17" rx="3.5" stroke="#E0736A"/><path d="M6 6l6 6M12 6l-6 6" stroke="#E0736A" strokeWidth="1.5" strokeLinecap="round"/></svg>;
  };

  const proConIcon = (type: 'pro' | 'con') => {
    if (type === 'pro') return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8.5" stroke="#24B3AC"/><path d="M5 9l3 3 5-5" stroke="#24B3AC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8.5" stroke="#BCC8CC"/><path d="M6 9h6" stroke="#BCC8CC" strokeWidth="1.5" strokeLinecap="round"/></svg>;
  };

  return (
    <main className="main-frame">
      <div className="result-wrapper">

        <section className="result-stepper">
          <div className="result-stepper-inner">
            {['1. Загрузить вакансию','2. Загрузить резюме','3. Загрузить запись\nсобеседования','4. Получить портрет\nкандидата'].map((label, i) => (
              <div key={i} className="result-stepper-group">
                <div className="result-step-item">
                  <svg width="28" height="28" viewBox="0 0 36 36" fill="none" style={{ filter: 'drop-shadow(0px 0px 3px #00A0CC)' }}>
                    <path d="M18 1L21.6 13.4L34 18L21.6 22.4L18 34L14.4 22.4L2 18L14.4 13.4L18 1Z" fill="#1987A6" stroke="#E5FEFF" strokeWidth="0.69"/>
                  </svg>
                  <p className="result-step-label">{label}</p>
                </div>
                {i < 3 && <div className="result-dots"><span/><span/><span/><span/><span/></div>}
              </div>
            ))}
          </div>
        </section>

        <div className="result-status-badge">{data.isLoading ? 'Идёт анализ AI...' : 'Анализ завершен'}</div>

        <div className="result-candidate-card">
          <div className="result-candidate-avatar"><span>{r?.candidateName?.[0] || 'К'}</span></div>
          <div className="result-candidate-info">
            <div className="result-score-badge">{data.isLoading ? '...' : (r?.score ?? 0)}</div>
            <div>
              <h2 className="result-candidate-name">{data.isLoading ? 'Анализируется...' : (r?.candidateName || '—')}</h2>
              <p className="result-candidate-position">{r?.candidatePosition || data.candidatePosition}</p>
              <p className="result-candidate-date">дата загрузки: {dateStr}</p>
            </div>
          </div>
          <div className="result-candidate-actions">
            <button className="result-btn-download" disabled={data.isLoading}>Скачать pdf</button>
            <button className="result-btn-download" disabled={data.isLoading}>Скачать word</button>
          </div>
        </div>

        <button className="result-back-btn" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="#2494B3" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Назад к списку кандидатов
        </button>

        <p className="result-intro">Ознакомьтесь с результатами анализа кандидата: мы выделили сильные стороны, риски и степень соответствия вакансии.</p>

        <div className="result-tabs">
          <button className={`result-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Общая сводка</button>
          <button className={`result-tab ${activeTab === 'psychological' ? 'active' : ''}`} onClick={() => setActiveTab('psychological')}>Психологический портрет</button>
        </div>

        {data.isLoading && (
          <div className="result-loading">
            <div className="result-spinner"/>
            <p>AI анализирует кандидата...</p>
          </div>
        )}

        {!data.isLoading && !r && (
          <div className="result-loading">
            <p style={{color:'#E0736A'}}>Не удалось получить данные. Проверьте что Ollama запущена.</p>
            <code style={{fontSize:12,color:'#797F7F'}}>ollama run llama3</code>
          </div>
        )}

        {!data.isLoading && r && activeTab === 'summary' && (
          <div className="result-content">
            <div className="result-section">
              <h3 className="result-section-title">Анализ соответствия кандидата требованиям вакансии</h3>
              <h4 className="result-subsection-title">Ключевые компетенции</h4>
              <div className="result-competency-card">
                <div className="result-candidate-avatar sm"><span>{r.candidateName?.[0] || 'К'}</span></div>
                <div>
                  <p className="result-text">{r.keyCompetencies}</p>
                  <p className="result-text">Образование: {r.education}</p>
                </div>
              </div>
              <h4 className="result-subsection-title">Опыт работы</h4>
              <ul className="result-list">
                {r.workExperience.map((w, i) => (
                  <li key={i} className="result-list-item">
                    <strong>{w.company}{w.period ? ` (${w.period})` : ''}</strong>{w.role ? ` — ${w.role}` : ''}
                  </li>
                ))}
              </ul>
              <h4 className="result-subsection-title">Соответствие требованиям</h4>
              <div className="result-requirements">
                {r.requirements.map((req, i) => (
                  <div key={i} className="result-requirement-item">
                    {statusIcon(req.status)}<span>{req.text}</span>
                  </div>
                ))}
              </div>
              <div className="result-conclusion-box">
                <h4 className="result-conclusion-title">Вывод</h4>
                <p className="result-text">{r.requirementsConclusion}</p>
              </div>
            </div>

            <div className="result-section">
              <h3 className="result-section-title">Краткое резюме интервью (саммари)</h3>
              <ul className="result-list">
                {r.interviewSummary.map((item, i) => (
                  <li key={i} className="result-list-item">
                    {item.title && <strong>{item.title}: </strong>}{item.text}
                  </li>
                ))}
              </ul>
              <div className="result-conclusion-box">
                <h4 className="result-conclusion-title">Вывод</h4>
                <p className="result-text">{r.interviewConclusion}</p>
              </div>
            </div>

            <div className="result-section">
              <h3 className="result-section-title">Анализ ценностного совпадения</h3>
              <p className="result-text"><strong>Ценности компании:</strong> {r.valueAlignment.companyValues}</p>
              <h4 className="result-subsection-title">Мнение кандидата</h4>
              <ul className="result-list">
                {r.valueAlignment.candidateOpinion.map((o, i) => <li key={i} className="result-list-item">{o}</li>)}
              </ul>
              <h4 className="result-subsection-title">Совпадения</h4>
              <div className="result-requirements">
                {r.valueAlignment.matches.map((m, i) => (
                  <div key={i} className="result-requirement-item">{statusIcon('positive')}<span>{m}</span></div>
                ))}
              </div>
              <h4 className="result-subsection-title">Риски</h4>
              <div className="result-requirements">
                {r.valueAlignment.risks.map((risk, i) => (
                  <div key={i} className="result-requirement-item">{statusIcon('negative')}<span>{risk}</span></div>
                ))}
              </div>
              <div className="result-conclusion-box">
                <h4 className="result-conclusion-title">Вывод</h4>
                <p className="result-text">{r.valueAlignment.conclusion}</p>
              </div>
            </div>
            <div className="result-section">
              <h3 className="result-section-title">Вывод по управленческому стилю и soft skills</h3>
              <h4 className="result-subsection-title">Стиль управления</h4>
              <ul className="result-list">
                {r.managementStyle.style.length > 0
                  ? r.managementStyle.style.map((s, i) => <li key={i} className="result-list-item">{s}</li>)
                  : <li className="result-list-item" style={{color:'#BCC8CC'}}>Нет данных</li>}
              </ul>
              <h4 className="result-subsection-title">Soft skills</h4>
              <ul className="result-list">
                {r.managementStyle.softSkills.length > 0
                  ? r.managementStyle.softSkills.map((s, i) => <li key={i} className="result-list-item">{s}</li>)
                  : <li className="result-list-item" style={{color:'#BCC8CC'}}>Нет данных</li>}
              </ul>
              <div className="result-conclusion-box">
                <h4 className="result-conclusion-title">Вывод</h4>
                <p className="result-text">{r.managementStyle.conclusion}</p>
              </div>
            </div>

            <div className="result-section">
              <h3 className="result-section-title">SWOT-анализ кандидата</h3>
              <h4 className="result-subsection-title">Сильные стороны (Strengths)</h4>
              <div className="result-requirements">
                {r.swot.strengths.map((s, i) => <div key={i} className="result-requirement-item">{swotIcon('strength')}<span>{s}</span></div>)}
              </div>
              <h4 className="result-subsection-title">Слабые стороны (Weaknesses)</h4>
              <div className="result-requirements">
                {r.swot.weaknesses.map((s, i) => <div key={i} className="result-requirement-item">{swotIcon('weakness')}<span>{s}</span></div>)}
              </div>
              <h4 className="result-subsection-title">Возможности (Opportunities)</h4>
              <div className="result-requirements">
                {r.swot.opportunities.map((s, i) => <div key={i} className="result-requirement-item">{swotIcon('opportunity')}<span>{s}</span></div>)}
              </div>
              <h4 className="result-subsection-title">Угрозы (Threats)</h4>
              <div className="result-requirements">
                {r.swot.threats.map((s, i) => <div key={i} className="result-requirement-item">{swotIcon('threat')}<span>{s}</span></div>)}
              </div>
            </div>

            <div className="result-general-conclusion">
              <h3 className="result-general-title">Общий вывод</h3>
              <p className="result-text" style={{color:'rgba(255,255,255,0.9)'}}>{r.generalConclusion.summary}</p>
              <div className="result-requirement-item" style={{marginTop:12}}>
                {proConIcon('pro')}<strong style={{color:'#fff'}}>Что делает его хорошим кандидатом</strong>
              </div>
              <ul className="result-list">
                {r.generalConclusion.pros.map((p, i) => <li key={i} className="result-list-item" style={{color:'rgba(255,255,255,0.9)'}}>{p}</li>)}
              </ul>
              <div className="result-requirement-item" style={{marginTop:8}}>
                {proConIcon('con')}<strong style={{color:'#fff'}}>Что учитывать</strong>
              </div>
              <ul className="result-list">
                {r.generalConclusion.cons.map((c, i) => <li key={i} className="result-list-item" style={{color:'rgba(255,255,255,0.9)'}}>{c}</li>)}
              </ul>
              <div className="result-conclusion-box" style={{marginTop:16,background:'rgba(255,255,255,0.15)'}}>
                <h4 className="result-conclusion-title" style={{color:'#fff'}}>Рекомендация</h4>
                <p className="result-text" style={{color:'rgba(255,255,255,0.9)'}}>{r.generalConclusion.recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default AnalysisResultPage;