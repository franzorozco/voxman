import { useState, useEffect } from "react";
import { X, Camera, Plus } from "lucide-react";
import { getProducts } from "../../../../../api/admin/products";
import useScanner from "../../../../../hooks/useScanner";
import { useScannerStore } from "../../../../../store/useScannerStore";
import { API_BASE_URL } from "../../../../../config/api";
import CustomSelect from "../../../../../components/ui/CustomSelect";
import "../../Carts/Carts.css";

export default function AddProductToDeliveryModal({ onClose, onAddProduct }) {
  const [searchProduct, setSearchProduct] = useState("");
  const [products, setProducts] = useState([]);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  
  const openScanner = useScannerStore(state => state.openScanner);
  
  const processScannedCode = async (scannedText) => {
    const code = scannedText.includes('/p/') ? scannedText.split('/p/').pop().trim() : scannedText.trim();
    if (!code) return;
    
    // Check loaded products dropdown
    for (const p of products) {
        const v = (p.product_variants || p.variants || []).find(v => v.sku === code || v.barcode === code);
        if (v) {
            handleAddVariant(p, v);
            return;
        }
    }
    
    // If not found locally, fetch from backend
    try {
        const response = await getProducts({ search: code, per_page: 5 });
        const fetchedProducts = response.data?.data || response.data || [];
        
        for (const p of fetchedProducts) {
            const v = (p.product_variants || p.variants || []).find(v => v.sku === code || v.barcode === code);
            if (v) {
                handleAddVariant(p, v);
                return;
            }
        }
        
        console.error("Producto escaneado no encontrado.");
    } catch (error) {
        console.error("Error al buscar producto escaneado:", error);
    }
  };

  useScanner(processScannedCode, true);

  // Handle Product Search
  useEffect(() => {
    const fetchProducts = async () => {
      if (!searchProduct.trim()) {
        setProducts([]);
        setIsSearchingProduct(false);
        return;
      }
      setIsSearchingProduct(true);
      try {
        const response = await getProducts({ search: searchProduct, per_page: 5 });
        setProducts(response.data?.data || response.data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsSearchingProduct(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchProduct]);

  const handleAddVariant = (product, variant) => {
    setIsProductDropdownOpen(false);
    setSearchProduct("");
    setSelectedVariant(variant);
    
    const branchesWithStock = variant.inventories?.filter(inv => (inv.stock || inv.quantity) > 0) || [];
    if (branchesWithStock.length === 1) {
        setSelectedBranchId(branchesWithStock[0].branch_id);
    } else {
        setSelectedBranchId("");
    }
  };

  const handleConfirmAdd = () => {
    if (!selectedBranchId) return;
    onAddProduct(selectedVariant, selectedBranchId);
  };

  const getProductImage = (product, variant = null) => {
    let imageUrl = null;
    if (variant && variant.variant_images && variant.variant_images.length > 0) {
      imageUrl = variant.variant_images[0].url || `/storage/${variant.variant_images[0].image_path}`;
    } else if (product.product_images && product.product_images.length > 0) {
      const mainImage = product.product_images.find(img => img.is_main) || product.product_images[0];
      imageUrl = mainImage.url || `/storage/${mainImage.image_path}`;
    }
    
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || import.meta.env.VITE_API_URL?.replace('/api', '') || API_BASE_URL}${imageUrl}`;
    }
    return imageUrl;
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '450px', width: '95%', margin: '0 auto', background: 'var(--bg-card)', borderRadius: '12px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Agregar Producto</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          
          {!selectedVariant ? (
            <div className="form-group cart-form-group">
              <label className="cart-form-label">Buscar y Agregar Producto</label>
              <div className="dropdown-container cart-form-dropdown-wrapper" style={{ marginBottom: isProductDropdownOpen ? '350px' : '0' }}>
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o SKU..."
                  value={searchProduct}
                  onChange={(e) => {
                    setSearchProduct(e.target.value);
                    setIsProductDropdownOpen(true);
                  }}
                  onFocus={() => setIsProductDropdownOpen(true)}
                  className="form-control cart-form-input"
                />
                <button
                  type="button"
                  onClick={() => openScanner(processScannedCode, true)}
                  className="scanner-btn"
                  title="Escanear código de barras o QR"
                >
                  <Camera size={18} />
                </button>
                
                {isProductDropdownOpen && searchProduct && (
                  <div className="dropdown-menu cart-form-dropdown-menu" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {isSearchingProduct ? (
                      <div className="dropdown-item cart-form-dropdown-item">
                        Buscando productos...
                      </div>
                    ) : products.length === 0 ? (
                      <div className="dropdown-item cart-form-dropdown-item">
                        No se encontraron productos
                      </div>
                    ) : (
                      products.map(product => (
                        <div key={product.id} className="dropdown-product-group cart-form-dropdown-group">
                          <div className="dropdown-product-name cart-form-group-title">{product.name}</div>
                          {(product.product_variants || product.variants || []).map(variant => {
                            const totalStock = variant.inventories?.reduce((sum, inv) => sum + parseInt(inv.stock || inv.quantity || 0, 10), 0) || 0;
                            return (
                              <div 
                                key={variant.id} 
                                className="dropdown-item variant-item cart-form-variant-item"
                                onMouseDown={(e) => {
                                  e.preventDefault(); 
                                  handleAddVariant(product, variant);
                                }}
                              >
                                <div className="variant-info">
                                  <span>SKU: {variant.sku} - <strong>Bs. {variant.price || product.base_price}</strong></span>
                                  <span className="variant-details">
                                    {variant.size?.name && <span style={{ marginRight: '8px' }}>Talla: {variant.size.name}</span>}
                                    {variant.fit?.name && <span style={{ marginRight: '8px' }}>Fit: {variant.fit.name}</span>}
                                    {variant.variant_attribute_values?.map((attr, idx) => (
                                      <span key={idx} style={{ marginRight: '8px' }}>
                                        {attr.attribute_value?.attribute?.name}: {attr.attribute_value?.value}
                                      </span>
                                    ))}
                                  </span>
                                  {variant.inventories && variant.inventories.length > 0 && (
                                    <div className="variant-stock">
                                      <strong>Stock Total: {totalStock}</strong>
                                      <span>
                                        ({variant.inventories.filter(inv => (inv.stock || inv.quantity) > 0).map(inv => `${inv.branch?.name}: ${inv.stock || inv.quantity}`).join(' | ') || 'Sin stock en sucursales'})
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <Plus size={16} />
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Producto Seleccionado</h4>
                <div style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '4px' }}>
                  <strong>SKU:</strong> {selectedVariant.sku}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '4px' }}>
                  <strong>Detalles:</strong> {selectedVariant.size?.name && `Talla: ${selectedVariant.size.name} `} 
                  {selectedVariant.variant_attribute_values?.map(attr => `${attr.attribute_value?.attribute?.name}: ${attr.attribute_value?.value}`).join(' ')}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>
                  Bs. {selectedVariant.price}
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                  Extraer stock de:
                </label>
                <CustomSelect 
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '6px' }}
                >
                  <option value="">Seleccionar sucursal...</option>
                  {(selectedVariant.inventories || []).filter(inv => (inv.stock || inv.quantity) > 0).map(inv => (
                    <option key={inv.branch?.id || inv.branch_id} value={inv.branch?.id || inv.branch_id}>
                      {inv.branch?.name} (Stock: {inv.stock || inv.quantity})
                    </option>
                  ))}
                </CustomSelect>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedVariant(null)}
                  style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                >
                  Volver
                </button>
                <button 
                  type="button" 
                  onClick={handleConfirmAdd}
                  disabled={!selectedBranchId}
                  style={{ padding: '10px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: selectedBranchId ? 'pointer' : 'not-allowed', opacity: selectedBranchId ? 1 : 0.6, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Confirmar y Agregar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
