import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { CalendarClockIcon, CheckCircleIcon, LinkIcon, Trash2Icon, RefreshCcwIcon } from 'lucide-react';

export default function Schedule() {
    const { token } = useContext(AppContext);
    const [status, setStatus] = useState({ connected: false, username: null });
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const resStatus = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/tiktok/status`, { headers: { 'Authorization': `Bearer ${token}` }});
            const dataStatus = await resStatus.json();
            setStatus(dataStatus);

            const resQueue = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/schedule/list`, { headers: { 'Authorization': `Bearer ${token}` }});
            const dataQueue = await resQueue.json();
            setQueue(dataQueue);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const connectTikTok = async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/tiktok/connect`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }});
        const data = await res.json();
        window.location.href = data.url; 
    };

    const handleDelete = async (id) => {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/schedule/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({id}) });
        loadData();
    };

    return (
        <div className="app-container">
          <header className="header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
            <div style={{textAlign: 'left'}}>
               <h1>Calendário Autoposter <span style={{fontSize: '0.8rem', verticalAlign: 'top', background: 'var(--primary-color)', color: 'white', padding: '2px 6px', borderRadius: 8}}>BETA</span></h1>
               <p style={{marginTop: '0.5rem', fontSize: '1rem'}}>Acompanhe os envios agendados ou conecte sua conta oficial do TikTok.</p>
            </div>
            <div>
               {status.connected ? (
                   <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(11, 163, 96, 0.1)', color: '#0ba360', padding: '0.8rem 1.5rem', borderRadius: 20, border: '1px solid rgba(11, 163, 96, 0.4)'}}>
                       <CheckCircleIcon size={18}/> Conectado a Conta Oficial: <b>{status.username}</b>
                   </div>
               ) : (
                   <button onClick={connectTikTok} className="search-btn" style={{margin: 0, display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'linear-gradient(135deg, #000 0%, #333 100%)', border: '1px solid #555'}}>
                       <LinkIcon size={18}/> Conectar Conta Oficial do TikTok
                   </button>
               )}
            </div>
          </header>

          <div style={{background: 'var(--panel-bg)', borderRadius: 24, padding: '2rem', border: '1px solid var(--panel-border)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                  <h2 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><CalendarClockIcon/> Fila do Robô de Publicação</h2>
                  <button onClick={loadData} style={{background: 'transparent', border: 'none', color: 'var(--secondary-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem'}}><RefreshCcwIcon size={16}/> Atualizar</button>
              </div>
              
              {loading ? (
                  <div style={{textAlign: 'center', padding: '2rem'}}><div className="loader" style={{margin: '0 auto'}}></div></div>
              ) : queue.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 16}}>
                      <p style={{color: 'var(--text-secondary)'}}>Sua Fila está vazia.</p>
                      <p>Vá na aba <b>"Meus Salvos"</b> e clique no botão "📅 Agendar Postagem" em algum vídeo para testar.</p>
                  </div>
              ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                      {queue.map(post => (
                          <div key={post.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--panel-border)'}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                                  <img src={post.cover_url} style={{width: 70, height: 70, borderRadius: 8, objectFit: 'cover'}}/>
                                  <div>
                                      <h4 style={{marginBottom: 4}}>Agendado para: <b>{new Date(post.post_time).toLocaleString()}</b></h4>
                                      <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>{post.caption || "Sem legenda"}</p>
                                  </div>
                              </div>
                              <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                                  <span style={{padding: '0.4rem 1rem', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, background: post.status === 'PUBLISHED' ? 'rgba(11, 163, 96, 0.2)' : 'rgba(255, 204, 0, 0.2)', color: post.status === 'PUBLISHED' ? '#0ba360' : '#ffcc00'}}>
                                      {post.status === 'PUBLISHED' ? '✅ PUBLICADO (NUVEM)' : '⏳ AGUARDANDO POSTAGEM'}
                                  </span>
                                  <button onClick={() => handleDelete(post.id)} style={{background: 'rgba(255, 77, 79, 0.1)', border: '1px solid rgba(255, 77, 79, 0.3)', padding: '0.6rem', borderRadius: 8, color: '#ff4d4f', cursor: 'pointer', transition: 'all 0.2s', display: 'flex'}} title="Cancelar e Excluir">
                                      <Trash2Icon size={18}/>
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
        </div>
    );
}
