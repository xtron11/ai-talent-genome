import { Navigate } from 'react-router-dom';
import { useAuth } from './../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuth } = useAuth();

  // Пока проверяем токен — ничего не показываем
  if (isAuth === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <span>Загрузка...</span>
    </div>;
  }

  // Не авторизован — редирект на главную (там форма входа)
  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;