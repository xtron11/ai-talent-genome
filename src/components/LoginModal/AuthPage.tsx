import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');

        if (!code) {
            navigate('/');
            return;
        }

        console.log("Код получен от бэкенда:", code);

        fetch('http://localhost:8000/api/exchange-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.access_token && data.token) {
                console.log("Токены получены!");

                // HH токен — для запросов к HH API
                localStorage.setItem('hh_access_token', data.access_token);

                // Наш JWT — для проверки авторизации в ProtectedRoute
                localStorage.setItem('token', data.token);

                navigate('/HomeSelection');
            } else {
                console.error("Ошибка обмена кода:", data);
                navigate('/');
            }
        })
        .catch(err => {
            console.error("Ошибка сети:", err);
            navigate('/');
        });

    }, [location, navigate]);

    return (
        <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Manrope, sans-serif', color: '#323333' }}>
            Авторизация через HeadHunter...
        </div>
    );
};

export default AuthPage;