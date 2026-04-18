import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const { login } = useContext(AppContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro no login');
            
            login(data);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 style={{background: 'linear-gradient(135deg, var(--secondary-color), var(--primary-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem', fontSize:'2rem'}}>TrendCatcher</h2>
                <h3 style={{marginBottom: '1rem'}}>Bem-vindo de volta!</h3>
                <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>Faça login para gerenciar sua Câmera e IA.</p>
                {error && <div className="status-message" style={{color: '#ff4d6d', border: '1px solid rgba(255, 77, 109, 0.4)', padding: '0.8rem', borderRadius: '8px'}}>{error}</div>}
                <form onSubmit={handleSubmit} className="auth-form" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <input type="email" placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)} required style={{padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', color:'white', fontSize:'1rem'}} />
                    <input type="password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} required style={{padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', color:'white', fontSize:'1rem'}} />
                    <button type="submit" className="search-btn" style={{width: '100%', marginTop: '1rem', padding: '1rem', borderRadius:'12px'}} disabled={loading}>
                        {loading ? <div className="loader"></div> : 'Entrar no Sistema'}
                    </button>
                </form>
                <div style={{marginTop: '2rem', textAlign: 'center'}}>
                    <Link to="/register" style={{color: 'var(--secondary-color)', textDecoration: 'none'}}>🚀 Não tem conta? Cadastre-se</Link>
                </div>
            </div>
        </div>
    );
}
