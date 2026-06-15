import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Trash2, Search, Ticket } from "lucide-react";
import { toast } from "react-hot-toast";
import { getDeletedPromotions, restorePromotion, forceDeletePromotion } from "../../../../api/admin/discounts";
import { Link } from "react-router-dom";

export default function DeletedPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDeleted();
  }, []);

  const fetchDeleted = async () => {
    try {
      setLoading(true);
      const res = await getDeletedPromotions();
      setPromotions(res.data);
    } catch (error) {
      toast.error("Error al cargar promociones eliminadas");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("¿Deseas restaurar esta promoción?")) return;
    try {
      await restorePromotion(id);
      toast.success("Promoción restaurada");
      fetchDeleted();
    } catch (error) {
      toast.error("Error al restaurar");
    }
  };

  const handleForceDelete = async (id) => {
    if (!window.confirm("¿Eliminar permanentemente? Esta acción es irreversible.")) return;
    try {
      await forceDeletePromotion(id);
      toast.success("Promoción eliminada permanentemente");
      fetchDeleted();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const filtered = promotions.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="products-container">
      <div className="products-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard/promotions" className="btn-secondary" style={{textDecoration: 'none', padding: '8px', display: 'flex', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-overlay)', color: 'var(--text-main)'}}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="products-title" style={{margin: 0}}>Papelera de Promociones</h1>
            <span style={{color: 'var(--text-muted)', fontSize: '14px'}}>Promociones desactivadas o eliminadas</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            Cargando papelera...
          </div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Eliminación</th>
                <th width="150">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((promo) => (
                  <tr key={promo.id}>
                    <td>
                      <span style={{ fontWeight: 500 }}>{promo.name}</span>
                    </td>
                    <td>{promo.code || 'Automático'}</td>
                    <td>{promo.type === 'percentage' ? 'Porcentaje' : 'Fijo'}</td>
                    <td>{promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value}`}</td>
                    <td>{new Date(promo.deleted_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="action-btn" 
                          title="Restaurar"
                          onClick={() => handleRestore(promo.id)}
                          style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button 
                          className="action-btn" 
                          title="Eliminar Permanente"
                          onClick={() => handleForceDelete(promo.id)}
                          style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    La papelera está vacía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
