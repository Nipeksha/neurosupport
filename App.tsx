import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DyslexiaTools from './pages/DyslexiaTools';
import AutismSupport from './pages/AutismSupport';
import AutismAssessment from './pages/AutismAssessment';
import Games from './components/Games';

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dyslexia" element={<DyslexiaTools />} />
            <Route path="/autism" element={<AutismSupport />} />
            <Route path="/autism/assessment" element={<AutismAssessment />} />
            <Route path="/autism/games" element={<Games />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
};

export default App;