import { getImageUrl } from '../../../../utils/imageUtils';
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getInventory, getInventoryStats } from "../../../../api/admin/inventory";
import { getBranches } from "../../../../api/admin/branches";
import { getCategories } from "../../../../api/admin/categories";
import { getBrands } from "../../../../api/admin/brands";
import { Search, Filter, History, AlertTriangle, ArrowRightLeft, PenTool, ChevronDown, ChevronRight, Package, Plus, ClipboardCheck, TrendingUp, DollarSign, Box } from "lucide-react";
import CanAccess from "../../../../components/ui/CanAccess";
import AdjustStockModal from "./AdjustStockModal";
import TransferStockModal from "./TransferStockModal";
import ReceiveStockModal from "./components/ReceiveStockModal";
import AuditInventoryModal from "./components/AuditInventoryModal";
import QuickActionModal from "./components/QuickActionModal";
import useScanner from "../../../../hooks/useScanner";
import { useScannerStore } from "../../../../store/scanner/useScannerStore";
import "./Inventory.css";
import { API_BASE_URL } from "../../../../config/api";
import { useAuthStore } from "../../../../store/authStore";
import { Camera } from "lucide-react";
import toast from "react-hot-toast";

import CustomSelect from '../../../../components/ui/CustomSelect';
export default function Inventory() {
  const [inventories, setInventories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  const initialBranchId = localStorage.getItem('inventory_branch_id') || "";
  
  const [filters, setFilters] = useState({
    search: "",
    branch_id: initialBranchId,
    status: "",
    category_id: "",
    brand_id: "",
    min_price: "",
    max_price: "",
    page: 1
  });

  const [adjustModal, setAdjustModal] = useState({ isOpen: false, item: null });
  const [transferModal, setTransferModal] = useState({ isOpen: false, item: null });
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  
  const openScanner = useScannerStore(state => state.openScanner);

  const [quickActionModal, setQuickActionModal] = useState({ isOpen: false, item: null });

  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  const [viewMode, setViewMode] = useState(initialBranchId ? "table" : "selector"); // "selector" or "table"

  const handleBranchSelect = (branchId) => {
    if (branchId) {
      localStorage.setItem('inventory_branch_id', branchId);
    } else {
      localStorage.removeItem('inventory_branch_id');
    }
    setFilters({ ...filters, branch_id: branchId, page: 1 });
    setIsBranchDropdownOpen(false);
    setViewMode(branchId ? "table" : "selector");
  };

  const processScannedCode = async (scannedText) => {
    const code = scannedText.includes('/p/') ? scannedText.split('/p/').pop().trim() : scannedText.trim();
    if (!code) return;

    setFilters(prev => ({ ...prev, search: code, page: 1 }));
    if (viewMode === "selector") {
      setViewMode("table");
    }

    if (!filters.branch_id) {
      toast.error("Selecciona una sucursal para ver opciones rápidas de escaneo.", { icon: '🏢' });
      return;
    }

    try {
      const res = await getInventory({ search: code, branch_id: filters.branch_id, page: 1 });
      const items = res.data?.data || [];
      const exactMatch = items.find(i => 
        i.variant?.sku === code || 
        i.variant?.barcode === code || 
        i.variant?.id === code
      );
      
      if (exactMatch) {
        setQuickActionModal({ isOpen: true, item: exactMatch });
      }
    } catch (err) {
      console.error("Error scanning item:", err);
    }
  };

  useScanner(processScannedCode, !receiveModalOpen && !auditModalOpen && !adjustModal.isOpen && !transferModal.isOpen && !quickActionModal.isOpen);

  const user = useAuthStore((state) => state.user);
  const canViewAllBranches = user?.permissions?.includes('view_inventory_all_branches') || user?.roles?.includes('Owner');

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, branchRes, statsRes] = await Promise.all([
        getInventory(filters),
        getBranches(),
        getInventoryStats({ branch_id: filters.branch_id })
      ]);
      setInventories(invRes.data?.data || []);
      setStats(statsRes.data);
      
      if (invRes.data?.current_page) {
        setPagination({
          current_page: invRes.data.current_page,
          last_page: invRes.data.last_page,
          total: invRes.data.total
        });
      }

      const loadedBranches = branchRes.data || branchRes || [];
      setBranches(loadedBranches);
      
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    const fetchSelectOptions = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          getCategories({ per_page: 100 }),
          getBrands({ per_page: 100 })
        ]);
        setCategories(catRes.data?.data || catRes.data || []);
        setBrands(brandRes.data?.data || brandRes.data || []);
      } catch (error) {
        console.error("Error loading categories/brands for filters:", error);
      }
    };
    fetchSelectOptions();
  }, []);

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleAdjustSuccess = () => {
    loadData();
  };

  const handleTransferSuccess = () => {
    loadData();
  };

  const selectedBranch = branches.find(b => b.id === filters.branch_id);

  return (
    <div className="inventory-container">
      <div className="inventory-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="inventory-title" style={{ margin: 0 }}>Gestión de Inventario</h1>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          
          <div style={{ position: 'relative' }}>
            <button 
              className="btn-secondary" 
              onClick={() => canViewAllBranches && setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', cursor: canViewAllBranches ? 'pointer' : 'default' }}
            >
              {selectedBranch ? (
                <>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    <Package size={14} color="#fff" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1' }}>Sucursal Actual</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, lineHeight: '1.2' }}>{selectedBranch.name}</span>
                  </div>
                </>
              ) : (
                <span>Seleccionar Sucursal</span>
              )}
              {canViewAllBranches && <ChevronDown size={16} style={{ marginLeft: '4px' }} />}
            </button>

            {isBranchDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', left: '0', marginTop: '8px', width: '280px', maxWidth: '85vw', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', zIndex: 99, overflow: 'hidden', animation: 'fadeIn 0.2s ease' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cambiar Sucursal</span>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <button
                    onClick={() => handleBranchSelect("")}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border-color)', background: filters.branch_id === "" ? 'var(--color-secondary)' : 'transparent', color: 'var(--text-main)', cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left' }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={16} />
                    </div>
                    <span style={{ fontWeight: 500 }}>Todas las sucursales</span>
                  </button>

                  {branches.map(branch => {
                    const primaryImg = branch.images && branch.images.length > 0 ? (branch.images.find(img => img.is_primary) || branch.images[0]) : null;
                    return (
                      <button
                        key={branch.id}
                        onClick={() => handleBranchSelect(branch.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border-color)', background: filters.branch_id === branch.id ? 'var(--color-secondary)' : 'transparent', color: 'var(--text-main)', cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left' }}
                      >
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {primaryImg ? (
                            <img 
                              src={primaryImg.image_url.startsWith('http') ? primaryImg.image_url : getImageUrl(primaryImg.image_url)} 
                              alt={branch.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                            />
                          ) : null}
                          {(!primaryImg) && <Package size={16} />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>{branch.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{branch.phone || "Sin teléfono"}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {filters.branch_id && (
            <>
              <CanAccess permission="view_inventory_history">
                <Link 
                  to={`/dashboard/inventory/movements${filters.branch_id ? `?branch_id=${filters.branch_id}` : ''}`}
                  className="btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '12px 16px', borderRadius: '10px' }}
                >
                  <History size={18} /> <span className="hide-on-mobile">Historial</span>
                </Link>
              </CanAccess>

              <CanAccess permission="adjust_inventory">
                <button
                  onClick={() => setAuditModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', background: 'var(--color-warning)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 500, boxShadow: '0 4px 10px var(--bg-overlay)', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <ClipboardCheck size={18} strokeWidth={2.5} /> <span className="hide-on-mobile">Auditar Inventario</span>
                </button>
              </CanAccess>

              <CanAccess permission="receive_inventory">
                <button
                  onClick={() => setReceiveModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '10px', background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', cursor: 'pointer', fontWeight: 500, boxShadow: '0 4px 10px var(--bg-overlay)', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Plus size={18} strokeWidth={2.5} /> <span className="hide-on-mobile">Ingresar Stock</span>
                </button>
              </CanAccess>
            </>
          )}
        </div>
      </div>

      {viewMode === "selector" && canViewAllBranches ? (
        <div className="branch-selector-view" style={{ padding: '20px 0', animation: 'fadeIn 0.3s ease' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Selecciona una Sucursal</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Elige la sucursal para la cual deseas consultar o gestionar el inventario.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {branches.map(branch => {
              const primaryImg = branch.images && branch.images.length > 0 ? (branch.images.find(img => img.is_primary) || branch.images[0]) : null;
              return (
                <div
                  key={branch.id}
                  onClick={() => handleBranchSelect(branch.id)}
                  style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border-color)', cursor: 'pointer', height: '200px', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {primaryImg ? (
                    <>
                      <img 
                        src={primaryImg.image_url.startsWith('http') ? primaryImg.image_url : getImageUrl(primaryImg.image_url)} 
                        alt={branch.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                      <div style={{ display: 'none', width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--primary-color), var(--bg-main))', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={64} color="rgba(255,255,255,0.15)" />
                      </div>
                    </>
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={64} color="var(--text-muted)" />
                    </div>
                  )}
                  
                  <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '20px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#fff', fontSize: '20px', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{branch.name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success-color)' }}></div>
                      {branch.phone || "Sucursal Activa"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '30px' }}>
            <button
              onClick={() => { setFilters({ ...filters, branch_id: "", page: 1 }); setViewMode("table"); }}
              className="btn-secondary"
              style={{ padding: '14px 28px', fontSize: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <Package size={18} /> Ver inventario de todas las sucursales
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Dashboard */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px', animation: 'fadeIn 0.4s ease' }}>
              <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ítems en Stock</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-secondary)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Box size={16} /></div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>{stats.total_items.toLocaleString()}</div>
              </div>
              
              <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Capital Invertido</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-secondary)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={16} /></div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Bs. {stats.total_cost_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Valor Potencial</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-secondary)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={16} /></div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Bs. {stats.total_retail_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bajo Stock / Agotados</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-secondary)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={16} /></div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: stats.low_stock_alerts > 0 ? 'var(--color-warning)' : 'var(--text-main)' }}>{stats.low_stock_alerts.toLocaleString()}</div>
              </div>
            </div>
          )}

          <div className="filters-container" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: showFilters ? '15px' : '0' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}
                  placeholder="Buscar producto o SKU..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
              </div>
              <button
                onClick={() => openScanner(processScannedCode)}
                title="Escanear con Cámara"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--color-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(99,102,241,0.05)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-card)' }}
              >
                <Camera size={20} />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', background: showFilters ? 'var(--primary-color)' : 'var(--bg-card)', color: showFilters ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
              >
                <Filter size={18} />
                <span className="hide-on-mobile">Filtros</span>
              </button>
            </div>

            {showFilters && (
              <div className="filters-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Estado de Stock</label>
                  <CustomSelect
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', transition: 'border 0.2s' }}
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  >
                    <option value="">Todos los estados</option>
                    <option value="in_stock">En Stock</option>
                    <option value="low_stock">Bajo Stock</option>
                    <option value="out_of_stock">Agotado</option>
                  </CustomSelect>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Categoría</label>
                  <CustomSelect
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', transition: 'border 0.2s' }}
                    value={filters.category_id}
                    onChange={(e) => setFilters({ ...filters, category_id: e.target.value, page: 1 })}
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </CustomSelect>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Marca</label>
                  <CustomSelect
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', transition: 'border 0.2s' }}
                    value={filters.brand_id}
                    onChange={(e) => setFilters({ ...filters, brand_id: e.target.value, page: 1 })}
                  >
                    <option value="">Todas las marcas</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </CustomSelect>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Precio Mínimo (Bs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                    placeholder="Ej. 50"
                    value={filters.min_price}
                    onChange={(e) => setFilters({ ...filters, min_price: e.target.value, page: 1 })}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Precio Máximo (Bs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                    placeholder="Ej. 200"
                    value={filters.max_price}
                    onChange={(e) => setFilters({ ...filters, max_price: e.target.value, page: 1 })}
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => setFilters({ ...filters, status: "", category_id: "", brand_id: "", min_price: "", max_price: "", page: 1 })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock Actual</th>
                  <th>Precio</th>
                  <th>Sucursal</th>
                  <th>SKU / Cod.</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ animation: 'pulse 1.5s infinite ease-in-out' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-input)' }}></div>
                          <div>
                            <div style={{ width: '120px', height: '14px', borderRadius: '4px', background: 'var(--bg-input)', marginBottom: '6px' }}></div>
                            <div style={{ width: '80px', height: '10px', borderRadius: '4px', background: 'var(--bg-input)' }}></div>
                          </div>
                        </div>
                      </td>
                      <td><div style={{ width: '50px', height: '14px', borderRadius: '4px', background: 'var(--bg-input)' }}></div></td>
                      <td><div style={{ width: '60px', height: '14px', borderRadius: '4px', background: 'var(--bg-input)' }}></div></td>
                      <td><div style={{ width: '100px', height: '14px', borderRadius: '4px', background: 'var(--bg-input)' }}></div></td>
                      <td><div style={{ width: '90px', height: '14px', borderRadius: '4px', background: 'var(--bg-input)' }}></div></td>
                      <td><div style={{ width: '70px', height: '24px', borderRadius: '12px', background: 'var(--bg-input)' }}></div></td>
                      <td><div style={{ width: '100px', height: '30px', borderRadius: '8px', background: 'var(--bg-input)' }}></div></td>
                    </tr>
                  ))
                ) : inventories.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', opacity: 0.8 }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          <Package size={32} />
                        </div>
                        <div>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text-main)', fontWeight: 600 }}>No hay inventario</h3>
                          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>No se encontraron productos en esta sucursal con los filtros aplicados.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const groupedInventories = inventories.reduce((acc, item) => {
                      const productId = item.variant?.product?.id || "unknown";
                      const branchId = item.branch_id || "unknown";
                      const key = `${productId}-${branchId}`;
                      
                      if (!acc[key]) {
                        acc[key] = {
                          id: key,
                          product: item.variant?.product,
                          branch: item.branch,
                          items: [],
                          totalStock: 0,
                          isExpanded: expandedGroups[key] || false
                        };
                      }
                      
                      acc[key].items.push(item);
                      acc[key].totalStock += item.stock;
                      acc[key].totalReserved = (acc[key].totalReserved || 0) + (Number(item.reserved_stock) || 0);
                      return acc;
                    }, {});

                    return Object.values(groupedInventories).map((group) => {
                      const toggleGroup = (id) => {
                        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
                      };

                      const prodImages = group.product?.images || group.product?.product_images || [];
                      const groupProdImg = prodImages.find(img => img.is_main) || prodImages[0];
                      const groupImgUrl = groupProdImg?.url || groupProdImg?.image_path;
                      let groupFinalImgUrl = "/placeholder.png";
                      if (groupImgUrl) {
                        if (groupImgUrl.startsWith("http")) {
                          groupFinalImgUrl = groupImgUrl;
                        } else {
                          // Ensure we don't strip /storage if it's required, just append to API base
                          groupFinalImgUrl = getImageUrl(groupImgUrl);
                        }
                      }

                      const isGroupLowStock = group.items.some(i => i.stock <= i.min_stock && i.stock > 0);
                      const isGroupOutOfStock = group.items.every(i => i.stock <= 0);

                      return (
                        <React.Fragment key={group.id}>
                          <tr 
                            style={{ background: 'var(--bg-card)', cursor: 'pointer', borderBottom: group.isExpanded ? 'none' : '1px solid var(--border-color)', transition: 'background 0.2s' }} 
                            onClick={() => toggleGroup(group.id)}
                            className="group-row"
                          >
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                {group.isExpanded ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                                <img
                                  src={groupFinalImgUrl}
                                  alt={group.product?.name}
                                  className="product-img"
                                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                                  onError={(e) => { e.target.src = getImageUrl('/catalog/products/default.png'); }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <div style={{ fontWeight: 600, lineHeight: '1.2', color: 'var(--text-main)' }}>{group.product?.name || "Desconocido"}</div>
                                  <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: '1.2' }}>
                                    {group.items.length} variante(s)
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div>
                                  <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{group.totalStock}</span>
                                  <span style={{ fontSize: '0.8em', color: 'var(--text-muted)', marginLeft: '4px' }}>uds</span>
                                </div>
                                {group.totalReserved > 0 && (
                                  <div style={{ fontSize: '11px', color: 'var(--color-warning)', fontWeight: 500 }}>
                                    {group.totalReserved} reservados
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>-</td>
                            <td>{group.branch?.name || "Sin sucursal"}</td>
                            <td>
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Múltiples SKU</span>
                            </td>
                            <td>
                              {isGroupOutOfStock ? (
                                <span className="status-badge danger"><AlertTriangle size={12} /> Agotado</span>
                              ) : isGroupLowStock ? (
                                <span className="status-badge warning"><AlertTriangle size={12} /> Bajo Stock</span>
                              ) : (
                                <span className="status-badge success">En Stock</span>
                              )}
                            </td>
                            <td>
                              {/* Parent row actions could be global (like view product), but we leave empty for variants */}
                            </td>
                          </tr>
                          
                          {group.isExpanded && [...group.items].sort((a, b) => (a.variant?.sku || '').localeCompare(b.variant?.sku || '')).map((item) => {
                            const product = item.variant?.product;
                            const isLowStock = item.stock <= item.min_stock && item.stock > 0;
                            const isOutOfStock = item.stock <= 0;
                            
                            let imgUrl = item.variant?.variant_images?.[0]?.url || item.variant?.variant_images?.[0]?.image_path;
                              if (!imgUrl) {
                                const attrIds = item.variant?.variant_attribute_values?.map(vav => vav.attribute_value_id) || [];
                                const colorImgs = product?.attribute_value_images?.filter(img => attrIds.includes(img.attribute_value_id)) || [];
                                const colorImg = colorImgs.find(img => img.is_main) || colorImgs[0];
                                if (colorImg) imgUrl = colorImg.url || colorImg.image_path;
                              }
                              if (!imgUrl) {
                                const fallBackImages = product?.images || product?.product_images || [];
                                const prodImg = fallBackImages.find(img => img.is_main) || fallBackImages[0];
                                imgUrl = prodImg?.url || prodImg?.image_path;
                              }
                              let finalImgUrl = "/placeholder.png";
                              if (imgUrl) {
                                if (imgUrl.startsWith("http")) {
                                  finalImgUrl = imgUrl;
                                } else {
                                  finalImgUrl = getImageUrl(imgUrl);
                                }
                              }

                            let colorVal = null;
                            let otherAttrs = [];
                            
                            item.variant?.variant_attribute_values?.forEach(vav => {
                              const attrName = vav.attribute_value?.attribute?.name?.toLowerCase() || "";
                              const isColor = attrName.includes("color") || vav.attribute_value?.attribute?.is_fixed || vav.attribute_value?.hex_code;
                              
                              if (isColor && !colorVal) {
                                colorVal = vav.attribute_value?.value;
                              } else if (vav.attribute_value?.value) {
                                otherAttrs.push(vav.attribute_value?.value);
                              }
                            });

                            const orderedAttrs = [];
                            if (colorVal) orderedAttrs.push(colorVal);
                            if (item.variant?.size?.name) orderedAttrs.push(item.variant.size.name);
                            orderedAttrs.push(...otherAttrs);
                            if (item.variant?.fit?.name) orderedAttrs.push(item.variant.fit.name);

                            const attributesText = orderedAttrs.length > 0 ? orderedAttrs.join(", ") : "Única";

                            return (
                              <tr key={item.id} style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ paddingLeft: '48px' }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <img
                                      src={finalImgUrl}
                                      alt={attributesText}
                                      className="product-img"
                                      style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '6px' }}
                                      onError={(e) => { e.target.src = getImageUrl('/catalog/products/default.png'); }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <div style={{ fontWeight: 500, lineHeight: '1.2', color: 'var(--text-main)', fontSize: '13px' }}>
                                        {attributesText}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <div>
                                      <span style={{ fontWeight: 'bold', fontSize: '1.05em' }}>{item.stock}</span>
                                      <span style={{ fontSize: '0.8em', color: 'var(--text-muted)', marginLeft: '4px' }}>uds</span>
                                    </div>
                                    {Number(item.reserved_stock) > 0 && (
                                      <div style={{ fontSize: '11px', color: 'var(--color-warning)', fontWeight: 500 }}>
                                        {item.reserved_stock} reservados
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span style={{ fontWeight: 600 }}>Bs {item.variant?.price?.toFixed(2) || "0.00"}</span>
                                </td>
                                <td style={{ color: 'var(--text-muted)' }}>{item.branch?.name || "Sin sucursal"}</td>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '13px' }}>{item.variant?.sku || "Sin SKU"}</span>
                                    {item.variant?.barcode && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.variant.barcode}</span>}
                                  </div>
                                </td>
                                <td>
                                  {isOutOfStock ? (
                                    <span className="status-badge danger"><AlertTriangle size={12} /> Agotado</span>
                                  ) : isLowStock ? (
                                    <span className="status-badge warning"><AlertTriangle size={12} /> Bajo Stock</span>
                                  ) : (
                                    <span className="status-badge success">En Stock</span>
                                  )}
                                </td>
                                <td>
                                  <div className="table-actions">
                                    <CanAccess permission="adjust_inventory">
                                      <button 
                                        className="btn-edit" 
                                        onClick={(e) => { e.stopPropagation(); setAdjustModal({ isOpen: true, item }); }}
                                        title="Ajustar Stock"
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        <PenTool size={14} /> <span style={{fontSize: '12px'}}>Ajustar</span>
                                      </button>
                                    </CanAccess>
                                    
                                    <CanAccess permission="transfer_inventory">
                                      <button 
                                        className="btn-secondary" 
                                        onClick={(e) => { e.stopPropagation(); setTransferModal({ isOpen: true, item }); }}
                                        title="Transferir Stock"
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        <ArrowRightLeft size={14} /> <span style={{fontSize: '12px'}}>Transferir</span>
                                      </button>
                                    </CanAccess>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>

        </>
      )}

      {adjustModal.isOpen && (
        <AdjustStockModal 
          item={adjustModal.item}
          onClose={() => setAdjustModal({ isOpen: false, item: null })}
          onSuccess={handleAdjustSuccess}
          onBack={adjustModal.fromQuickAction ? () => {
            setAdjustModal({ isOpen: false, item: null });
            setQuickActionModal({ isOpen: true, item: adjustModal.item });
          } : undefined}
        />
      )}

      {transferModal.isOpen && (
        <TransferStockModal 
          item={transferModal.item}
          branches={branches}
          onClose={() => setTransferModal({ isOpen: false, item: null })}
          onSuccess={handleTransferSuccess}
          onBack={transferModal.fromQuickAction ? () => {
            setTransferModal({ isOpen: false, item: null });
            setQuickActionModal({ isOpen: true, item: transferModal.item });
          } : undefined}
        />
      )}

      {receiveModalOpen && (
        <ReceiveStockModal
          defaultBranchId={filters.branch_id}
          onClose={() => setReceiveModalOpen(false)}
          onSuccess={() => { setReceiveModalOpen(false); loadData(); }}
        />
      )}

      {auditModalOpen && (
        <AuditInventoryModal
          branchId={filters.branch_id}
          branches={branches}
          onClose={() => setAuditModalOpen(false)}
          onSuccess={() => { setAuditModalOpen(false); loadData(); }}
        />
      )}

      {quickActionModal.isOpen && (
        <QuickActionModal 
          item={quickActionModal.item}
          onClose={() => setQuickActionModal({ isOpen: false, item: null })}
          onAdjust={() => {
            setQuickActionModal({ isOpen: false, item: null });
            setAdjustModal({ isOpen: true, item: quickActionModal.item, fromQuickAction: true });
          }}
          onTransfer={() => {
            setQuickActionModal({ isOpen: false, item: null });
            setTransferModal({ isOpen: true, item: quickActionModal.item, fromQuickAction: true });
          }}
        />
      )}
    </div>
  );
}
