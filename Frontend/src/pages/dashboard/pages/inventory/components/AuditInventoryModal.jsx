import React, { useState, useEffect } from "react";
import { X, Search, Save, AlertCircle, Package, Check, Camera } from "lucide-react";
import { getInventory, submitInventoryAudit } from "../../../../../api/admin/inventory";
import { toast } from "react-hot-toast";
import useScanner from "../../../../../hooks/useScanner";
import { useScannerStore } from "../../../../../store/useScannerStore";

export default function AuditInventoryModal({ branchId, branches, onClose, onSuccess }) {
  const [searchResults, setSearchResults] = useState([]);
  const [auditedItems, setAuditedItems] = useState({}); // { variant_id: { item, count } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const openScanner = useScannerStore(state => state.openScanner);

  const selectedBranch = branches.find(b => b.id === branchId);

  const processScannedCode = async (scannedText) => {
    if (!branchId) return;
    const code = scannedText.includes('/p/') ? scannedText.split('/p/').pop().trim() : scannedText.trim();
    if (!code) return;

    try {
      const res = await getInventory({ search: code, branch_id: branchId, per_page: 5 });
      const items = res.data?.data || [];
      const exactMatch = items.find(i => 
        i.variant?.sku === code || 
        i.variant?.barcode === code || 
        i.variant?.id === code
      );

      if (exactMatch) {
        setAuditedItems(prev => {
           const updated = { ...prev };
           const variantId = exactMatch.variant_id;
           const currentCount = updated[variantId]?.count !== undefined && updated[variantId]?.count !== "" 
                ? parseInt(updated[variantId].count) 
                : 0;
           updated[variantId] = {
             item: exactMatch,
             count: currentCount + 1
           };
           return updated;
        });
        toast.success(`+1 añadido: ${exactMatch.variant?.sku}`, { icon: '📦' });
      } else {
        toast.error(`SKU ${code} no encontrado en esta sucursal`);
      }
    } catch (err) {
      toast.error("Error al buscar producto escaneado");
    }
  };

  const handleScanClick = () => {
    if (!branchId) {
      toast.error("Selecciona una sucursal primero");
      return;
    }
    openScanner(processScannedCode, true);
  };

  useScanner(processScannedCode, true);

  // Debounced search
  useEffect(() => {
    if (!branchId) return;
    
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await getInventory({ branch_id: branchId, search: search.trim(), per_page: 50 });
        setSearchResults(res.data?.data || []);
      } catch (error) {
        toast.error("Error al buscar productos");
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, branchId]);

  const handleCountChange = (item, value) => {
    const variantId = item.variant_id;
    const parsedValue = value === "" ? "" : parseInt(value);
    
    setAuditedItems(prev => {
      const updated = { ...prev };
      
      // If the user clears the input and it wasn't modified before, or they just erase it,
      // we can remove it from audited list if we want, but let's keep it if they explicitly interacted.
      // Actually, if it's empty, we can just delete it from auditedItems so it doesn't submit.
      if (parsedValue === "") {
        delete updated[variantId];
      } else {
        updated[variantId] = {
          item: item,
          count: parsedValue
        };
      }
      
      return updated;
    });
  };

  const handleSubmit = async () => {
    const itemsToSubmit = Object.values(auditedItems)
      .filter(audited => audited.count !== "" && audited.count !== null)
      .map(audited => ({
        variant_id: audited.item.variant_id,
        actual_stock: audited.count
      }));

    if (itemsToSubmit.length === 0) {
      toast.error("No has auditado ningún producto todavía.");
      return;
    }

    try {
      setSaving(true);
      await submitInventoryAudit({
        branch_id: branchId,
        items: itemsToSubmit
      });

      toast.success("Auditoría guardada exitosamente");
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Error al guardar auditoría");
    } finally {
      setSaving(false);
    }
  };

  // Group and sort items by product for display
  const groupItems = (itemsList) => {
    const sizeOrder = {
      'XXS': 1, 'XS': 2, 'S': 3, 'M': 4, 'L': 5, 'XL': 6, 'XXL': 7, 'XXXL': 8
    };

    const grouped = itemsList.reduce((acc, item) => {
      const pId = item.variant?.product?.id || "unknown";
      if (!acc[pId]) {
        acc[pId] = { product: item.variant?.product, items: [] };
      }
      acc[pId].items.push(item);
      return acc;
    }, {});

    // Sort items within each group
    Object.values(grouped).forEach(group => {
      group.items.sort((a, b) => {
        const sizeA = a.variant?.size?.name || "";
        const sizeB = b.variant?.size?.name || "";

        const orderA = sizeOrder[sizeA.toUpperCase()];
        const orderB = sizeOrder[sizeB.toUpperCase()];

        if (orderA && orderB) {
          if (orderA !== orderB) return orderA - orderB;
        } else if (orderA && !orderB) {
          return -1;
        } else if (!orderA && orderB) {
          return 1;
        } else {
          const sizeCmp = sizeA.localeCompare(sizeB);
          if (sizeCmp !== 0) return sizeCmp;
        }

        const colorA = a.variant?.variant_attribute_values?.[0]?.attribute_value?.value || "";
        const colorB = b.variant?.variant_attribute_values?.[0]?.attribute_value?.value || "";
        return colorA.localeCompare(colorB);
      });
    });

    return grouped;
  };

  // Decide what to show: search results or already audited items
  const isSearching = search.trim().length >= 2;
  const displayItems = isSearching ? searchResults : Object.values(auditedItems).map(a => a.item);
  const groupedDisplay = groupItems(displayItems);

  if (!branchId) {
    return (
      <div className="modal-overlay" style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="modal-content" style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '500px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
          <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Error de Auditoría</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-muted)" /></button>
          </div>
          <div className="modal-body" style={{ padding: '24px' }}>
            <p style={{ margin: 0 }}>Debe seleccionar una sucursal específica para realizar una auditoría.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="modal-content" style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '900px', borderRadius: '16px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        
        <div className="modal-header" style={{ position: 'relative', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ paddingRight: '40px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Package /> Auditoría de Inventario</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Sucursal: {selectedBranch?.name}</p>
          </div>
          <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-secondary)', padding: '12px 16px', borderRadius: '8px', color: 'var(--color-warning)', gap: '10px', border: '1px solid var(--border-color)' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '13px', color: 'var(--text-main)' }}><strong>Auditoría por Búsqueda:</strong> Busca los productos, ingresa su conteo real y se guardarán en tu lista de auditados. Al finalizar, presiona Guardar.</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Busca un producto por nombre o SKU para auditarlo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '14px 14px 14px 38px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', fontSize: '15px' }}
              />
            </div>
            <button
              onClick={handleScanClick}
              title="Escanear con Cámara"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', borderRadius: '10px', background: 'var(--bg-input)', color: 'var(--color-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s', fontWeight: 500 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'rgba(99,102,241,0.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-input)' }}
            >
              <Camera size={24} />
            </button>
          </div>

          {!isSearching && Object.keys(auditedItems).length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)' }}>
              <Package size={48} style={{ opacity: 0.5, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>Tu lista de auditoría está vacía</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>Usa el buscador de arriba para encontrar productos y ajustar su stock.</p>
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'auto', flex: 1, minHeight: 0, background: 'var(--bg-card)' }}>
              <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'auto' }}>
                <thead style={{ background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>Producto / Variante</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>SKU</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'center', whiteSpace: 'nowrap' }}>Teórico</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'center', whiteSpace: 'nowrap' }}>Físico</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'center', whiteSpace: 'nowrap' }}>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Buscando productos...</td></tr>
                  ) : Object.keys(groupedDisplay).length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No se encontraron productos.</td></tr>
                  ) : (
                    Object.values(groupedDisplay).map(group => (
                      <React.Fragment key={group.product?.id || Math.random()}>
                        {/* Fila de Agrupación del Producto */}
                        <tr style={{ background: 'var(--color-secondary)' }}>
                          <td colSpan="5" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)' }}>
                            {group.product?.name || "Producto Desconocido"}
                          </td>
                        </tr>
                        {/* Filas de las Variantes */}
                        {group.items.map(item => {
                          const variantId = item.variant_id;
                          const theoryStock = item.stock;
                          
                          // Get count from auditedItems if it exists, otherwise leave empty
                          const audited = auditedItems[variantId];
                          const physicalStock = audited ? audited.count : "";
                          const diff = physicalStock === "" ? 0 : physicalStock - theoryStock;
                          
                          const isAudited = audited !== undefined;
                          
                          return (
                            <tr key={item.id} style={{ background: isAudited ? 'var(--bg-input)' : 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '12px 16px', paddingLeft: '32px', fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {isAudited && <Check size={14} color="var(--color-success)" />}
                                  <span>
                                    {item.variant?.size?.name && `${item.variant.size.name}`}
                                    {item.variant?.variant_attribute_values?.[0]?.attribute_value?.value && ` - ${item.variant.variant_attribute_values[0].attribute_value.value}`}
                                    {(!item.variant?.size?.name && !item.variant?.variant_attribute_values?.length) && "Única"}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.variant?.sku}</td>
                              <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center', color: 'var(--text-main)' }}>{theoryStock}</td>
                              <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={physicalStock}
                                  onChange={(e) => handleCountChange(item, e.target.value)}
                                  placeholder="-"
                                  style={{ width: '80px', padding: '8px', textAlign: 'center', borderRadius: '6px', border: '1px solid var(--border-color)', background: isAudited ? 'var(--bg-card)' : 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', fontWeight: 600 }}
                                />
                              </td>
                              <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'center', fontWeight: 'bold', color: diff > 0 ? 'var(--color-success)' : diff < 0 ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                                {physicalStock === "" ? "-" : diff > 0 ? `+${diff}` : diff}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer audit-modal-footer" style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '0 0 16px 16px', gap: '15px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center' }}>
            {Object.keys(auditedItems).length} productos auditados en esta sesión
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} disabled={saving} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}>
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving || loading || Object.keys(auditedItems).length === 0} style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 500, opacity: Object.keys(auditedItems).length === 0 ? 0.5 : 1 }}>
              <Save size={18} /> {saving ? "Guardando..." : "Guardar Auditoría"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
