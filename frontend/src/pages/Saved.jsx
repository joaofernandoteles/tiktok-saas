import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Trash2Icon, DownloadCloudIcon, ExternalLinkIcon, CheckSquareIcon, SquareIcon, CalendarClockIcon } from 'lucide-react';
import VideoModal from '../components/VideoModal';
import ScheduleModal from '../components/ScheduleModal';

export default function Saved() {
  const { savedVideos, removeSavedVideo, token } = useContext(AppContext);
  const [downloadingId, setDownloadingId] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [schedulingVideo, setSchedulingVideo] = useState(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  const toggleSelection = (id) => {
      if(selectedVideos.includes(id)) {
          setSelectedVideos(selectedVideos.filter(v => v !== id));
      } else {
          setSelectedVideos([...selectedVideos, id]);
      }
  };

  const selectAll = () => {
      if(selectedVideos.length === savedVideos.length) {
          setSelectedVideos([]);
      } else {
          setSelectedVideos(savedVideos.map(v => v.id));
      }
  };

  const downloadSingle = async (video) => {
      try {
          const urlToDownload = video.downloadUrl || video.videoUrl;
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/download?url=${encodeURIComponent(urlToDownload)}&token=${token}`);
          
          if (!response.ok) throw new Error("Erro na rede. Talvez o vídeo esteja protegido.");

          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `Trend-${video.author.nickname}-${video.id}.mp4`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(downloadUrl);
      } catch (e) {
          console.error("Não foi possível baixar:", e.message);
      }
  };

  const handleDownload = async (video) => {
      setDownloadingId(video.id);
      await downloadSingle(video);
      setDownloadingId(null);
  };

  const handleBulkDownload = async () => {
      if(selectedVideos.length === 0) return;
      setIsBulkDownloading(true);
      setBulkProgress(0);

      const toDownload = savedVideos.filter(v => selectedVideos.includes(v.id));

      for(let i=0; i<toDownload.length; i++) {
          setBulkProgress(i + 1);
          setDownloadingId(toDownload[i].id);
          await downloadSingle(toDownload[i]);
          
          // Esperar 1 segundo entre os downloads para o navegador e internet limparem a fila de recursos
          await new Promise(r => setTimeout(r, 1000));
      }

      setDownloadingId(null);
      setIsBulkDownloading(false);
      setSelectedVideos([]);
  };

  if (savedVideos.length === 0) {
      return (
        <div className="app-container" style={{ textAlign: 'center', marginTop: '15vh' }}>
            <h2>Nenhum Vídeo Salvo 😢</h2>
            <p style={{color: 'var(--text-secondary)', marginTop: '1rem'}}>
                Vá na aba de Buscas e clique em "Salvar" nos vídeos que quiser baixar!
            </p>
        </div>
      )
  }

  return (
    <div className="app-container">
      <header className="header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
        <div style={{textAlign: 'left'}}>
           <h1 style={{fontSize: '2.2rem'}}>Meus Vídeos Salvos</h1>
           <p style={{fontSize: '1rem', marginTop: '0.5rem'}}>Marque a caixinha nos vídeos que deseja baixar e aperte o botão em massa.</p>
        </div>
        <div style={{display: 'flex', gap: '0.8rem', alignItems: 'center'}}>
           <button onClick={selectAll} className="action-btn" style={{padding: '0.8rem 1.2rem'}}>
               {selectedVideos.length === savedVideos.length ? <CheckSquareIcon size={18}/> : <SquareIcon size={18}/>}
               {selectedVideos.length === savedVideos.length ? "Desmarcar Todos" : "Selecionar Todos"}
           </button>
           <button 
               onClick={handleBulkDownload} 
               disabled={selectedVideos.length === 0 || isBulkDownloading}
               className="search-btn"
               style={{
                   background: selectedVideos.length > 0 ? 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' : 'var(--panel-bg)',
                   color: selectedVideos.length > 0 ? 'white' : 'var(--text-secondary)',
                   border: selectedVideos.length > 0 ? 'none' : '1px solid var(--panel-border)',
                   opacity: isBulkDownloading ? 0.7 : 1, 
                   padding: '0.8rem 1.5rem', 
                   margin: 0
               }}
           >
               {isBulkDownloading ? (
                   <><div className="loader" style={{width: 14, height: 14, borderTopColor: 'white'}}></div> Baixando {bulkProgress}/{selectedVideos.length}...</>
               ) : (
                   `Baixar Selecionados (${selectedVideos.length})`
               )}
           </button>
        </div>
      </header>

      <div className="results-grid">
          {savedVideos.map(video => (
            <div className={`video-card ${selectedVideos.includes(video.id) ? 'selected-card' : ''}`} key={video.id}>
              
              <div className="card-selector" onClick={() => toggleSelection(video.id)}>
                 {selectedVideos.includes(video.id) ? <CheckSquareIcon color="#0ba360" size={24} className="fill-icon"/> : <SquareIcon color="rgba(255,255,255,0.7)" size={24}/>}
              </div>

              <div className="thumbnail-container">
                <img src={video.cover} alt={video.title} />
                <button onClick={() => setPlayingVideo(video)} className="play-overlay" style={{border: 'none', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', fontFamily: 'inherit'}}>
                  ASSISTIR NO SISTEMA
                </button>
              </div>
              <div className="card-info" style={{ gap: '0.8rem' }}>
                <h3 style={{ marginBottom: '0.5rem'}}>{video.title}</h3>
                
                <p style={{fontSize: '0.85rem', color: 'var(--secondary-color)'}}>@{video.author.nickname}</p>
                
                <div className="card-actions" style={{ flexDirection: 'column', gap: '0.5rem', marginTop: '1rem'}}>
                    <button 
                        className="action-btn download-btn"
                        onClick={() => handleDownload(video)}
                        disabled={downloadingId === video.id || isBulkDownloading}
                        style={{ width: '100%', background: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)', color: 'white'}}
                    >
                        {downloadingId === video.id ? (
                            <><div className="loader" style={{width: 14, height: 14, borderTopColor: 'white'}}></div> Baixando...</>
                        ) : (
                            <><DownloadCloudIcon size={18}/> Download Único</>
                        )}
                    </button>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                            className="action-btn"
                            onClick={() => setSchedulingVideo(video)}
                            style={{ flex: 1, justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                        >
                            <CalendarClockIcon size={16} /> Programar Postagem
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="action-btn" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}>
                           <ExternalLinkIcon size={18}/> Origin
                        </a>
                        <button 
                            className="action-btn"
                            onClick={() => removeSavedVideo(video.id)}
                            style={{ flex: 1, justifyContent: 'center', color: '#ff4d4f', borderColor: 'rgba(255, 77, 79, 0.2)' }}
                        >
                            <Trash2Icon size={18} /> Remover
                        </button>
                    </div>
                </div>
              </div>
            </div>
          ))}
      </div>
      
      {playingVideo && (
         <VideoModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
      {schedulingVideo && (
         <ScheduleModal video={schedulingVideo} onClose={() => setSchedulingVideo(null)} />
      )}
    </div>
  );
}
