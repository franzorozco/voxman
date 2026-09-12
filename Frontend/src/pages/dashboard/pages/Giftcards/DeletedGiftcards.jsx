import { useState, useEffect } from "react";
import { ArrowLeft, Search, RotateCcw, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { getDeletedGiftcards, restoreGiftcard, forceDeleteGiftcard } from "../../../../api/admin/giftcards";
import { Link } from "react-router-dom";
import "./Giftcards.css";

export default function DeletedGiftcards() {
  const [giftcards, setGiftcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCodes, setVisibleCodes] = useState({});

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
      <div className="products-header gift-header-container">
        <div className="gift-header-title-row">
          <div className="gift-header-icon-box" style={{ background: 'var(--bg-card)' }}>
            <Link to="/dashboard/giftcards" style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={24} />
            </Link>
          </div>
          <div>
            <h1 className="products-title gift-header-title">Papelera de Giftcards</h1>
            <p className="gift-header-subtitle">Giftcards eliminadas</p>
          </div>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner gift-filters-row">
          <div style={{ flex: 1 }} className="gift-search-wrapper">
            <Search size={18} className="gift-search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por código..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="gift-search-input"
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
          <table className="gift-table">
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
                    <td data-label="Código">
                      <div className="gift-code-wrapper">
                        <span className="gift-code-text">
                          {visibleCodes[g.id] ? g.code : "••••••••"}
                        </span>
                        <button 
                          className="gift-visibility-btn" 
                          onClick={() => setVisibleCodes(prev => ({...prev, [g.id]: !prev[g.id]}))}
                          title={visibleCodes[g.id] ? "Ocultar código" : "Mostrar código"}
                        >
                          {visibleCodes[g.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </td>
                    <td data-label="Saldo Restante">
                      <span className="gift-balance-active">
                        {formatCurrency(g.current_balance)}
                      </span>
                    </td>
                    <td data-label="Vencimiento">
                      <div className="gift-dates-text">
                        {g.expires_at ? new Date(g.expires_at).toLocaleDateString() : 'Sin vencimiento'}
                      </div>
                    </td>
                    <td data-label="Estado">
                      <span className="status-badge status-inactive">
                        Eliminada
                      </span>
                    </td>
                    <td data-label="Acciones" className="gift-actions-cell">
                      <div className="gift-actions-wrapper">
                        <button 
                          className="btn-secondary gift-ticket-btn"
                          title="Restaurar"
                          onClick={() => handleRestore(g.id)}
                          style={{ color: '#10b981' }}
                        >
                          <RotateCcw size={18} />
                        </button>
                        <button 
                          className="btn-delete gift-delete-btn"
                          title="Eliminar permanentemente"
                          onClick={() => handleForceDelete(g.id)}
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
