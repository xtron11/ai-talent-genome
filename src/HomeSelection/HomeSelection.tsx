import './HomeSelection.css';
import { useNavigate } from 'react-router-dom';

const HomeSelection = () => {
  const navigate = useNavigate();
  return (
    <main className="selection-wrapper">
      <div className="selection-container">
        {/* Frame добро пожаловать */}
        <header className="welcome-frame">
          <h1 className="welcome-title">Добро пожаловать!</h1>
          <div className="subtitle-frame">
            <p className="welcome-subtitle">Выберите, что вы хотите сделать сегодня</p>
          </div>
        </header>

        {/* Кнопки */}
        <section className="cards-grid">
          {/* Frame первой кнопки */}
          <button className="selection-card" onClick={() => navigate('/analyzer')}>
            <div className="star-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 0L24.4902 15.5098L40 20L24.4902 24.4902L20 40L15.5098 24.4902L0 20L15.5098 15.5098L20 0Z" fill="#1987A6" stroke="#E5FEFF" strokeWidth="1.14"/>
              </svg>
            </div>
            <span className="card-text">
              Провести поведенческий и эмоциональный анализ кандидата
            </span>
          </button>

          {/* Frame второй кнопки */}
          <button className="selection-card" onClick={() => navigate('/SelectionPage')}>
            <div className="star-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 0L24.4902 15.5098L40 20L24.4902 24.4902L20 40L15.5098 24.4902L0 20L15.5098 15.5098L20 0Z" fill="#1987A6" stroke="#E5FEFF" strokeWidth="1.14"/>
              </svg>
            </div>
            <span className="card-text">
              Выявить топ-кандидатов под вакансию
            </span>
          </button>
        </section>
      </div>
    </main>
  );
};

export default HomeSelection;