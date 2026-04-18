import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { HeartIcon, BookmarkIcon } from 'lucide-react';
import VideoModal from '../components/VideoModal';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mockWarning, setMockWarning] = useState('');
  const [error, setError] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  const { likedVideos, toggleLikeVideo, saveVideo, savedVideos, token } = useContext(AppContext);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setVideos([]);
    setMockWarning('');
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/search`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ topic, likedVideos })
      });
      const data = await response.json();

      if (!response.ok) {
         throw new Error(data.error || 'Erro ao buscar vídeos da API');
      }

      if (data.isMock) setMockWarning(data.message);
      
      setVideos(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isLiked = (id) => likedVideos.find(v => v.id === id);
  const isSaved = (id) => savedVideos.find(v => v.id === id);

  return (
    <div className="app-container">
      <header className="header">
        <h1>Buscar Tendências</h1>
        <p>A IA aprende com os seus 'Likes'. Pesquise agora para encontrar a nata do seu nicho.</p>
      </header>

      <div className="search-section">
        <form className="search-box" onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Qual assunto você procura? (ex: tecnologia...)" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? <div className="loader"></div> : 'Buscar Reels/Trends'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="relaxed-loader-container">
          <div className="floating-robot">🤖</div>
          <h2 className="loading-title">Vasculhando a Nuvem...</h2>
          <p className="loading-subtitle">
            {likedVideos.length > 0 
                ? `Você curtiu ${likedVideos.length} vídeos. A IA está analisando 50 novas trends para achar as que combinam 100% com você! 🧠` 
                : 'O robô tá lá no TikTok garimpando os melhores vídeos. Curta alguns vídeos para treinar a Inteligência Artificial! ☕'}
          </p>
          <div className="pulsing-dots">
            <span className="dot"></span><span className="dot"></span><span className="dot"></span>
          </div>
        </div>
      )}

      {error && !loading && <div className="status-message" style={{color: 'var(--primary-color)'}}>{error}</div>}
      
      {mockWarning && !loading && <div className="mock-warning">⚠️ {mockWarning}</div>}

      {videos.length > 0 && !loading && (
        <div className="results-grid">
          {videos.map(video => (
            <div className="video-card" key={video.id}>
              <div className="thumbnail-container">
                <img src={video.cover} alt={video.title} />
                <button onClick={() => setPlayingVideo(video)} className="play-overlay" style={{border: 'none', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', cursor: 'pointer', fontFamily: 'inherit'}}>
                  ASSISTIR NO SISTEMA
                </button>
              </div>
              <div className="card-info">
                <h3>{video.title}</h3>
                
                <div className="card-actions">
                    <button 
                        className={`action-btn ${isLiked(video.id) ? 'liked' : ''}`}
                        onClick={() => toggleLikeVideo(video)}
                        title="Isso ensina a IA sobre o que você gosta"
                    >
                        <HeartIcon className={isLiked(video.id) ? 'fill-icon' : ''} size={18} /> 
                        {isLiked(video.id) ? 'Gostou' : 'Gostei'}
                    </button>
                    <button 
                        className={`action-btn ${isSaved(video.id) ? 'saved' : ''}`}
                        onClick={() => saveVideo(video)}
                        disabled={isSaved(video.id)}
                    >
                        <BookmarkIcon className={isSaved(video.id) ? 'fill-icon' : ''} size={18} /> 
                        {isSaved(video.id) ? 'Salvo' : 'Salvar'}
                    </button>
                </div>

                <div className="card-footer">
                  <div className="author">
                    <img src={video.author.avatar} alt={video.author.nickname} />
                    <span>@{video.author.nickname}</span>
                  </div>
                  <div className="stats">
                    <div title="Visualizações">▶ {video.stats.playCount}</div>
                    <div title="Curtidas">❤️ {video.stats.diggCount}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {playingVideo && (
         <VideoModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </div>
  );
}
