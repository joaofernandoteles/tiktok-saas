import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/register`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro no cadastro');
            
            alert('Sua conta SaaS foi ativada com sucesso! Você já pode entrar.');
            navigate('/login');
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
                <h3 style={{marginBottom: '1rem'}}>Criar Conta</h3>
                <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>Cadastre-se na Plataforma e tenha seus gostos analisados por Inteligência Artificial.</p>
                {error && <div className="status-message" style={{color: '#ff4d6d', border: '1px solid rgba(255, 77, 109, 0.4)', padding: '0.8rem', borderRadius: '8px'}}>{error}</div>}
                <form onSubmit={handleSubmit} className="auth-form" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <input type="text" placeholder="Nome ou Empresa" value={name} onChange={e => setName(e.target.value)} required style={{padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', color:'white', fontSize:'1rem'}} />
                    <input type="email" placeholder="E-mail principal" value={email} onChange={e => setEmail(e.target.value)} required style={{padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', color:'white', fontSize:'1rem'}} />
                    <input type="password" placeholder="Crie uma senha forte" value={password} onChange={e => setPassword(e.target.value)} required style={{padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', color:'white', fontSize:'1rem'}} />
                    <button type="submit" className="search-btn" style={{width: '100%', marginTop: '1rem', padding: '1rem', borderRadius:'12px'}} disabled={loading}>
                         {loading ? <div className="loader"></div> : 'Ativar Minha Conta'}
                    </button>
                </form>
                <div style={{marginTop: '2rem', textAlign: 'center'}}>
                    <Link to="/login" style={{color: 'var(--secondary-color)', textDecoration: 'none'}}>⬅ Já é cliente? Faça Login</Link>
                </div>
            </div>
        </div>
    );
}
