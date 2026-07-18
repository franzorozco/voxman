import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, Ticket, RefreshCw, Eye, Smartphone } from "lucide-react";
import { toast } from "react-hot-toast";
import { getGiftcards, deleteGiftcard } from "../../../../api/admin/giftcards";
import GiftcardModal from "./GiftcardModal";
import GiftcardHistoryModal from "./GiftcardHistoryModal";
import GiftcardCoupon from "./GiftcardCoupon";
import GiftcardDigitalizeModal from "./GiftcardDigitalizeModal";
import { Link } from "react-router-dom";

import "../Products/Products.css";

export default function Giftcards() {
  const [giftcards, setGiftcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isDigitalizeModalOpen, setIsDigitalizeModalOpen] = useState(false);
  const [selectedGiftcard, setSelectedGiftcard] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  useEffect(() => {
    fetchGiftcards();
  }, []);

  const fetchGiftcards = async () => {
    try {
      setLoading(true);
      const res = await getGiftcards();
      // Asumiendo que res.data.data es donde viene paginado o res.data si es array
      setGiftcards(res.data.data || res.data);
    } catch (error) {
      console.error("Error fetching giftcards:", error);
      toast.error("Error al cargar giftcards");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, giftcard = null) => {
    setModalMode(mode);
    setSelectedGiftcard(giftcard);
    setIsModalOpen(true);
  };

  const handleOpenHistory = (giftcard) => {
    setSelectedGiftcard(giftcard);
    setIsHistoryModalOpen(true);
  };

  const handleOpenCoupon = (giftcard) => {
    setSelectedGiftcard(giftcard);
    setIsCouponModalOpen(true);
  };

  const handleOpenDigitalize = (giftcard) => {
    setSelectedGiftcard(giftcard);
    setIsDigitalizeModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas desactivar/eliminar esta Giftcard?")) return;
    try {
      await deleteGiftcard(id);
      toast.success("Giftcard eliminada");
      fetchGiftcards();
    } catch (error) {
      toast.error("Error al eliminar la Giftcard");
    }
  };

  const filteredGiftcards = giftcards.filter(g => {
    const matchesSearch = g.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status calc for filter
    let calculatedStatus = 'active';
    if (!g.is_active) calculatedStatus = 'inactive';
    else if (g.current_balance <= 0) calculatedStatus = 'exhausted';
    else if (g.expires_at && new Date(g.expires_at).setHours(23,59,59,999) < new Date().getTime()) calculatedStatus = 'expired';

    const matchesStatus = filterStatus === 'all' || filterStatus === calculatedStatus;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
  };

  return (
    <div className="products-container">
      <div className="products-header">
        <h1 className="products-title">Giftcards y Cupones</h1>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar por código..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
            />
          </div>
          
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Solo Activas</option>
            <option value="exhausted">Agotadas (Saldo 0)</option>
            <option value="expired">Expiradas</option>
            <option value="inactive">Inactivas</option>
          </select>
          
          <Link to="/dashboard/giftcards/deleted" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '8px', textDecoration: 'none', border: '1px solid var(--border-color)', background: 'var(--bg-overlay)', color: 'var(--text-main)' }}>
             <Trash2 size={16}/> Papelera
          </Link>

          <button className="btn-primary" onClick={() => handleOpenModal("create")}>
            <Plus size={18} />
            Emitir Giftcard
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            Cargando giftcards...
          </div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Propietario / Comprador</th>
                <th>Saldo Original</th>
                <th>Saldo Actual</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th width="180">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredGiftcards.length > 0 ? (
                filteredGiftcards.map((g) => {
                  
                  // Smart Status Logic
                  let statusText = 'Activa';
                  let statusClass = 'status-active';
                  
                  if (!g.is_active) {
                    statusText = 'Inactiva';
                    statusClass = 'status-inactive';
                  } else if (g.current_balance <= 0) {
                    statusText = 'Agotada';
                    statusClass = 'status-inactive'; // Podríamos usar otra clase si tuviéramos
                  } else if (g.expires_at && new Date(g.expires_at).setHours(23,59,59,999) < new Date().getTime()) {
                    statusText = 'Expirada';
                    statusClass = 'status-inactive';
                  }

                  return (
                  <tr key={g.id}>
                    <td>
                      <span style={{ fontWeight: 600, letterSpacing: '1px', background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                        {g.code}
                      </span>
                    </td>
                    <td>
                      {g.customer ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500 }}>{g.customer.user?.profile?.first_name || 'Cliente'} {g.customer.user?.profile?.last_name || ''}</span>
                          <span style={{ fontSize: '11px', color: 'var(--primary-color)' }}>Propietario Digital</span>
                        </div>
                      ) : g.purchaser ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500 }}>{g.purchaser.user?.profile?.first_name || 'Cliente'} {g.purchaser.user?.profile?.last_name || ''}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Comprador Original</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px' }}>Sin asignar</span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {formatCurrency(g.initial_balance)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                      {formatCurrency(g.current_balance)}
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        {g.expires_at ? new Date(g.expires_at).toLocaleDateString() : 'Sin vencimiento'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${statusClass}`}>
                        {statusText}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions" style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          className="action-btn"
                          title="Imprimir Cupón"
                          onClick={() => handleOpenCoupon(g)}
                          style={{ color: '#8b5cf6' }} // purple for tickets
                        >
                          <Ticket size={18} />
                        </button>
                        
                        {!g.is_digitalized && (
                          <button 
                            className="action-btn"
                            title="Digitalizar (Asignar Dueño)"
                            onClick={() => handleOpenDigitalize(g)}
                            style={{ color: '#10b981' }} // green for digitalize
                            disabled={!g.is_active}
                          >
                            <Smartphone size={18} />
                          </button>
                        )}

                        <button 
                          className="action-btn"
                          title="Ver Historial"
                          onClick={() => handleOpenHistory(g)}
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="action-btn"
                          title="Recargar saldo"
                          onClick={() => handleOpenModal("reload", g)}
                          disabled={!g.is_active}
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button 
                          className="action-btn"
                          style={{ color: 'var(--danger-color)' }}
                          title="Eliminar"
                          onClick={() => handleDelete(g.id)}
                          disabled={!g.is_active}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No se encontraron giftcards.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <GiftcardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchGiftcards}
        mode={modalMode}
        giftcard={selectedGiftcard}
      />

      <GiftcardHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        giftcard={selectedGiftcard}
      />

      <GiftcardCoupon
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        giftcard={selectedGiftcard}
      />

      <GiftcardDigitalizeModal 
        isOpen={isDigitalizeModalOpen}
        onClose={() => setIsDigitalizeModalOpen(false)}
        onSuccess={fetchGiftcards}
        giftcard={selectedGiftcard}
      />
    </div>
  );
}
