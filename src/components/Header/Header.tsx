import { useState } from 'react';
import './Header.css';
import LoginModal from '../LoginModal/LoginModal';
import RegisterModal from '../LoginModal/RegisterModal';

const Header = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const openLogin = () => { setIsRegisterOpen(false); setIsLoginOpen(true); };
  const openRegister = () => { setIsLoginOpen(false); setIsRegisterOpen(true); };

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="logo-group">
            <img src="/Logo.svg" alt="Logo" className="logo-img" />
            <span className="logo-text">AI Talent Genome</span>
          </div>
          <nav className="nav-group">
            <button className="btn-base btn-text">Контакты</button>
            <button className="btn-base btn-accent" onClick={openLogin}>Войти</button>
            <button className="btn-base btn-primary" onClick={openRegister}>Регистрация</button>
            <div className="lang-selector">
              <svg className="globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>RU</span>
            </div>
          </nav>
        </div>
      </header>

      {isLoginOpen && (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onSwitchToRegister={openRegister}  // ← добавь
        />
      )}
      {isRegisterOpen && (
        <RegisterModal
          onClose={() => setIsRegisterOpen(false)}
          onSwitchToLogin={openLogin}
        />
      )}
    </>
  );
};

export default Header;