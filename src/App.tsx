import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import HeaderHome from './components/HeaderHome/HeaderHome';
import Hero from './components/Hero/Hero';
import Footer from './components/Footer/Footer';
import PageAnalyzer from './components/Pages/PageAnalyzer';
import PageResume from './components/Pages/PageResume/PageResume';
import PageInterview from './components/Pages/PageResume/PageInterview';
import SelectionPage from './SelectionPage/SelectionPage';
import UploadPage from './SelectionPage/UploadPage';
import HomeSelection from './HomeSelection/HomeSelection';
import AuthPage from './components/LoginModal/AuthPage';
import LoginModal from './components/LoginModal/LoginModal';
import ProtectedRoute from './components/ProtectedRoute';
import VacanciesPage from './VacanciesPage/VacanciesPage';
import AnalysisResultPage from './components/Pages/Analysisresultpage/Analysisresultpage';
import { useState } from 'react';
import './index.css';

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="app-wrapper">
      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
      <Routes>

        {/* ПУБЛИЧНЫЕ */}
        <Route path="/" element={
          <>
            <Header />
            <Hero />
            <Footer variant="main" />  {/* ← добавь */}
          </>
        }/>
        <Route path="/auth" element={<AuthPage />} />

        {/* ЗАЩИЩЁННЫЕ */}
        <Route path="/HomeSelection" element={
          <ProtectedRoute>
            <>
              <HeaderHome />
              <HomeSelection />
              <Footer />
            </>
          </ProtectedRoute>
        }/>
        <Route path="/analyzer" element={
          <ProtectedRoute>
            <>
              <HeaderHome />
              <PageAnalyzer />
              <Footer />
            </>
          </ProtectedRoute>
        }/>
        <Route path="/analyzer/resume" element={
          <ProtectedRoute>
            <>
              <HeaderHome />
              <PageResume />
              <Footer />
            </>
          </ProtectedRoute>
        }/>
        <Route path="/analyzer/resume/interview" element={
          <ProtectedRoute>
            <>
              <HeaderHome />
              <PageInterview />
              <Footer />
            </>
          </ProtectedRoute>
        }/>
        <Route path="/analyzer/result" element={
          <ProtectedRoute>
            <>
              <HeaderHome />
              <AnalysisResultPage />
              <Footer />
            </>
          </ProtectedRoute>
        }/>
        <Route path="/SelectionPage" element={
          <ProtectedRoute>
            <>
              <HeaderHome />
              <SelectionPage />
              <Footer />
            </>
          </ProtectedRoute>
        }/>
        <Route path="/upload-candidate" element={
          <ProtectedRoute>
            <>
              <HeaderHome />
              <UploadPage />
              <Footer />
            </>
          </ProtectedRoute>
        }/>
        <Route path="/vacancies" element={
          <ProtectedRoute>
            <>
              <HeaderHome />
              <VacanciesPage />
              <Footer />
            </>
          </ProtectedRoute>
        }/>
      </Routes>
    </div>
  );
}

export default App;