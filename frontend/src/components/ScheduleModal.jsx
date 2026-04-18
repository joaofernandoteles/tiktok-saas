import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { XIcon, CalendarIcon, ClockIcon, SendIcon } from 'lucide-react';

export default function ScheduleModal({ video, onClose }) {
  const { token } = useContext(AppContext);
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSchedule = async (e) => {
    e.preventDefault();
    if(!date || !time) return alert("Selecione data e hora!");

    const postTimeMs = new Date(`${date}T${time}`).getTime();
    if(postTimeMs <= Date.now()) return alert("O horário deve ser no futuro.");

    setLoading(true);
    try {
        const payload = {
            video_id: video.id,
            video_url: video.videoUrl || video.downloadUrl,
            cover_url: video.cover,
            caption: caption,
            post_time: postTimeMs
        };

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/schedule/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if(!response.ok) throw new Error("Falha ao agendar.");
        alert("Vídeo adicionado à fila de publicações do robô!");
        onClose();
    } catch (err) {
        console.error(err);
        alert("Erro: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{zIndex: 2000}}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'auto', maxHeight: '90vh', overflowY: 'auto'}}>
        <button className="modal-close" onClick={onClose}><XIcon size={24} /></button>
        
        <h2>📅 Agendar Postagem Automática</h2>
        <p style={{color: 'var(--text-secondary)'}}>O robô publicará este vídeo por você usando sua conta do TikTok assim que der o horário escolhido.</p>

        <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
            <img src={video.cover} alt="preview" style={{width: 100, height: 140, borderRadius: 12, objectFit: 'cover'}} />
            <textarea 
               value={caption} 
               onChange={e => setCaption(e.target.value)}
               placeholder="Escreva a legenda e as #hashtags do post aqui..."
               style={{flex: 1, padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--panel-border)', resize: 'none', height: 140}}
            />
        </div>

        <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
            <div style={{flex: 1}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}><CalendarIcon size={14}/> Obter Data</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{width: '100%', padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--panel-border)', fontSize: '1rem'}} required/>
            </div>
            <div style={{flex: 1}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}><ClockIcon size={14}/> Horário Local</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{width: '100%', padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--panel-border)', fontSize: '1rem'}} required/>
            </div>
        </div>

        <button onClick={handleSchedule} disabled={loading} className="search-btn" style={{width: '100%', marginTop: '1.5rem', padding: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'}}>
            {loading ? <div className="loader"></div> : <><SendIcon size={18}/> Enviar para a Fila do Robô Autoposter</>}
        </button>
      </div>
    </div>
  );
}
