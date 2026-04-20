import { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { CalendarClockIcon, CheckCircleIcon, LinkIcon, Trash2Icon, RefreshCcwIcon, ZapIcon, PencilIcon, XIcon, SendIcon, CalendarIcon, ClockIcon, UploadIcon } from 'lucide-react';

const API = () => import.meta.env.VITE_API_URL || 'http://localhost:3001';

function EditModal({ post, onClose, onSaved }) {
    const { token } = useContext(AppContext);
    const [caption, setCaption] = useState(post.caption || '');
    const [date, setDate] = useState(() => {
        const d = new Date(post.post_time);
        return d.toISOString().slice(0, 10);
    });
    const [time, setTime] = useState(() => {
        const d = new Date(post.post_time);
        return d.toTimeString().slice(0, 5);
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        const postTimeMs = new Date(`${date}T${time}`).getTime();
        setLoading(true);
        try {
            const res = await fetch(`${API()}/api/schedule/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id: post.id, caption, post_time: postTimeMs })
            });
            if (!res.ok) throw new Error('Falha ao salvar.');
            onSaved();
            onClose();
        } catch (err) {
            alert('Erro: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{zIndex: 2000}}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'auto', maxHeight: '90vh', overflowY: 'auto'}}>
                <button className="modal-close" onClick={onClose}><XIcon size={24}/></button>
                <h2>Editar Agendamento</h2>

                <div style={{display: 'flex', gap: '1rem', marginTop: '0.5rem'}}>
                    <img src={post.cover_url} alt="preview" style={{width: 80, height: 112, borderRadius: 12, objectFit: 'cover'}}/>
                    <textarea
                        value={caption}
                        onChange={e => setCaption(e.target.value)}
                        placeholder="Legenda e #hashtags..."
                        style={{flex: 1, padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--panel-border)', resize: 'none', height: 112}}
                    />
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                    <div style={{flex: 1}}>
                        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}><CalendarIcon size={14}/> Data</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{width: '100%', padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--panel-border)', fontSize: '1rem'}}/>
                    </div>
                    <div style={{flex: 1}}>
                        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}><ClockIcon size={14}/> Horário</label>
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{width: '100%', padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--panel-border)', fontSize: '1rem'}}/>
                    </div>
                </div>

                <button onClick={handleSave} disabled={loading} className="search-btn" style={{width: '100%', marginTop: '0.5rem', padding: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'}}>
                    {loading ? <div className="loader"></div> : <><SendIcon size={18}/> Salvar Alterações</>}
                </button>
            </div>
        </div>
    );
}

export default function Schedule() {
    const { token } = useContext(AppContext);
    const [status, setStatus] = useState({ connected: false, username: null });
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState(null);
    const [postingNow, setPostingNow] = useState(null);
    const [uploadCaption, setUploadCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    const loadData = async () => {
        try {
            const resStatus = await fetch(`${API()}/api/tiktok/status`, { headers: { 'Authorization': `Bearer ${token}` }});
            const dataStatus = await resStatus.json();
            setStatus(dataStatus);

            const resQueue = await fetch(`${API()}/api/schedule/list`, { headers: { 'Authorization': `Bearer ${token}` }});
            const dataQueue = await resQueue.json();
            setQueue(dataQueue);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const connectTikTok = async () => {
        const res = await fetch(`${API()}/api/tiktok/connect`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }});
        const data = await res.json();
        window.location.href = data.url;
    };

    const handleDelete = async (id) => {
        await fetch(`${API()}/api/schedule/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({id}) });
        loadData();
    };

    const handleUploadAndPost = async () => {
        const file = fileRef.current?.files[0];
        if (!file) return alert('Seleciona um arquivo MP4.');
        setUploading(true);
        try {
            const form = new FormData();
            form.append('video', file);
            form.append('caption', uploadCaption);
            const res = await fetch(`${API()}/api/schedule/upload-and-post`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: form
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert('Vídeo postado com sucesso no TikTok!');
            setUploadCaption('');
            if (fileRef.current) fileRef.current.value = '';
            loadData();
        } catch (e) {
            alert('Erro ao postar: ' + e.message);
        } finally {
            setUploading(false);
        }
    };

    const handlePostNow = async (post) => {
        if (!window.confirm(`Postar "${post.caption || 'este vídeo'}" agora no TikTok?`)) return;
        setPostingNow(post.id);
        try {
            const res = await fetch(`${API()}/api/schedule/post-now`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ id: post.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            alert('Postado com sucesso no TikTok!');
            loadData();
        } catch (err) {
            alert('Erro ao postar: ' + err.message);
            loadData();
        } finally {
            setPostingNow(null);
        }
    };

    const statusBadge = (s) => {
        if (s === 'PUBLISHED') return { bg: 'rgba(11,163,96,0.2)', color: '#0ba360', label: '✅ PUBLICADO' };
        if (s === 'ERROR') return { bg: 'rgba(255,77,79,0.2)', color: '#ff4d4f', label: '❌ ERRO' };
        return { bg: 'rgba(255,204,0,0.2)', color: '#ffcc00', label: '⏳ AGUARDANDO' };
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
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(11,163,96,0.1)', color: '#0ba360', padding: '0.8rem 1.5rem', borderRadius: 20, border: '1px solid rgba(11,163,96,0.4)'}}>
                            <CheckCircleIcon size={18}/> Conectado: <b>{status.username}</b>
                        </div>
                    ) : (
                        <button onClick={connectTikTok} className="search-btn" style={{margin: 0, display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'linear-gradient(135deg, #000 0%, #333 100%)', border: '1px solid #555'}}>
                            <LinkIcon size={18}/> Conectar Conta Oficial do TikTok
                        </button>
                    )}
                </div>
            </header>

            {status.connected && (
                <div style={{background: 'var(--panel-bg)', borderRadius: 24, padding: '2rem', border: '1px solid var(--panel-border)', marginBottom: '1.5rem'}}>
                    <h2 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem'}}><UploadIcon size={20}/> Postar Vídeo do Computador</h2>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        <input ref={fileRef} type="file" accept="video/mp4,video/*" style={{padding: '0.8rem', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', color: 'white'}}/>
                        <textarea value={uploadCaption} onChange={e => setUploadCaption(e.target.value)} placeholder="Legenda e #hashtags..." rows={2} style={{padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', color: 'white', resize: 'none'}}/>
                        <button onClick={handleUploadAndPost} disabled={uploading} className="search-btn" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem'}}>
                            {uploading ? <div className="loader"></div> : <><UploadIcon size={18}/> Enviar e Postar Agora no TikTok</>}
                        </button>
                    </div>
                </div>
            )}

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
                        {queue.map(post => {
                            const badge = statusBadge(post.status);
                            const isPending = post.status === 'PENDING' || post.status === 'ERROR';
                            return (
                                <div key={post.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--panel-border)', flexWrap: 'wrap', gap: '1rem'}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                                        <img src={post.cover_url} style={{width: 70, height: 70, borderRadius: 8, objectFit: 'cover'}}/>
                                        <div>
                                            <h4 style={{marginBottom: 4}}>Agendado para: <b>{new Date(post.post_time).toLocaleString()}</b></h4>
                                            <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>{post.caption || "Sem legenda"}</p>
                                        </div>
                                    </div>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap'}}>
                                        <span style={{padding: '0.4rem 1rem', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, background: badge.bg, color: badge.color}}>
                                            {badge.label}
                                        </span>
                                        {isPending && (
                                            <>
                                                <button onClick={() => setEditingPost(post)} title="Editar" style={{background: 'rgba(100,100,255,0.1)', border: '1px solid rgba(100,100,255,0.3)', padding: '0.6rem', borderRadius: 8, color: '#8888ff', cursor: 'pointer', display: 'flex'}}>
                                                    <PencilIcon size={18}/>
                                                </button>
                                                <button onClick={() => handlePostNow(post)} disabled={postingNow === post.id} title="Postar agora" style={{background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', padding: '0.6rem', borderRadius: 8, color: '#ffaa00', cursor: 'pointer', display: 'flex'}}>
                                                    {postingNow === post.id ? <div className="loader" style={{width:18,height:18}}/> : <ZapIcon size={18}/>}
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => handleDelete(post.id)} title="Excluir" style={{background: 'rgba(255,77,79,0.1)', border: '1px solid rgba(255,77,79,0.3)', padding: '0.6rem', borderRadius: 8, color: '#ff4d4f', cursor: 'pointer', display: 'flex'}}>
                                            <Trash2Icon size={18}/>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {editingPost && <EditModal post={editingPost} onClose={() => setEditingPost(null)} onSaved={loadData}/>}
        </div>
    );
}
