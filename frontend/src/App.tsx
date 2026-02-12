import type { FC } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocaleProvider } from './contexts/LocaleContext';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';

const App: FC = () => {
  return (
    <LocaleProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/:userSlug/dashboard" element={<DashboardPage />} />
            <Route path="/:userSlug/:yearMonth" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </LocaleProvider>
  );
}

export default App;
