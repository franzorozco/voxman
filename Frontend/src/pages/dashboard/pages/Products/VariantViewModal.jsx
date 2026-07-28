import React, { useState, useEffect } from "react";
import { X, Box, Tag, DollarSign, Image as ImageIcon, CheckCircle, XCircle, Info, Hash, PackageSearch, Edit2, Save } from "lucide-react";
import { API_BASE_URL } from "../../../../config/api";
import api from "../../../../api/client";
import { updateVariant, updateProductMeasurements } from "../../../../api/admin/products";
import toast from "react-hot-toast";

import CustomSelect from '../../../../components/ui/CustomSelect';
const formatMoney = (amount) => {
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(amount);
};

export default function VariantViewModal({ variant, product, requiredMeasurements = [], measurementsState = {}, onClose, onVariantUpdated }) {
  const [activeTab, setActiveTab] = useState('info');

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [sizes, setSizes] = useState([]);
  const [fits, setFits] = useState([]);
  const [attributes, setAttributes] = useState([]);
  
  // Update infoState when variant prop changes
  useEffect(() => {
    setInfoState({
      price: variant.price || product.base_price,
      cost: variant.cost || 0,
      weight: variant.weight || 0,
      size_id: variant.size_id || '',
      fit_id: variant.fit_id || '',
      attribute_value_ids: variant.variant_attribute_values?.map(v => v.attribute_value_id) || []
    });
  }, [variant]);

  const [infoState, setInfoState] = useState({
    price: variant.price || product.base_price,
    cost: variant.cost || 0,
    weight: variant.weight || 0,
    size_id: variant.size_id || '',
    fit_id: variant.fit_id || '',
    attribute_value_ids: variant.variant_attribute_values?.map(v => v.attribute_value_id) || []
  });

  const handleEditInfo = async () => {
    setIsEditingInfo(true);
    if (sizes.length === 0) {
      try {
        const [szRes, ftRes, attrRes] = await Promise.all([
          api.get('/v1/admin/sizes'),
          api.get('/v1/admin/fits'),
          api.get('/v1/admin/attributes')
        ]);
        setSizes(szRes.data?.data || szRes.data || []);
        setFits(ftRes.data?.data || ftRes.data || []);
        setAttributes(attrRes.data?.data || attrRes.data || []);
      } catch(e) {
        toast.error("Error al cargar opciones de atributos");
      }
    }
  };

  const handleSaveInfo = async () => {
    try {
      setIsSaving(true);
      const res = await updateVariant(variant.id, infoState);
      toast.success("Información actualizada correctamente");
      setIsEditingInfo(false);
      if (onVariantUpdated && res.data.variant) {
        onVariantUpdated(res.data.variant);
      }
    } catch(e) {
      toast.error("Error al actualizar la variante");
    } finally {
      setIsSaving(false);
    }
  };

  const [isEditingMeas, setIsEditingMeas] = useState(false);
  const [measState, setMeasState] = useState({});

  const handleEditMeas = () => {
    setIsEditingMeas(true);
    const initialMeas = {};
    requiredMeasurements?.forEach(rm => {
       initialMeas[rm.id] = measurementsState?.[variant.id]?.[rm.id] || variant.variant_measurements?.find(vm => vm.measurement_type_id === rm.id)?.value || '';
    });
    variant.variant_measurements?.forEach(vm => {
       if (initialMeas[vm.measurement_type_id] === undefined) {
         initialMeas[vm.measurement_type_id] = vm.value || '';
       }
    });
    setMeasState(initialMeas);
  };

  const handleSaveMeas = async () => {
    try {
      setIsSaving(true);
      const formattedMeasurements = {};
      formattedMeasurements[variant.id] = [];
      Object.keys(measState).forEach(typeId => {
        formattedMeasurements[variant.id].push({
          measurement_type_id: typeId,
          value: measState[typeId]
        });
      });
      await updateProductMeasurements(product.id, formattedMeasurements);
      toast.success("Medidas actualizadas. Recarga la página para ver los cambios.");
      setIsEditingMeas(false);
    } catch(e) {
      toast.error("Error al actualizar medidas");
    } finally {
      setIsSaving(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url}`;
  };

  // Extraer todos los IDs de atributos de esta variante para buscar coincidencias de imágenes (como strings para IDs UUID)
  const variantAttrIds = variant.variant_attribute_values?.map(vav => String(vav.attribute_value_id)) || [];

  // Imágenes específicas de la variante (exclusivas o por color)
  let specificImages = [];
  if (variant.variant_images && variant.variant_images.length > 0) {
    specificImages = variant.variant_images.map(img => ({ ...img, tag: 'Variante' }));
  } else if (product.attribute_value_images && variantAttrIds.length > 0) {
    specificImages = product.attribute_value_images
      .filter(img => variantAttrIds.includes(String(img.attribute_value_id)))
      .map(img => ({ ...img, tag: 'Color' }));
  }

  // Imágenes globales del producto (portada y galería principal)
  const globalImages = product.product_images?.map(img => ({ ...img, tag: img.is_main ? 'Portada' : 'Global' })) || [];

  // Imagen principal para la miniatura superior (prioriza específica, luego portada)
  const bestImage = specificImages[0]?.url || globalImages.find(img => img.is_main)?.url || globalImages[0]?.url;
  const imageUrl = getImageUrl(bestImage);

  const getAttributeName = (vav) => vav.attribute_value?.attribute?.name || '';
  const getAttributeValue = (vav) => vav.attribute_value?.value || '';

  const totalStock = variant.inventories?.reduce((acc, inv) => acc + (inv.stock || inv.quantity || 0), 0) || 0;
  
  const price = parseFloat(variant.price || product.base_price || 0);
  const cost = parseFloat(variant.cost || 0);
  const margin = price - cost;
  const marginPercentage = cost > 0 ? ((margin / cost) * 100).toFixed(1) : 100;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, animation: 'fadeIn 0.2s ease', backdropFilter: 'blur(4px)' }} onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="modal-content" style={{ background: 'var(--bg-main)', borderRadius: '16px', width: '95%', maxWidth: '850px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {imageUrl ? (
                <img src={imageUrl} alt="Variant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ImageIcon size={24} color="var(--text-muted)" />
              )}
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: 'var(--text-main)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                SKU: {variant.sku}
                <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: variant.is_active ? 'var(--color-success-alpha, rgba(16, 185, 129, 0.15))' : 'var(--color-danger-alpha, rgba(239, 68, 68, 0.15))', color: variant.is_active ? 'var(--color-success)' : 'var(--color-danger)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {variant.is_active ? <CheckCircle size={14} /> : <XCircle size={14} />} {variant.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Box size={14} /> Producto Base: {product.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', transition: '0.2s' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', padding: '0 24px', overflowX: 'auto' }}>
          {[
            { id: 'info', label: 'Información', icon: Info },
            { id: 'inventory', label: 'Inventario y Stock', icon: PackageSearch },
            { id: 'images', label: 'Galería y Colores', icon: ImageIcon },
            { id: 'measurements', label: 'Medidas', icon: Hash }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveTab(tab.id); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-muted)',
                borderBottom: `3px solid ${activeTab === tab.id ? 'var(--color-primary)' : 'transparent'}`,
                transition: '0.2s', opacity: activeTab === tab.id ? 1 : 0.7,
                whiteSpace: 'nowrap'
              }}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

                  {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              
              {/* Identificación y Atributos */}
              <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                    <Hash size={18} color="var(--color-primary)" /> Identificación y Atributos
                  </h3>
                  {!isEditingInfo ? (
                    <button className="btn-secondary" onClick={handleEditInfo} style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                      <Edit2 size={14} /> Editar
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                      <button className="btn-secondary" onClick={() => setIsEditingInfo(false)} style={{ padding: '4px 10px', fontSize: '12px' }}>
                        Cancelar
                      </button>
                      <button className="btn-primary" onClick={handleSaveInfo} disabled={isSaving} style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Save size={14} /> {isSaving ? "..." : "Guardar"}
                      </button>
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Código SKU</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)', background: 'var(--bg-overlay)', padding: '4px 10px', borderRadius: '6px' }}>{variant.sku}</span>
                  </div>
                  {variant.barcode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Código de Lectura</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{variant.barcode}</span>
                    </div>
                  )}
                  
                  {variant.size && (
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Talla (Size)</span>
                      {isEditingInfo ? (
                        <CustomSelect className="simple-input" value={infoState.size_id} onChange={e => setInfoState({...infoState, size_id: e.target.value})} style={{ width: '150px', padding: '4px 8px' }}>
                          {sizes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </CustomSelect>
                      ) : (
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{variant.size.name}</span>
                      )}
                    </div>
                  )}
                  
                  {variant.fit && (
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Corte (Fit)</span>
                      {isEditingInfo ? (
                        <CustomSelect className="simple-input" value={infoState.fit_id} onChange={e => setInfoState({...infoState, fit_id: e.target.value})} style={{ width: '150px', padding: '4px 8px' }}>
                          {fits.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </CustomSelect>
                      ) : (
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{variant.fit.name}</span>
                      )}
                    </div>
                  )}

                  {variant.variant_attribute_values?.map((vav, idx) => {
                    const attrName = getAttributeName(vav);
                    const attr = attributes.find(a => a.name.toLowerCase() === attrName.toLowerCase());
                    return (
                      <div key={vav.attribute_value_id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '14px', textTransform: 'capitalize' }}>{attrName}</span>
                        {(isEditingInfo && attr) ? (
                          <CustomSelect 
                            className="simple-input" 
                            style={{ width: '150px', padding: '4px 8px' }}
                            value={infoState.attribute_value_ids.find(id => (attr.attribute_values || []).some(v => String(v.id) === String(id))) || vav.attribute_value_id}
                            onChange={e => {
                               const newVal = e.target.value;
                               const otherIds = infoState.attribute_value_ids.filter(id => !(attr.attribute_values || []).some(v => String(v.id) === String(id)));
                               setInfoState({...infoState, attribute_value_ids: [...otherIds, newVal]});
                            }}
                          >
                            {(attr.attribute_values || []).map(val => <option key={val.id} value={val.id}>{val.value}</option>)}
                          </CustomSelect>
                        ) : (
                          <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{getAttributeValue(vav)}</span>
                        )}
                      </div>
                    );
                  })}

                  {(variant.weight > 0 || isEditingInfo) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Peso (kg)</span>
                      {isEditingInfo ? (
                        <input type="number" step="0.01" className="simple-input" value={infoState.weight} onChange={e => setInfoState({...infoState, weight: e.target.value})} style={{ width: '150px', padding: '4px 8px', textAlign: 'right' }} />
                      ) : (
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{variant.weight} kg</span>
                      )}
                    </div>
                  )}
                  
                  {(!variant.size && !variant.fit && !variant.weight && (!variant.variant_attribute_values || variant.variant_attribute_values.length === 0)) && !isEditingInfo && (
                    <div style={{ padding: '10px', background: 'var(--bg-overlay)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                      Esta es la variante base/genérica del producto. No tiene atributos específicos definidos.
                    </div>
                  )}
                </div>
              </div>

              {/* Finanzas */}
              <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <DollarSign size={18} color="var(--color-primary)" /> Datos Financieros
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Precio de Venta (Retail)</span>
                    {isEditingInfo ? (
                        <input type="number" step="0.01" className="simple-input" value={infoState.price} onChange={e => setInfoState({...infoState, price: e.target.value})} style={{ width: '150px', padding: '4px 8px', textAlign: 'right' }} />
                    ) : (
                        <span style={{ fontWeight: '700', color: 'var(--color-success)', fontSize: '18px' }}>{formatMoney(price)}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Costo Interno (Mayorista)</span>
                    {isEditingInfo ? (
                        <input type="number" step="0.01" className="simple-input" value={infoState.cost} onChange={e => setInfoState({...infoState, cost: e.target.value})} style={{ width: '150px', padding: '4px 8px', textAlign: 'right' }} />
                    ) : (
                        <span style={{ fontWeight: '600', color: 'var(--color-danger)' }}>{formatMoney(cost)}</span>
                    )}
                  </div>
                  
                  {!isEditingInfo && (
                    <div style={{ background: 'var(--bg-overlay)', padding: '16px', borderRadius: '12px', marginTop: '8px', border: margin >= 0 ? '1px solid var(--color-success)' : '1px solid var(--color-danger)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>Margen de Utilidad</span>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: margin >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{formatMoney(margin)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--bg-input)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, marginPercentage))}%`, background: margin >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: margin >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{marginPercentage}% ROI</span>
                      </div>
                    </div>
                  )}
                  
                  {variant.price && variant.price !== product.base_price && !isEditingInfo && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '10px', padding: '12px', background: 'rgba(99,102,241,0.1)', borderRadius: '8px', color: 'var(--color-primary)' }}>
                      <Info size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.4 }}>Esta variante tiene un <b>precio personalizado</b> de {formatMoney(variant.price)}. Ignora el precio base del producto que es {formatMoney(product.base_price)}.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock Global Total</span>
                  <span style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-main)' }}>{totalStock}</span>
                </div>
                
                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor de Venta del Stock</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)' }}>{formatMoney(totalStock * price)}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Si se vendiera todo hoy</span>
                </div>
                
                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Costo Inmovilizado</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-danger)' }}>{formatMoney(totalStock * cost)}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Capital invertido en almacén</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', padding: '20px' }}>
                  <Tag size={18} color="var(--color-primary)" /> Distribución en Sucursales
                </h3>
                
                {variant.inventories?.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--bg-overlay)' }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Sucursal</th>
                        <th style={{ textAlign: 'center', padding: '12px 20px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Stock Mínimo</th>
                        <th style={{ textAlign: 'right', padding: '12px 20px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Stock Disponible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variant.inventories.map(inv => {
                        const stock = inv.stock || inv.quantity || 0;
                        const minStock = inv.min_stock || 0;
                        const status = stock === 0 ? 'danger' : (stock <= minStock ? 'warning' : 'success');
                        
                        return (
                          <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--text-main)' }}>
                              {inv.branch?.name || 'Sucursal Base'}
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                              {minStock} u.
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', color: `var(--color-${status})`, background: `var(--color-${status}-alpha, rgba(0,0,0,0.1))`, padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                                  {status === 'danger' ? 'Agotado' : (status === 'warning' ? 'Bajo' : 'Óptimo')}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-main)', width: '40px' }}>{stock}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>No hay registros de inventario para esta variante en ninguna sucursal.</p>
                  </div>
                )}
              </div>
              
            </div>
          )}
          {activeTab === 'images' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  Imágenes Específicas de esta Variante
                </h3>
                
                {specificImages.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
                    {specificImages.map((img, idx) => (
                      <div key={img.id || idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '1', background: 'var(--bg-overlay)' }}>
                        <img src={getImageUrl(img.url)} alt={img.tag} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '11px', padding: '6px', textAlign: 'center', fontWeight: 600 }}>
                          {img.tag}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>Esta variante no tiene imágenes exclusivas ni imágenes por color asignadas.</p>
                  </div>
                )}
              </div>

              {globalImages.length > 0 && (
                <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    Imágenes Generales del Producto
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                    {globalImages.map((img, idx) => (
                      <div key={img.id || idx} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', aspectRatio: '1', background: 'var(--bg-overlay)' }}>
                        <img src={getImageUrl(img.url)} alt={img.tag} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', padding: '4px', textAlign: 'center', fontWeight: 600 }}>
                          {img.tag}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'measurements' && (
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                  <Hash size={18} color="var(--color-primary)" /> Tabla de Medidas
                </h3>
                {!isEditingMeas ? (
                  <button className="btn-secondary" onClick={handleEditMeas} style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                    <Edit2 size={14} /> Editar
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <button className="btn-secondary" onClick={() => setIsEditingMeas(false)} style={{ padding: '4px 10px', fontSize: '12px' }}>
                      Cancelar
                    </button>
                    <button className="btn-primary" onClick={handleSaveMeas} disabled={isSaving} style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Save size={14} /> {isSaving ? "..." : "Guardar"}
                    </button>
                  </div>
                )}
              </div>
              {(variant.variant_measurements?.length > 0 || requiredMeasurements?.length > 0) ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--bg-overlay)' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Tipo de Medida</th>
                      <th style={{ textAlign: 'right', padding: '12px 20px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Valor (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const displayMeasurements = [];
                      
                      // 1. Agregar las requeridas
                      requiredMeasurements?.forEach(rm => {
                        displayMeasurements.push({
                          id: rm.id,
                          name: rm.name,
                          value: measurementsState?.[variant.id]?.[rm.id] || variant.variant_measurements?.find(vm => vm.measurement_type_id === rm.id)?.value
                        });
                      });

                      // 2. Agregar cualquier otra que la variante tenga pero no sea requerida
                      variant.variant_measurements?.forEach(vm => {
                        if (!displayMeasurements.find(m => m.id === vm.measurement_type_id)) {
                          displayMeasurements.push({
                            id: vm.measurement_type_id,
                            name: vm.measurement_type?.name || `Medida ${vm.measurement_type_id}`,
                            value: vm.value
                          });
                        }
                      });

                      return displayMeasurements.map((m, idx) => (
                        <tr key={m.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--text-main)' }}>
                            {m.name}
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                            {isEditingMeas ? (
                              <input 
                                type="number" 
                                step="0.1" 
                                className="simple-input" 
                                value={measState[m.id] || ''} 
                                onChange={e => setMeasState({...measState, [m.id]: e.target.value})} 
                                style={{ width: '100px', padding: '6px 10px', textAlign: 'right' }} 
                                placeholder="0.0"
                              />
                            ) : (
                              m.value ? `${m.value} cm` : <span style={{ color: 'var(--text-muted)' }}>---</span>
                            )}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>Esta variante no tiene medidas registradas.</p>
                </div>
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
