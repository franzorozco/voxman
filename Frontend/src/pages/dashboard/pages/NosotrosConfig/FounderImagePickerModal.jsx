import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getImageUrl } from '../../../../utils/imageUtils';
import { API_URL } from '../../../../config/api';

export default function FounderImagePickerModal({ isOpen, onClose, onSelect, currentimage }) {
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
          const res = await axios.get(`${API_URL}/v1/admin/home-config/actor-images`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setGallery(res.data.data || []);
        } catch (e) {
          toast.error("Error al cargar la galerÃ­a de imÃ¡genes");
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
      toast.error("La imagen es muy grande. MÃ¡ximo 50MB");
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const res = await axios.post(`${API_URL}/v1/admin/home-config/upload-actor-image`, formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success("Imagen subida exitosamente");
      onSelect(res.data.url);
      onClose();
    } catch (e) {
      toast.error("Error al subir la imagen");
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
            Seleccionar Imagen del Fundador
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
            { id: "gallery", label: "GalerÃ­a de Variantes", icon: <ImageIcon size={14} /> }
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
                <h4 className="hc-style-65">Sube una imagen desde tu equipo</h4>
                <p className="hc-style-66">Formato recomendado: Cuadrado (Aspect Ratio 1:1).</p>
                
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUpload} className="hc-style-67" disabled={uploading} />
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
                <label className="hc-style-70">Enlace directo a la imagen</label>
                <div className="hc-style-71">
                  <input 
                    type="text" 
                    value={urlInput} 
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
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
                  <div className="hc-style-75" style={{ aspectRatio: '1/1' }}>
                    <img 
                      src={urlInput} 
                      alt="Preview" 
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }} 
                      onError={e => {
                        e.target.src = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_white.jfif";
                      }} 
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
                placeholder="Buscar imagen..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="hc-style-76" 
              />
              
              {loading ? (
                <div className="hc-style-77">
                  Cargando galerÃ­a...
                </div>
              ) : filteredGallery.length === 0 ? (
                <div className="hc-style-77">
                  No se encontraron imÃ¡genes.
                </div>
              ) : (
                <div className="hc-style-78" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
                  {filteredGallery.map((url, i) => {
                    const isSelected = currentimage === url;
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
                          aspectRatio: '1/1',
                          borderColor: isSelected ? "var(--color-primary)" : "transparent"
                        }}
                      >
                        <img 
                          src={getImageUrl(url)} 
                          alt="preview" 
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }} 
                          loading="lazy" 
                          onError={e => {
                            e.target.src = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_white.jfif";
                          }} 
                        />
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
