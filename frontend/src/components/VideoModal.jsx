import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { XIcon } from 'lucide-react';

export default function VideoModal({ video, onClose }) {
  const { token } = useContext(AppContext);
  if (!video) return null;

  const streamUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/stream?url=${encodeURIComponent(video.downloadUrl || video.videoUrl)}&token=${token}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <XIcon size={24} />
        </button>
        <video 
           className="modal-video" 
           src={streamUrl} 
           autoPlay 
           controls 
           loop
           playsInline
        ></video>
      </div>
    </div>
  );
}
