import { getImageUrl } from '../../../../utils/imageUtils';
import React, { useState, useEffect } from "react";
import { X, Upload, Link as LinkIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { createShopShort, updateShopShort } from "../../../../api/admin/shopShorts";
import { getProducts } from "../../../../api/admin/products";
import { getCategories } from "../../../../api/admin/categories";
import CustomSelect from "../../../../components/ui/CustomSelect";
import { API_BASE_URL } from "../../../../config/api";
import { VideoPlayer } from "../../../../components/ui/videoHelpers";

export default function ShopShortModal({ short, onClose, onSaved }) {
  const isEditing = !!short;
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState(short?.title || "");
  const [productId, setProductId] = useState(short?.product_id || "");
  const [categoryId, setCategoryId] = useState(short?.category_id || "");
  const [priority, setPriority] = useState(short?.priority || 1);
  const [isActive, setIsActive] = useState(short ? short.is_active : true);
  
  const [videoFile, setVideoFile] = useState(null);
  const [videoLink, setVideoLink] = useState(
    short?.video_url && short.video_url.startsWith("http") ? short.video_url : ""
  );

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [prodRes, catRes] = await Promise.all([
        getProducts({ per_page: 100 }),
        getCategories()
      ]);
      const prodData = prodRes.data?.data || prodRes.data || [];
      setProducts(Array.isArray(prodData) ? prodData : []);
      
      const catData = catRes.data?.data || catRes.data || [];
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoadingData(false);
    }
  };

  const productOptions = [
    { value: "", label: "Ninguno (Catálogo General)" },
    ...products.map(p => ({ value: p.id, label: p.name }))
  ];

  const categoryOptions = [
    { value: "", label: "Ninguna" },
    ...categories.map(c => ({ value: c.id, label: c.name }))
  ];

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("El video no puede superar los 50MB");
        return;
      }
      setVideoFile(file);
      setVideoLink(""); // Clear link if file is selected
    }
  };

  const handleLinkChange = (e) => {
    setVideoLink(e.target.value);
    if (e.target.value) setVideoFile(null); // Clear file if link is provided
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditing && !videoFile && !videoLink) {
      toast.error("Debes proporcionar un archivo de video o un enlace válido");
      return;
    }

    if (priority < 1 || priority > 10) {
      toast.error("La prioridad debe ser un número del 1 al 10");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      if (title) formData.append("title", title);
      if (productId) formData.append("product_id", productId);
      if (categoryId) formData.append("category_id", categoryId);
      formData.append("priority", priority);
      formData.append("is_active", isActive ? 1 : 0);
      
      if (videoFile) {
        formData.append("video", videoFile);
      } else if (videoLink) {
        formData.append("video_link", videoLink);
      }

      if (isEditing) {
        await updateShopShort(short.id, formData);
        toast.success("Video actualizado con éxito");
      } else {
        await createShopShort(formData);
        toast.success("Video creado con éxito");
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Error al guardar el video");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'none' };
  const inputStyle = { width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '14px' };

  const getPreviewUrl = () => {
    if (videoFile) return URL.createObjectURL(videoFile);
    if (videoLink) return videoLink;
    if (short?.video_url) return short.video_url.startsWith('http') ? short.video_url : getImageUrl(short.video_url);
    return null;
  };

  const previewUrl = getPreviewUrl();

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999 }}>
      <div className="modal-content fade-in" style={{ background: 'var(--bg-main)', borderRadius: '16px', overflow: 'hidden', maxWidth: '600px', width: '100%', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
            {isEditing ? "Editar Video" : "Nuevo Video"}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={labelStyle}>Opciones de Video *</label>
                
                <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                  {/* File Upload Zone */}
                  <div style={{ position: 'relative' }}>
                    <div className="shorts-upload-zone" style={{ opacity: videoLink ? 0.5 : 1 }}>
                      <input 
                        type="file" 
                        accept="video/mp4,video/quicktime,video/webm"
                        onChange={handleVideoChange}
                        disabled={!!videoLink}
                      />
                      <Upload size={32} className="shorts-upload-icon" />
                      {videoFile ? (
                        <p className="shorts-upload-filename">{videoFile.name}</p>
                      ) : isEditing && short.video_url && !short.video_url.startsWith('http') ? (
                        <p className="shorts-upload-text">Archivo actual cargado. Click para reemplazar.</p>
                      ) : (
                        <p className="shorts-upload-text">Click o arrastra un archivo de video (Max 50MB)</p>
                      )}
                    </div>
                    {(videoFile || (isEditing && short?.video_url && !short.video_url.startsWith('http'))) && !videoLink && (
                       <button
                         type="button"
                         onClick={() => {
                           setVideoFile(null);
                           // Si estamos editando y hay un archivo antiguo, esto solo limpia el nuevo archivo subido
                           // Para limpiar el viejo tendríamos que vaciar video_url, pero lo dejaremos así para no complicar el backend,
                           // o podemos simplemente dejar que el usuario suba otro o ponga un link.
                         }}
                         style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                         title="Limpiar archivo"
                       >
                         <X size={14} />
                       </button>
                    )}
                  </div>

                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold' }}>O</div>

                  {/* URL Input */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="url"
                        style={{ ...inputStyle, paddingLeft: '38px', opacity: videoFile ? 0.5 : 1 }}
                        value={videoLink}
                        onChange={handleLinkChange}
                        placeholder="Pegar enlace de video (Ej: https://.../video.mp4)"
                        disabled={!!videoFile}
                      />
                      {videoLink && (
                        <button
                          type="button"
                          onClick={() => setVideoLink("")}
                          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                          title="Limpiar enlace"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {previewUrl && (
                  <div className="shorts-video-preview-large" style={{ marginTop: '16px', position: 'relative' }}>
                    <VideoPlayer 
                      url={previewUrl} 
                      autoPlay={true}
                      style={{ width: '100%', maxHeight: '250px', background: '#000' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Título (Opcional)</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Nueva Colección Verano"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Categoría Vinculada (Opcional)</label>
                  <CustomSelect
                    value={categoryId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCategoryId(val);
                      if (val) setProductId(""); // Mutual exclusivity
                    }}
                    placeholder={loadingData ? "Cargando..." : "Seleccione categoría..."}
                    style={inputStyle}
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </CustomSelect>
                </div>
                <div>
                  <label style={labelStyle}>Producto Vinculado (Opcional)</label>
                  <CustomSelect
                    value={productId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProductId(val);
                      if (val) setCategoryId(""); // Mutual exclusivity
                    }}
                    placeholder={loadingData ? "Cargando..." : "Seleccione producto..."}
                    style={inputStyle}
                  >
                    {productOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </CustomSelect>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Prioridad (1 al 10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    style={inputStyle}
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>Mayor número = aparece antes</small>
                </div>

                <div>
                  <label style={labelStyle}>Estado</label>
                  <div style={{ marginTop: '10px' }}>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <span className="slider"></span>
                      <span style={{ marginLeft: '12px', fontSize: '14px', color: 'var(--text-main)', fontWeight: 500 }}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-card)' }}>
              <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 500 }}>
                {loading ? "Guardando..." : "Guardar Video"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
