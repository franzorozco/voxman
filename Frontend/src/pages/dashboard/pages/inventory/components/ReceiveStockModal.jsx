import { useState, useEffect, useRef } from "react";
import { X, Search, Package, Check, ChevronDown, Plus } from "lucide-react";
import { adjustStock, batchAdjustStock, getInventory } from "../../../../../api/inventory";
import toast from "react-hot-toast";
import { getProducts } from "../../../../../api/products";
import { getBranches } from "../../../../../api/branches";
import { API_BASE_URL } from "../../../../../config/api";
import { useAuthStore } from "../../../../../store/authStore";

export default function ReceiveStockModal({ defaultBranchId, onClose, onSuccess }) {
  const { user } = useAuthStore();
  const hasPermission = user?.permissions?.includes("inventory_mass_entry") || user?.roles?.includes("Owner");

  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  
  // Paso 1: Sucursal
  const [selectedBranchId, setSelectedBranchId] = useState(defaultBranchId || "");

  // Paso 2: Producto
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Paso 3: Variantes e Inventario local
  const [selectedVariant, setSelectedVariant] = useState(null); // Usado solo si no hay permiso masivo
  const [localInventory, setLocalInventory] = useState({});
  const [quantities, setQuantities] = useState({}); // { variant_id: qty }
  const [reference, setReference] = useState("");

  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    // Si pasaron una sucursal por defecto, la seleccionamos
    if (defaultBranchId) {
      setSelectedBranchId(defaultBranchId);
    }
  }, [defaultBranchId]);

  const loadBranches = async () => {
    try {
      const res = await getBranches();
      setBranches(res.data || res);
    } catch (error) {
      console.error("Error loading branches", error);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await getProducts({ search: value });
        const products = res.data?.data || [];
        setSearchResults(products);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error searching products", error);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const selectProduct = async (product) => {
    setSelectedProduct(product);
    setSelectedVariant(null);
    setQuantities({});
    setShowDropdown(false);
    setSearchQuery(""); // clear search
    
    // Si tenemos sucursal, traemos el stock local para estas variantes
    if (selectedBranchId) {
      try {
        const res = await getInventory({ branch_id: selectedBranchId, product_id: product.id });
        const invs = res.data?.data || res.data || [];
        const invMap = {};
        invs.forEach(inv => {
          invMap[inv.variant_id] = inv.stock;
        });
        setLocalInventory(invMap);
      } catch (err) {
        console.error("Error loading local inventory", err);
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBranchId) {
      toast.error("Debes seleccionar una sucursal destino.");
      return;
    }

    if (hasPermission) {
      const itemsToAdjust = Object.keys(quantities).filter(vid => quantities[vid] > 0).map(vid => ({
        variant_id: vid,
        quantity: quantities[vid]
      }));

      if (itemsToAdjust.length === 0) {
        toast.error("Debes ingresar una cantidad mayor a cero en al menos una variante.");
        return;
      }

      setLoading(true);
      try {
        await batchAdjustStock({
          branch_id: selectedBranchId,
          items: itemsToAdjust,
          reference: reference || "Ingreso Masivo de stock (Catálogo)"
        });
        toast.success("Stock masivo ingresado correctamente.");
        onSuccess();
        onClose();
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Error al ingresar stock masivo");
      } finally {
        setLoading(false);
      }

    } else {
      // Flujo Normal (Una sola variante)
      if (!selectedVariant) {
        toast.error("Debes seleccionar una variante del producto.");
        return;
      }
      const qty = quantities[selectedVariant.id] || 0;
      if (qty <= 0) {
        toast.error("La cantidad a ingresar debe ser mayor a cero.");
        return;
      }

      setLoading(true);
      try {
        await adjustStock({
          variant_id: selectedVariant.id,
          branch_id: selectedBranchId,
          quantity: qty,
          reference: reference || "Ingreso de nuevo stock (Catálogo)"
        });
        toast.success("Stock ingresado correctamente a la sucursal.");
        onSuccess();
        onClose();
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Error al ingresar stock");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQtyChange = (variantId, value) => {
    setQuantities(prev => ({ ...prev, [variantId]: value }));
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
      <div className="modal-content" style={{ background: 'var(--bg-card)', borderRadius: '16px', width: '90%', maxWidth: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-overlay)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-primary)', color: 'var(--color-primary-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={20} />
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)', fontWeight: 600 }}>Ingreso Global de Stock</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto' }}>
          
          {/* PASO 1: SUCURSAL */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              1. Sucursal de Destino
            </label>
            <select
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: defaultBranchId ? 'var(--bg-main)' : 'var(--bg-input)', color: 'var(--text-main)', fontSize: '15px', outline: 'none', cursor: defaultBranchId ? 'not-allowed' : 'pointer', opacity: defaultBranchId ? 0.8 : 1 }}
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              required
              disabled={!!defaultBranchId}
            >
              <option value="">-- Selecciona una sucursal --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {!!defaultBranchId && (
              <small style={{ color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                * Has ingresado desde una sucursal específica. El ingreso está bloqueado a esta sucursal por seguridad.
              </small>
            )}
          </div>

          {/* PASO 2: PRODUCTO (BUSCADOR) */}
          <div style={{ marginBottom: '25px', position: 'relative' }} ref={dropdownRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                2. Seleccionar Producto
              </label>
              {selectedProduct && (
                <button type="button" onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                  Cambiar Producto
                </button>
              )}
            </div>

            {!selectedProduct ? (
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar en el catálogo global por nombre o SKU..."
                  value={searchQuery}
                  onChange={handleSearch}
                  onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                  style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: '10px', border: '1px solid var(--color-primary)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '15px', outline: 'none', boxShadow: '0 0 0 2px var(--bg-overlay)' }}
                />
                
                {isSearching && (
                  <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted)' }}>Buscando...</div>
                )}

                {/* DROPDOWN DE RESULTADOS */}
                {showDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', marginTop: '5px', zIndex: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '250px', overflowY: 'auto' }}>
                    {searchResults.length === 0 && !isSearching ? (
                      <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No se encontraron productos.</div>
                    ) : (
                      searchResults.map(prod => (
                        <div
                          key={prod.id}
                          onClick={() => selectProduct(prod)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-main)', overflow: 'hidden', flexShrink: 0 }}>
                            {prod.product_images && prod.product_images.length > 0 ? (
                              <img src={`${API_BASE_URL}${prod.product_images[0].url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={20} color="var(--text-muted)" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>{prod.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{prod.product_variants?.length || 0} variante(s) disponibles</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              // PRODUCTO SELECCIONADO (VISTA PREVIA)
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--color-success)' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'var(--bg-main)', overflow: 'hidden', flexShrink: 0 }}>
                  {selectedProduct.product_images && selectedProduct.product_images.length > 0 ? (
                    <img src={`${API_BASE_URL}${selectedProduct.product_images[0].url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={24} color="var(--text-muted)" />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedProduct.name}
                    <div style={{ background: 'var(--color-success)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} />
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedProduct.category?.name || "Sin categoría"}</div>
                </div>
              </div>
            )}
          </div>

          {/* PASO 3: VARIANTE(S) */}
          {selectedProduct && (
            <div style={{ marginBottom: '25px', animation: 'fadeIn 0.3s ease' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                3. {hasPermission ? "Ingresar Cantidades por Variante" : "Seleccionar Variante a Ingresar"}
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                {selectedProduct.product_variants?.map(variant => {
                  
                  // Generar nombre descriptivo de la variante
                  let attrsText = "";
                  if (variant.variant_attribute_values?.length > 0) {
                    attrsText = variant.variant_attribute_values.map(vav => vav.attribute_value?.value || vav.attribute_value?.name).join(", ");
                  }
                  if (variant.size) {
                    attrsText += (attrsText ? ", " : "") + variant.size.name;
                  }
                  if (!attrsText) attrsText = "Estándar";

                  const isSelected = selectedVariant?.id === variant.id || hasPermission;
                  const currentStock = localInventory[variant.id] || 0;
                  const currentQty = quantities[variant.id] || 0;

                  let imgUrl = variant.variant_images?.[0]?.url;
                  if (!imgUrl) {
                    const attrIds = variant.variant_attribute_values?.map(vav => vav.attribute_value_id) || [];
                    const colorImg = selectedProduct?.attribute_value_images?.find(img => attrIds.includes(img.attribute_value_id));
                    if (colorImg) imgUrl = colorImg.url;
                  }
                  if (!imgUrl) {
                    imgUrl = selectedProduct?.product_images?.find(img => img.is_main)?.url || selectedProduct?.product_images?.[0]?.url;
                  }
                  const finalImgUrl = imgUrl ? (imgUrl.startsWith("http") ? imgUrl : `${API_BASE_URL}${imgUrl.startsWith('/') ? '' : '/storage/'}${imgUrl}`) : null;

                  return (
                    <div 
                      key={variant.id}
                      onClick={() => !hasPermission && setSelectedVariant(variant)}
                      style={{ 
                        padding: '12px', 
                        borderRadius: '10px', 
                        border: `2px solid ${isSelected && !hasPermission ? 'var(--primary-color)' : 'var(--border-color)'}`, 
                        background: (isSelected && !hasPermission) ? 'var(--primary-color-alpha)' : 'var(--bg-input)', 
                        cursor: hasPermission ? 'default' : 'pointer', 
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '8px'
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {finalImgUrl ? (
                           <img src={finalImgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                         ) : null}
                         {(!finalImgUrl) && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sin IMG</span>}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{attrsText}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: '4px' }}>{variant.sku}</div>
                      
                      <div style={{ fontSize: '12px', color: currentStock > 0 ? 'var(--color-success)' : 'var(--text-muted)', fontWeight: 500 }}>
                        Stock actual: {currentStock}
                      </div>

                      {hasPermission && (
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', width: '100%', marginTop: 'auto' }}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleQtyChange(variant.id, Math.max(0, currentQty - 1)); }}
                            style={{ padding: '6px 10px', background: 'var(--bg-input)', border: 'none', borderRight: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold' }}
                          >-</button>
                          <input
                            type="number"
                            min="0"
                            value={currentQty}
                            onChange={(e) => handleQtyChange(variant.id, parseInt(e.target.value) || 0)}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '100%', padding: '6px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', outline: 'none' }}
                            className="no-spinners"
                          />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleQtyChange(variant.id, currentQty + 1); }}
                            style={{ padding: '6px 10px', background: 'var(--bg-input)', border: 'none', borderLeft: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold' }}
                          >+</button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {(!selectedProduct.product_variants || selectedProduct.product_variants.length === 0) && (
                  <div style={{ gridColumn: '1/-1', padding: '15px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-input)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                    Este producto no tiene variantes registradas. No se puede ingresar stock.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 4: CANTIDAD Y DETALLES */}
          {((hasPermission && selectedProduct) || (!hasPermission && selectedVariant)) && (
            <div style={{ animation: 'fadeIn 0.3s ease', background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'block', marginBottom: '15px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                4. Detalles Adicionales de Recepción
              </label>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {!hasPermission && (
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-main)' }}>Cantidad a Ingresar</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(selectedVariant.id, Math.max(1, (quantities[selectedVariant.id] || 0) - 1))}
                        style={{ padding: '12px 16px', background: 'var(--bg-input)', border: 'none', borderRight: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
                      >-</button>
                      <input
                        type="number"
                        min="1"
                        value={quantities[selectedVariant.id] || 0}
                        onChange={(e) => handleQtyChange(selectedVariant.id, parseInt(e.target.value) || 0)}
                        style={{ width: '100%', padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '16px', fontWeight: 'bold', textAlign: 'center', outline: 'none' }}
                        className="no-spinners"
                      />
                      <button
                        type="button"
                        onClick={() => handleQtyChange(selectedVariant.id, (quantities[selectedVariant.id] || 0) + 1)}
                        style={{ padding: '12px 16px', background: 'var(--bg-input)', border: 'none', borderLeft: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
                      >+</button>
                    </div>
                  </div>
                )}
                <div style={{ flex: '2 1 200px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: 'var(--text-main)' }}>Motivo / Referencia (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Llegada de nuevo lote, devolución..."
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '14px' }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-main)' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !selectedBranchId || (!hasPermission && !selectedVariant) || (hasPermission && !selectedProduct)}
            style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: 'var(--color-primary)', color: 'var(--color-primary-text)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', opacity: (loading || !selectedBranchId || (!hasPermission && !selectedVariant) || (hasPermission && !selectedProduct)) ? 0.5 : 1 }}
          >
            {loading ? "Procesando..." : "Confirmar Ingreso"} <Check size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
