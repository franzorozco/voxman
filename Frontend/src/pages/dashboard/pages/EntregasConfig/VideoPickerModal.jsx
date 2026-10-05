import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import { getVideoUrl } from '../../../../utils/videoUtils';

export default function VideoPickerModal({ isOpen, onClose, onSelect, currentVideo }) {
  const [tab, setTab] = useState('gallery'); // gallery | upload | url
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [search, setSearch] = useState('');
  const fileInputRef = useRef(null);

  // Fetch gallery
  useEffect(() => {
    if (isOpen && tab === 'gallery') {
      const fetchGallery = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`${API_URL}/v1/admin/home-config/videos`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setGallery(res.data.data || []);
        } catch (e) {
          toast.error("Error al cargar la galería de videos");
        } finally {
          setLoading(false);
        }
      };
      fetchGallery();
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("El video es muy grande. Máximo 50MB");
      return;
    }

    const formData = new FormData();
    formData.append('video', file);

    try {
      setUploading(true);
      const res = await axios.post(`${API_URL}/v1/admin/home-config/upload-video`, formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success("Video subido exitosamente");
      onSelect(res.data.url);
      onClose();
    } catch (e) {
      toast.error("Error al subir el video");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput) return;
    onSelect(urlInput);
    onClose();
  };

  const filteredGallery = search ? gallery.filter(url => url.toLowerCase().includes(search.toLowerCase())) : gallery;

  return (
    <div className="hc-style-54">
      <div className="hc-style-55">
        
        {/* Header */}
        <div className="hc-style-56">
          <h3 className="hc-style-57">
            Seleccionar Video de Fondo
          </h3>
          <button onClick={onClose} className="hc-style-59">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="hc-style-60">
          {[
            { id: "upload", label: "Subir desde PC", icon: <Upload size={14} /> },
            { id: "url", label: "Pegar URL", icon: <LinkIcon size={14} /> },
            { id: "gallery", label: "Galería", icon: <ImageIcon size={14} /> }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px 0",
                border: "none",
                borderBottom: tab === t.id ? "2px solid var(--color-primary)" : "2px solid transparent",
                background: tab === t.id ? "var(--bg-card)" : "transparent",
                color: tab === t.id ? "var(--color-primary)" : "var(--text-muted)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer"
              }}
            >
              {t.icon} <span className="hc-style-13">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="hc-style-61">
          
          {tab === "upload" && (
            <div className="hc-style-62">
              <div className="hc-style-63">
                <Upload size={40} className="hc-style-64" />
                <h4 className="hc-style-65">Sube un video desde tu equipo</h4>
                <p className="hc-style-66">Formatos soportados: MP4, WEBM, MOV (Max 50MB).</p>
                
                <input type="file" accept="video/mp4,video/webm,video/quicktime" ref={fileInputRef} onChange={handleUpload} className="hc-style-67" disabled={uploading} />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={uploading} 
                  style={{
                    padding: "10px 24px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    background: "var(--color-primary)",
                    color: "var(--color-primary-text)",
                    border: "none",
                    cursor: uploading ? "not-allowed" : "pointer",
                    opacity: uploading ? 0.7 : 1
                  }}
                >
                  {uploading ? "Subiendo..." : "Seleccionar Archivo"}
                </button>
              </div>
            </div>
          )}

          {tab === "url" && (
            <div className="hc-style-68">
              <div className="hc-style-69">
                <label className="hc-style-70">Enlace directo al video</label>
                <div className="hc-style-71">
                  <input 
                    type="text" 
                    value={urlInput} 
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://ejemplo.com/video.mp4"
                    className="hc-style-72"
                  />
                  <button onClick={handleUrlSubmit} className="hc-style-83">
                    Aplicar
                  </button>
                </div>
              </div>
              {urlInput && (
                <div className="hc-style-73">
                  <p className="hc-style-74">Vista previa:</p>
                  <div className="hc-style-75" style={{ aspectRatio: '16/9', width: '300px' }}>
                    <video 
                      src={urlInput} 
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }} 
                      muted
                      controls
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "gallery" && (
            <div>
              <input 
                type="text" 
                placeholder="Buscar video..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="hc-style-76" 
              />
              
              {loading ? (
                <div className="hc-style-77">
                  Cargando galería...
                </div>
              ) : filteredGallery.length === 0 ? (
                <div className="hc-style-77">
                  No se encontraron videos.
                </div>
              ) : (
                <div className="hc-style-78" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                  {filteredGallery.map((url, i) => {
                    const isSelected = currentVideo === url;
                    return (
                      <div 
                        key={i} 
                        onClick={() => {
                          onSelect(url);
                          onClose();
                        }} 
                        title={url} 
                        className="hc-style-79" 
                        style={{
                          aspectRatio: '16/9',
                          borderColor: isSelected ? "var(--color-primary)" : "transparent",
                          position: 'relative'
                        }}
                      >
                        <video 
                          src={getVideoUrl(url)} 
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }} 
                          muted 
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          fontSize: '11px',
                          padding: '4px',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textAlign: 'center'
                        }}>
                          {url.split('/').pop()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
