import { Link, useNavigate } from 'react-router-dom';
import './HeaderHome.css';

const HeaderHome = () => {
  const navigate = useNavigate();

  return (
    <header className="header-home">
      <div className="header-home-content">

        {/* Логотип */}
        <Link to="/HomeSelection" className="logo-link">
          <div className="logo-group">
            <img src="/Logo.svg" alt="Logo" className="logo-img" />
            <span className="logo-text">AI Talent Genome</span>
          </div>
        </Link>

        {/* Навигация */}
        <div className="header-right-side">
          <button className="btn-nav btn-vacancies" onClick={() => navigate('/vacancies')}>
            Мои вакансии
          </button>
          <button className="btn-nav btn-candidates-new">
            Мои кандидаты
          </button>
          <button className="btn-nav btn-analysis" onClick={() => navigate('/HomeSelection')}>
            Анализ
          </button>

          {/* остальное без изменений */}

          <div className="header-user-block">

            {/* Колокольчик с точкой */}
            <button className="notification-btn">
              <svg width="21" height="23" viewBox="0 0 21 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.8844 8.99534C15.8844 7.39958 15.2504 5.86918 14.1221 4.7408C12.9937 3.61243 11.4633 2.97852 9.86753 2.97852C8.27177 2.97852 6.74136 3.61243 5.61299 4.7408C4.48461 5.86918 3.8507 7.39958 3.8507 8.99534C4.3521 16.0953 0.842285 18.0206 0.842285 18.0206L6.28289 18.6735C8.66411 18.9593 11.071 18.9593 13.4522 18.6735L18.8928 18.0206C18.8928 18.0206 15.383 16.0953 15.8844 8.99534Z" stroke="#323333" strokeWidth="1.68453" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11.6045 21.0283C11.4282 21.3322 11.1751 21.5845 10.8706 21.7599C10.5662 21.9353 10.221 22.0276 9.86962 22.0276C9.51826 22.0276 9.17306 21.9353 8.86859 21.7599C8.56412 21.5845 8.31107 21.3322 8.13477 21.0283" stroke="#323333" strokeWidth="1.60048" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="16.1995" cy="4.22198" r="3.37758" fill="#24B3AC" stroke="white" strokeWidth="1.68879"/>
              </svg>
            </button>

            {/* Аватар с иконкой профиля внутри как фон */}
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                <svg className="profile-icon" width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g opacity="0.7">
                    <circle cx="18" cy="9" r="9" fill="#CED7D9"/>
                    <path d="M0 36C0 28.5442 6.04416 22.5 13.5 22.5H22.5C29.9558 22.5 36 28.5442 36 36V36.5C36 41.4706 31.9706 45.5 27 45.5H9C4.02944 45.5 0 41.4706 0 36.5V36Z" fill="#CED7D9"/>
                  </g>
                </svg>
                <span className="profile-avatar-text">АГ</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </header>
  );
};

export default HeaderHome;