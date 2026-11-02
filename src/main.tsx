import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Добавляем импорт
import './index.css'
import './styles/common.css';
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter> {/* Оборачиваем здесь */}
      <App />
    </BrowserRouter>
  </StrictMode>,
)