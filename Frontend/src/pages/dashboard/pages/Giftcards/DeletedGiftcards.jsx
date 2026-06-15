import { useState, useEffect } from "react";
import { ArrowLeft, Search, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { getDeletedGiftcards, restoreGiftcard, forceDeleteGiftcard } from "../../../../api/admin/giftcards";
import { Link } from "react-router-dom";
import "../Products/Products.css";

export default function DeletedGiftcards() {
  const [giftcards, setGiftcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDeletedGiftcards();
  }, []);

  const fetchDeletedGiftcards = async () => {
    try {
      setLoading(true);
      const res = await getDeletedGiftcards();
      setGiftcards(res.data);
    } catch (error) {
      console.error("Error fetching deleted giftcards:", error);
      toast.error("Error al cargar la papelera");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreGiftcard(id);
      toast.success("Giftcard restaurada");
      fetchDeletedGiftcards();
    } catch (error) {
      toast.error("Error al restaurar");
    }
  };

  const handleForceDelete = async (id) => {
    if (!window.confirm("¿Estás 100% seguro de que deseas eliminar permanentemente esta Giftcard? Esta acción no se puede deshacer y el saldo se perderá por completo.")) return;
    try {
      await forceDeleteGiftcard(id);
      toast.success("Eliminada permanentemente");
      fetchDeletedGiftcards();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const filteredGiftcards = giftcards.filter(g => 
    g.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
  };

  return (
    <div className="products-container">
      <div className="products-header">
        <h1 className="products-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to="/dashboard/giftcards" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>
            <ArrowLeft size={24} />
          </Link>
          Papelera de Giftcards
        </h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por código..." 
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
                <th>Código</th>
                <th>Saldo Restante</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th width="120">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredGiftcards.length > 0 ? (
                filteredGiftcards.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <span style={{ fontWeight: 600, letterSpacing: '1px', background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                        {g.code}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      {formatCurrency(g.current_balance)}
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {g.expires_at ? new Date(g.expires_at).toLocaleDateString() : 'Sin vencimiento'}
                      </div>
                    </td>
                    <td>
                      <span className="status-badge status-inactive">
                        Eliminada
                      </span>
                    </td>
                    <td>
                      <div className="table-actions" style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          className="action-btn"
                          title="Restaurar"
                          onClick={() => handleRestore(g.id)}
                          style={{ color: '#10b981' }}
                        >
                          <RotateCcw size={18} />
                        </button>
                        <button 
                          className="action-btn"
                          title="Eliminar permanentemente"
                          onClick={() => handleForceDelete(g.id)}
                          style={{ color: 'var(--danger-color)' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    La papelera está vacía.
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
