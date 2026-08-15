import React, { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Edit, Trash2, Film } from "lucide-react";
import { toast } from "react-hot-toast";
import { getShopShorts, deleteShopShort } from "../../../../api/admin/shopShorts";
import ShopShortModal from "./ShopShortModal";
import "../Products/Products.css"; 
import "./ShopShorts.css";
import { API_BASE_URL } from "../../../../config/api";
import { VideoPlayer } from "../../../../utils/videoHelpers";

export default function ShopShorts() {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShort, setSelectedShort] = useState(null);

  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    fetchShorts();
  }, []);

  const fetchShorts = async () => {
    try {
      setLoading(true);
      const res = await getShopShorts();
      setShorts(res.data);
    } catch (error) {
      console.error("Error fetching shop shorts:", error);
      toast.error("Error al cargar los videos cortos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (short = null) => {
    setSelectedShort(short);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este video?")) return;
    try {
      await deleteShopShort(id);
      toast.success("Video eliminado");
      fetchShorts();
    } catch (error) {
      toast.error("Error al eliminar el video");
    }
  };

  const filteredShorts = shorts.filter(s => {
    const term = searchQuery.toLowerCase();
    const titleMatch = s.title && s.title.toLowerCase().includes(term);
    const productMatch = s.product && s.product.name.toLowerCase().includes(term);
    return titleMatch || productMatch;
  });

  return (
    <div className="products-container fade-in">
      <div className="products-header">
        <h1 className="products-title">Shop Shorts</h1>
        <div className="products-header-actions">
          <button 
            className="btn-primary" 
            onClick={() => { setSelectedShort(null); setIsModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            Nuevo Video
          </button>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner">
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
              placeholder="Buscar por título o producto..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">Cargando videos...</div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Video</th>
                <th>Título</th>
                <th>Categoría Vinculada</th>
                <th>Producto Vinculado</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredShorts.map((short) => (
                <tr key={short.id}>
                  <td data-label="Video">
                    <div style={{ width: '48px', height: '64px', borderRadius: '4px', overflow: 'hidden', background: '#000' }}>
                      <VideoPlayer 
                        url={short.video_url}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        autoPlay={false}
                        onMouseOver={(e) => {
                          if(e.target.play) e.target.play();
                        }}
                        onMouseOut={(e) => {
                          if(e.target.pause) { e.target.pause(); e.target.currentTime = 0; }
                        }}
                      />
                    </div>
                  </td>
                  <td data-label="Título">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{short.title || 'Sin título'}</span>
                    </div>
                  </td>
                  <td data-label="Categoría Vinculada">
                    <span style={{ fontWeight: 500 }}>{short.category ? short.category.name : 'N/A'}</span>
                  </td>
                  <td data-label="Producto Vinculado">
                    <span style={{ fontWeight: 500 }}>{short.product ? short.product.name : 'N/A'}</span>
                  </td>
                  <td data-label="Prioridad">
                    <span style={{ fontWeight: 500 }}>{short.priority}</span>
                  </td>
                  <td data-label="Estado">
                    <span style={{ background: 'var(--bg-overlay)', color: short.is_active ? 'var(--color-success)' : 'var(--color-danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                      {short.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button 
                        className="btn-secondary"
                        onClick={() => handleOpenModal(short)}
                        title="Editar"
                        style={{ padding: '6px' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={() => handleDelete(short.id)}
                        title="Eliminar"
                        style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredShorts.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No se encontraron videos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <ShopShortModal
          short={selectedShort}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchShorts}
        />
      )}
    </div>
  );
}
