import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginModal.css';
import './RegisterModal.css';

interface RegisterModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

type RegisterStep = 'contact' | 'password' | 'confirm';

const CheckIcon = ({ valid }: { valid: boolean }) => (
  valid ? (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.8333 6.55715V7.17048C13.8325 8.6081 13.367 10.0069 12.5062 11.1584C11.6454 12.3098 10.4355 13.1521 9.05691 13.5597C7.67829 13.9674 6.20484 13.9184 4.85631 13.4202C3.50779 12.922 2.35644 12.0012 1.57397 10.7952C0.791511 9.58917 0.419861 8.16253 0.514451 6.72803C0.609042 5.29353 1.1648 3.92803 2.09885 2.8352C3.0329 1.74236 4.29519 0.980737 5.69746 0.663913C7.09973 0.347089 8.56685 0.49204 9.88 1.07715M13.8333 1.83715L7.16667 8.51048L5.16667 6.51048" stroke="#2494B3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7.5" cy="7.5" r="6.5" stroke="#D2D9D9" strokeWidth="1"/>
    </svg>
  )
);

const RegisterModal = ({ onClose, onSwitchToLogin }: RegisterModalProps) => {
  const [step, setStep] = useState<RegisterStep>('contact');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [emailValue, setEmailValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpError, setOtpError] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true); // сначала можно сразу нажать
  const [resendCount, setResendCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [phoneExistsError, setPhoneExistsError] = useState(false);

  // Интервалы в секундах: 30с, 1м, 2м, 5м, 10м, 30м, 1ч
  const RESEND_INTERVALS = [30, 60, 120, 300, 600, 1800, 3600];

  const startTimer = (count: number) => {
    const seconds = RESEND_INTERVALS[Math.min(count, RESEND_INTERVALS.length - 1)];
    setTimer(seconds);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const navigate = useNavigate();

  const handleResend = () => {
    setOtp(['', '', '', '', '', '']);
    setOtpError(false);        // сбрасываем ошибку
    setOtpSuccess(false);
    setPhoneExistsError(false);
    const newCount = resendCount + 1;
    setResendCount(newCount);
    startTimer(newCount - 1);
  };

  React.useEffect(() => {
    // При входе на confirm таймер не стартует — canResend уже true
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (!input) { setPhoneValue(''); return; }
    if (input.startsWith('7') || input.startsWith('8')) input = input.substring(1);
    input = input.substring(0, 10);
    let formatted = '+7 ';
    if (input.length > 0) formatted += `(${input.substring(0, 3)}`;
    if (input.length >= 4) formatted += `) ${input.substring(3, 6)}`;
    if (input.length >= 7) formatted += ` ${input.substring(6, 8)}`;
    if (input.length >= 9) formatted += ` ${input.substring(8, 10)}`;
    setPhoneValue(formatted);
  };

  const isContactValid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return authMethod === 'email' ? emailRegex.test(emailValue) : phoneValue.length === 18;
  }, [authMethod, emailValue, phoneValue]);

  const passwordRules = useMemo(() => ({
    length:  passwordValue.length >= 8,
    cases:   /[a-z]/.test(passwordValue) && /[A-Z]/.test(passwordValue),
    digit:   /\d/.test(passwordValue),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordValue),
  }), [passwordValue]);

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  // Маскируем телефон: +7700*****18
  const maskedPhone = phoneValue.length > 8
  ? phoneValue.slice(0, 9) + '*'.repeat(phoneValue.length - 11) + phoneValue.slice(-2)
  : phoneValue;

  // Маскируем email: da***@mail.ru
  const maskedEmail = emailValue.replace(/^(.{2})(.*)(@.*)$/,
    (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 3)) + c
  );

  const handleOtpChange = async (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setOtpError(false); // сброс ошибки при вводе
    setPhoneExistsError(false);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Проверяем когда все 6 заполнены
    if (newOtp.every(d => d !== '')) {
      const code = newOtp.join('');
      if (code === '000000') {
        // Отправляем данные на бэкенд
        try {
          const response = await fetch('http://localhost:8000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: phoneValue,
              password: passwordValue,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            if (result.detail === 'Пользователь с таким номером уже существует') {
              setPhoneExistsError(true); // показываем специальную ошибку
            } else {
              setOtpError(true);
            }
            return;
          }

          setOtpSuccess(true);
          setTimeout(() => {
            navigate('/HomeSelection');
          }, 3000);

        } catch (err) {
          console.error('Сетевая ошибка:', err);
          setOtpError(true);
        }
      } else {
        setOtpError(true);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleNext = async () => {
    if (step === 'contact' && isContactValid) {
      // Проверяем телефон на существование только для phone
      if (authMethod === 'phone') {
        console.log('Проверяем номер:', phoneValue); // ← добавь
        try {
          const response = await fetch('http://localhost:8000/check-phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneValue }),
          });
          const result = await response.json();
          console.log('Ответ сервера:', result); // ← добавь
          if (result.exists) {
            setPhoneExistsError(true);
            return; // не пускаем дальше
          }
        } catch (err){
          console.error('Ошибка:', err); // ← добавь
          // если бэкенд недоступен — пропускаем проверку
        }
      }
      setPhoneExistsError(false);
      setStep('password');
    }
    else if (step === 'password' && isPasswordValid) setStep('confirm');
  };

  const handleBack = () => {
    if (step === 'password') setStep('contact');
    else if (step === 'confirm') setStep('password');
    else onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Шапка */}
        <div className="modal-header">
          <button className="back-button" onClick={handleBack}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M13 7H1M1 7L7 13M1 7L7 1" stroke="#323333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="modal-logo">
            <img src="/LogoLoggin.svg" alt="DNA" className="logo-icon-svg" />
            <span className="logo-text-modal">AI Talent Genome</span>
          </div>
        </div>

        {/* ШАГ 1: контакт */}
        {step === 'contact' && (
          <>
            <h2 className="modal-main-title">Регистрация</h2>
            <div className="modal-body-container">
              <div className="method-selector">
                <button className={`method-btn ${authMethod === 'email' ? 'active' : ''}`} onClick={() => setAuthMethod('email')}>E-mail</button>
                <button className={`method-btn ${authMethod === 'phone' ? 'active' : ''}`} onClick={() => setAuthMethod('phone')}>Телефон</button>
              </div>
              <div className="input-field-wrapper">
                <div className="input-icon">
                  {authMethod === 'email' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#919999" strokeWidth="1.5"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#919999" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                  )}
                </div>
                {authMethod === 'email' ? (
                  <input type="email" placeholder="E-mail" className="login-input" value={emailValue} onChange={(e) => setEmailValue(e.target.value)}/>
                ) : (
                  <input type="text" placeholder="+7 (___) ___ __ __" className="login-input"
                    value={phoneValue}
                    onChange={(e) => { handlePhoneInput(e); setPhoneExistsError(false); }}/>
                )}
              </div>
              {phoneExistsError && (
                <p className="phone-exists-error">
                  Аккаунт с таким номером телефона уже существует.{' '}
                  <span className="phone-exists-login" onClick={onSwitchToLogin}>
                    Войти
                  </span>
                </p>
              )}
              <button className={`login-submit-btn ${isContactValid ? 'valid' : ''}`} onClick={handleNext} disabled={!isContactValid}>Далее</button>
              <div className="social-group">
                <button className="social-login-btn">Войти с Google</button>
                <button className="social-login-btn">Войти с Yandex</button>
              </div>
              <p className="footer-hint">Уже есть учётная запись?{' '}<span className="signup-link" onClick={onSwitchToLogin}>Войти</span></p>
            </div>
          </>
        )}

        {/* ШАГ 2: пароль */}
        {step === 'password' && (
          <>
            <h2 className="modal-main-title">Регистрация</h2>
            <div className="modal-body-container">
              <div className="register-step2-frame">
                <div className="input-field-wrapper">
                  <div className="input-icon">
                    {authMethod === 'phone' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#919999" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#919999" strokeWidth="1.5"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    )}
                  </div>
                  <input type={authMethod === 'email' ? 'email' : 'text'} className="login-input register-input-readonly"
                    value={authMethod === 'email' ? emailValue : phoneValue} readOnly/>
                </div>
                <div className="register-password-frame">
                  <label className="register-field-label">Пароль</label>
                  <div className="input-field-wrapper">
                    <div className="input-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#919999" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    </div>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Пароль" className="login-input"
                      value={passwordValue} onChange={(e) => setPasswordValue(e.target.value)}/>
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#919999" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#919999" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="password-rules">
                  <p className="password-rules-title">Пароль должен содержать:</p>
                  <div className="password-rule"><CheckIcon valid={passwordRules.length}/><span className={passwordRules.length ? 'rule-valid' : ''}>Не менее 8 символов</span></div>
                  <div className="password-rule"><CheckIcon valid={passwordRules.cases}/><span className={passwordRules.cases ? 'rule-valid' : ''}>Не менее одной заглавной и строчной буквы</span></div>
                  <div className="password-rule"><CheckIcon valid={passwordRules.digit}/><span className={passwordRules.digit ? 'rule-valid' : ''}>Не менее одной цифры</span></div>
                  <div className="password-rule"><CheckIcon valid={passwordRules.special}/><span className={passwordRules.special ? 'rule-valid' : ''}>Не менее одного спецсимвола (! ? @ # и др.)</span></div>
                </div>
                <button className={`login-submit-btn ${isPasswordValid ? 'valid' : ''}`} onClick={handleNext} disabled={!isPasswordValid}>Далее</button>
              </div>
            </div>
          </>
        )}

        {/* ШАГ 3: подтверждение */}
        {step === 'confirm' && (
          <div className="modal-body-container">
            {authMethod === 'phone' ? (
              otpSuccess ? (
                /* Экран успеха */
                <div className="confirm-frame success-frame">
                  <h2 className="success-title">Ваш аккаунт подтверждён</h2>
                  <div className="success-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="32" cy="32" r="30" stroke="#24B3AC" strokeWidth="2.5"/>
                      <path d="M20 33l8 8 16-18" stroke="#24B3AC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              ) : (
                /* Подтверждение телефона — 6 ячеек OTP */
                <div className="confirm-frame">
                  <h2 className="modal-main-title">Подтвердите ваш сотовый номер</h2>
                  <p className="confirm-description">
                    Для активации вашего аккаунта, подтвердите код,<br/>
                    отправленный на номер {maskedPhone}
                  </p>
                  <div className="otp-frame">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        className={`otp-cell ${otpError ? 'otp-cell-error' : otp.join('') === '000000' ? 'otp-cell-valid' : ''}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      />
                    ))}
                  </div>
                  {otpError && <p className="otp-error-text">Введён неверный код</p>}
                  {phoneExistsError && (
                    <p className="phone-exists-error">
                      Аккаунт с таким номером телефона уже существует.{' '}
                      <span className="phone-exists-login" onClick={onSwitchToLogin}>
                        Войти
                      </span>
                    </p>
                  )}
                  {/* Повторная отправка */}
                  {canResend ? (
                    <p className="otp-resend-link" onClick={handleResend}>
                      Отправить код повторно
                    </p>
                  ) : (
                    <p className="otp-resend">
                      Отправить код повторно: {String(Math.floor(timer / 60)).padStart(2,'0')}:{String(timer % 60).padStart(2,'0')}
                    </p>
                  )}
                </div>
              )
            ) : (
              /* Подтверждение email */
              <div className="confirm-frame">
                <h2 className="modal-main-title">Подтвердите ваш Email - адрес</h2>
                <p className="confirm-description">
                  Для активации вашего аккаунта, перейдите<br/>
                  по ссылке, отправленной на {maskedEmail}
                </p>
                <p className="confirm-hint">
                  Если письма нет во входящих, проверьте папку<br/>
                  «Спам»
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default RegisterModal;