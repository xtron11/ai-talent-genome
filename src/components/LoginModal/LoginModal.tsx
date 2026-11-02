import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginModal.css';

interface LoginModalProps {
  onClose: () => void;
  onSwitchToRegister?: () => void; // ← новый проп
}

type ModalView = 'hh-first' | 'credentials';

const LoginModal = ({ onClose, onSwitchToRegister }: LoginModalProps) => {
  const [view, setView] = useState<ModalView>('hh-first');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [emailValue, setEmailValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [loginError, setLoginError] = useState('');

  const navigate = useNavigate();

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (!input) { setPhoneValue(''); return; }
    if (input.startsWith('7') || input.startsWith('8')) { input = input.substring(1); }
    input = input.substring(0, 10);
    let formatted = '+7 ';
    if (input.length > 0) formatted += `(${input.substring(0, 3)}`;
    if (input.length >= 4) formatted += `) ${input.substring(3, 6)}`;
    if (input.length >= 7) formatted += ` ${input.substring(6, 8)}`;
    if (input.length >= 9) formatted += ` ${input.substring(8, 10)}`;
    setPhoneValue(formatted);
  };

  const isFormValid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const contactValid = authMethod === 'email'
      ? emailRegex.test(emailValue)
      : phoneValue.length === 18;
    return contactValid && passwordValue.length >= 4;
  }, [authMethod, emailValue, phoneValue, passwordValue]);

  // ── ВХОД: запрос к бэкенду + сохранение токена ──────────────────────────────
  const handleLogin = async () => {
    if (!isFormValid) return;
    setLoginError('');

    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: authMethod === 'phone' ? phoneValue : undefined,
          email: authMethod === 'email' ? emailValue : undefined,
          password: passwordValue,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setLoginError('Неверный E-mail или пароль. Повторите попытку.');
        return;
      }

      // Сохраняем JWT токен — теперь пользователь авторизован
      localStorage.setItem('token', result.token);

      onClose();
      navigate('/HomeSelection');

    } catch {
      setLoginError('Не удалось подключиться к серверу');
    }
  };

  const handleHHLogin = () => {
    const HH_CLIENT_ID = 'PK23JN5LV8U1VS7TBAQ79T5199SQBLMEF9VU9QI6UKCPEP45V0062S328R8HML0M';
    const HH_REDIRECT_URI = 'http://localhost:8000/callback';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: HH_CLIENT_ID,
      redirect_uri: HH_REDIRECT_URI,
      state: 'aitg-demo-1',
    });
    window.location.href = `https://hh.ru/oauth/authorize?${params.toString()}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Шапка общая */}
        <div className="modal-header">
          <button
            className="back-button"
            onClick={view === 'credentials' ? () => setView('hh-first') : onClose}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M13 7H1M1 7L7 13M1 7L7 1" stroke="#323333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="modal-logo">
            <img src="/LogoLoggin.svg" alt="DNA" className="logo-icon-svg" />
            <span className="logo-text-modal">AI Talent Genome</span>
          </div>
        </div>

        <h2 className="modal-main-title">Вход в личный кабинет</h2>

        {view === 'hh-first' ? (
          <div className="hh-main-frame">
            <div className="hh-info-card">
              <div className="hh-star-icon">
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
                  <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feFlood floodColor="#00A0CC" result="color" />
                      <feComposite in="color" in2="blur" operator="in" result="glow" />
                      <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                    d="M22 2L26.4902 17.5098L42 22L26.4902 26.4902L22 42L17.5098 26.4902L2 22L17.5098 17.5098L22 2Z"
                    fill="#1987A6"
                    stroke="#E5FEFF"
                    strokeWidth="1.14"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                  />
                </svg>
              </div>
              <p className="hh-description">
                Войдите через кабинет работодателя на HeadHunter, чтобы автоматически перенести актуальные вакансии и отлики кандидатов
              </p>
            </div>

            <div className="hh-action-block">
              <div className="agreement-frame">
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={isAgreed}
                    onChange={() => setIsAgreed(!isAgreed)}
                  />
                </div>
                <div className="agreement-textbox">
                  <label className="agreement-label">
                    Я принимаю условия пользовательского соглашения и даю согласие на обработку персональных данных
                  </label>
                </div>
              </div>

              <div className="hh-buttons-frame">
                <button
                  className={`btn-hh-accent ${isAgreed ? 'static' : 'disabled'}`}
                  disabled={!isAgreed}
                  onClick={handleHHLogin}
                >
                  <span className="btn-hh-text">Войти через HeadHunter</span>
                </button>
                <button className="btn-switch-text" onClick={() => setView('credentials')}>
                  <span className="btn-switch-label">Войти другим способом</span>
                </button>
              </div>
            </div>
          </div>

        ) : (
          <div className="modal-body-container">
            <div className="method-selector">
              <button
                className={`method-btn ${authMethod === 'email' ? 'active' : ''}`}
                onClick={() => { setAuthMethod('email'); setLoginError(''); }}
              >
                E-mail
              </button>
              <button
                className={`method-btn ${authMethod === 'phone' ? 'active' : ''}`}
                onClick={() => { setAuthMethod('phone'); setLoginError(''); }}
              >
                Телефон
              </button>
            </div>

            {/* Поле email/телефон */}
            <div className="input-field-wrapper">
              <div className="input-icon">
                {authMethod === 'email' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke={loginError ? '#E0057E' : '#919999'} strokeWidth="1.5">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke={loginError ? '#E0057E' : '#919999'} strokeWidth="1.5">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                )}
              </div>
              {authMethod === 'email' ? (
                <input type="email" placeholder="E-mail"
                  className={`login-input ${loginError ? 'input-error' : ''}`}
                  value={emailValue}
                  onChange={(e) => { setEmailValue(e.target.value); setLoginError(''); }}/>
              ) : (
                <input type="text" placeholder="+7 (___) ___ __ __"
                  className={`login-input ${loginError ? 'input-error' : ''}`}
                  value={phoneValue}
                  onChange={(e) => { handlePhoneInput(e); setLoginError(''); }}/>
              )}
            </div>

            {/* Поле пароля */}
            <div className="input-field-wrapper">
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke={loginError ? '#E0057E' : '#919999'} strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <input type={showPassword ? 'text' : 'password'} placeholder="Пароль"
                className={`login-input ${loginError ? 'input-error' : ''}`}
                value={passwordValue}
                onChange={(e) => { setPasswordValue(e.target.value); setLoginError(''); }}/>
              <button type="button" className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}>
                {/* глазик без изменений */}
              </button>
            </div>

            {loginError && <p className="login-error-text">{loginError}</p>}

            <button
              className={`login-submit-btn ${isFormValid ? 'valid' : ''}`}
              onClick={handleLogin}
            >
              Войти
            </button>

            <div className="social-group">
              <button className="social-login-btn">Войти с Google</button>
              <button className="social-login-btn">Войти с Yandex</button>
            </div>
            <p className="footer-hint">
              Нет учетной записи?{' '}
              <span className="signup-link" onClick={onSwitchToRegister}>
                Зарегистрируйтесь
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;