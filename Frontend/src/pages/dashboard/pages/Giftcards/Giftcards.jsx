import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, Ticket, RefreshCw, Eye, EyeOff, Smartphone } from "lucide-react";
import { toast } from "react-hot-toast";
import { getGiftcards, deleteGiftcard } from "../../../../api/admin/giftcards";
import GiftcardModal from "./GiftcardModal";
import GiftcardHistoryModal from "./GiftcardHistoryModal";
import GiftcardCoupon from "./GiftcardCoupon";
import GiftcardDigitalizeModal from "./GiftcardDigitalizeModal";
import { Link } from "react-router-dom";

import "./Giftcards.css";

import CustomSelect from '../../../../components/ui/CustomSelect';
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
  const [visibleCodes, setVisibleCodes] = useState({});

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
      <div className="products-header gift-header-container">
        <div className="gift-header-title-row">
          <div className="gift-header-icon-box">
            <Ticket size={24} />
          </div>
          <div>
            <h1 className="products-title gift-header-title">Giftcards y Cupones</h1>
            <p className="gift-header-subtitle">Gestión de tarjetas de regalo y saldos</p>
          </div>
        </div>

        <div className="gift-header-actions-row">
          <div className="gift-header-action-col">
            <Link to="/dashboard/giftcards/deleted" className="btn-secondary gift-header-action-btn">
              <Trash2 size={18} style={{ flexShrink: 0 }} />
              <span className="hide-on-mobile">Papelera</span>
            </Link>
          </div>
          <div className="gift-header-action-col">
            <button className="btn-primary gift-header-action-btn" onClick={() => handleOpenModal("create")}>
              <Plus size={18} style={{ flexShrink: 0 }} />
              <span className="hide-on-mobile">Emitir Giftcard</span>
            </button>
          </div>
        </div>
      </div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div className="filters-container-inner gift-filters-row">
          <div style={{ flex: 2 }} className="gift-search-wrapper">
            <Search size={18} className="gift-search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por código..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="gift-search-input"
            />
          </div>
          
          <div style={{ flex: 1 }}>
            <CustomSelect 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="gift-status-select"
              style={{ height: '42px' }}
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Solo Activas</option>
              <option value="exhausted">Agotadas (Saldo 0)</option>
              <option value="expired">Expiradas</option>
              <option value="inactive">Inactivas</option>
            </CustomSelect>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            Cargando giftcards...
          </div>
        ) : (
          <table className="gift-table">
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
                    <td data-label="Propietario / Comprador">
                      {g.customer ? (
                        <div className="gift-owner-info">
                          <span className="gift-owner-name">{g.customer.user?.profile?.first_name || 'Cliente'} {g.customer.user?.profile?.last_name || ''}</span>
                          <span className="gift-owner-role primary">Propietario Digital</span>
                        </div>
                      ) : g.purchaser ? (
                        <div className="gift-owner-info">
                          <span className="gift-owner-name">{g.purchaser.user?.profile?.first_name || 'Cliente'} {g.purchaser.user?.profile?.last_name || ''}</span>
                          <span className="gift-owner-role muted">Comprador Original</span>
                        </div>
                      ) : (
                        <span className="gift-unassigned-text">Sin asignar</span>
                      )}
                    </td>
                    <td data-label="Saldo Original">
                      <span className="gift-balance-muted">
                        {formatCurrency(g.initial_balance)}
                      </span>
                    </td>
                    <td data-label="Saldo Actual" className="gift-balance-active">
                      {formatCurrency(g.current_balance)}
                    </td>
                    <td data-label="Vencimiento">
                      <div className="gift-dates-text">
                        {g.expires_at ? new Date(g.expires_at).toLocaleDateString() : 'Sin vencimiento'}
                      </div>
                    </td>
                    <td data-label="Estado">
                      <span className={`status-badge ${statusClass}`}>
                        {statusText}
                      </span>
                    </td>
                    <td data-label="Acciones" className="gift-actions-cell">
                      <div className="gift-actions-wrapper">
                        <button 
                          className="btn-secondary gift-ticket-btn"
                          title="Imprimir Cupón"
                          onClick={() => handleOpenCoupon(g)}
                        >
                          <Ticket size={18} />
                        </button>
                        
                        {!g.is_digitalized && (
                          <button 
                            className="btn-secondary gift-digitalize-btn"
                            title="Digitalizar (Asignar Dueño)"
                            onClick={() => handleOpenDigitalize(g)}
                            disabled={!g.is_active}
                          >
                            <Smartphone size={18} />
                          </button>
                        )}

                        <button 
                          className="btn-secondary gift-history-btn"
                          title="Ver Historial"
                          onClick={() => handleOpenHistory(g)}
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="btn-secondary gift-reload-btn"
                          title="Recargar saldo"
                          onClick={() => handleOpenModal("reload", g)}
                          disabled={!g.is_active}
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button 
                          className="btn-delete gift-delete-btn"
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
