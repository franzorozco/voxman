import { useState, useEffect } from "react";
import { getProducts } from "../../../../api/admin/products";
import { getBranches } from "../../../../api/admin/branches";
import { createCart } from "../../../../api/admin/carts";
import { convertToOrder, getDeliveryZones, getDeliveryDrivers, updateOrder } from "../../../../api/admin/orderNetwork";
import { toast } from "react-hot-toast";
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Search, ShoppingCart, Plus, Minus, Trash2, ArrowRight, Camera, X } from "lucide-react";
import useScanner from "../../../../hooks/useScanner";
import { useScannerStore } from "../../../../store/useScannerStore";
import "../Carts/Carts.css";

export default function NewOrderModal({ editData, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Products, 2: Delivery Details
  const [loading, setLoading] = useState(false);
  
  // Step 1 State
  const [searchProduct, setSearchProduct] = useState("");
  const [products, setProducts] = useState([]);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]); // { variant, quantity, price }
  const [branches, setBranches] = useState([]);
  
  // Step 2 State
  const [deliveryData, setDeliveryData] = useState({
    meeting_point: "",
    latitude: null,
    longitude: null,
    shipping_cost: 0,
    scheduled_date: "",
    time_window: "",
    guest_name: "",
    guest_phone: "",
    customer_id: "",
    driver_id: ""
  });
  
  const [meetingPointType, setMeetingPointType] = useState("predefined");
  const [predefinedMeetingPoints, setPredefinedMeetingPoints] = useState([]);
  const [deliveryDrivers, setDeliveryDrivers] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: -17.3895, lng: -66.1568 }); // Cochabamba
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyD2GCanK5Gxm26zDyPrKc7MNy7WhAJZK7M"
  });

  // Public Link to show at the end
  const [generatedLink, setGeneratedLink] = useState(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await getBranches();
        setBranches(data.data || data);
      } catch (error) {
        toast.error("Error al cargar sucursales");
      }
    };
    
    const fetchZones = async () => {
      try {
        const data = await getDeliveryZones();
        setPredefinedMeetingPoints(data.data || data);
      } catch (error) {
        console.error("Error al cargar zonas de entrega");
      }
    };
    
    const fetchDrivers = async () => {
      try {
        const data = await getDeliveryDrivers();
        setDeliveryDrivers(data.data || data);
      } catch (error) {
        console.error("Error al cargar empleados");
      }
    };
    
    fetchBranches();
    fetchZones();
    fetchDrivers();
  }, []);

  // Initialize with editData if provided
  useEffect(() => {
    if (editData && branches.length > 0) {
      const sale = editData.shipment?.sale;
      if (sale && sale.sale_details && cartItems.length === 0) {
        const items = sale.sale_details.map(detail => ({
          variant: detail.product_variant,
          product: detail.product_variant?.product,
          price: Number(detail.unit_price) || detail.product_variant?.price || 0,
          quantity: detail.quantity,
          branch_id: branches[0]?.id // Default to first branch for existing items
        }));
        setCartItems(items);
      }
      
      setDeliveryData({
        meeting_point: editData.meeting_point || "",
        latitude: editData.latitude || null,
        longitude: editData.longitude || null,
        shipping_cost: editData.shipment?.shipping_cost || 0,
        scheduled_date: editData.scheduled_date || "",
        time_window: editData.time_window || "",
        guest_name: sale?.guest?.name || "",
        guest_phone: sale?.guest?.whatsapp_phone || "",
        customer_id: sale?.customer_id || "",
        driver_id: editData.driver_id || ""
      });
      
      if (editData.latitude && editData.longitude) {
        setMapCenter({ lat: Number(editData.latitude), lng: Number(editData.longitude) });
      }
    }
  }, [editData, branches]);

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
    const existingItem = cartItems.find(item => item.variant?.sku === code || item.variant?.barcode === code);
    if (existingItem) {
       updateQuantity(existingItem.variant.id, 1);
       toast.success(`Se sumó 1 unidad de ${existingItem.variant.sku}`);
       return;
    }

    // Second, check loaded products dropdown
    for (const p of products) {
        const v = (p.product_variants || p.variants || []).find(v => v.sku === code || v.barcode === code);
        if (v) {
            addItem(v, p);
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
                addItem(v, p);
                return;
            }
        }
        
        toast.error("Producto escaneado no encontrado.", { icon: '🔍' });
    } catch (error) {
        console.error("Error scanning product:", error);
        toast.error("Error al buscar producto escaneado.");
    }
  };

  // Only activate scanner when on step 1
  useScanner(processScannedCode, step === 1);

  const addItem = (variant, product) => {
    const totalStock = parseInt(variant.inventories?.reduce((sum, inv) => sum + parseInt(inv.stock || inv.quantity || 0, 10), 0) || 0, 10);
    
    if (totalStock <= 0) {
      toast.error("Este producto no tiene stock disponible en ninguna sucursal.");
      return;
    }

    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.variant.id === variant.id);
      if (existingItemIndex >= 0) {
        const item = prev[existingItemIndex];
        const currentQty = parseInt(item.quantity, 10);
        
        const branchInventory = item.branch_id 
          ? item.variant.inventories?.find(inv => inv.branch_id === item.branch_id || inv.branch?.id === item.branch_id)
          : null;
        
        const currentMaxStock = branchInventory 
          ? parseInt(branchInventory.stock || branchInventory.quantity || 0, 10)
          : totalStock;

        if (currentQty + 1 > currentMaxStock) {
          toast.error(`No puedes agregar más. El stock máximo disponible es ${currentMaxStock}.`);
          return prev;
        }
        
        const newItems = [...prev];
        newItems[existingItemIndex] = { ...item, quantity: currentQty + 1 };
        return newItems;
      }
      
      // Try to auto-select a branch if only one has stock
      const availableBranches = variant.inventories?.filter(inv => parseInt(inv.stock || inv.quantity || 0, 10) >= 1) || [];
      const autoBranchId = availableBranches.length === 1 ? availableBranches[0].branch?.id : null;

      return [...prev, { variant, product, quantity: 1, price: variant.price, maxStock: totalStock, branch_id: autoBranchId }];
    });

    setSearchProduct('');
    setIsProductDropdownOpen(false);
  };

  const updateQuantity = (variantId, delta) => {
    setCartItems(prev => {
      const index = prev.findIndex(item => item.variant.id === variantId);
      if (index === -1) return prev;
      
      const item = prev[index];
      const newQuantity = parseInt(item.quantity, 10) + parseInt(delta, 10);
      
      if (newQuantity > 0) {
        const branchInventory = item.branch_id 
          ? item.variant.inventories?.find(inv => inv.branch_id === item.branch_id || inv.branch?.id === item.branch_id)
          : null;
        
        const currentMaxStock = branchInventory 
          ? parseInt(branchInventory.stock || branchInventory.quantity || 0, 10)
          : parseInt(item.maxStock, 10);

        if (newQuantity > currentMaxStock) {
          toast.error(`Stock insuficiente. El máximo disponible es ${currentMaxStock}.`);
          return prev;
        }
        
        const newItems = [...prev];
        newItems[index] = { ...item, quantity: newQuantity };
        return newItems;
      }
      return prev;
    });
  };

  const updateItemBranch = (variantId, branchId) => {
    setCartItems(prev => prev.map(item => 
      item.variant.id === variantId ? { ...item, branch_id: branchId } : item
    ));
  };

  const removeItem = (variantId) => {
    setCartItems(prev => prev.filter(item => item.variant.id !== variantId));
  };

  const handleAddVariant = (product, variant) => {
    addItem(variant, product);
  };

  const subtotalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingAmount = Number(deliveryData.shipping_cost || 0);
  const totalAmount = subtotalAmount + shippingAmount;

  const handleNextStep = () => {
    if (cartItems.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    
    // Validate that every item has a branch selected
    const missingBranch = cartItems.find(item => !item.branch_id);
    if (missingBranch) {
      toast.error(`Selecciona la sucursal de origen para: ${missingBranch.product.name}`);
      return;
    }
    
    setStep(2);
  };

  const handleSubmit = async (e, isDraft = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      if (editData) {
        const updatePayload = {
          items: cartItems.map(item => ({
            variant_id: item.variant.id,
            quantity: item.quantity,
            branch_id: item.branch_id
          })),
          meeting_point: deliveryData.meeting_point,
          scheduled_date: deliveryData.scheduled_date,
          time_window: deliveryData.time_window,
          latitude: deliveryData.latitude,
          longitude: deliveryData.longitude,
          shipping_cost: deliveryData.shipping_cost,
          driver_id: deliveryData.driver_id,
          guest_name: deliveryData.guest_name,
          guest_phone: deliveryData.guest_phone,
        };
        await updateOrder(editData.id, updatePayload);
        toast.success("Entrega actualizada correctamente");
        onSuccess();
        onClose();
        return;
      }

      // Create Cart
      const cartPayload = {
        source: 'order_network',
        items: cartItems.map(item => ({
          variant_id: item.variant.id,
          quantity: item.quantity
        }))
      };
      
      const cartRes = await createCart(cartPayload);
      const cartId = cartRes.data?.cart?.id || cartRes.cart?.id;

      if (!cartId) throw new Error("No se pudo crear la proforma base");

      // Use the first item's branch as the primary branch for the Sale record
      const primaryBranchId = cartItems[0]?.branch_id;

      // Convert to Order Network
      const orderPayload = {
        cart_id: cartId,
        branch_id: primaryBranchId,
        items_branches: cartItems.map(item => ({
          variant_id: item.variant.id,
          branch_id: item.branch_id
        })),
        meeting_point: deliveryData.meeting_point,
        scheduled_date: deliveryData.scheduled_date,
        time_window: deliveryData.time_window,
        latitude: deliveryData.latitude,
        longitude: deliveryData.longitude,
        shipping_cost: deliveryData.shipping_cost,
      };
      
      if (deliveryData.driver_id) orderPayload.driver_id = deliveryData.driver_id;
      if (deliveryData.guest_name) orderPayload.guest_name = deliveryData.guest_name;
      if (deliveryData.guest_phone) orderPayload.guest_phone = deliveryData.guest_phone;
      if (deliveryData.customer_id) orderPayload.customer_id = deliveryData.customer_id;
      
      const orderRes = await convertToOrder({ ...orderPayload, save_as_draft: isDraft });
      const scheduleId = orderRes.data.schedule_id;
      
      toast.success(isDraft ? "Borrador guardado correctamente" : "Entrega agendada correctamente");
      
      // Generate Public URL
      const publicUrl = `${window.location.origin}/tracking/${scheduleId}`;
      setGeneratedLink(publicUrl);
      setStep(3);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "Error al procesar la orden");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success("Enlace copiado al portapapeles");
  };

  if (generatedLink) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
          <h2 style={{ color: 'var(--color-success)', marginBottom: '16px' }}>¡Entrega Agendada!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Comparte este enlace con el cliente para que pueda hacer seguimiento de su pedido.</p>
          
          <input 
            type="text" 
            readOnly 
            value={generatedLink} 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--color-primary)', textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}
          />
          
          <button className="action-btn primary" style={{ width: '100%', marginBottom: '12px', padding: '12px' }} onClick={copyLink}>
            Copiar Enlace
          </button>
          
          <button className="btn-cancel" style={{ width: '100%', padding: '12px' }} onClick={() => { onClose(); onSuccess(); }}>
            Finalizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px', height: '85vh', overflow: 'visible' }}>
        <div className="modal-header">
          <h2>Nueva Entrega (Redes Sociales)</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', gap: '24px', padding: '24px' }}>
          
          {/* LEFT SIDE: Products or Form depending on Step */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {step === 1 ? (
              <>
                <div className="form-group cart-form-group">
                  <label className="cart-form-label">Buscar y Agregar Producto</label>
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
                      <div className="dropdown-menu cart-form-dropdown-menu" style={{ top: '100%', left: 0, right: 0, marginTop: '8px', zIndex: 100 }}>
                        {products.length === 0 ? (
                          <div className="dropdown-item cart-form-dropdown-item">No se encontraron productos</div>
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
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span>SKU: {variant.sku} - <strong>Bs. {variant.price}</strong></span>
                                      <span style={{ fontSize: '0.85em', color: 'var(--text-muted)' }}>
                                        {variant.size?.name && <span style={{ marginRight: '8px' }}>Talla: {variant.size.name}</span>}
                                        {variant.fit?.name && <span style={{ marginRight: '8px' }}>Fit: {variant.fit.name}</span>}
                                        {variant.variant_attribute_values?.map((attr, idx) => (
                                          <span key={idx} style={{ marginRight: '8px' }}>
                                            {attr.attribute_value?.attribute?.name}: {attr.attribute_value?.value}
                                          </span>
                                        ))}
                                      </span>
                                      {variant.inventories && variant.inventories.length > 0 && (
                                        <div style={{ fontSize: '0.8em', color: 'var(--color-primary)', marginTop: '4px' }}>
                                          <strong>Stock Total: {totalStock}</strong>
                                          <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>
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
              </>
            ) : (
              <form id="delivery-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Datos de Logística</h3>
                {step === 2 ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                      <div className="form-group">
                        <label>Punto de Encuentro / Dirección *</label>
                        <div className="meeting-point-type-selector" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <button 
                            type="button" 
                            className={`type-btn ${meetingPointType === 'predefined' ? 'active' : ''}`}
                            onClick={() => {
                              setMeetingPointType('predefined');
                              setDeliveryData({...deliveryData, meeting_point: "", latitude: null, longitude: null, shipping_cost: 0});
                            }}
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: meetingPointType === 'predefined' ? 'var(--color-primary)' : 'var(--bg-card)', color: meetingPointType === 'predefined' ? 'var(--color-primary-text)' : 'var(--text-main)', cursor: 'pointer', transition: '0.2s' }}
                          >
                            Seleccionar
                          </button>
                          <button 
                            type="button" 
                            className={`type-btn ${meetingPointType === 'manual' ? 'active' : ''}`}
                            onClick={() => {
                              setMeetingPointType('manual');
                              setDeliveryData({...deliveryData, meeting_point: "", latitude: null, longitude: null, shipping_cost: 0});
                            }}
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: meetingPointType === 'manual' ? 'var(--color-primary)' : 'var(--bg-card)', color: meetingPointType === 'manual' ? 'var(--color-primary-text)' : 'var(--text-main)', cursor: 'pointer', transition: '0.2s' }}
                          >
                            Manual (Mapa)
                          </button>
                        </div>
                        
                        {meetingPointType === 'predefined' ? (
                          <select 
                            required
                            className="form-control"
                            value={deliveryData.meeting_point}
                            onChange={(e) => {
                              const selectedName = e.target.value;
                              const zone = predefinedMeetingPoints.find(z => z.name === selectedName);
                              setDeliveryData({
                                ...deliveryData, 
                                meeting_point: selectedName,
                                latitude: zone?.latitude || null,
                                longitude: zone?.longitude || null,
                                shipping_cost: zone ? Number(zone.base_cost) : 0
                              });
                            }}
                          >
                            <option value="">-- Selecciona un punto de encuentro --</option>
                            {predefinedMeetingPoints.map(point => (
                              <option key={point.id} value={point.name}>
                                {point.name} {point.city ? `(${point.city})` : ''} - Bs. {Number(point.base_cost).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="manual-location-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input 
                              type="text" 
                              required
                              className="form-control"
                              placeholder="Ej: Casa de Pedro (Av. América #123)"
                              value={deliveryData.meeting_point}
                              onChange={(e) => setDeliveryData({...deliveryData, meeting_point: e.target.value})}
                            />
                            
                            <div className="map-container" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                              {isLoaded ? (
                                <GoogleMap
                                  mapContainerStyle={{ width: '100%', height: '300px' }}
                                  center={deliveryData.latitude && deliveryData.longitude ? { lat: Number(deliveryData.latitude), lng: Number(deliveryData.longitude) } : mapCenter}
                                  zoom={13}
                                  onClick={(e) => {
                                    setDeliveryData({
                                      ...deliveryData,
                                      latitude: e.latLng.lat(),
                                      longitude: e.latLng.lng()
                                    });
                                  }}
                                >
                                  {deliveryData.latitude && deliveryData.longitude && (
                                    <MarkerF position={{ lat: Number(deliveryData.latitude), lng: Number(deliveryData.longitude) }} />
                                  )}
                                </GoogleMap>
                              ) : (
                                <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando mapa...</div>
                              )}
                            </div>
                            <small style={{ color: 'var(--text-muted)' }}>
                              * Haz clic en el mapa para marcar el punto exacto de entrega. 
                              {deliveryData.latitude && ` (Lat: ${Number(deliveryData.latitude).toFixed(5)}, Lng: ${Number(deliveryData.longitude).toFixed(5)})`}
                            </small>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Encargado de la Entrega (Opcional)</label>
                          <select 
                            className="form-control"
                            value={deliveryData.driver_id}
                            onChange={(e) => setDeliveryData({...deliveryData, driver_id: e.target.value})}
                          >
                            <option value="">-- Sin asignar --</option>
                            {deliveryDrivers.map(employee => (
                              <option key={employee.id} value={employee.id}>
                                {employee.user?.profile?.first_name} {employee.user?.profile?.last_name_paternal} - Cod: {employee.employee_code} - Tel: {employee.phone}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Nombre del Cliente *</label>
                          <input type="text" required className="form-control" value={deliveryData.guest_name} onChange={(e) => setDeliveryData({...deliveryData, guest_name: e.target.value})} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>WhatsApp *</label>
                          <input type="text" required className="form-control" value={deliveryData.guest_phone} onChange={(e) => setDeliveryData({...deliveryData, guest_phone: e.target.value})} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Fecha de Entrega *</label>
                          <input type="date" required className="form-control" value={deliveryData.scheduled_date} onChange={(e) => setDeliveryData({...deliveryData, scheduled_date: e.target.value})} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Hora *</label>
                          <input type="time" required className="form-control" value={deliveryData.time_window} onChange={(e) => setDeliveryData({...deliveryData, time_window: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </form>
            )}
          </div>

          {/* RIGHT SIDE: Cart Summary */}
          <div style={{ flex: 1, background: 'var(--bg-overlay)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={20} /> Resumen
            </h3>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                  El carrito está vacío
                </div>
              ) : (
                cartItems.map(item => {
                  const availableBranches = item.variant.inventories?.filter(inv => parseInt(inv.stock || inv.quantity || 0, 10) >= parseInt(item.quantity, 10)) || [];
                  return (
                    <div key={item.variant.id} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, fontSize: '14px' }}>{item.product.name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.variant.sku} x {item.quantity}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Bs. {(item.price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeItem(item.variant.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Extraer stock de:</label>
                        <select 
                          className="form-control" 
                          style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '6px' }}
                          value={item.branch_id || ''}
                          onChange={(e) => updateItemBranch(item.variant.id, e.target.value)}
                        >
                          <option value="">Seleccionar sucursal...</option>
                          {availableBranches.map(inv => (
                            <option key={inv.branch?.id} value={inv.branch?.id}>
                              {inv.branch?.name} (Stock: {inv.stock || inv.quantity})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', borderRadius: '6px', padding: '4px', alignSelf: 'flex-start', marginTop: '8px' }}>
                        <button onClick={() => updateQuantity(item.variant.id, -1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}><Minus size={14} /></button>
                        <span style={{ fontSize: '14px', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.variant.id, 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}><Plus size={14} /></button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)' }}>
                  <span>Subtotal:</span>
                  <span>Bs. {subtotalAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)' }}>
                  <span>Costo de Envío:</span>
                  <span>Bs. {shippingAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
                  <span>Total:</span>
                  <span style={{ color: 'var(--color-primary)' }}>Bs. {totalAmount.toFixed(2)}</span>
                </div>
              </div>
              
              {step === 1 ? (
                <button 
                  className="action-btn primary" 
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: cartItems.length === 0 ? 0.5 : 1, cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer', border: 'none', background: 'var(--color-primary)', color: 'var(--color-primary-text)' }}
                  onClick={handleNextStep}
                  disabled={cartItems.length === 0}
                >
                  Continuar <ArrowRight size={18} />
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    type="submit"
                    form="delivery-form"
                    className="action-btn success" 
                    style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                    disabled={loading}
                  >
                    {loading ? "Procesando..." : (editData ? "Guardar Cambios" : "Finalizar Entrega")}
                  </button>
                  <button 
                    type="button"
                    className="btn-cancel" 
                    style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Volver al Carrito
                  </button>
                  {!editData && (
                    <button 
                      type="button"
                      className="btn-cancel" 
                      style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px', border: '1px dashed var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                      onClick={() => handleSubmit(null, true)}
                      disabled={loading}
                    >
                      Guardar como Borrador
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
