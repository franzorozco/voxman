import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, Ticket, RefreshCw, Eye, EyeOff, Smartphone, MoreVertical, Filter } from "lucide-react";
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
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    return 'Bs. ' + Number(amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
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

        <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
  <Link to="/dashboard/giftcards/deleted" className="btn-secondary" style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', padding: '10px' }} title="Papelera">
    <Trash2 size={18} />
    {!isMobile && "Papelera"}
  </Link>
  <button 
    className="btn-primary" 
    onClick={() => handleOpenModal("create")}
    style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
    title="Emitir Giftcard"
  >
    <Plus size={18} />
    {!isMobile && "Emitir Giftcard"}
  </button>
  <button 
    className="btn-secondary" 
    onClick={fetchGiftcards}
    style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
    title="Actualizar"
  >
    <RefreshCw size={18} className={loading ? "spin" : ""} />
    {!isMobile && "Actualizar"}
  </button>
</div>
</div>

      <div className="filters-container" style={{ marginBottom: '20px' }}>
  <div className="filters-container-inner" style={{ marginBottom: showFilters ? '15px' : '0' }}>
    <div style={{ flex: 1, position: 'relative' }}>
      <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      <input 
        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
        placeholder="Buscar por c�digo..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
    <button 
      onClick={() => setShowFilters(!showFilters)}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: showFilters ? 'var(--color-primary)' : 'var(--bg-card)', color: showFilters ? 'var(--color-primary-text)' : 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
    >
      <Filter size={18} />
      <span className="hide-on-mobile">Filtros</span>
    </button>
  </div>

  {showFilters && (
    <div className="filters-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado</label>
        <CustomSelect 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
        >
          <option value="all">Todos los Estados</option>
          <option value="active">Solo Activas</option>
          <option value="exhausted">Agotadas (Saldo 0)</option>
          <option value="expired">Expiradas</option>
          <option value="inactive">Inactivas</option>
        </CustomSelect>
      </div>
    </div>
  )}
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
                <th width="180" style={{ display: isMobile ? "none" : "table-cell" }}>Acciones</th>
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
                    <td data-label="C�digo" style={{ position: 'relative' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <div className="show-on-mobile" style={{ display: isMobile ? 'block' : 'none' }}>
      <button 
        className="btn-icon" 
        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', padding: 0, margin: 0, width: 'auto', height: 'auto' }}
        onClick={(event) => {
          event.stopPropagation();
          setActiveDropdown(activeDropdown === g.id ? null : g.id);
        }}
      >
        <MoreVertical size={20} />
      </button>
      
      {activeDropdown === g.id && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 98 }}
            onClick={(event) => {
              event.stopPropagation();
              setActiveDropdown(null);
            }}
          />
          <div 
            style={{
              position: 'absolute',
              left: '10px',
              top: '40px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 99,
              minWidth: '150px',
              display: 'flex',
              flexDirection: 'column',
              padding: '4px'
            }}
          >
            <button 
              onClick={() => { handleOpenCoupon(g); setActiveDropdown(null); }}
              style={{ background: 'transparent', border: 'none', padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)', width: '100%', fontSize: '14px' }}
            >
              <Ticket size={16} /> Imprimir Cup�n
            </button>
            {!g.is_digitalized && g.is_active && (
              <button 
                onClick={() => { handleOpenDigitalize(g); setActiveDropdown(null); }}
                style={{ background: 'transparent', border: 'none', padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)', width: '100%', fontSize: '14px' }}
              >
                <Smartphone size={16} /> Digitalizar
              </button>
            )}
            <button 
              onClick={() => { handleOpenHistory(g); setActiveDropdown(null); }}
              style={{ background: 'transparent', border: 'none', padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)', width: '100%', fontSize: '14px' }}
            >
              <Eye size={16} /> Ver Historial
            </button>
            {g.is_active && (
              <button 
                onClick={() => { handleOpenModal("reload", g); setActiveDropdown(null); }}
                style={{ background: 'transparent', border: 'none', padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-primary)', width: '100%', fontSize: '14px' }}
              >
                <RefreshCw size={16} /> Recargar Saldo
              </button>
            )}
            {g.is_active && (
              <button 
                onClick={() => { handleDelete(g.id); setActiveDropdown(null); }}
                style={{ background: 'transparent', border: 'none', padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--color-danger)', width: '100%', fontSize: '14px' }}
              >
                <Trash2 size={16} /> Eliminar
              </button>
            )}
          </div>
        </>
      )}
    </div>
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
                    <td data-label="Acciones" className="gift-actions-cell" style={{ display: isMobile ? "none" : "table-cell" }}>
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










