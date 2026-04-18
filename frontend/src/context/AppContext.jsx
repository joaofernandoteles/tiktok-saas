import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tiktokApp_token'));
  const [savedVideos, setSavedVideos] = useState([]);
  const [likedVideos, setLikedVideos] = useState([]);

  // Se tem token na memoria mas nao tem user (F5 na pagina)
  useEffect(() => {
    if (token && !user) {
        // Tenta pegar o cache local só pro visual iniciar rápido
        const saved = localStorage.getItem('tiktokApp_saved');
        const liked = localStorage.getItem('tiktokApp_liked');
        const usr = localStorage.getItem('tiktokApp_user');
        
        if(saved) setSavedVideos(JSON.parse(saved));
        if(liked) setLikedVideos(JSON.parse(liked));
        if(usr) setUser(JSON.parse(usr));
        
        // Em um sistema mais robusto fariamos um GET /api/user/me pra validar o token no backend aqui
    }
  }, [token]);

  const login = (data) => {
      setToken(data.token);
      setUser(data.user);
      setSavedVideos(data.savedVideos || []);
      setLikedVideos(data.likedVideos || []);
      
      localStorage.setItem('tiktokApp_token', data.token);
      localStorage.setItem('tiktokApp_user', JSON.stringify(data.user));
      localStorage.setItem('tiktokApp_saved', JSON.stringify(data.savedVideos));
      localStorage.setItem('tiktokApp_liked', JSON.stringify(data.likedVideos));
  };

  const logout = () => {
      setToken(null);
      setUser(null);
      setSavedVideos([]);
      setLikedVideos([]);
      localStorage.removeItem('tiktokApp_token');
      localStorage.removeItem('tiktokApp_user');
      localStorage.removeItem('tiktokApp_saved');
      localStorage.removeItem('tiktokApp_liked');
  };

  const syncWithCloud = async (newSaved, newLiked) => {
      if(!token) return;
      
      const payload = {};
      if(newSaved) payload.savedVideos = newSaved;
      if(newLiked) payload.likedVideos = newLiked;

      try {
          await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/sync`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify(payload)
          });
      } catch(e) {
          console.error("Falhou ao sincronizar nuvem", e);
      }
  };

  const saveVideo = (video) => {
    if (!savedVideos.find(v => v.id === video.id)) {
      const novalista = [video, ...savedVideos];
      setSavedVideos(novalista);
      localStorage.setItem('tiktokApp_saved', JSON.stringify(novalista));
      syncWithCloud(novalista, null);
    }
  };

  const removeSavedVideo = (id) => {
    const novalista = savedVideos.filter(v => v.id !== id);
    setSavedVideos(novalista);
    localStorage.setItem('tiktokApp_saved', JSON.stringify(novalista));
    syncWithCloud(novalista, null);
  };

  const toggleLikeVideo = (video) => {
    let novalista;
    if (likedVideos.find(v => v.id === video.id)) {
      novalista = likedVideos.filter(v => v.id !== video.id);
    } else {
      novalista = [{ id: video.id, title: video.title, author: video.author.nickname }, ...likedVideos];
    }
    setLikedVideos(novalista);
    localStorage.setItem('tiktokApp_liked', JSON.stringify(novalista));
    syncWithCloud(null, novalista);
  };

  return (
    <AppContext.Provider value={{
      user, token, login, logout,
      savedVideos, saveVideo, removeSavedVideo,
      likedVideos, toggleLikeVideo
    }}>
      {children}
    </AppContext.Provider>
  );
};
