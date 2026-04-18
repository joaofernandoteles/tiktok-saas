import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import { useContext } from 'react';
import MainLayout from './layout/MainLayout';
import Home from './pages/Home';
import Saved from './pages/Saved';
import Schedule from './pages/Schedule';
import Login from './pages/Login';
import Register from './pages/Register';

import './index.css';

// Componente para forçar o login antes de acessar o sistema
const ProtectedRoute = ({ children }) => {
    const { token } = useContext(AppContext);
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

// Componente para nao deixar abrir login se ja estiver logado
const PublicRoute = ({ children }) => {
    const { token } = useContext(AppContext);
    if (token) return <Navigate to="/" replace />;
    return children;
};

function RouterConfig() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
           <Route index element={<Home />} />
           <Route path="saved" element={<Saved />} />
           <Route path="schedule" element={<Schedule />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AppProvider>
        <RouterConfig />
    </AppProvider>
  );
}

export default App;
