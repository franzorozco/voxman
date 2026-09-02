import { useState, useEffect } from "react";
import { getProducts } from "../../../../api/admin/products";
import { getBranches } from "../../../../api/admin/branches";
import { createCart } from "../../../../api/admin/carts";
import { convertToOrder, getDeliveryZones, getDeliveryDrivers, updateOrder, getHistoricalDestinations, updateDeliveryStatus } from "../../../../api/admin/orderNetwork";
import { getCustomers } from "../../../../api/admin/customers";
import { toast } from "react-hot-toast";
import { MarkerF } from '@react-google-maps/api';
import GoogleMapWrapper from '../../../../components/ui/GoogleMapWrapper';
import { Search, ShoppingCart, Plus, Minus, Trash2, ArrowRight, Camera, X, XCircle, MapPin, Map, User, UserCheck, CheckCircle2 } from "lucide-react";
import useScanner from "../../../../hooks/useScanner";
import { useScannerStore } from "../../../../store/scanner/useScannerStore";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";
import "../Carts/Carts.css";

import CustomSelect from '../../../../components/ui/CustomSelect';
import CanAccess from '../../../../components/ui/CanAccess';
export default function NewOrderModal({ editData, mode = "create", onClose, onSuccess }) {
  const settings = useShopSettingsStore(state => state.settings);
  const fetchSettings = useShopSettingsStore(state => state.fetchSettings);

  const [step, setStep] = useState(1); // 1: Products, 2: Delivery Details
  const [loading, setLoading] = useState(false);
  
  // Step 1 State
  const [searchProduct, setSearchProduct] = useState("");
  const [products, setProducts] = useState([]);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]); // { variant, quantity, price }
  const [branches, setBranches] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  const getDefaultDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getDefaultTime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Step 2 State
  const [deliveryData, setDeliveryData] = useState({
    meeting_point: "",
    city: "",
    original_delivery_zone_id: "",
    latitude: null,
    longitude: null,
    shipping_cost: 0,
    scheduled_date: getDefaultDate(),
    time_window: getDefaultTime(),
    guest_name: "",
    guest_country_code: "+591",
    guest_phone: "",
    customer_id: "",
    driver_id: "",
    delivery_type: "scheduled_point",
    pickup_branch_id: "",
    address_id: "",
    recipient_name: "",
    recipient_ci: "",
    recipient_phone: "",
    destination_city: ""
  });
  
  const [meetingPointType, setMeetingPointType] = useState("predefined");
  const [predefinedMeetingPoints, setPredefinedMeetingPoints] = useState([]);
  const [deliveryDrivers, setDeliveryDrivers] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: -16.4897, lng: -68.1193 }); // La Paz default
  
  // Customer Search State
  const [customerSearchType, setCustomerSearchType] = useState("guest"); // "guest" | "registered"
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customersList, setCustomersList] = useState([]);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Driver Search State
  const [driverSearchQuery, setDriverSearchQuery] = useState("");
  const [isDriverDropdownOpen, setIsDriverDropdownOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  
  // Loading States
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isSearchingDriver, setIsSearchingDriver] = useState(false);
  const [historicalDestinations, setHistoricalDestinations] = useState([]);
  const [isDestinationsDropdownOpen, setIsDestinationsDropdownOpen] = useState(false);
  


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
        const zones = data.data || data;
        setPredefinedMeetingPoints(zones);
        
        if (editData && editData.meeting_point) {
           const zone = zones.find(z => z.name === editData.meeting_point);
           if (zone) {
             setDeliveryData(prev => ({
               ...prev,
               city: prev.city || zone.city,
               original_delivery_zone_id: prev.original_delivery_zone_id || zone.id,
               latitude: prev.latitude || zone.latitude,
               longitude: prev.longitude || zone.longitude,
               shipping_cost: prev.shipping_cost || Number(zone.base_cost)
             }));
           }
        }
      } catch (error) {
        console.error("Error al cargar zonas de entrega");
      }
    };
    
    fetchBranches();
    fetchZones();
    fetchSettings(true);
  }, []);

  // Initialize with editData if provided
  useEffect(() => {
    if (editData && branches.length > 0) {
      const sale = editData.shipment?.sale;
      if (sale && sale.sale_details && cartItems.length === 0) {
        const activeDetails = sale.sale_details.filter(d => !d.deleted_at);
        const items = activeDetails.map(detail => {
          const reservation = sale.stock_reservations?.find(res => res.variant_id === detail.variant_id && res.status !== 'released');
          
          let autoBranchId = "";
          if (reservation) {
            autoBranchId = reservation.branch_id;
          } else if (detail.product_variant?.inventories?.length > 0) {
            const sortedInvs = [...detail.product_variant.inventories].sort((a, b) => 
              parseInt(b.stock || b.quantity || 0, 10) - parseInt(a.stock || a.quantity || 0, 10)
            );
            autoBranchId = sortedInvs[0].branch_id || sortedInvs[0].branch?.id || "";
          }

          return {
            _id: Date.now().toString() + Math.random(),
            variant: detail.product_variant,
            product: detail.product_variant?.product,
            price: Number(detail.unit_price) || detail.product_variant?.price || 0,
            quantity: detail.quantity,
            maxStock: detail.product_variant?.inventories?.reduce((sum, inv) => sum + parseInt(inv.stock || inv.quantity || 0, 10), 0) || 0,
            branch_id: autoBranchId
          };
        });
        setCartItems(items);
      }
      
        let p_code = "+591";
        let p_num = sale?.guest?.whatsapp_phone || "";
        if (p_num.startsWith("+") && p_num.includes(" ")) {
          const parts = p_num.split(" ");
          p_code = parts[0];
          p_num = parts.slice(1).join(" ");
        }

        let initialMeetingPointType = 'predefined';
        const dType = editData.shipment?.delivery_type;
        if (dType === 'home_delivery') initialMeetingPointType = 'delivery';
        else if (dType === 'external') initialMeetingPointType = 'external';
        else if (!editData.meeting_point && !editData.latitude && !editData.longitude) initialMeetingPointType = 'predefined';
        else if (editData.latitude && editData.longitude && dType !== 'home_delivery') initialMeetingPointType = 'manual';
        
        setMeetingPointType(initialMeetingPointType);

        setDeliveryData({
          meeting_point: editData.meeting_point || "",
          latitude: editData.latitude || null,
          longitude: editData.longitude || null,
          shipping_cost: editData.shipment?.shipping_cost || 0,
          scheduled_date: editData.scheduled_date || "",
          time_window: editData.time_window || "",
          guest_name: sale?.guest?.name || "",
          guest_country_code: p_code,
          guest_phone: p_num,
          customer_id: sale?.customer_id || "",
          driver_id: editData.driver_id || "",
          delivery_type: dType || "scheduled_point",
          address_id: editData.shipment?.address_id || "",
          pickup_branch_id: editData.shipment?.pickup_branch_id || "",
          recipient_name: editData.shipment?.recipient_name || "",
          recipient_ci: editData.shipment?.recipient_ci || "",
          recipient_phone: editData.shipment?.recipient_phone || "",
          destination_city: editData.shipment?.destination_city || ""
        });
        
        if (editData.driver_id && editData.driver) {
          const d = editData.driver;
          const name = d.user?.profile ? `${d.user.profile.first_name} ${d.user.profile.last_name_paternal || ''}` : (d.user?.username || d.employee_code || "Repartidor");
          setSelectedDriver({ id: d.id, name: name.trim() });
          setDriverSearchQuery(name.trim());
        }
      
      if (sale?.customer_id) {
        setCustomerSearchType("registered");
        if (sale.customer) {
          const c = sale.customer;
          const name = c.pos_profile ? `${c.pos_profile.first_name} ${c.pos_profile.last_name_paternal || ''}` :
                      (c.user?.profile ? `${c.user.profile.first_name} ${c.user.profile.last_name_paternal || ''}` : 
                      (c.user?.username || c.customer_code));
          setSelectedCustomer({ id: c.id, name: name.trim(), addresses: c.addresses || [] });
          setCustomerSearchQuery(name.trim());
        }
      } else {
        setCustomerSearchType("guest");
      }
      
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

  // Handle Customer Search
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!customerSearchQuery.trim()) {
        setCustomersList([]);
        setIsSearchingCustomer(false);
        return;
      }
      setIsSearchingCustomer(true);
      try {
        const response = await getCustomers({ search: customerSearchQuery });
        setCustomersList(response.data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setIsSearchingCustomer(false);
      }
    };
    
    if (customerSearchType === 'registered' && !selectedCustomer) {
      const timeoutId = setTimeout(() => {
        fetchCustomers();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [customerSearchQuery, customerSearchType, selectedCustomer]);

  // Handle Driver Search
  useEffect(() => {
    const fetchDrivers = async () => {
      if (!driverSearchQuery.trim()) {
        setDeliveryDrivers([]);
        setIsSearchingDriver(false);
        return;
      }
      setIsSearchingDriver(true);
      try {
        const params = { search: driverSearchQuery };
        if (meetingPointType === 'pickup' && deliveryData.pickup_branch_id) {
          params.branch_id = deliveryData.pickup_branch_id;
        }
        const response = await getDeliveryDrivers(params);
        setDeliveryDrivers(response.data || []);
      } catch (error) {
        console.error('Error fetching drivers:', error);
      } finally {
        setIsSearchingDriver(false);
      }
    };
    
    if (!selectedDriver) {
      const timeoutId = setTimeout(() => {
        fetchDrivers();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [driverSearchQuery, selectedDriver, meetingPointType, deliveryData.pickup_branch_id]);

  // Fetch Historical Destinations
  useEffect(() => {
    if (meetingPointType === 'external') {
      const params = {};
      if (customerSearchType === 'registered' && selectedCustomer) {
        params.customer_id = selectedCustomer.id;
      } else if (customerSearchType === 'guest' && deliveryData.guest_phone) {
        params.guest_phone = deliveryData.guest_phone;
      }
      
      if (params.customer_id || (params.guest_phone && params.guest_phone.length > 5)) {
        getHistoricalDestinations(params).then(res => {
          setHistoricalDestinations(res.data || res || []);
        }).catch(err => console.error("Error fetching destinations:", err));
      } else {
        setHistoricalDestinations([]);
      }
    }
  }, [meetingPointType, customerSearchType, selectedCustomer, deliveryData.guest_phone]);

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
      // Find a row for this variant that can accept +1 quantity (has stock available)
      const existingItemIndex = prev.findIndex(item => {
        if (item.variant.id !== variant.id) return false;
        const currentQty = parseInt(item.quantity, 10);
        const branchInventory = item.branch_id 
          ? item.variant.inventories?.find(inv => inv.branch_id === item.branch_id || inv.branch?.id === item.branch_id)
          : null;
        const currentMaxStock = branchInventory 
          ? parseInt(branchInventory.stock || branchInventory.quantity || 0, 10)
          : totalStock;
        return currentQty + 1 <= currentMaxStock;
      });

      if (existingItemIndex >= 0) {
        const item = prev[existingItemIndex];
        const newItems = [...prev];
        newItems[existingItemIndex] = { ...item, quantity: parseInt(item.quantity, 10) + 1 };
        return newItems;
      }
      
      const availableBranches = variant.inventories?.filter(inv => parseInt(inv.stock || inv.quantity || 0, 10) >= 1) || [];
      let autoBranchId = null;
      if (availableBranches.length > 0) {
        const sortedBranches = [...availableBranches].sort((a, b) => 
          parseInt(b.stock || b.quantity || 0, 10) - parseInt(a.stock || a.quantity || 0, 10)
        );
        autoBranchId = sortedBranches[0].branch_id || sortedBranches[0].branch?.id || null;
      }

      return [...prev, { _id: Date.now().toString() + Math.random(), variant, product, quantity: 1, price: variant.price, maxStock: totalStock, branch_id: autoBranchId }];
    });

    setSearchProduct('');
    setIsProductDropdownOpen(false);
  };

  const updateQuantity = (itemId, delta) => {
    setCartItems(prev => {
      const index = prev.findIndex(item => item._id === itemId);
      if (index === -1) return prev;
      
      const item = prev[index];
      const newQuantity = parseInt(item.quantity, 10) + parseInt(delta, 10);
      
      if (newQuantity > 0) {
        if (delta > 0) {
          const totalRequestedOtherRows = prev
            .filter(i => i.variant.id === item.variant.id && i._id !== itemId)
            .reduce((sum, i) => sum + parseInt(i.quantity, 10), 0);
            
          if (newQuantity + totalRequestedOtherRows > parseInt(item.maxStock, 10)) {
            toast.error(`Has alcanzado el stock total disponible (${item.maxStock}) para este producto.`);
            return prev;
          }

          if (item.branch_id) {
            const branchInventory = item.variant.inventories?.find(inv => inv.branch_id === item.branch_id || inv.branch?.id === item.branch_id);
            const branchStock = parseInt(branchInventory?.stock || branchInventory?.quantity || 0, 10);
            
            const branchUsedByOthers = prev
              .filter(i => i.variant.id === item.variant.id && i._id !== itemId && i.branch_id == item.branch_id)
              .reduce((sum, i) => sum + parseInt(i.quantity, 10), 0);
              
            if (newQuantity + branchUsedByOthers > branchStock) {
               toast.error(`Stock insuficiente en esta sucursal. Usa el botón "Extraer de otra" para dividir.`);
               return prev;
            }
          }
        }
        
        const newItems = [...prev];
        newItems[index] = { ...item, quantity: newQuantity };
        return newItems;
      }
      return prev;
    });
  };

  const updateItemBranch = (itemId, branchId) => {
    if (meetingPointType === 'pickup') {
      setCartItems(prev => prev.map(item => ({ ...item, branch_id: branchId })));
      setDeliveryData(prev => ({ ...prev, pickup_branch_id: branchId }));
      toast.success("Sucursal de recojo sincronizada para todos los productos.");
    } else {
      setCartItems(prev => prev.map(item => 
        item._id === itemId ? { ...item, branch_id: branchId } : item
      ));
    }
  };

  const removeItem = (itemId) => {
    setCartItems(prev => prev.filter(item => item._id !== itemId));
  };

  const duplicateItem = (item) => {
    setCartItems(prev => {
      const totalRequested = prev
        .filter(i => i.variant.id === item.variant.id)
        .reduce((sum, i) => sum + parseInt(i.quantity, 10), 0);
        
      if (totalRequested >= parseInt(item.maxStock, 10)) {
        toast.error(`Has alcanzado el stock total disponible (${item.maxStock}). No puedes agregar más.`);
        return prev;
      }

      return [
        ...prev,
        { ...item, _id: Date.now().toString() + Math.random(), quantity: 1, branch_id: "" }
      ];
    });
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
          shipping_cost: deliveryData.delivery_type === 'external' ? null : deliveryData.shipping_cost,
          agency_dispatch_cost: deliveryData.delivery_type === 'external' ? deliveryData.agency_dispatch_cost : null,
          driver_id: deliveryData.driver_id,
          customer_id: deliveryData.customer_id,
          guest_name: deliveryData.guest_name,
          guest_phone: (deliveryData.guest_country_code && deliveryData.guest_phone) 
                        ? `${deliveryData.guest_country_code.trim()} ${deliveryData.guest_phone.trim()}` 
                        : deliveryData.guest_phone,
          recipient_name: deliveryData.recipient_name,
          recipient_ci: deliveryData.recipient_ci,
          recipient_phone: deliveryData.recipient_phone,
          destination_city: deliveryData.destination_city
        };
        
        if (mode === 'complete') {
          updatePayload.status = 'assigned';
        }
        
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
        delivery_type: deliveryData.delivery_type,
        pickup_branch_id: deliveryData.pickup_branch_id || null,
        address_id: deliveryData.address_id || null,
        meeting_point: deliveryData.meeting_point,
        scheduled_date: deliveryData.scheduled_date,
        time_window: deliveryData.time_window,
        latitude: deliveryData.latitude,
        longitude: deliveryData.longitude,
        shipping_cost: deliveryData.delivery_type === 'external' ? null : deliveryData.shipping_cost,
        agency_dispatch_cost: deliveryData.delivery_type === 'external' ? deliveryData.agency_dispatch_cost : null,
        recipient_name: deliveryData.recipient_name,
        recipient_ci: deliveryData.recipient_ci,
        recipient_phone: deliveryData.recipient_phone,
        destination_city: deliveryData.destination_city
      };
      
      if (deliveryData.driver_id) orderPayload.driver_id = deliveryData.driver_id;
      if (deliveryData.guest_name) orderPayload.guest_name = deliveryData.guest_name;
      if (deliveryData.guest_phone) {
        orderPayload.guest_phone = (deliveryData.guest_country_code) 
            ? `${deliveryData.guest_country_code.trim()} ${deliveryData.guest_phone.trim()}`
            : deliveryData.guest_phone;
      }
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

  const handleCancelDelivery = async () => {
    if (!editData) return;
    setLoading(true);
    try {
      await updateDeliveryStatus(editData.id, { status: 'cancelled' });
      toast.success("Entrega cancelada");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error("Error al cancelar entrega");
    } finally {
      setLoading(false);
      setShowCancelModal(false);
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
      <div className="modal-content new-order-modal-content">
        <div className="modal-header">
          <h2>
            {mode === 'complete' ? 'Completar Entrega' : mode === 'edit' ? 'Editar Entrega' : 'Nueva Entrega (Redes Sociales)'}
          </h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="new-order-modal-body">
          
          {/* LEFT SIDE: Products or Form depending on Step */}
          <div className="new-order-left-panel">
            {step === 1 ? (
              <>
                <div className="form-group cart-form-group">
                  <label className="cart-form-label">Buscar y Agregar Producto</label>
                  <div className="dropdown-container cart-form-dropdown-wrapper">
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
                      <div className="dropdown-menu cart-form-dropdown-menu">
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
                                      <span>SKU: {variant.sku} - <strong>Bs. {variant.price}</strong></span>
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
              </>
            ) : (
              <form id="delivery-form" onSubmit={handleSubmit} className="delivery-form">
                <h3>Datos de Logística</h3>
                {step === 2 ? (
                  <>
                    <div className="delivery-sections">
                      
                      {/* CARD 1: Lugar de Entrega */}
                      <div className="delivery-card">
                        <div className="form-group">
                          <label className="delivery-label">Lugar de Entrega *</label>
                          <div className="delivery-type-tabs">
                            {settings.delivery_pickup !== 'false' && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  setMeetingPointType('pickup');
                                  const targetBranch = cartItems.length > 0 ? (cartItems[0].branch_id || branches[0]?.id || "") : (branches[0]?.id || "");
                                  setDeliveryData({...deliveryData, meeting_point: "Recojo en sucursal", latitude: null, longitude: null, shipping_cost: 0, delivery_type: 'pickup', address_id: "", pickup_branch_id: targetBranch});
                                  setCartItems(prev => prev.map(item => ({ ...item, branch_id: targetBranch })));
                                }}
                                className={`tab-btn ${meetingPointType === 'pickup' ? 'active' : ''}`}
                              >
                                <ShoppingCart size={16} />
                                <span>Recojo en Sucursal</span>
                                {meetingPointType === 'pickup' && <CheckCircle2 size={14} />}
                              </button>
                            )}
                            {settings.delivery_scheduled_point !== 'false' && (
                              <>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setMeetingPointType('predefined');
                                    setDeliveryData({...deliveryData, meeting_point: "", latitude: null, longitude: null, shipping_cost: 0, delivery_type: 'scheduled_point', address_id: ""});
                                  }}
                                  className={`tab-btn ${meetingPointType === 'predefined' ? 'active' : ''}`}
                                >
                                  <MapPin size={16} />
                                  <span>Punto Fijo</span>
                                  {meetingPointType === 'predefined' && <CheckCircle2 size={14} />}
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setMeetingPointType('manual');
                                    setDeliveryData({...deliveryData, meeting_point: "", latitude: null, longitude: null, shipping_cost: 0, delivery_type: 'scheduled_point', address_id: ""});
                                  }}
                                  className={`tab-btn ${meetingPointType === 'manual' ? 'active' : ''}`}
                                >
                                  <Map size={16} />
                                  <span>Manual (Mapa)</span>
                                  {meetingPointType === 'manual' && <CheckCircle2 size={14} />}
                                </button>
                              </>
                            )}
                            {settings.delivery_home !== 'false' && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  setMeetingPointType('delivery');
                                  setDeliveryData({...deliveryData, meeting_point: "", latitude: null, longitude: null, shipping_cost: 0, delivery_type: 'home_delivery', address_id: ""});
                                }}
                                className={`tab-btn ${meetingPointType === 'delivery' ? 'active' : ''}`}
                              >
                                <MapPin size={16} />
                                <span>A Domicilio</span>
                                {meetingPointType === 'delivery' && <CheckCircle2 size={14} />}
                              </button>
                            )}
                            {settings.delivery_national !== 'false' && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  setMeetingPointType('external');
                                  let recName = "";
                                  let recPhone = "";
                                  let recCi = "";
                                  if (customerSearchType === 'guest') {
                                    recName = deliveryData.guest_name;
                                    recPhone = (deliveryData.guest_country_code || "") + " " + (deliveryData.guest_phone || "");
                                    recPhone = recPhone.trim();
                                  } else if (selectedCustomer) {
                                    const c = customersList.find(x => x.id === selectedCustomer.id);
                                    if (c) {
                                      recName = c.pos_profile ? `${c.pos_profile.first_name} ${c.pos_profile.last_name_paternal || ''}`.trim() :
                                                  (c.user?.profile ? `${c.user.profile.first_name} ${c.user.profile.last_name_paternal || ''}`.trim() : 
                                                  (c.user?.username || c.customer_code));
                                      recPhone = c.pos_profile?.whatsapp_phone || c.user?.profile?.phone || "";
                                      recCi = c.customer_code || "";
                                    } else {
                                      recName = selectedCustomer.name;
                                    }
                                  }
                                  setDeliveryData({
                                    ...deliveryData, 
                                    meeting_point: "", 
                                    latitude: null, 
                                    longitude: null, 
                                    shipping_cost: 0, 
                                    delivery_type: 'external', 
                                    address_id: "",
                                    recipient_name: recName,
                                    recipient_phone: recPhone,
                                    recipient_ci: recCi
                                  });
                                }}
                                className={`tab-btn ${meetingPointType === 'external' ? 'active' : ''}`}
                              >
                                <MapPin size={16} />
                                <span>Nacional</span>
                                {meetingPointType === 'external' && <CheckCircle2 size={14} />}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {meetingPointType === 'pickup' ? (
                          <div className="form-group">
                            <label>Selecciona la Sucursal de Recojo *</label>
                            <CustomSelect 
                              required
                              value={deliveryData.pickup_branch_id}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDeliveryData({
                                  ...deliveryData, 
                                  pickup_branch_id: val
                                });
                                setCartItems(prev => prev.map(item => ({ ...item, branch_id: val })));
                                toast.success("Stock reasignado a esta sucursal.");
                              }}
                            >
                              <option value="">-- Selecciona una sucursal --</option>
                              {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                  {branch.name}
                                </option>
                              ))}
                            </CustomSelect>
                          </div>
                        ) : meetingPointType === 'predefined' ? (
                          <CustomSelect 
                            required
                            value={deliveryData.meeting_point}
                            onChange={(e) => {
                              const selectedName = e.target.value;
                              const zone = predefinedMeetingPoints.find(z => z.name === selectedName);
                              setDeliveryData({
                                ...deliveryData, 
                                meeting_point: selectedName,
                                city: zone?.city || "",
                                original_delivery_zone_id: zone?.id || "",
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
                          </CustomSelect>
                        ) : meetingPointType === 'delivery' && selectedCustomer?.addresses?.length > 0 ? (
                          <div className="address-select-container">
                            <CustomSelect
                              value={deliveryData.address_id}
                              onChange={(e) => {
                                const addressId = e.target.value;
                                const address = selectedCustomer.addresses.find(a => a.id === addressId);
                                if (address) {
                                  setDeliveryData({
                                    ...deliveryData,
                                    address_id: address.id,
                                    meeting_point: `${address.street}, ${address.zone}`,
                                    latitude: address.latitude || null,
                                    longitude: address.longitude || null
                                  });
                                  if (address.latitude && address.longitude) {
                                    setMapCenter({ lat: Number(address.latitude), lng: Number(address.longitude) });
                                  }
                                } else {
                                  setDeliveryData({
                                    ...deliveryData,
                                    address_id: "",
                                    meeting_point: "",
                                    latitude: null,
                                    longitude: null
                                  });
                                }
                              }}
                            >
                              <option value="">-- Selecciona una dirección guardada --</option>
                              {selectedCustomer.addresses.map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.street}, {a.zone} {a.reference ? `(${a.reference})` : ''}
                                </option>
                              ))}
                            </CustomSelect>
                            <div className="form-group">
                              <label>Costo de Envío (Bs) *</label>
                              <input type="number" min="0" step="0.5" className="form-control" required value={deliveryData.shipping_cost} onChange={(e) => setDeliveryData({...deliveryData, shipping_cost: e.target.value})} />
                            </div>
                          </div>
                        ) : meetingPointType === 'external' ? (
                          <div className="form-group" style={{ margin: 0, padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', fontSize: '13px' }}>
                            <MapPin size={16} style={{ display: 'inline', marginRight: '6px' }} />
                            Para envíos a Nivel Nacional, por favor llena los detalles de destino y la persona que recibe en la sección inferior.
                          </div>
                        ) : (
                          <div className="manual-location-container">
                            <div className="form-group">
                              <label>Pegar Link de Google Maps o Coordenadas (Opcional)</label>
                              <input 
                                type="text" 
                                className="form-control"
                                placeholder="Pega el enlace largo de Google Maps o coordenadas (ej: -17.38, -66.15)"
                                onChange={(e) => {
                                  const url = e.target.value;
                                  if (!url) return;
                                  
                                  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                                  const dMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                                  const simpleMatch = url.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
                                  
                                  let lat = null, lng = null;
                                  
                                  if (atMatch) { lat = parseFloat(atMatch[1]); lng = parseFloat(atMatch[2]); }
                                  else if (dMatch) { lat = parseFloat(dMatch[1]); lng = parseFloat(dMatch[2]); }
                                  else if (simpleMatch) { lat = parseFloat(simpleMatch[1]); lng = parseFloat(simpleMatch[2]); }
                                  
                                  if (lat !== null && lng !== null) {
                                    setMapCenter({ lat, lng });
                                    setDeliveryData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                    toast.success("Ubicación detectada correctamente");
                                    e.target.value = '';
                                  } else if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
                                    toast.error("Por favor abre el link corto en tu navegador y pega el enlace completo que aparece en la barra de direcciones.");
                                  }
                                }}
                              />
                              <label>Especifica la Dirección o Lugar *</label>
                              <input 
                                type="text" 
                                required
                                className="form-control"
                                placeholder="Ej: Av. Las Américas, Edificio Los Pinos Piso 4..."
                                value={deliveryData.meeting_point}
                                onChange={(e) => setDeliveryData({...deliveryData, meeting_point: e.target.value})}
                              />
                            </div>
                            
                            <div className="map-container">
                              <GoogleMapWrapper
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
                                loadingElement={<div style={{ padding: '2rem', textAlign: 'center' }}>Cargando mapa...</div>}
                              >
                                {deliveryData.latitude && deliveryData.longitude && (
                                  <MarkerF position={{ lat: Number(deliveryData.latitude), lng: Number(deliveryData.longitude) }} />
                                )}
                              </GoogleMapWrapper>
                            </div>
                            <small>
                              * Haz clic en el mapa para marcar el punto exacto de entrega. 
                              {deliveryData.latitude && ` (Lat: ${Number(deliveryData.latitude).toFixed(5)}, Lng: ${Number(deliveryData.longitude).toFixed(5)})`}
                            </small>
                            <div className="form-group">
                              <label>Costo de Envío (Bs) *</label>
                              <input type="number" min="0" step="0.5" className="form-control" required value={deliveryData.shipping_cost} onChange={(e) => setDeliveryData({...deliveryData, shipping_cost: e.target.value})} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CARD 2: Datos del Cliente */}
                      <div className="delivery-card">
                        <div className="form-group">
                          <label className="delivery-label">Datos del Cliente *</label>
                          <div className="delivery-type-tabs">
                            <button 
                              type="button" 
                              onClick={() => {
                                setCustomerSearchType('guest');
                                setDeliveryData({...deliveryData, customer_id: ""});
                                setSelectedCustomer(null);
                              }}
                              className={`tab-btn ${customerSearchType === 'guest' ? 'active' : ''}`}
                            >
                              <User size={16} />
                              <span>Invitado / Nuevo</span>
                              {customerSearchType === 'guest' && <CheckCircle2 size={14} />}
                            </button>
                            <button 
                              type="button" 
                              onClick={() => {
                                setCustomerSearchType('registered');
                                setDeliveryData({...deliveryData, guest_name: "", guest_phone: ""});
                              }}
                              className={`tab-btn ${customerSearchType === 'registered' ? 'active' : ''}`}
                            >
                              <UserCheck size={16} />
                              <span>Cliente Registrado</span>
                              {customerSearchType === 'registered' && <CheckCircle2 size={14} />}
                            </button>
                          </div>

                          {customerSearchType === 'guest' ? (
                            <div className="guest-fields">
                              <div className="form-group">
                                <label>Nombre Completo *</label>
                                <input type="text" required={customerSearchType === 'guest'} className="form-control" value={deliveryData.guest_name} onChange={(e) => setDeliveryData({...deliveryData, guest_name: e.target.value})} />
                              </div>
                              <div className="form-group">
                                <label>Teléfono (WhatsApp) *</label>
                                <div className="phone-fields">
                                  <input 
                                    type="text" 
                                    required={customerSearchType === 'guest'} 
                                    className="form-control" 
                                    placeholder="+591"
                                    value={deliveryData.guest_country_code} 
                                    onChange={(e) => setDeliveryData({...deliveryData, guest_country_code: e.target.value})} 
                                  />
                                  <input 
                                    type="text" 
                                    required={customerSearchType === 'guest'} 
                                    className="form-control" 
                                    placeholder="Ej: 63194677"
                                    value={deliveryData.guest_phone} 
                                    onChange={(e) => setDeliveryData({...deliveryData, guest_phone: e.target.value})} 
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="form-group">
                              <label>Buscar Cliente Registrado *</label>
                              {selectedCustomer ? (
                                <div className="selected-item">
                                  <span style={{ fontWeight: 600 }}>{selectedCustomer.name}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => { 
                                      setSelectedCustomer(null); 
                                      setDeliveryData({...deliveryData, customer_id: ""}); 
                                      setCustomerSearchQuery(""); 
                                    }} 
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Buscar por nombre, teléfono o código..." 
                                    value={customerSearchQuery} 
                                    onChange={(e) => {
                                      setCustomerSearchQuery(e.target.value);
                                      setIsCustomerDropdownOpen(true);
                                    }} 
                                    onFocus={() => setIsCustomerDropdownOpen(true)}
                                  />
                                  {isCustomerDropdownOpen && customerSearchQuery.trim() && (
                                    <div className="dropdown-menu">
                                      {isSearchingCustomer ? (
                                        <div className="dropdown-item">Buscando cliente...</div>
                                      ) : customersList.length === 0 ? (
                                        <div className="dropdown-item">No se encontraron clientes con esa búsqueda.</div>
                                      ) : (
                                        customersList.map(c => {
                                          const name = c.pos_profile ? `${c.pos_profile.first_name} ${c.pos_profile.last_name_paternal || ''}` :
                                                      (c.user?.profile ? `${c.user.profile.first_name} ${c.user.profile.last_name_paternal || ''}` : 
                                                      (c.user?.username || c.customer_code));
                                          const phone = c.pos_profile?.phone || c.user?.profile?.phone || "Sin Teléfono";
                                          
                                          return (
                                            <div 
                                              key={c.id} 
                                              className="dropdown-item" 
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                setSelectedCustomer({ id: c.id, name: name.trim(), addresses: c.addresses || [] });
                                                setDeliveryData({...deliveryData, customer_id: c.id});
                                                setIsCustomerDropdownOpen(false);
                                              }}
                                            >
                                              <div style={{ fontWeight: 600 }}>{name.trim()}</div>
                                              <div style={{ fontSize: '12px' }}>Tel: {phone} | Cód: {c.customer_code}</div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>


                      {/* CARD 2.5: Destino y Destinatario (Solo para Nivel Nacional) */}
                      {meetingPointType === 'external' && (
                        <div className="delivery-card">
                          <h4 style={{ margin: 0, marginBottom: '15px' }}>Destino y Persona que Recibe</h4>
                          <div className="external-location-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label>Ciudad / Departamento de Destino *</label>
                              <input 
                                type="text"
                                className="form-control"
                                placeholder="Ej: Santa Cruz, Cochabamba, Sucre..."
                                required
                                value={deliveryData.meeting_point}
                                onFocus={() => setIsDestinationsDropdownOpen(true)}
                                onBlur={() => setIsDestinationsDropdownOpen(false)}
                                onChange={e => {
                                  setDeliveryData({...deliveryData, meeting_point: e.target.value, destination_city: e.target.value});
                                  setIsDestinationsDropdownOpen(true);
                                }}
                              />
                              {isDestinationsDropdownOpen && historicalDestinations.length > 0 && (
                                <div style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>Destinos anteriores registrados para este número/cliente:</div>
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {historicalDestinations.map((dest, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault(); // Prevent onBlur from firing before click
                                          setDeliveryData({...deliveryData, meeting_point: dest, destination_city: dest});
                                          setIsDestinationsDropdownOpen(false);
                                        }}
                                        style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '16px', background: 'var(--color-primary-alpha)', border: '1px solid rgba(139, 92, 246, 0.3)', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: '500' }}
                                      >
                                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        {dest}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div style={{ padding: '15px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)' }}>Datos de Quien Recibe el Paquete</h4>
                                <button 
                                  type="button"
                                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', background: 'var(--color-primary-alpha)', color: 'var(--color-primary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                  onClick={() => {
                                    let recName = "";
                                    let recPhone = "";
                                    let recCi = "";
                                    if (customerSearchType === 'guest') {
                                      recName = deliveryData.guest_name;
                                      recPhone = (deliveryData.guest_country_code || "") + " " + (deliveryData.guest_phone || "");
                                      recPhone = recPhone.trim();
                                    } else if (selectedCustomer) {
                                      const c = customersList.find(x => x.id === selectedCustomer.id);
                                      if (c) {
                                        recName = c.pos_profile ? `${c.pos_profile.first_name} ${c.pos_profile.last_name_paternal || ''}`.trim() :
                                                    (c.user?.profile ? `${c.user.profile.first_name} ${c.user.profile.last_name_paternal || ''}`.trim() : 
                                                    (c.user?.username || c.customer_code));
                                        recPhone = c.pos_profile?.whatsapp_phone || c.user?.profile?.phone || "";
                                        recCi = c.customer_code || "";
                                      } else {
                                        recName = selectedCustomer.name;
                                      }
                                    }
                                    setDeliveryData(prev => ({ ...prev, recipient_name: recName, recipient_phone: recPhone, recipient_ci: recCi }));
                                    toast.success("Datos copiados del comprador");
                                  }}
                                >
                                  <UserCheck size={14} /> Usar datos del comprador
                                </button>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                  <label>Nombre Completo *</label>
                                  <input type="text" className="form-control" required value={deliveryData.recipient_name} onChange={e => setDeliveryData({...deliveryData, recipient_name: e.target.value})} placeholder="Nombre de quien recoge" />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                  <label>Carnet de Identidad (CI) *</label>
                                  <input type="text" className="form-control" required value={deliveryData.recipient_ci} onChange={e => setDeliveryData({...deliveryData, recipient_ci: e.target.value})} placeholder="Nro de CI" />
                                </div>
                                <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                                  <label>Teléfono de Contacto *</label>
                                  <div className="phone-fields">
                                    <input type="text" className="form-control" placeholder="+591" 
                                      value={(deliveryData.recipient_phone || '').includes(' ') ? (deliveryData.recipient_phone || '').split(' ')[0] : '+591'} 
                                      onChange={e => {
                                        const code = e.target.value;
                                        const num = (deliveryData.recipient_phone || '').includes(' ') ? (deliveryData.recipient_phone || '').split(' ').slice(1).join(' ') : (deliveryData.recipient_phone || '');
                                        setDeliveryData({...deliveryData, recipient_phone: `${code} ${num}`.trim()});
                                      }} 
                                    />
                                    <input type="text" className="form-control" required placeholder="Número de celular" 
                                      value={(deliveryData.recipient_phone || '').includes(' ') ? (deliveryData.recipient_phone || '').split(' ').slice(1).join(' ') : (deliveryData.recipient_phone || '')} 
                                      onChange={e => {
                                        const num = e.target.value;
                                        const code = (deliveryData.recipient_phone || '').includes(' ') ? (deliveryData.recipient_phone || '').split(' ')[0] : '+591';
                                        setDeliveryData({...deliveryData, recipient_phone: `${code} ${num}`.trim()});
                                      }} 
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="form-group" style={{ margin: 0, marginTop: '5px' }}>
                              <label>Costo de Envío a Agencia (Bs) *</label>
                              <input type="number" min="0" step="0.5" className="form-control" required value={deliveryData.agency_dispatch_cost || ''} onChange={(e) => setDeliveryData({...deliveryData, agency_dispatch_cost: e.target.value})} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CARD 3: Información de entrega */}
                      <div className="delivery-card">
                        <h4 style={{ margin: 0 }}>Información de entrega</h4>
                        
                        <div className="form-group">
                          <label>Encargado de la Entrega (Opcional)</label>
                          {selectedDriver ? (
                            <div className="selected-item">
                              <span style={{ fontWeight: 600 }}>{selectedDriver.name}</span>
                              <button 
                                type="button" 
                                onClick={() => { 
                                  setSelectedDriver(null); 
                                  setDeliveryData({...deliveryData, driver_id: ""}); 
                                  setDriverSearchQuery(""); 
                                }} 
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Buscar repartidor por nombre, teléfono o código..." 
                                value={driverSearchQuery} 
                                onChange={(e) => {
                                  setDriverSearchQuery(e.target.value);
                                  setIsDriverDropdownOpen(true);
                                }} 
                                onFocus={() => setIsDriverDropdownOpen(true)}
                              />
                              {isDriverDropdownOpen && (
                                <div className="dropdown-menu">
                                  {isSearchingDriver ? (
                                    <div className="dropdown-item">Buscando encargado...</div>
                                  ) : deliveryDrivers.length === 0 ? (
                                    <div className="dropdown-item">No se encontraron repartidores con ese nombre.</div>
                                  ) : (
                                    deliveryDrivers.map(employee => {
                                      const name = `${employee.user?.profile?.first_name || ''} ${employee.user?.profile?.last_name_paternal || ''}`.trim();
                                      return (
                                        <div 
                                          key={employee.id} 
                                          className="dropdown-item" 
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            setSelectedDriver({ id: employee.id, name });
                                            setDeliveryData({...deliveryData, driver_id: employee.id});
                                            setIsDriverDropdownOpen(false);
                                          }}
                                        >
                                          <div style={{ fontWeight: 600 }}>{name || `Empleado ${employee.employee_code}`}</div>
                                          <div style={{ fontSize: '12px' }}>Tel: {employee.phone} | Cód: {employee.employee_code}</div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <div className="date-time-fields">
                          <div className="form-group">
                            <label>Fecha de Programación *</label>
                            <input type="date" required className="form-control" value={deliveryData.scheduled_date} onChange={(e) => setDeliveryData({...deliveryData, scheduled_date: e.target.value})} />
                          </div>
                          <div className="form-group">
                            <label>Hora (Estimada) *</label>
                            <input type="time" required className="form-control" value={deliveryData.time_window} onChange={(e) => setDeliveryData({...deliveryData, time_window: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </form>
            )}
          </div>

          {/* RIGHT SIDE: Cart Summary */}
          <div className="new-order-right-panel">
            <h3>
              <ShoppingCart size={20} /> Resumen
            </h3>
            
            <div className="cart-items-list">
              {cartItems.length === 0 ? (
                <div className="empty-cart-message">
                  El carrito está vacío
                </div>
              ) : (
                cartItems.map(item => {
                  const usedByOtherRowsInBranch = (branchId) => {
                    return cartItems
                      .filter(i => i.variant.id === item.variant.id && i._id !== item._id && i.branch_id == branchId)
                      .reduce((sum, i) => sum + parseInt(i.quantity, 10), 0);
                  };

                  const availableBranches = item.variant.inventories?.filter(inv => {
                    const branchId = inv.branch?.id || inv.branch_id;
                    const stock = parseInt(inv.stock || inv.quantity || 0, 10);
                    const remaining = stock - usedByOtherRowsInBranch(branchId);
                    return remaining >= parseInt(item.quantity, 10);
                  }) || [];
                  const isStockInsufficient = availableBranches.length === 0;

                  const variantTotalRequested = cartItems
                    .filter(i => i.variant.id === item.variant.id)
                    .reduce((sum, i) => sum + parseInt(i.quantity, 10), 0);
                  const canDuplicate = variantTotalRequested < parseInt(item.maxStock, 10);

                  return (
                    <div key={item._id} style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 500, fontSize: '14px' }}>{item.product.name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.variant.sku} x {item.quantity}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Bs. {(item.price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeItem(item._id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px' }} title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Extraer stock de:</label>
                        <CustomSelect 
                          style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '6px', border: (!item.branch_id || isStockInsufficient) ? '1px solid var(--color-danger)' : '1px solid var(--border-color)' }}
                          value={item.branch_id || ''}
                          onChange={(e) => updateItemBranch(item._id, e.target.value)}
                        >
                          <option value="">Seleccionar sucursal...</option>
                          {availableBranches.map(inv => (
                            <option key={inv.branch?.id || inv.branch_id} value={inv.branch?.id || inv.branch_id}>
                              {inv.branch?.name || 'Sucursal'} (Stock: {inv.stock || inv.quantity})
                            </option>
                          ))}
                        </CustomSelect>
                        {isStockInsufficient && (
                           <span style={{ fontSize: '11px', color: 'var(--color-danger)', marginTop: '2px', fontWeight: 500 }}>Stock insuficiente para el pedido</span>
                        )}
                        {!isStockInsufficient && !item.branch_id && (
                           <span style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: '2px', fontWeight: 500 }}>Debe seleccionar una sucursal</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', borderRadius: '6px', padding: '4px' }}>
                          <button onClick={() => updateQuantity(item._id, -1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}><Minus size={14} /></button>
                          <span style={{ fontSize: '14px', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item._id, 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px' }}><Plus size={14} /></button>
                        </div>
                        
                        {canDuplicate && (
                          <button 
                            onClick={() => duplicateItem(item)} 
                            style={{ background: 'transparent', border: '1px dashed var(--color-primary)', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            + Extraer de otra
                          </button>
                        )}
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
                  <span>{meetingPointType === 'external' ? 'Se define al remitir' : `Bs. ${shippingAmount.toFixed(2)}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
                  <span>Total:</span>
                  <span style={{ color: 'var(--color-primary)' }}>Bs. {totalAmount.toFixed(2)}</span>
                </div>
              </div>
              
              {step === 1 ? (() => {
                const isValidToContinue = cartItems.length > 0 && cartItems.every(item => {
                  if (!item.branch_id) return false;
                  
                  const usedByOtherRowsInBranch = (branchId) => {
                    return cartItems
                      .filter(i => i.variant.id === item.variant.id && i._id !== item._id && i.branch_id == branchId)
                      .reduce((sum, i) => sum + parseInt(i.quantity, 10), 0);
                  };

                  const availableBranches = item.variant.inventories?.filter(inv => {
                    const branchId = inv.branch?.id || inv.branch_id;
                    const stock = parseInt(inv.stock || inv.quantity || 0, 10);
                    const remaining = stock - usedByOtherRowsInBranch(branchId);
                    return remaining >= parseInt(item.quantity, 10);
                  }) || [];

                  return availableBranches.some(inv => (inv.branch?.id || inv.branch_id) == item.branch_id);
                });

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                      className="action-btn primary" 
                      style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: !isValidToContinue ? 0.5 : 1, cursor: !isValidToContinue ? 'not-allowed' : 'pointer', border: 'none', background: 'var(--color-primary)', color: 'var(--color-primary-text)' }}
                      onClick={handleNextStep}
                      disabled={!isValidToContinue}
                    >
                      Continuar <ArrowRight size={18} />
                    </button>
                    {editData && (
                      <CanAccess permission="cancel_orders">
                        <button 
                          type="button"
                          className="btn-cancelar" 
                          style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 500, transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          onClick={() => setShowCancelModal(true)}
                          disabled={loading}
                        >
                          <XCircle size={16} /> Cancelar Entrega
                        </button>
                      </CanAccess>
                    )}
                  </div>
                );
              })() : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <CanAccess permission={editData ? 'edit_orders' : 'create_orders'}>
                    <button 
                      type="submit"
                      form="delivery-form"
                      className="action-btn success" 
                      style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer', opacity: loading ? 0.7 : 1, fontWeight: 600, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                      disabled={loading}
                    >
                      {loading ? "Procesando..." : (mode === 'complete' ? "Completar" : mode === 'edit' ? "Guardar Cambios" : "Crear Entrega")}
                    </button>
                  </CanAccess>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      type="button"
                      className="btn-cancel" 
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500, transition: '0.2s' }}
                      onClick={() => setStep(1)}
                      disabled={loading}
                    >
                      Volver
                    </button>
                    {!editData && (
                      <CanAccess permission="create_orders">
                        <button 
                          type="button"
                          className="btn-cancel" 
                          style={{ flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px', border: '1px dashed var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, transition: '0.2s' }}
                          onClick={() => handleSubmit(null, true)}
                          disabled={loading}
                        >
                          Borrador
                        </button>
                      </CanAccess>
                    )}
                    {editData && (
                      <CanAccess permission="cancel_orders">
                        <button 
                          type="button"
                          className="btn-cancelar" 
                          style={{ flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 500, transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          onClick={() => setShowCancelModal(true)}
                          disabled={loading}
                        >
                          <XCircle size={16} /> Cancelar Entrega
                        </button>
                      </CanAccess>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {showCancelModal && (
        <div className="modal-overlay fade-in" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '400px', width: '90%', background: 'var(--bg-card)', borderRadius: '16px', padding: '30px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#ef4444' }}>
              <XCircle size={48} />
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: 'var(--text-main)' }}>Cancelar Entrega</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px', lineHeight: '1.5' }}>
              ¿Estás seguro de que deseas cancelar esta entrega? <br/><strong>Esta acción no se puede deshacer.</strong>
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button"
                onClick={() => setShowCancelModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600 }}
                disabled={loading}
              >
                Cerrar
              </button>
              <button 
                type="button"
                onClick={handleCancelDelivery}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                disabled={loading}
              >
                {loading ? 'Cancelando...' : 'Sí, Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
