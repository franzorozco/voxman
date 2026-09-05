import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Camera } from 'lucide-react';
import { getCustomers } from '../../../../api/admin/customers';
import { getProducts } from '../../../../api/admin/products';
import { createCart, updateCart } from '../../../../api/admin/carts';
import { toast } from 'react-hot-toast';
import useScanner from '../../../../hooks/useScanner';
import { useScannerStore } from '../../../../store/scanner/useScannerStore';
import './Carts.css';

export default function CartFormModal({ cart, onClose, onSuccess }) {
  const isEditing = !!cart;
  
  const [customers, setCustomers] = useState([]);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(cart?.customer || null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing && cart.items) {
      const initialItems = cart.items.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        product: item.product_variant?.product,
        variant: item.product_variant,
        price: item.override_price !== null && item.override_price !== undefined ? item.override_price : (item.product_variant?.price || 0),
        maxStock: item.product_variant?.inventories?.reduce((sum, inv) => sum + (inv.stock || 0), 0) || 0,
        override_price: item.override_price,
        original_price: item.original_price,
        bundle_group_id: item.bundle_group_id
      }));
      setItems(initialItems);
    }
  }, [cart, isEditing]);

  // Handle Customer Search
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await getCustomers({ search: searchCustomer, per_page: 5 });
        setCustomers(response.data?.data || response.data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchCustomer]);

  // Handle Product Search
  useEffect(() => {
    const fetchProducts = async () => {
      if (!searchProduct.trim()) {
        setProducts([]);
        return;
      }
      try {
        const response = await getProducts({ search: searchProduct, per_page: 5 });
        setProducts(response.data?.data || response.data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchProduct]);

  const openScanner = useScannerStore(state => state.openScanner);

  const processScannedCode = async (scannedText) => {
    const code = scannedText.includes('/p/') ? scannedText.split('/p/').pop().trim() : scannedText.trim();
    if (!code) return;
    
    // First, check if it's already in the local items list to increment
    const existingItem = items.find(item => item.variant?.sku === code || item.variant?.barcode === code);
    if (existingItem) {
       // Get the index and increment using the existing function
       const index = items.findIndex(item => item.variant_id === existingItem.variant_id);
       updateQuantity(index, 1);
       toast.success(`Se sumó 1 unidad de ${existingItem.variant.sku}`);
       return;
    }

    // Second, check loaded products dropdown
    for (const p of products) {
        const v = p.product_variants?.find(v => v.sku === code || v.barcode === code);
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
            const v = p.product_variants?.find(v => v.sku === code || v.barcode === code);
            if (v) {
                handleAddVariant(p, v);
                return;
            }
        }
        
        toast.error("Producto escaneado no encontrado.", { icon: '🔍' });
    } catch (error) {
        console.error("Error scanning product:", error);
        toast.error("Error al buscar producto escaneado.");
    }
  };

  useScanner(processScannedCode, true); // Active whenever the modal is open

  const handleAddVariant = (product, variant) => {
    const totalStock = variant.inventories?.reduce((sum, inv) => sum + (inv.stock || 0), 0) || 0;
    
    if (totalStock <= 0) {
      toast.error("Este producto no tiene stock disponible en ninguna sucursal.");
      return;
    }

    const existingItemIndex = items.findIndex(item => item.variant_id === variant.id);
    if (existingItemIndex >= 0) {
      const currentQty = items[existingItemIndex].quantity;
      if (currentQty + 1 > totalStock) {
        toast.error(`No puedes agregar más. El stock máximo disponible es ${totalStock}.`);
        return;
      }
      const newItems = [...items];
      newItems[existingItemIndex].quantity += 1;
      setItems(newItems);
    } else {
      setItems([...items, {
        variant_id: variant.id,
        quantity: 1,
        product,
        variant,
        price: variant.price,
        maxStock: totalStock
      }]);
    }
    setSearchProduct('');
    setIsProductDropdownOpen(false);
  };

  const updateQuantity = (index, delta) => {
    const newItems = [...items];
    const newQuantity = newItems[index].quantity + delta;
    const maxStock = newItems[index].maxStock || Infinity;

    if (newQuantity > 0) {
      if (newQuantity > maxStock) {
        toast.error(`Stock insuficiente. El máximo disponible es ${maxStock}.`);
        return;
      }
      newItems[index].quantity = newQuantity;
      setItems(newItems);
    }
  };

  const removeItem = (index) => {
    const newItems = [...items];
    const removedItem = newItems[index];
    newItems.splice(index, 1);
    
    // Si era parte de un conjunto, romper el conjunto para los ítems restantes
    if (removedItem.bundle_group_id) {
       newItems.forEach(item => {
           if (item.bundle_group_id === removedItem.bundle_group_id) {
               item.price = item.original_price || item.variant?.price || 0;
               item.override_price = null;
               item.bundle_group_id = null;
           }
       });
    }

    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Debes agregar al menos un producto.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer_id: selectedCustomer?.id || null,
        items: items.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          override_price: item.override_price,
          original_price: item.original_price,
          bundle_group_id: item.bundle_group_id
        }))
      };

      if (isEditing) {
        await updateCart(cart.id, payload);
      } else {
        await createCart(payload);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving cart:', error);
      alert(error.response?.data?.message || "Ocurrió un error al guardar la proforma.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCustomerName = (cust) => {
    if (!cust) return 'Anónimo';
    if (cust.user?.profile) return `${cust.user.profile.first_name} ${cust.user.profile.last_name_paternal || ''}`;
    if (cust.posProfile) return `${cust.posProfile.first_name} ${cust.posProfile.last_name_paternal || ''}`;
    if (cust.pos_profile) return `${cust.pos_profile.first_name} ${cust.pos_profile.last_name_paternal || ''}`;
    return 'Cliente Anónimo';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content cart-form-modal cart-form-modal-container">
        <button className="modal-close" onClick={onClose}><X size={24} /></button>
        
        <h2 className="cart-form-title">{isEditing ? 'Editar Proforma' : 'Nueva Proforma'}</h2>
        
        <form onSubmit={handleSubmit} className="cart-form">
          <div className="form-group cart-form-group">
            <label className="cart-form-label">Cliente</label>
            <div className="dropdown-container cart-form-dropdown-wrapper">
              <input 
                type="text" 
                placeholder="Buscar cliente (dejar vacío para Anónimo)..." 
                value={selectedCustomer ? getCustomerName(selectedCustomer) : searchCustomer}
                onChange={(e) => {
                  setSearchCustomer(e.target.value);
                  setSelectedCustomer(null);
                  setIsCustomerDropdownOpen(true);
                }}
                onFocus={() => setIsCustomerDropdownOpen(true)}
                className="form-control cart-form-input"
              />
              {isCustomerDropdownOpen && customers.length > 0 && !selectedCustomer && (
                <div className="dropdown-menu cart-form-dropdown-menu">
                  {customers.map(cust => (
                    <div 
                      key={cust.id} 
                      className="dropdown-item cart-form-dropdown-item"
                      onClick={() => {
                        setSelectedCustomer(cust);
                        setSearchCustomer(getCustomerName(cust));
                        setIsCustomerDropdownOpen(false);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div style={{ fontWeight: '600' }}>{getCustomerName(cust)}</div>
                      <div style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                        {cust.customer_code && <span style={{ marginRight: '8px' }}>Cód: {cust.customer_code}</span>}
                        {cust.user?.email && <span style={{ marginRight: '8px' }}>✉ {cust.user.email}</span>}
                        {(cust.pos_profile?.phone || cust.user?.profile?.phone) && <span>📞 {cust.pos_profile?.phone || cust.user?.profile?.phone}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedCustomer && (
              <button 
                type="button" 
                className="btn-clear cart-form-clear-btn"
                onClick={() => setSelectedCustomer(null)}
              >
                Limpiar Cliente (Venta Anónima)
              </button>
            )}
          </div>

          <div className="form-group cart-form-group">
            <label className="cart-form-label">Agregar Producto</label>
            <div className="dropdown-container cart-form-dropdown-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => openScanner(processScannedCode, true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s' }}
                title="Escanear código de barras o QR"
              >
                <Camera size={18} />
              </button>
              
              {isProductDropdownOpen && searchProduct && (
                <div className="dropdown-menu cart-form-dropdown-menu" style={{ top: '100%', left: 0, right: 0, marginTop: '8px' }}>
                  {products.length === 0 ? (
                    <div className="dropdown-item cart-form-dropdown-item">No se encontraron productos</div>
                  ) : (
                    products.map(product => (
                      <div key={product.id} className="dropdown-product-group cart-form-dropdown-group">
                        <div className="dropdown-product-name cart-form-group-title">{product.name}</div>
                        {(product.product_variants || product.variants || []).map(variant => (
                          <div 
                            key={variant.id} 
                            className="dropdown-item variant-item cart-form-variant-item"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent input from losing focus if needed
                              handleAddVariant(product, variant);
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>SKU: {variant.sku} - <strong>Bs. {variant.price}</strong></span>
                              <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                                {variant.size?.name && <span style={{ marginRight: '8px' }}>Talla: {variant.size.name}</span>}
                                {variant.fit?.name && <span style={{ marginRight: '8px' }}>Fit: {variant.fit.name}</span>}
                                {variant.variant_attribute_values?.map(attr => (
                                  <span key={attr.id} style={{ marginRight: '8px' }}>
                                    {attr.attribute_value?.attribute?.name}: {attr.attribute_value?.value}
                                  </span>
                                ))}
                              </span>
                              {variant.inventories && variant.inventories.length > 0 && (
                                <div style={{ fontSize: '0.8em', color: 'var(--color-primary)', marginTop: '4px' }}>
                                  <strong>Stock Total: {variant.inventories.reduce((sum, inv) => sum + (inv.stock || 0), 0)}</strong>
                                  <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
                                    ({variant.inventories.filter(inv => inv.stock > 0).map(inv => `${inv.branch?.name}: ${inv.stock}`).join(' | ') || 'Sin stock en sucursales'})
                                  </span>
                                </div>
                              )}
                            </div>
                            <Plus size={16} />
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="cart-items-section cart-form-items-section">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Variante / SKU</th>
                  <th>Precio (Bs)</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th className="cart-form-text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="cart-form-empty-td">
                      No hay productos agregados.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const isBundleItem = item.bundle_group_id !== null && item.bundle_group_id !== undefined;
                    return (
                    <tr key={index} style={isBundleItem ? { backgroundColor: 'var(--bg-hover)' } : {}}>
                      <td className="cart-form-font-bold">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{item.product?.name || 'Producto'}</span>
                          {isBundleItem && (
                            <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '600', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', marginTop: '4px', border: '1px solid #fde68a' }}>
                              ✨ Ítem de Conjunto
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="cart-form-sku-td">
                        SKU: {item.variant?.sku}
                      </td>
                      <td>
                        {isBundleItem ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '12px' }}>
                              Bs. {Number(item.original_price || item.variant?.price || 0).toFixed(2)}
                            </span>
                            <span style={{ color: '#059669', fontWeight: 'bold' }}>
                              Bs. {Number(item.price).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span>{Number(item.price).toFixed(2)}</span>
                        )}
                      </td>
                      <td>
                        <div className="quantity-controls cart-form-quantity-controls">
                          <button type="button" onClick={() => updateQuantity(index, -1)} className="cart-form-qty-btn">-</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(index, 1)} className="cart-form-qty-btn">+</button>
                        </div>
                      </td>
                      <td className="cart-form-font-bold">
                        {(item.price * item.quantity).toFixed(2)}
                      </td>
                      <td className="cart-form-text-center">
                        <button type="button" className="btn-delete cart-form-delete-btn" onClick={() => removeItem(index)}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>

          <div className="cart-form-footer cart-form-footer-box">
            <div className="cart-total-box">
              <h3 className="cart-form-total-title">Total: Bs. {totalAmount.toFixed(2)}</h3>
            </div>
            <div className="form-actions cart-form-actions-box">
              <button type="button" className="btn-secondary cart-form-btn-cancel" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-primary cart-form-btn-save" disabled={isSubmitting || items.length === 0}>
                {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Proforma')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
