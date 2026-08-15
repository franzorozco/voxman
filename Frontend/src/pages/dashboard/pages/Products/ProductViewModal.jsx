import React, { useState, useEffect } from "react";
import { X, Package, Tag, DollarSign, Activity, Link as LinkIcon, Info, Users, ArrowUpRight, BarChart3, Image as ImageIcon, Ruler, Save, Edit2, Copy, Check, PenTool, ExternalLink, Box, CheckCircle, AlertCircle, ShoppingBag } from "lucide-react";
import { API_BASE_URL } from "../../../../config/api";
import api from "../../../../api/client";
import { updateProductMeasurements, updatePartialProduct } from "../../../../api/admin/products";
import CanAccess from "../../../../components/ui/CanAccess";
import ProductImageEditor from "./ProductImageEditor";
import QrPrintTab from "./components/QrPrintTab";
import VariantViewModal from "./VariantViewModal";
import toast from "react-hot-toast";
import "./Products.css";

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={handleCopy} 
      title="Copiar"
      style={{ 
        background: 'none', border: 'none', cursor: 'pointer', 
        padding: '4px', display: 'flex', alignItems: 'center', 
        color: copied ? 'var(--color-success)' : 'var(--text-muted)',
        transition: '0.2s', borderRadius: '4px'
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

export default function ProductViewModal({ product: initialProduct, initialVariantId, directVariantMode = false, onClose, onUpdated }) {
  if (!initialProduct) return null;

  const [product, setProduct] = useState(initialProduct);
  const [activeTab, setActiveTab] = useState("general");
  
  const [viewingVariant, setViewingVariant] = useState(() => {
    if (initialVariantId && initialProduct.product_variants) {
      return initialProduct.product_variants.find(v => v.id === initialVariantId) || null;
    }
    return null;
  });
  const [isEditingImages, setIsEditingImages] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // Measurements State
  const [loadingMeas, setLoadingMeas] = useState(true);
  const [savingMeas, setSavingMeas] = useState(false);
  const [isEditingMeas, setIsEditingMeas] = useState(false);
  const [requiredMeasurements, setRequiredMeasurements] = useState([]);
  const [measurementsState, setMeasurementsState] = useState({});
  const [globalMeasValues, setGlobalMeasValues] = useState({});
  const [initialMeasValues, setInitialMeasValues] = useState({});

  // Measurements Logic
  const fetchMeasurements = async () => {
    try {
      setLoadingMeas(true);
      const relRes = await api.get('/v1/admin/product-type-measurements');
      const relations = relRes.data?.data ?? relRes.data ?? [];
      const myRelations = relations.filter(r => r.product_type_id === product.product_type_id);
      const measRes = await api.get('/v1/admin/measurement-types');
      const allMeas = measRes.data?.data ?? measRes.data ?? [];
      
      const required = [];
      const seen = new Set();
      myRelations.forEach(rel => {
        if (!seen.has(rel.measurement_type_id)) {
          seen.add(rel.measurement_type_id);
          const type = allMeas.find(m => m.id === rel.measurement_type_id);
          if (type) required.push({ id: type.id, name: type.name });
        }
      });
      setRequiredMeasurements(required);

      const mapping = {};
      if (product.product_variants) {
        product.product_variants.forEach(variant => {
          mapping[variant.id] = {};
          if (variant.variant_measurements) {
            variant.variant_measurements.forEach(vm => {
              mapping[variant.id][vm.measurement_type_id] = vm.value;
            });
          }
        });
      }
      setMeasurementsState(mapping);
      setInitialMeasValues(mapping);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar medidas");
    } finally {
      setLoadingMeas(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'measurements') {
      fetchMeasurements();
    }
  }, [activeTab, product.id]);

  const handleValueChange = (variantId, measurementId, value) => {
    setMeasurementsState(prev => ({
      ...prev,
      [variantId]: { ...prev[variantId], [measurementId]: value }
    }));
  };

  const handleGlobalValueChange = (measurementId, value) => {
    setGlobalMeasValues(prev => ({ ...prev, [measurementId]: value }));
  };

  const applyGlobalValues = () => {
    if (Object.keys(globalMeasValues).length === 0) return;
    setMeasurementsState(prev => {
      const newValues = { ...prev };
      product.product_variants.forEach(variant => {
        newValues[variant.id] = { ...newValues[variant.id] };
        Object.keys(globalMeasValues).forEach(mId => {
          if (globalMeasValues[mId] !== "" && globalMeasValues[mId] !== undefined) {
             newValues[variant.id][mId] = globalMeasValues[mId];
          }
        });
      });
      return newValues;
    });
    toast.success("Medidas aplicadas a todas las variantes.");
  };

  const handleSaveMeasurements = async () => {
    try {
      setSavingMeas(true);
      const formattedMeasurements = {};
      Object.keys(measurementsState).forEach(variantId => {
        formattedMeasurements[variantId] = [];
        Object.keys(measurementsState[variantId]).forEach(typeId => {
          formattedMeasurements[variantId].push({
            measurement_type_id: typeId,
            value: measurementsState[variantId][typeId]
          });
        });
      });

      await updateProductMeasurements(product.id, formattedMeasurements);
      toast.success("Medidas actualizadas correctamente");
      setIsEditingMeas(false);
      refreshProduct();
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar medidas");
    } finally {
      setSavingMeas(false);
    }
  };

  const refreshProduct = async () => {
    try {
      const res = await api.get(`/v1/admin/products/${product.id}`);
      setProduct(res.data);
      if (onUpdated) onUpdated();
    } catch (error) {
      console.error("Error refreshing product:", error);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return `${API_BASE_URL}/storage/product_images/default.png`;
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
  };

  const handleTagUpdate = async (newTags) => {
    try {
      setProduct(prev => ({ ...prev, tags: newTags }));
      const formData = new FormData();
      formData.append("tags", JSON.stringify(newTags));
      await updatePartialProduct(product.id, formData);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar etiquetas");
      refreshProduct();
    }
  };

  // Determine Product primary image
  const primaryImage = product.product_images?.find(img => img.is_main)?.url 
    || product.product_images?.[0]?.url;

  const formatMoney = (value) => {
    const num = Number(value || 0);
    return `Bs ${num.toLocaleString("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calculate Prices and Costs from variants
  let minPrice = Number(product.base_price || 0);
  let maxPrice = Number(product.base_price || 0);
  let minCost = 0;
  let maxCost = 0;

  if (product.product_variants && product.product_variants.length > 0) {
    const prices = product.product_variants.map(v => Number(v.price || product.base_price));
    const costs = product.product_variants.map(v => Number(v.cost || 0));
    
    minPrice = Math.min(...prices);
    maxPrice = Math.max(...prices);
    minCost = Math.min(...costs);
    maxCost = Math.max(...costs);
  }

  // Calculate total stock across all variants
  const globalStock = product.product_variants?.reduce((total, v) => {
    return total + (v.inventories?.reduce((acc, inv) => acc + (inv.stock || inv.quantity || 0), 0) || 0);
  }, 0) || 0;

  // Get owner name
  const ownerName = product.owner?.user?.profile
    ? `${product.owner.user.profile.first_name || ''} ${product.owner.user.profile.last_name_paternal || ''}`.trim()
    : product.owner?.user?.email || "Sin propietario";

  return (
    <div className="modal-overlay pvm-overlay" onClick={onClose} style={directVariantMode ? { background: 'transparent' } : {}}>
      <div className="modal pvm-container" onClick={(e) => e.stopPropagation()} style={{ display: directVariantMode ? 'none' : 'flex' }}>
        
        {/* Header */}
        <div className="pvm-header">
          <div className="pvm-header-info">
            <div className="pvm-image-container">
              <img 
                src={getImageUrl(primaryImage)} 
                alt={product.name} 
                className="pvm-image"
                onError={(e) => e.target.src = `${API_BASE_URL}/storage/product_images/default.png`}
              />
            </div>
            <div>
              <h2 className="pvm-title">{product.name}</h2>
              <div className="pvm-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pvm-sku">SKU: {product.sku || 'N/A'}</span>
                  {product.sku && <CopyButton text={product.sku} />}
                </div>
                <span className="pvm-dot"></span>
                <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`} style={{ padding: '2px 8px', fontSize: '11px' }}>
                  {product.is_active ? 'Activo' : 'Inactivo'}
                </span>
                <span className="pvm-dot"></span>
                <span className="pvm-stock">Stock: {globalStock} u.</span>
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="pvm-tabs">
          <button 
            onClick={() => setActiveTab('general')}
            style={{ 
              padding: '16px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
              color: activeTab === 'general' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'general' ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: '0.2s'
            }}
          >
            Información General
          </button>
          <button 
            onClick={() => setActiveTab('variants')}
            style={{ 
              padding: '16px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
              color: activeTab === 'variants' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'variants' ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: '0.2s'
            }}
          >
            Variantes e Inventario ({product.product_variants?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('images')}
            style={{ 
              padding: '16px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
              color: activeTab === 'images' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'images' ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: '0.2s'
            }}
          >
            Galería y Colores
          </button>
          <button 
            onClick={() => setActiveTab('measurements')}
            style={{ 
              padding: '16px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
              color: activeTab === 'measurements' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'measurements' ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: '0.2s'
            }}
          >
            Medidas Físicas
          </button>
          <button 
            onClick={() => setActiveTab('qr_print')}
            style={{ 
              padding: '16px 0', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
              color: activeTab === 'qr_print' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'qr_print' ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: '0.2s',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="7" y1="7" x2="7" y2="7"></line><line x1="17" y1="7" x2="17" y2="7"></line><line x1="7" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="17" y2="17"></line></svg>
            Imprimir Etiquetas
          </button>
        </div>

        {/* Content */}
        <div className="pvm-modal-body">
          
          {activeTab === 'general' && (
            <div className="pvm-content-grid">
              {/* Left Column */}
              <div className="pvm-stack">
                <div className="pvm-card">
                  <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-main)' }}>
                    <Info size={18} color="var(--color-primary)" /> Detalles del Producto
                  </h3>
                  <div className="pvm-details-grid">
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Categoría</p>
                      <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)' }}>{product.category?.name || 'Sin categoría'}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Tipo de Producto</p>
                      <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)' }}>{product.product_type?.name || 'Estándar'}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Marca</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {product.brand?.logo_url && (
                          <img src={product.brand.logo_url} alt="logo" style={{ width: 20, height: 20, objectFit: 'contain', background: '#fff', borderRadius: 4 }} />
                        )}
                        <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)' }}>{product.brand?.name || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Propietario / Dueño</p>
                      <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-main)' }}>{ownerName}</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Descripción Corta</p>
                      <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: '1.5' }}>{product.short_description || 'Sin descripción'}</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Descripción Larga</p>
                      <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{product.long_description || 'Sin descripción'}</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        <Tag size={16} color="var(--color-primary)" /> Etiquetas de Marketing
                      </label>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                        Agrega etiquetas para destacar este producto (ej: "Nuevo", "Oferta").
                      </p>

                      {/* Quick add suggestions */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {['Nuevo', 'Oferta', 'Best Seller', 'Liquidación', 'Exclusivo', 'Ed. Limitada', 'Temporada'].map(suggestion => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              if (!(product.tags || []).includes(suggestion)) {
                                handleTagUpdate([...(product.tags || []), suggestion]);
                              }
                            }}
                            disabled={(product.tags || []).includes(suggestion)}
                            style={{
                              padding: '4px 12px', borderRadius: '14px', fontSize: '11px', fontWeight: '500', cursor: 'pointer',
                              border: '1px dashed var(--border-color)',
                              background: (product.tags || []).includes(suggestion) ? 'var(--bg-overlay)' : 'transparent',
                              color: (product.tags || []).includes(suggestion) ? 'var(--text-muted)' : 'var(--text-main)',
                              opacity: (product.tags || []).includes(suggestion) ? 0.5 : 1,
                              transition: '0.15s'
                            }}
                          >
                            + {suggestion}
                          </button>
                        ))}
                      </div>

                      {/* Current tags */}
                      {(product.tags || []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                          {product.tags.map((tag, idx) => (
                            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '20px', background: 'var(--color-primary-alpha, rgba(99,102,241,0.15))', color: 'var(--color-primary)', fontSize: '12px', fontWeight: '600' }}>
                              {tag}
                              <button type="button" onClick={() => handleTagUpdate(product.tags.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '16px', padding: 0, lineHeight: 1, fontWeight: 'bold' }}>×</button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Custom tag input */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Escribe una etiqueta y presiona Enter..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tagInput.trim()) {
                              e.preventDefault();
                              if (!(product.tags || []).includes(tagInput.trim())) {
                                handleTagUpdate([...(product.tags || []), tagInput.trim()]);
                              }
                              setTagInput("");
                            }
                          }}
                          style={{ 
                            flex: 1, 
                            background: 'var(--bg-input, transparent)', 
                            border: '1px solid var(--border-color)', 
                            color: 'var(--text-main)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '13px'
                          }}
                        />
                        <button type="button" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }} onClick={() => {
                          if (tagInput.trim() && !(product.tags || []).includes(tagInput.trim())) {
                            handleTagUpdate([...(product.tags || []), tagInput.trim()]);
                          }
                          setTagInput("");
                        }}>Agregar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="pvm-stack">
                <div className="pvm-card">
                  <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-main)' }}>
                    <DollarSign size={18} color="var(--color-primary)" /> Finanzas (Rango de Variantes)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Precio de Venta</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>
                        {minPrice === maxPrice ? formatMoney(minPrice) : `${formatMoney(minPrice)} - ${formatMoney(maxPrice)}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Costo</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '15px' }}>
                        {minCost === maxCost ? formatMoney(minCost) : `${formatMoney(minCost)} - ${formatMoney(maxCost)}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Margen de Beneficio</span>
                      <span style={{ fontWeight: '600', color: 'var(--color-success)', fontSize: '15px' }}>
                        {minPrice - minCost === maxPrice - maxCost 
                          ? formatMoney(minPrice - minCost) 
                          : `${formatMoney(minPrice - minCost)} - ${formatMoney(maxPrice - maxCost)}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pvm-card">
                  <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-main)' }}>
                    <BarChart3 size={18} color="var(--color-primary)" /> Métricas
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Vistas Totales</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{product.views || product.view_count || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Total de Variantes</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{product.product_variants?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="pvm-stack">
              {/* Mini KPIs */}
              {(() => {
                const variants = product.product_variants || [];
                const totalStock = variants.reduce((acc, v) => acc + (v.inventories?.reduce((s, inv) => s + (inv.stock || inv.quantity || 0), 0) || 0), 0);
                const lowStockCount = variants.filter(v => {
                  const vStock = v.inventories?.reduce((s, inv) => s + (inv.stock || inv.quantity || 0), 0) || 0;
                  const minStock = v.inventories?.reduce((max, inv) => Math.max(max, inv.min_stock || 0), 0) || 0;
                  return vStock > 0 && vStock <= minStock;
                }).length;
                const noStockCount = variants.filter(v => {
                  const vStock = v.inventories?.reduce((s, inv) => s + (inv.stock || inv.quantity || 0), 0) || 0;
                  return vStock === 0;
                }).length;
                return (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📦</div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stock Total</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>{totalStock}</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>⚠️</div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stock Bajo</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: lowStockCount > 0 ? 'var(--color-warning, #f59e0b)' : 'var(--text-main)' }}>{lowStockCount}</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🔴</div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sin Stock</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: noStockCount > 0 ? 'var(--color-danger)' : 'var(--text-main)' }}>{noStockCount}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {product.product_variants?.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="products-table products-table-responsive" style={{ width: '100%', border: 'none', borderRadius: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ background: 'var(--bg-overlay)', width: '25%' }}>Variante (SKU)</th>
                      <th style={{ background: 'var(--bg-overlay)' }}>Atributos</th>
                      <th style={{ background: 'var(--bg-overlay)' }}>Precio y Costo</th>
                      <th style={{ background: 'var(--bg-overlay)', minWidth: '150px' }}>Inventario por Sucursal</th>
                      <th style={{ background: 'var(--bg-overlay)', width: '100px' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.product_variants.map((variant, vIndex) => {
                      
                        const variantAttrIds = variant.variant_attribute_values?.map(v => String(v.attribute_value_id)) || [];
                        let displayImageUrl = variant.variant_images?.[0]?.url;
                        if (!displayImageUrl && product.attribute_value_images) {
                          const colorImg = product.attribute_value_images.find(img => variantAttrIds.includes(String(img.attribute_value_id)) && img.is_main) 
                                        || product.attribute_value_images.find(img => variantAttrIds.includes(String(img.attribute_value_id)));
                          if (colorImg) displayImageUrl = colorImg.url;
                        }
                        if (!displayImageUrl) displayImageUrl = primaryImage;

                        const totalStock = variant.inventories?.reduce((acc, inv) => acc + (inv.stock || inv.quantity || 0), 0) || 0;
                        return (
                          <tr key={variant.id || vIndex}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {displayImageUrl ? (
                                  <img 
                                    src={getImageUrl(displayImageUrl)} 
                                    style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                                  />

                              ) : (
                                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ImageIcon size={14} color="var(--text-muted)" />
                                </div>
                              )}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{variant.sku}</div>
                                <CopyButton text={variant.sku} />
                              </div>
                                {variant.barcode && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cód: {variant.barcode}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', fontSize: '13px' }}>
                              
                              {/* Display Size if exists */}
                              {variant.size && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Talla:</span>
                                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{variant.size.name}</span>
                                </div>
                              )}

                              {/* Display Fit if exists */}
                              {variant.fit && (
                                <React.Fragment>
                                  <span style={{ color: 'var(--border-color)' }}>•</span>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Fit:</span>
                                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{variant.fit.name}</span>
                                  </div>
                                </React.Fragment>
                              )}

                              {/* Display other attributes (Color, Material, etc) */}
                              {variant.variant_attribute_values?.map((vav, aIndex) => {
                                const attrName = vav.attribute_value?.attribute?.name || '';
                                const attrValue = vav.attribute_value?.value || '';
                                return (
                                  <React.Fragment key={vav.id || aIndex}>
                                    {(variant.size || variant.fit || aIndex > 0) && <span style={{ color: 'var(--border-color)' }}>•</span>}
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                        {attrName}:
                                      </span>
                                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                        {attrValue}
                                      </span>
                                    </div>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Venta: {formatMoney(variant.price || product.base_price)}</span>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Costo: {formatMoney(variant.cost || 0)}</span>
                            </div>
                          </td>
                          <td>
                            {variant.inventories?.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-overlay)', padding: '8px', borderRadius: '8px' }}>
                                {variant.inventories.map((inv, invIdx) => (
                                   <div key={inv.id || invIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                      <span style={{ color: 'var(--text-main)' }}>{inv.branch?.name || 'Sucursal Base'}:</span>
                                      <span style={{ fontWeight: '600', color: (inv.stock || inv.quantity) > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{inv.stock || inv.quantity || 0} u.</span>
                                   </div>
                                ))}
                                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2px', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
                                   <span style={{ color: 'var(--text-main)' }}>Total:</span>
                                   <span style={{ color: 'var(--color-primary)' }}>{totalStock} u.</span>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: '500' }}>Sin inventario</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={`status-badge ${variant.is_active ? 'active' : 'inactive'}`} style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                {variant.is_active ? 'Activa' : 'Inactiva'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setViewingVariant(variant)}
                                title="Ver detalles completos de variante"
                                style={{
                                  background: 'var(--color-primary-alpha, rgba(99,102,241,0.1))',
                                  color: 'var(--color-primary)',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  transition: '0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary-alpha, rgba(99,102,241,0.1))'}
                                onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary-text)'}
                                onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                              >
                                <ExternalLink size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Package size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                  <p style={{ margin: 0, fontSize: '15px' }}>Este producto no tiene variantes registradas.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'images' && (() => {
            const hasGlobalImages = product.product_images?.length > 0;
            const hasColorImages = product.attribute_value_images?.length > 0;
            const variantsWithImages = product.product_variants?.filter(v => v.variant_images?.length > 0) || [];
            const hasVariantImages = variantsWithImages.length > 0;

            const getAttributeDetails = (attrValId) => {
              if (!product.product_variants) return null;
              for (const variant of product.product_variants) {
                const found = variant.variant_attribute_values?.find(vav => Number(vav.attribute_value_id) === Number(attrValId));
                if (found && found.attribute_value) {
                  return found.attribute_value;
                }
              }
              return null;
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                  <h3 style={{ margin: "0", fontSize: "18px", color: "var(--text-main)" }}>
                    {isEditingImages ? "Editando Imágenes" : "Galería y Colores"}
                  </h3>
                  {!isEditingImages && (
                    <CanAccess permission="edit_products">
                      <button
                        className="btn-secondary"
                        onClick={() => setIsEditingImages(true)}
                        style={{ display: "flex", alignItems: "center", gap: "8px" }}
                      >
                        <PenTool size={16} /> Editar Imágenes
                      </button>
                    </CanAccess>
                  )}
                </div>

                {isEditingImages ? (
                  <ProductImageEditor 
                    product={product} 
                    onSaved={() => {
                      setIsEditingImages(false);
                      refreshProduct();
                    }} 
                    onCancel={() => setIsEditingImages(false)} 
                  />
                ) : (
                  <>
                    {!hasGlobalImages && !hasColorImages && !hasVariantImages && (
                      <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                        <p style={{ margin: 0, fontSize: '15px' }}>Este producto no tiene imágenes en su galería.</p>
                      </div>
                    )}
                    
                    {/* 1. Portada y Galería Principal */}
                    {hasGlobalImages && (
                  <div>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      Portada y Galería Principal
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))', gap: '20px' }}>
                      {product.product_images.map((img, iIndex) => (
                        <div key={img.id || iIndex} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: img.is_main ? '2px solid var(--color-primary)' : '1px solid var(--border-color)', aspectRatio: '1', background: 'var(--bg-overlay)' }}>
                          <img 
                            src={getImageUrl(img.url)} 
                            alt="Global Image" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {img.is_main && (
                            <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--color-primary)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                              ★ PORTADA
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Imágenes Agrupadas por Color */}
                {hasColorImages && (
                  <div>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      Imágenes por Color (Compartidas)
                    </h3>
                    <div className="pvm-stack">
                      {/* Agrupar attribute_value_images por attribute_value_id */}
                      {Object.entries(
                        product.attribute_value_images.reduce((acc, img) => {
                          if (!acc[img.attribute_value_id]) acc[img.attribute_value_id] = [];
                          acc[img.attribute_value_id].push(img);
                          return acc;
                        }, {})
                      ).map(([attrValId, images], idx) => {
                        const attrDetails = getAttributeDetails(attrValId);
                        const colorName = attrDetails?.value || `ID: ${attrValId}`;
                        const hexCode = attrDetails?.hex_code;

                        return (
                          <div key={idx} className="pvm-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                              {hexCode && (
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: hexCode, border: '2px solid var(--border-color)' }}></div>
                              )}
                              <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>
                                {colorName}
                              </span>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '8px' }}>
                                Se aplica a todas las variantes de este color
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 110px), 1fr))', gap: '16px' }}>
                              {images.map((img, iIndex) => (
                                <div key={img.id || iIndex} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: img.is_main ? '2px solid var(--color-primary)' : '1px solid var(--border-color)', aspectRatio: '1', background: 'var(--bg-overlay)' }}>
                                  <img src={getImageUrl(img.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  {img.is_main && (
                                    <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' }}>
                                      Principal
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Imágenes Específicas por Variante */}
                {hasVariantImages && (
                  <div>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      Imágenes Específicas por Variante
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {variantsWithImages.map((variant, vIdx) => (
                        <div key={variant.id || vIdx} style={{ background: 'var(--bg-overlay)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '15px' }}>{variant.sku}</span>
                            <CopyButton text={variant.sku} />
                          </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                              {variant.variant_attribute_values?.map(vav => vav.attribute_value?.value).join(' • ')}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--color-warning)', background: 'rgba(234, 179, 8, 0.1)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                              Únicas de esta variante
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 90px), 1fr))', gap: '16px' }}>
                            {variant.variant_images.map((img, iIndex) => (
                              <div key={img.id || iIndex} style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '1', background: 'var(--bg-main)' }}>
                                <img src={getImageUrl(img.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                  </>
                )}
              </div>
            );
          })()}

          {activeTab === 'measurements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <h3 style={{ margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", color: "var(--text-main)" }}>
                    <Ruler size={18} color="var(--color-primary)" /> {isEditingMeas ? "Editando Medidas" : "Catálogo de Medidas Físicas"}
                  </h3>
                  <p style={{ margin: "0", fontSize: "13px", color: "var(--text-muted)" }}>
                    {isEditingMeas 
                      ? "Ingresa los centímetros exactos de las prendas para el almacén y control de tallas."
                      : "Consulta las medidas físicas actuales para todas las variantes."}
                  </p>
                </div>
                
                <div style={{ display: "flex", gap: "10px" }}>
                  {isEditingMeas ? (
                    <>
                      <button 
                        className="btn-secondary"
                        onClick={() => { setIsEditingMeas(false); setMeasurementsState(initialMeasValues); }} 
                        disabled={savingMeas}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        Cancelar
                      </button>
                      <button 
                        className="btn-primary"
                        onClick={handleSaveMeasurements} 
                        disabled={savingMeas}
                        style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}
                      >
                        <Save size={16} /> {savingMeas ? "Guardando..." : "Guardar Medidas"}
                      </button>
                    </>
                  ) : (
                    requiredMeasurements.length > 0 && product.product_variants?.length > 0 && (
                      <CanAccess permission="manage_product_measurements">
                        <button
                          className="btn-secondary"
                          onClick={() => setIsEditingMeas(true)}
                          style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}
                        >
                          <Edit2 size={16} /> Editar Medidas
                        </button>
                      </CanAccess>
                    )
                  )}
                </div>
              </div>

                {loadingMeas ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Cargando esquema de medidas...</div>
                ) : requiredMeasurements.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "15px" }}>🤷‍♂️</div>
                    <h3 style={{ margin: 0, fontWeight: 500, color: "var(--text-main)" }}>Sin Medidas Requeridas</h3>
                    <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>
                      El Tipo de Producto ("{product.product_type?.name}") no tiene medidas asociadas. Ve a Configuración de Catálogo para agregarle medidas si es necesario.
                    </p>
                  </div>
                ) : product.product_variants?.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--color-danger)" }}>
                    Este producto aún no tiene variantes generadas.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="products-table">
                      <thead>
                        <tr>
                          <th style={{ minWidth: "120px" }}>SKU Variante</th>
                          <th style={{ minWidth: "120px" }}>Atributos</th>
                          {requiredMeasurements.map(m => (
                            <th key={m.id} style={{ minWidth: "100px", textAlign: "center" }}>
                              {m.name} <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "normal" }}>(cm)</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {isEditingMeas && product.product_variants?.length > 1 && (
                          <tr style={{ background: "var(--bg-hover, rgba(0,0,0,0.02))", borderBottom: "2px solid var(--border-color)" }}>
                            <td colSpan={2} style={{ padding: "15px 12px", fontSize: "0.9rem", color: "var(--text-main)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontWeight: "600", color: "var(--color-primary)" }}>Rellenado Rápido</span>
                                <button 
                                  className="btn-secondary" 
                                  style={{ padding: "4px 8px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "5px" }}
                                  onClick={applyGlobalValues}
                                  title="Aplica estos valores a todas las filas de abajo"
                                >
                                  <Copy size={12} /> Aplicar a Todas
                                </button>
                              </div>
                            </td>
                            {requiredMeasurements.map(m => (
                              <td key={m.id} style={{ padding: "10px", textAlign: "center" }}>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  placeholder="0.0"
                                  value={globalMeasValues[m.id] || ""}
                                  onChange={(e) => handleGlobalValueChange(m.id, e.target.value)}
                                  style={{ 
                                    width: "80px", 
                                    padding: "8px", 
                                    borderRadius: "6px", 
                                    border: "1px dashed var(--color-primary)", 
                                    background: "transparent", 
                                    color: "var(--color-primary)",
                                    fontWeight: "600",
                                    textAlign: "center",
                                    outline: "none"
                                  }}
                                />
                              </td>
                            ))}
                          </tr>
                        )}
                        {product.product_variants.map(variant => {
                          const attrText = variant.variant_attribute_values
                            ?.map(vav => vav.attribute_value?.value)
                            .filter(Boolean)
                            .join(", ");
                            
                          const detailParts = [];
                          if (variant.size?.name) detailParts.push(`Talla ${variant.size.name}`);
                          if (variant.fit?.name) detailParts.push(variant.fit.name);
                          if (attrText) detailParts.push(attrText);

                          return (
                            <tr key={variant.id}>
                              <td style={{ fontFamily: "monospace", color: "var(--text-main)" }}>{variant.sku}</td>
                              <td>
                                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.4", display: "block" }}>
                                  {detailParts.join(" • ") || "Estándar"}
                                </span>
                              </td>
                              
                              {requiredMeasurements.map(m => {
                                const val = measurementsState[variant.id]?.[m.id];
                                return (
                                  <td key={m.id} style={{ padding: "10px", textAlign: "center" }}>
                                    {isEditingMeas ? (
                                      <input 
                                        type="number" 
                                        step="0.1"
                                        placeholder="0.0"
                                        value={val || ""}
                                        onChange={(e) => handleValueChange(variant.id, m.id, e.target.value)}
                                        style={{ 
                                          width: "80px", 
                                          padding: "8px", 
                                          borderRadius: "6px", 
                                          border: "1px solid var(--border-color)", 
                                          background: "var(--bg-input)", 
                                          color: "var(--text-main)",
                                          textAlign: "center",
                                          outline: "none",
                                          transition: "0.2s border"
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                                        onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
                                      />
                                    ) : (
                                      <span style={{ 
                                        fontWeight: 600, 
                                        color: val ? "var(--text-main)" : "var(--text-muted)", 
                                        display: "inline-block",
                                        minWidth: "40px",
                                        fontSize: "0.95rem"
                                      }}>
                                        {val ? `${val} cm` : "---"}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          )}

          {activeTab === 'qr_print' && (
            <QrPrintTab product={product} />
          )}

        </div>

        {/* Footer */}
        <div className="modal-actions pvm-modal-footer">
          <button className="btn-secondary" onClick={onClose} style={{ minWidth: '120px' }}>
            Cerrar
          </button>
        </div>

      </div>
      
      {/* Variant View Modal */}
      {viewingVariant && (
        <VariantViewModal
          variant={viewingVariant}
          product={product}
          requiredMeasurements={requiredMeasurements}
          measurementsState={measurementsState}
          onClose={() => {
             if (directVariantMode) {
                onClose();
             } else {
                setViewingVariant(null);
             }
          }}
          onVariantUpdated={(updatedVariant) => {
             setViewingVariant(updatedVariant);
             refreshProduct();
          }}
        />
      )}
    </div>
  );
}
