import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { 
  User, 
  MapPin, 
  Lock, 
  Package, 
  Heart, 
  Award, 
  Settings, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ChevronRight, 
  ChevronDown,
  ShoppingBag,
  AlertCircle, 
  Sparkles, 
  ExternalLink,
  Smartphone,
  Mail,
  Calendar,
  X,
  Loader2,
  Truck,
  Clock
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import useShopWishlistStore from "../../store/shop/useShopWishlistStore";
import Navbar from "../home/components/Navbar";
import Footer from "../../components/layout/Footer";
import { 
  getProfile, 
  updateProfile, 
  changePassword, 
  addAddress, 
  updateAddress, 
  deleteAddress,
  getMyOrders 
} from "../../api/profile/profileApi";
import { getImageUrl } from "../../utils/imageUtils";
import AddressMapPicker from "../../components/ui/AddressMapPicker";
import { verifyRegisterCode, resendRegisterCode } from "../../api/admin/auth";
import "./Profile.css";

const MissingDataPointer = ({ message }) => (
  <div style={{
    marginTop: '6px',
    background: 'var(--color-warning, #f59e0b)',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    position: 'relative',
    animation: 'pulseArrow 2s infinite'
  }}>
    <div style={{
      position: 'absolute',
      top: '-3px',
      left: '12px',
      transform: 'rotate(45deg)',
      width: '6px',
      height: '6px',
      background: 'var(--color-warning, #f59e0b)',
    }} />
    <AlertCircle size={12} />
    {message}
    <style>{`
      @keyframes pulseArrow {
        0% { transform: translateY(0); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
        50% { transform: translateY(2px); box-shadow: 0 0 0 4px rgba(245, 158, 11, 0); }
        100% { transform: translateY(0); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
      }
    `}</style>
  </div>
);

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, token, logout, login } = useAuthStore();
  const { profileIsDark, toggleProfileTheme, setProfileTheme } = useThemeStore();

  useEffect(() => {
    // Si la ruta anterior nos pasó un tema específico, lo aplicamos al montar
    if (location.state && location.state.theme !== undefined) {
      setProfileTheme(location.state.theme === 'dark');
    }
  }, [location.state, setProfileTheme]);

  const [activeTab, setActiveTab] = useState("profile"); // profile, addresses, security, orders, wishlist, loyalty, preferences
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const selectorRef = useRef(null);

  useEffect(() => {
    const handleClickOutsideSelector = (e) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        setIsSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideSelector);
    document.addEventListener("touchstart", handleClickOutsideSelector);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideSelector);
      document.removeEventListener("touchstart", handleClickOutsideSelector);
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showConfirmCodeModal, setShowConfirmCodeModal] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Deferred Email Verification State
  const [verifyCodeInput, setVerifyCodeInput] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const autoVerifyTriggeredRef = useRef(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // User Profile Data
  const [userData, setUserData] = useState(null);
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name_paternal: "",
    last_name_maternal: "",
    phone_prefix: "+591",
    phone_number: "",
    customer_code: "",
    birthdate: "",
    gender: "Prefiero no decirlo",
    notification_email: ""
  });

  // Password Change Form
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    country: "Bolivia",
    state: "La Paz",
    city: "La Paz",
    zone: "",
    street: "",
    reference: "",
    latitude: null,
    longitude: null,
  });

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState("all"); // all, pending, in_transit, completed

  // Wishlist Store
  const { items: wishlistItems, loading: wishlistLoading, fetchWishlist, toggleWishlist } = useShopWishlistStore();

  // Fetch Profile data on mount
  const loadProfile = async () => {
    try {
      setLoading(true);
      setConnectionError(false);
      const res = await getProfile();
      if (res?.user) {
        setUserData(res.user);
        
        // Populate profile form
        const prof = res.user.profile || {};
        const customer = res.user.customers?.[0];
        let pPrefix = "+591";
        let pNum = "";
        if (prof.phone) {
            const parts = prof.phone.split(" ");
            if (parts.length > 1) {
                pPrefix = parts[0];
                pNum = parts.slice(1).join(" ");
            } else {
                pNum = prof.phone;
            }
        }
        setProfileForm({
          first_name: prof.first_name || "",
          last_name_paternal: prof.last_name_paternal || "",
          last_name_maternal: prof.last_name_maternal || "",
          phone_prefix: pPrefix,
          phone_number: pNum,
          customer_code: customer?.customer_code || "",
          birthdate: prof.birthdate ? prof.birthdate.split("T")[0] : "",
          gender: ["Masculino", "Femenino", "Prefiero no decirlo"].includes(prof.gender) ? prof.gender : "Prefiero no decirlo",
          notification_email: res?.user?.owner?.notification_email || userData?.owner?.notification_email || ""
        });

        // Populate addresses from customers collection
        if (customer?.addresses) {
          setAddresses(customer.addresses);
        }

        // Keep local auth store user in sync
        login({ user: res.user, token: token || localStorage.getItem("token") });
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      // If unauthorized (token expired/invalid), force logout and redirect
      if (err.response && err.response.status === 401) {
        toast.error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
        logout();
        navigate("/login");
        return;
      }
      
      // Catch network errors (no connection)
      if (!err.response || err.code === "ERR_NETWORK") {
        setConnectionError(true);
        setLoading(false);
        return;
      }
      
      // Fallback to local authUser if available for other errors (e.g. network error)
      if (authUser) {
        setUserData(authUser);
        const prof = authUser.profile || {};
        const customer = authUser.customers?.[0];
        let pPrefix = "+591";
        let pNum = "";
        if (prof.phone) {
            const parts = prof.phone.split(" ");
            if (parts.length > 1) {
                pPrefix = parts[0];
                pNum = parts.slice(1).join(" ");
            } else {
                pNum = prof.phone;
            }
        }
        setProfileForm({
          first_name: prof.first_name || "",
          last_name_paternal: prof.last_name_paternal || "",
          last_name_maternal: prof.last_name_maternal || "",
          phone_prefix: pPrefix,
          phone_number: pNum,
          customer_code: customer?.customer_code || "",
          birthdate: prof.birthdate ? prof.birthdate.split("T")[0] : "",
          gender: ["Masculino", "Femenino", "Prefiero no decirlo"].includes(prof.gender) ? prof.gender : "Prefiero no decirlo",
          notification_email: res?.user?.owner?.notification_email || userData?.owner?.notification_email || ""
        });
        if (customer?.addresses) {
          setAddresses(customer.addresses);
        }
      } else {
        toast.error("Por favor inicia sesión para acceder a tu perfil.");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Verification handlers (deferred email verification)
  const handleVerifyEmailCode = useCallback(async (e, explicitCode = null, explicitEmail = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const codeToVerify = (explicitCode ?? verifyCodeInput ?? "").replace(/\D/g, "").trim();
    const emailToVerify = (explicitEmail ?? userData?.email ?? authUser?.email ?? "").trim().toLowerCase();

    if (!emailToVerify) {
      toast.error("No se encontró el correo de la cuenta para verificar.");
      return;
    }
    if (codeToVerify.length !== 6) {
      toast.error("Ingresa el código de 6 dígitos enviado a tu correo.");
      return;
    }

    try {
      setVerifyingEmail(true);
      const res = await verifyRegisterCode({
        email: emailToVerify,
        code: codeToVerify,
      });
      const verifiedUser = res.data?.user;
      const newToken = res.data?.token || token || localStorage.getItem("token");

      toast.success(res.data?.message || "¡Correo electrónico verificado exitosamente!");
      setVerifyCodeInput("");

      setUserData((prev) =>
        prev
          ? {
              ...prev,
              email_verified_at: verifiedUser?.email_verified_at || new Date().toISOString(),
              is_email_verified: true,
            }
          : verifiedUser
      );

      if (verifiedUser && newToken) {
        localStorage.setItem("token", newToken);
        localStorage.setItem("shop_auth_token", newToken);
        localStorage.setItem("shop_user", JSON.stringify(verifiedUser));
        login({ user: { ...(userData || {}), ...verifiedUser, is_email_verified: true }, token: newToken });
      }

      // Clean query params if present
      if (location.search.includes("verify_code")) {
        navigate("/profile", { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Código de verificación inválido o expirado.");
    } finally {
      setVerifyingEmail(false);
    }
  }, [verifyCodeInput, userData, authUser, token, login, location.search, navigate]);

  const handleResendEmailCode = async () => {
    if (resendCooldown > 0 || resendingEmail) return;
    const emailToResend = (userData?.email || authUser?.email || "").trim().toLowerCase();
    if (!emailToResend) return;

    try {
      setResendingEmail(true);
      const res = await resendRegisterCode({ email: emailToResend });
      toast.success(res.data?.message || "Se ha enviado un nuevo código de 6 dígitos a tu correo.");
      setResendCooldown(res.data?.cooldown_seconds || 60);
    } catch (error) {
      if (error.response?.data?.cooldown_seconds) {
        setResendCooldown(error.response.data.cooldown_seconds);
      }
      toast.error(error.response?.data?.message || "No se pudo reenviar el código de verificación.");
    } finally {
      setResendingEmail(false);
    }
  };

  // Auto-verify if user clicked the link in the verification email (?verify_code=XXXXXX&email=...)
  useEffect(() => {
    if (autoVerifyTriggeredRef.current) return;
    const params = new URLSearchParams(location.search);
    const urlCode = (params.get("verify_code") || "").replace(/\D/g, "").trim();
    const urlEmail = (params.get("email") || userData?.email || authUser?.email || "").trim().toLowerCase();

    if (urlCode.length === 6 && urlEmail) {
      autoVerifyTriggeredRef.current = true;
      setVerifyCodeInput(urlCode);
      handleVerifyEmailCode(null, urlCode, urlEmail);
    }
  }, [location.search, userData, authUser, handleVerifyEmailCode]);

  // Frontend auth validation: redirect if logged out from elsewhere (e.g. Navbar)
  useEffect(() => {
    if (!loading && !authUser && !token) {
      toast.error("Por favor inicia sesión para acceder a tu perfil.");
      navigate("/login");
    }
  }, [authUser, token, loading, navigate]);

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!profileForm.first_name.trim()) {
      toast.error("El nombre es requerido.");
      return;
    }

    // Check if customer code was modified
    const originalCode = userData?.customers?.[0]?.customer_code || "";
    if (profileForm.customer_code?.trim() !== originalCode && !showConfirmCodeModal) {
      setShowConfirmCodeModal(true);
      return;
    }

    executeProfileSubmit();
  };

  const executeProfileSubmit = async () => {
    try {
      setSavingProfile(true);
      // Sanitize: send null instead of empty strings for optional fields
      const payload = {
        first_name: profileForm.first_name,
        birthdate: profileForm.birthdate?.trim() || null,
        phone: profileForm.phone_number ? `${profileForm.phone_prefix} ${profileForm.phone_number}`.trim() : null,
        last_name_paternal: profileForm.last_name_paternal?.trim() || null,
        last_name_maternal: profileForm.last_name_maternal?.trim() || null,
        gender: profileForm.gender?.trim() || null,
        customer_code: profileForm.customer_code?.trim() || null,
        notification_email: profileForm.notification_email?.trim() || null,
      };
      const res = await updateProfile(payload);
      toast.success("Perfil actualizado con éxito.");
      setShowConfirmCodeModal(false);
      if (res?.user) {
        setUserData(res.user);
        login({ user: res.user, token: token || localStorage.getItem("token") });
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      const errMsg = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(" ")
        : err.response?.data?.message || "Error al actualizar perfil.";
      toast.error(errMsg);
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      toast.error("Las nuevas contraseñas no coinciden.");
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword(passwordForm);
      toast.success("¡Contraseña actualizada exitosamente!");
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: ""
      });
    } catch (err) {
      console.error("Error changing password:", err);
      toast.error(err.response?.data?.message || "Error al cambiar contraseña.");
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Address Save (Add / Update)
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!addressForm.street.trim()) {
      toast.error("La calle / dirección es requerida.");
      return;
    }

    try {
      setSavingAddress(true);
      if (editingAddressId) {
        const res = await updateAddress(editingAddressId, addressForm);
        toast.success("Dirección actualizada.");
        if (res?.user?.customers?.[0]?.addresses) {
          setAddresses(res.user.customers[0].addresses);
        } else {
          loadProfile();
        }
      } else {
        const res = await addAddress(addressForm);
        toast.success("Dirección guardada exitosamente.");
        if (res?.user?.customers?.[0]?.addresses) {
          setAddresses(res.user.customers[0].addresses);
        } else {
          loadProfile();
        }
      }
      setShowAddressModal(false);
      setEditingAddressId(null);
      setAddressForm({
        country: "Bolivia",
        state: "La Paz",
        city: "La Paz",
        zone: "",
        street: "",
        reference: "",
        latitude: null,
        longitude: null,
      });
    } catch (err) {
      console.error("Error saving address:", err);
      toast.error(err.response?.data?.message || "Error al guardar dirección.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      country: addr.country || "Bolivia",
      state: addr.state || "",
      city: addr.city || "",
      zone: addr.zone || "",
      street: addr.street || "",
      reference: addr.reference || "",
      latitude: addr.latitude ? Number(addr.latitude) : null,
      longitude: addr.longitude ? Number(addr.longitude) : null,
    });
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta dirección?")) return;
    try {
      await deleteAddress(id);
      toast.success("Dirección eliminada.");
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Error deleting address:", err);
      toast.error("Error al eliminar la dirección.");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada.");
    navigate("/");
  };

  // Load orders when tab is activated or filter changes
  const loadOrders = useCallback(async (filter) => {
    try {
      setOrdersLoading(true);
      const params = {};
      if (filter && filter !== "all") {
        params.status = filter;
      }
      const data = await getMyOrders(params);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading orders:", err);
      toast.error("Error al cargar tus pedidos.");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Fetch data when switching tabs
  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders(orderFilter);
    } else if (activeTab === "wishlist") {
      fetchWishlist();
    }
  }, [activeTab]);

  // Refetch orders when filter changes
  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders(orderFilter);
    }
  }, [orderFilter]);

  // Helper: get delivery status label and color for profile cards
  const getDeliveryStatusInfo = (schedule, shipment) => {
    if (!schedule) {
      // No delivery schedule, use shipment status
      const s = shipment?.status || 'pending';
      if (s === 'delivered') return { label: 'Entregado', color: '#10b981', cssClass: 'status-delivered' };
      if (s === 'shipped') return { label: 'Enviado', color: '#3b82f6', cssClass: 'status-transit' };
      return { label: 'Pendiente', color: '#64748b', cssClass: 'status-pending' };
    }
    const st = schedule.status;
    switch (st) {
      case 'completed': return { label: 'Entregado', color: '#10b981', cssClass: 'status-delivered' };
      case 'on_the_way': return { label: 'En Camino', color: '#3b82f6', cssClass: 'status-transit' };
      case 'at_the_meeting_point': return { label: 'En el Punto', color: '#8b5cf6', cssClass: 'status-transit' };
      case 'ready_for_pickup': return { label: 'Listo para Recoger', color: '#8b5cf6', cssClass: 'status-transit' };
      case 'assigned': return { label: 'Agendado', color: '#4f46e5', cssClass: 'status-pending' };
      case 'preparing':
      case 'prepared': return { label: 'Preparando', color: '#f97316', cssClass: 'status-pending' };
      case 'packaged': return { label: 'Empaquetado', color: '#0ea5e9', cssClass: 'status-transit' };
      case 'shipped': return { label: 'Remitido', color: '#3b82f6', cssClass: 'status-transit' };
      case 'cancelled': return { label: 'Cancelado', color: '#ef4444', cssClass: 'status-cancelled' };
      default: return { label: 'Pendiente', color: '#64748b', cssClass: 'status-pending' };
    }
  };

  // Helper: get membership tier from points
  const getMembershipTier = (points) => {
    if (points >= 500) return { name: 'Gold', color: '#f59e0b' };
    if (points >= 100) return { name: 'Silver', color: '#9ca3af' };
    return { name: 'Bronze', color: '#cd7f32' };
  };

  // Helper values
  const customerInfo = userData?.customers?.[0];
  
  // Check if customer_code can be updated (2 months rule)
  let canChangeCustomerCode = true;
  let nextAllowedChangeDate = null;
  if (customerInfo?.customer_code_updated_at) {
    const lastUpdateDate = new Date(customerInfo.customer_code_updated_at);
    const twoMonthsLater = new Date(lastUpdateDate);
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
    if (new Date() < twoMonthsLater) {
      canChangeCustomerCode = false;
      nextAllowedChangeDate = twoMonthsLater.toLocaleDateString();
    }
  }
  const userInitials = (userData?.full_name?.trim())
    ? userData.full_name.trim().split(/\s+/).map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase()
    : (userData?.username || userData?.email || "U").slice(0, 2).toUpperCase();

  if (connectionError) {
    return (
      <div className="profile-page-wrapper">
        <Navbar isDarkThemeOverride={profileIsDark} />
        <div style={{ width: '100%', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main, #09090b)', color: 'var(--text-main, #fff)', textAlign: 'center', padding: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <AlertCircle size={40} style={{ color: '#ef4444' }} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '500', marginBottom: '12px', letterSpacing: '-0.02em' }}>Sin conexión al servidor</h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted, #a1a1aa)', maxWidth: '420px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
            No pudimos obtener los datos de tu perfil. Por favor, verifica tu conexión a internet o intenta volver más tarde.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '12px 28px', 
              background: 'var(--text-main, #fff)', 
              color: 'var(--bg-main, #09090b)', 
              border: 'none', 
              borderRadius: '30px', 
              cursor: 'pointer', 
              fontSize: '0.95rem', 
              fontWeight: '600', 
              transition: 'opacity 0.2s', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            Reintentar conexión
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading && !userData) {
    return (
      <div className="profile-page-wrapper">
        <Navbar isDarkThemeOverride={profileIsDark} />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'profileSpin 0.8s linear infinite'
          }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Cargando tu perfil...</p>
          <style>{`@keyframes profileSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
        <Footer />
      </div>
    );
  }

  const tabGroups = [
    {
      name: "Mi Cuenta",
      items: [
        { id: "profile", label: "Datos Personales", icon: User, desc: "Información y contacto" },
        { id: "addresses", label: "Direcciones de Envío", icon: MapPin, desc: "Direcciones para entregas", badge: addresses.length },
        { id: "security", label: "Seguridad & Acceso", icon: Lock, desc: "Contraseña y credenciales" },
      ]
    },
    {
      name: "Actividad & Compras",
      items: [
        { id: "orders", label: "Mis Pedidos", icon: Package, desc: "Historial de compras y pedidos" },
        { id: "wishlist", label: "Lista de Deseos", icon: Heart, desc: "Prendas guardadas" },
        { id: "loyalty", label: "Puntos & Club VIP", icon: Award, desc: "Puntos y recompensas", tag: "NUEVO" },
      ]
    },
    {
      name: "Ajustes",
      items: [
        { id: "preferences", label: "Preferencias", icon: Settings, desc: "Opciones de cuenta" },
      ]
    }
  ];

  const currentTabItem = tabGroups.flatMap(g => g.items).find(i => i.id === activeTab) || tabGroups[0].items[0];
  const CurrentTabIcon = currentTabItem.icon;

  return (
    <div className="profile-page-wrapper">
      <Navbar isDarkThemeOverride={profileIsDark} />

      <main className="profile-main-container">
        {/* =========================================
            BANNER DE VERIFICACIÓN DE CORREO DIFERIDA (OPCIÓN B)
            ========================================= */}
        {userData && !userData.is_email_verified && !userData.email_verified_at && (
          <div
            style={{
              marginBottom: "20px",
              padding: "18px 22px",
              borderRadius: "14px",
              background: profileIsDark
                ? "linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(217, 119, 6, 0.08))"
                : "linear-gradient(135deg, #fffbeb, #fef3c7)",
              border: profileIsDark ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid #fcd34d",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: "1 1 320px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "rgba(245, 158, 11, 0.2)",
                  color: "#d97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Mail size={20} />
              </div>
              <div>
                <h3
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: profileIsDark ? "#fde68a" : "#92400e",
                  }}
                >
                  Confirma tu correo electrónico
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    lineHeight: 1.45,
                    color: profileIsDark ? "#fcd34d" : "#b45309",
                  }}
                >
                  Enviamos un código de 6 dígitos a <strong>{userData.email}</strong>. Confirma tu correo dentro de las primeras 24 horas para mantener tu cuenta activa de forma permanente.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleVerifyEmailCode}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Código (6 dígitos)"
                value={verifyCodeInput}
                onChange={(e) => setVerifyCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                style={{
                  width: "155px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: profileIsDark ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid #f59e0b",
                  background: profileIsDark ? "rgba(17, 24, 39, 0.8)" : "#ffffff",
                  color: profileIsDark ? "#ffffff" : "#111827",
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "3px",
                  textAlign: "center",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={verifyingEmail || verifyCodeInput.length !== 6}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#d97706",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: verifyingEmail || verifyCodeInput.length !== 6 ? "not-allowed" : "pointer",
                  opacity: verifyingEmail || verifyCodeInput.length !== 6 ? 0.65 : 1,
                }}
              >
                {verifyingEmail ? "Verificando..." : "Confirmar código"}
              </button>
              <button
                type="button"
                onClick={handleResendEmailCode}
                disabled={resendingEmail || resendCooldown > 0}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: profileIsDark ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid #d97706",
                  background: "transparent",
                  color: profileIsDark ? "#fde68a" : "#92400e",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: resendingEmail || resendCooldown > 0 ? "not-allowed" : "pointer",
                  opacity: resendingEmail || resendCooldown > 0 ? 0.6 : 1,
                }}
              >
                {resendingEmail
                  ? "Enviando..."
                  : resendCooldown > 0
                  ? `Reenviar (${resendCooldown}s)`
                  : "Reenviar código"}
              </button>
            </form>
          </div>
        )}

        {/* =========================================
            HERO CARD CON DATOS DEL USUARIO
            ========================================= */}
        <div className="profile-hero-card">
          <div className="profile-user-identity">
            <div className="profile-avatar-wrapper">
              {userData?.photo ? (
                <img src={userData.photo} alt="Avatar" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-fallback">{userInitials}</div>
              )}
              <div className="profile-online-badge" title="En línea" />
            </div>

            <div className="profile-user-meta">
              <h1 className="profile-user-name">
                {userData?.full_name?.trim() || userData?.username || "Usuario"}
              </h1>
              <p>{userData?.email || "cargando..."}</p>

              <div className="profile-badges-row">
                <span className="profile-tag-badge tag-code">
                  CÓDIGO: {customerInfo?.customer_code || "CLI-VOX"}
                </span>
                {customerInfo?.points !== undefined && (
                  <span className="profile-tag-badge tag-vip">
                    {customerInfo.points} PTS
                  </span>
                )}
                {userData && (
                  <span
                    className="profile-tag-badge"
                    style={{
                      background:
                        userData.is_email_verified || userData.email_verified_at
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(245, 158, 11, 0.18)",
                      color:
                        userData.is_email_verified || userData.email_verified_at
                          ? "#10b981"
                          : "#f59e0b",
                      border:
                        userData.is_email_verified || userData.email_verified_at
                          ? "1px solid rgba(16, 185, 129, 0.3)"
                          : "1px solid rgba(245, 158, 11, 0.35)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {userData.is_email_verified || userData.email_verified_at ? (
                      <>
                        <ShieldCheck size={12} /> CORREO VERIFICADO
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} /> PENDIENTE DE VERIFICAR
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats - Rediseñados con iconos y tarjetas modernas */}
          <div className="profile-stats-grid">
            <div className="profile-stat-box">
              <div className="profile-stat-icon-wrapper purchases">
                <ShoppingBag size={18} />
              </div>
              <div className="profile-stat-content">
                <span className="profile-stat-value">
                  Bs. {Number(customerInfo?.total_purchases || 0).toFixed(2)}
                </span>
                <span className="profile-stat-label">Compras Totales</span>
              </div>
            </div>

            <div className="profile-stat-box">
              <div className="profile-stat-icon-wrapper addresses">
                <MapPin size={18} />
              </div>
              <div className="profile-stat-content">
                <span className="profile-stat-value">{addresses.length}</span>
                <span className="profile-stat-label">Direcciones</span>
              </div>
            </div>

            <div className="profile-stat-box">
              <div className="profile-stat-icon-wrapper status">
                <ShieldCheck size={18} />
              </div>
              <div className="profile-stat-content">
                <div className="profile-stat-value">
                  <span className={`profile-status-pill ${customerInfo?.is_active !== false ? "active" : "inactive"}`}>
                    <span className="profile-status-dot" />
                    {customerInfo?.is_active !== false ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <span className="profile-stat-label">Estado</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            BODY LAYOUT: SELECTOR MÓVIL + SIDEBAR DESKTOP + SECCIONES
            ========================================= */}
        <div className="profile-body-layout">
          {/* SELECTOR CUSTOMIZADO PARA PANTALLAS MÓVILES */}
          <div className="profile-mobile-tab-selector" ref={selectorRef}>
            <div className="profile-selector-meta-header">
              <span className="profile-selector-meta-title">Sección seleccionada</span>
            </div>

            <button
              type="button"
              className={`profile-selector-trigger ${isSelectorOpen ? 'open' : ''}`}
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              aria-haspopup="listbox"
              aria-expanded={isSelectorOpen}
            >
              <div className="profile-selector-trigger-left">
                <span className="profile-selector-trigger-icon">
                  <CurrentTabIcon size={18} />
                </span>
                <div className="profile-selector-trigger-text">
                  <span className="profile-selector-trigger-label">{currentTabItem.label}</span>
                  <span className="profile-selector-trigger-desc">{currentTabItem.desc}</span>
                </div>
              </div>

              <div className="profile-selector-trigger-right">
                {currentTabItem.badge !== undefined && currentTabItem.badge > 0 && (
                  <span className="profile-nav-badge-count">{currentTabItem.badge}</span>
                )}
                {currentTabItem.tag && (
                  <span className="profile-nav-badge-new">{currentTabItem.tag}</span>
                )}
                <ChevronDown size={18} className={`profile-selector-trigger-arrow ${isSelectorOpen ? 'rotated' : ''}`} />
              </div>
            </button>

            {isSelectorOpen && (
              <div className="profile-selector-menu" role="listbox">
                {tabGroups.map((group) => (
                  <div key={group.name} className="profile-selector-group">
                    <div className="profile-selector-group-label">{group.name}</div>
                    <div className="profile-selector-group-list">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isSelected = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`profile-selector-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setActiveTab(item.id);
                              setIsSelectorOpen(false);
                            }}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span className="profile-selector-item-icon">
                              <ItemIcon size={18} />
                            </span>
                            <div className="profile-selector-item-info">
                              <span className="profile-selector-item-title">{item.label}</span>
                              <span className="profile-selector-item-desc">{item.desc}</span>
                            </div>
                            <div className="profile-selector-item-meta">
                              {item.badge !== undefined && item.badge > 0 && (
                                <span className="profile-nav-badge-count">{item.badge}</span>
                              )}
                              {item.tag && (
                                <span className="profile-nav-badge-new">{item.tag}</span>
                              )}
                              {isSelected && <Check size={16} className="profile-selector-check-icon" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="profile-selector-divider" />
                <button
                  type="button"
                  className="profile-selector-item profile-selector-logout"
                  onClick={() => {
                    setIsSelectorOpen(false);
                    handleLogout();
                  }}
                >
                  <span className="profile-selector-item-icon logout">
                    <LogOut size={18} />
                  </span>
                  <div className="profile-selector-item-info">
                    <span className="profile-selector-item-title">Cerrar Sesión</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* SIDEBAR NAVEGACION (DESKTOP) */}
          <aside className="profile-sidebar">
            {tabGroups.map((group) => (
              <React.Fragment key={group.name}>
                <div className="profile-nav-group-title">{group.name}</div>
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`profile-nav-btn ${isActive ? "active" : ""}`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <span className="profile-nav-btn-left">
                        <ItemIcon size={18} /> {item.label}
                      </span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="profile-nav-badge-count">{item.badge}</span>
                      )}
                      {item.tag && (
                        <span className="profile-nav-badge-new">{item.tag}</span>
                      )}
                      {!item.tag && item.badge === undefined && (
                        <ChevronRight size={16} />
                      )}
                    </button>
                  );
                })}
                <div className="profile-sidebar-divider" />
              </React.Fragment>
            ))}

            <button
              type="button"
              className="profile-nav-btn profile-logout-btn"
              onClick={handleLogout}
            >
              <span className="profile-nav-btn-left">
                <LogOut size={18} /> Cerrar Sesión
              </span>
            </button>
          </aside>

          {/* =========================================
              CONTENIDO DINAMICO POR TAB
              ========================================= */}
          <section className="profile-content-area">
            {/* 1. DATOS PERSONALES */}
            {activeTab === "profile" && (
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title-group">
                    <h2><User size={22} /> Datos Personales y del Cliente</h2>
                    <p>Mantén tu información actualizada para tus envíos y facturación.</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit}>
                  {/* SECCIÓN: DATOS PERSONALES */}
                  <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-color)" }}>Datos Personales</h3>
                  <div className="profile-form-grid" style={{ marginBottom: "24px" }}>
                    <div className="profile-form-group">
                      <label className="profile-label">Nombre(s) *</label>
                      <input
                        type="text"
                        className="profile-input"
                        placeholder="Ej. Juan Carlos"
                        value={profileForm.first_name}
                        onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                        required
                      />
                      {!profileForm.first_name && <MissingDataPointer message="Falta completar nombre" />}
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-label">Apellido Paterno</label>
                      <input
                        type="text"
                        className="profile-input"
                        placeholder="Ej. Pérez"
                        value={profileForm.last_name_paternal}
                        onChange={(e) => setProfileForm({ ...profileForm, last_name_paternal: e.target.value })}
                      />
                      {!profileForm.last_name_paternal && <MissingDataPointer message="Falta completar apellido paterno" />}
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-label">Apellido Materno</label>
                      <input
                        type="text"
                        className="profile-input"
                        placeholder="Ej. Gómez"
                        value={profileForm.last_name_maternal}
                        onChange={(e) => setProfileForm({ ...profileForm, last_name_maternal: e.target.value })}
                      />
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-label">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        className="profile-input"
                        value={profileForm.birthdate}
                        onChange={(e) => setProfileForm({ ...profileForm, birthdate: e.target.value })}
                      />
                      {!profileForm.birthdate && <MissingDataPointer message="Falta completar fecha de nacimiento" />}
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-label">Género</label>
                      <select
                        className="profile-select"
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                      </select>
                    </div>
                  </div>

                  <hr style={{ border: "0", borderTop: "1px solid var(--border-color)", margin: "24px 0" }} />

                  {/* SECCIÓN: DATOS DEL CLIENTE */}
                  <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-color)" }}>Datos del Cliente</h3>
                  <div className="profile-form-grid">
                    <div className="profile-form-group">
                      <label className="profile-label">Número de Carnet</label>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        className="profile-input"
                        placeholder="Ej. 1234567"
                        value={profileForm.customer_code}
                        disabled={!canChangeCustomerCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^\d*$/.test(val)) {
                            setProfileForm({ ...profileForm, customer_code: val });
                          }
                        }}
                      />
                      {!canChangeCustomerCode ? (
                        <span className="profile-input-help" style={{ color: "var(--color-warning, #f59e0b)", display: "flex", gap: "4px", alignItems: "center", marginTop: "4px" }}>
                          <AlertCircle size={12} />
                          Solo puedes cambiar este dato cada 2 meses. Próximo cambio disponible: {nextAllowedChangeDate}
                        </span>
                      ) : (
                        <span className="profile-input-help" style={{ color: "var(--text-muted)", display: "flex", gap: "4px", alignItems: "center", marginTop: "4px", fontSize: "11px" }}>
                          <AlertCircle size={12} />
                          Nota: Si cambias o guardas tu carnet, no podrás volver a modificarlo durante 2 meses. Piensa bien tu decisión.
                        </span>
                      )}
                      {canChangeCustomerCode && !profileForm.customer_code && <MissingDataPointer message="Falta completar número de carnet" />}
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-label">Teléfono / Celular</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          className="profile-input"
                          style={{ width: "80px" }}
                          placeholder="+591"
                          value={profileForm.phone_prefix}
                          onChange={(e) => setProfileForm({ ...profileForm, phone_prefix: e.target.value })}
                        />
                        <input
                          type="text"
                          className="profile-input"
                          style={{ flex: 1 }}
                          placeholder="70000000"
                          value={profileForm.phone_number}
                          onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                        />
                      </div>
                      {!profileForm.phone_number && <MissingDataPointer message="Falta completar teléfono" />}
                    </div>
                  </div>

                  {/* SECCIÓN EXCLUSIVA PARA OWNERS */}
                  {userData?.owner && (
                    <>
                      <hr style={{ border: "0", borderTop: "1px solid var(--border-color)", margin: "24px 0" }} />
                      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-color)" }}>
                        Configuración de Tienda (Owner)
                      </h3>
                      <div className="profile-form-grid">
                        <div className="profile-form-group">
                          <label className="profile-label">Correo para notificaciones de ventas</label>
                          <input
                            type="email"
                            className="profile-input"
                            placeholder="Ej. ventas@miempresa.com"
                            value={profileForm.notification_email}
                            onChange={(e) => setProfileForm({ ...profileForm, notification_email: e.target.value })}
                          />
                          <span className="profile-input-help" style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px", display: "block" }}>
                            Si lo dejas en blanco, las notificaciones llegarán a tu correo principal de inicio de sesión.
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="profile-actions-row">
                    <button
                      type="submit"
                      className="profile-btn-primary"
                      disabled={savingProfile}
                    >
                      {savingProfile ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 2. DIRECCIONES DE ENVIO */}
            {activeTab === "addresses" && (
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title-group">
                    <h2><MapPin size={22} /> Direcciones de Envío</h2>
                    <p>Gestiona los puntos donde recibes tus pedidos de VOXman.</p>
                  </div>
                  <button
                    className="profile-btn-primary"
                    onClick={() => {
                      setEditingAddressId(null);
                      setAddressForm({
                        country: "Bolivia",
                        state: "La Paz",
                        city: "La Paz",
                        zone: "",
                        street: "",
                        reference: "",
                        latitude: null,
                        longitude: null,
                      });
                      setShowAddressModal(true);
                    }}
                  >
                    <Plus size={16} /> Nueva Dirección
                  </button>
                </div>

                {/* Formulario Modal / Desplegable */}
                {showAddressModal && (
                  <div style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "14px",
                    padding: "24px",
                    marginBottom: "24px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                        {editingAddressId ? "Editar Dirección" : "Agregar Nueva Dirección"}
                      </h3>
                      <button
                        onClick={() => setShowAddressModal(false)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleAddressSubmit}>

                      {/* MAP PICKER */}
                      <div style={{ marginBottom: "20px" }}>
                        <label className="profile-label" style={{ display: "block", marginBottom: "8px" }}>
                          Ubicación en el mapa
                        </label>
                        <AddressMapPicker
                          initialLat={addressForm.latitude}
                          initialLng={addressForm.longitude}
                          onAddressSelect={(fields) => {
                            setAddressForm(prev => ({
                              ...prev,
                              latitude: fields.lat ?? prev.latitude,
                              longitude: fields.lng ?? prev.longitude,
                              // Only overwrite text fields if the geocoder returned non-empty values
                              ...(fields.street ? { street: fields.street } : {}),
                              ...(fields.zone ? { zone: fields.zone } : {}),
                              ...(fields.city ? { city: fields.city } : {}),
                              ...(fields.state ? { state: fields.state } : {}),
                              ...(fields.country ? { country: fields.country } : {}),
                            }));
                          }}
                        />
                      </div>

                      {/* MANUAL FIELDS (editable after map selection) */}
                      <div className="profile-form-grid">
                        <div className="profile-form-group">
                          <label className="profile-label">País</label>
                          <input
                            type="text"
                            className="profile-input"
                            value={addressForm.country}
                            onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                          />
                        </div>

                        <div className="profile-form-group">
                          <label className="profile-label">Departamento / Estado</label>
                          <input
                            type="text"
                            className="profile-input"
                            placeholder="Ej. La Paz, Santa Cruz, Cochabamba"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          />
                        </div>

                        <div className="profile-form-group">
                          <label className="profile-label">Ciudad</label>
                          <input
                            type="text"
                            className="profile-input"
                            placeholder="Ej. La Paz / El Alto"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          />
                        </div>

                        <div className="profile-form-group">
                          <label className="profile-label">Zona / Barrio</label>
                          <input
                            type="text"
                            className="profile-input"
                            placeholder="Ej. Calacoto, San Pedro, Miraflores"
                            value={addressForm.zone}
                            onChange={(e) => setAddressForm({ ...addressForm, zone: e.target.value })}
                          />
                        </div>

                        <div className="profile-form-group full-width">
                          <label className="profile-label">Calle, Avenida y Número *</label>
                          <input
                            type="text"
                            className="profile-input"
                            placeholder="Ej. Av. Ballivián #123, Edif. Los Pinos Piso 4"
                            value={addressForm.street}
                            onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                            required
                          />
                        </div>

                        <div className="profile-form-group full-width">
                          <label className="profile-label">Referencia de Entrega</label>
                          <input
                            type="text"
                            className="profile-input"
                            placeholder="Ej. Portón negro frente a la farmacia"
                            value={addressForm.reference}
                            onChange={(e) => setAddressForm({ ...addressForm, reference: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="profile-actions-row">
                        <button
                          type="button"
                          className="profile-btn-outline"
                          onClick={() => setShowAddressModal(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="profile-btn-primary"
                          disabled={savingAddress}
                        >
                          {savingAddress ? "Guardando..." : (editingAddressId ? "Actualizar Dirección" : "Guardar Dirección")}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Listado de Direcciones */}
                {addresses.length === 0 ? (
                  <div className="profile-empty-state">
                    <MapPin size={48} />
                    <h3>No tienes direcciones registradas</h3>
                    <p>Agrega tu primera dirección para hacer tus compras mucho más rápido.</p>
                  </div>
                ) : (
                  <div className="profile-addresses-grid">
                    {addresses.map((addr, idx) => (
                      <div key={addr.id || idx} className="profile-address-card">
                        <div>
                          <div className="profile-address-header">
                            <MapPin size={16} /> Dirección #{idx + 1}
                          </div>
                          <p className="profile-address-street">{addr.street}</p>
                          <p className="profile-address-details">
                            {addr.zone ? `${addr.zone}, ` : ""}
                            {addr.city ? `${addr.city}, ` : ""}
                            {addr.state ? `${addr.state}, ` : ""}
                            {addr.country || "Bolivia"}
                          </p>
                          {addr.reference && (
                            <p className="profile-address-ref">Ref: {addr.reference}</p>
                          )}
                        </div>

                        <div className="profile-address-actions">
                          <button
                            className="profile-btn-outline"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => handleEditAddress(addr)}
                          >
                            <Edit2 size={13} /> Editar
                          </button>
                          <button
                            className="profile-btn-danger"
                            onClick={() => handleDeleteAddress(addr.id)}
                          >
                            <Trash2 size={13} /> Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. SEGURIDAD Y ACCESO */}
            {activeTab === "security" && (
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title-group">
                    <h2><Lock size={22} /> Seguridad & Contraseña</h2>
                    <p>Protege tu cuenta actualizando regularmente tu contraseña.</p>
                  </div>
                </div>

                <div className="profile-form-grid" style={{ marginBottom: "24px" }}>
                  <div className="profile-form-group">
                    <label className="profile-label">Correo Electrónico</label>
                    <input
                      type="email"
                      className="profile-input"
                      value={userData?.email || ""}
                      disabled
                    />
                    <span className="profile-input-help">Para cambiar tu correo contacta con soporte.</span>
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-label">Nombre de Usuario</label>
                    <input
                      type="text"
                      className="profile-input"
                      value={userData?.username ? `@${userData.username}` : "No configurado"}
                      disabled
                    />
                  </div>
                </div>

                <hr style={{ border: "0", borderTop: "1px solid var(--border-color)", margin: "24px 0" }} />

                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", color: "var(--text-color)" }}>Cambiar Contraseña</h3>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="profile-form-grid">
                    <div className="profile-form-group full-width">
                      <label className="profile-label">Contraseña Actual *</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          className="profile-input"
                          placeholder="Tu contraseña actual"
                          value={passwordForm.current_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-muted)"
                          }}
                        >
                          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-label">Nueva Contraseña *</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          className="profile-input"
                          placeholder="Mínimo 8 caracteres"
                          value={passwordForm.new_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-muted)"
                          }}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <span className="profile-input-help">Usa letras, números y caracteres especiales.</span>
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-label">Confirmar Nueva Contraseña *</label>
                      <input
                        type="password"
                        className="profile-input"
                        placeholder="Repite la nueva contraseña"
                        value={passwordForm.new_password_confirmation}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div className="profile-actions-row">
                    <button
                      type="submit"
                      className="profile-btn-primary"
                      disabled={savingPassword}
                    >
                      {savingPassword ? "Actualizando..." : "Actualizar Contraseña"}
                    </button>
                  </div>
                </form>

                {/* Extra Security Elements (Opciones de presencia) */}
                <div style={{ marginTop: "36px", paddingTop: "24px", borderTop: "1px solid var(--border-color)" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={18} color="var(--color-success)" /> Opciones Avanzadas de Seguridad
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px",
                      background: "var(--bg-input)",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)"
                    }}>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: 600 }}>Autenticación en Dos Pasos (2FA)</h4>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Añade una capa extra de seguridad usando Google Authenticator.</p>
                      </div>
                      <span className="profile-tag-badge tag-vip">Próximamente</span>
                    </div>

                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px",
                      background: "var(--bg-input)",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)"
                    }}>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: 600 }}>Sesiones Activas</h4>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Navegador actual (Windows Chrome) - Conectado ahora</p>
                      </div>
                      <button className="profile-btn-outline" style={{ fontSize: "11px", padding: "6px 12px" }}>
                        Cerrar otras
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. MIS PEDIDOS */}
            {activeTab === "orders" && (
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title-group">
                    <h2><Package size={22} /> Mis Pedidos</h2>
                    <p>Revisa el estado de tus entregas y el historial de compras online.</p>
                  </div>
                  <Link to="/shop/catalog" className="profile-btn-outline" style={{ fontSize: "12px" }}>
                    Ir a la Tienda <ExternalLink size={13} />
                  </Link>
                </div>

                <div className="profile-orders-tabs">
                  {[
                    { key: "all", label: "Todos" },
                    { key: "pending", label: "Pendientes" },
                    { key: "in_transit", label: "En Camino" },
                    { key: "completed", label: "Entregados" }
                  ].map(f => (
                    <button
                      key={f.key}
                      className={`profile-tab-pill ${orderFilter === f.key ? "active" : ""}`}
                      onClick={() => setOrderFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {ordersLoading ? (
                  <div className="profile-empty-state" style={{ padding: "40px 0" }}>
                    <Loader2 size={32} style={{ animation: "profileSpin 0.8s linear infinite" }} />
                    <p>Cargando pedidos...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="profile-empty-state" style={{ padding: "32px 0" }}>
                    <Package size={48} />
                    <h3>No tienes pedidos registrados</h3>
                    <p>Cuando realices tu primera compra, aparecerá aquí.</p>
                    <Link to="/shop/catalog" className="profile-btn-primary" style={{ display: "inline-flex", marginTop: "8px" }}>
                      Explorar Catálogo
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {orders.map((order) => {
                      const mainShipment = order.shipments?.[0];
                      const schedule = mainShipment?.delivery_schedule;
                      const statusInfo = getDeliveryStatusInfo(schedule, mainShipment);
                      const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" }) : "";
                      const trackingId = schedule?.id || mainShipment?.id;

                      const grandTotal = order.financials?.grand_total || 0;
                      const totalPaid = order.financials?.total_paid || 0;
                      const displayTotal = order.status === 'paid' ? grandTotal : order.financials?.balance_due || 0;

                      return (
                        <div key={order.id} className="profile-order-card">
                          <div className="order-meta-group">
                            <h4>Pedido {order.invoice_number ? `#${order.invoice_number}` : `#${order.id.slice(0, 8).toUpperCase()}`}</h4>
                            <p>Realizado el {orderDate} • {order.financials?.items_count || 0} artículo{order.financials?.items_count !== 1 ? "s" : ""}</p>
                          </div>
                          <span className={`order-status-badge ${statusInfo.cssClass}`} style={{ backgroundColor: `${statusInfo.color}15`, color: statusInfo.color, borderColor: statusInfo.color }}>
                            {statusInfo.label}
                          </span>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: "15px" }}>Bs. {Number(displayTotal).toFixed(2)}</span>
                            {Number(order.financials?.global_discount || 0) > 0 && (
                              <div style={{ fontSize: "11px", color: "var(--color-danger, #ef4444)" }}>
                                Desc: -Bs. {Number(order.financials.global_discount).toFixed(2)}
                              </div>
                            )}
                          </div>
                          {trackingId && (
                            <Link to={`/tracking/${trackingId}`} className="profile-btn-outline" style={{ fontSize: "12px", padding: "6px 14px" }}>
                              Ver Seguimiento
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 5. LISTA DE DESEOS */}
            {activeTab === "wishlist" && (
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title-group">
                    <h2><Heart size={22} /> Lista de Deseos</h2>
                    <p>Tus prendas favoritas guardadas para después.</p>
                  </div>
                  {wishlistItems.length > 0 && (
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      {wishlistItems.length} artículo{wishlistItems.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {wishlistLoading ? (
                  <div className="profile-empty-state" style={{ padding: "40px 0" }}>
                    <Loader2 size={32} style={{ animation: "profileSpin 0.8s linear infinite" }} />
                    <p>Cargando lista de deseos...</p>
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="profile-empty-state">
                    <Heart size={48} />
                    <h3>Tu lista de deseos está vacía</h3>
                    <p>Explora nuestro catálogo exclusivo y guarda los productos que más te gusten.</p>
                    <Link to="/shop/catalog" className="profile-btn-primary" style={{ display: "inline-flex" }}>
                      Explorar Catálogo
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                    {wishlistItems.map((item) => {
                      // Build the product link with color/size query params
                      const basePath = item.is_bundle
                        ? `/shop/bundle/${item.product_id}`
                        : `/shop/product/${item.product_id}`;
                      const params = new URLSearchParams();
                      if (item.variant?.color) params.set("color", item.variant.color);
                      const productLink = params.toString() ? `${basePath}?${params}` : basePath;

                      const imageUrl = item.cover_image ? getImageUrl(item.cover_image) : null;

                      return (
                        <div key={item.id} className="profile-wishlist-card">
                          {/* Image */}
                          <Link to={productLink} style={{ display: "block", textDecoration: "none" }}>
                            <div className="profile-wishlist-img-wrap">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.product_name}
                                  className="profile-wishlist-img"
                                />
                              ) : (
                                <div className="profile-wishlist-img-placeholder">
                                  <Heart size={32} style={{ opacity: 0.25 }} />
                                </div>
                              )}
                              {/* Discount badge */}
                              {item.has_discount && item.discount_label && (
                                <span className="profile-wishlist-discount-badge">
                                  {item.discount_label}
                                </span>
                              )}
                              {/* Bundle badge */}
                              {item.is_bundle && (
                                <span className="profile-wishlist-bundle-badge">Conjunto</span>
                              )}
                            </div>
                          </Link>

                          {/* Info */}
                          <div className="profile-wishlist-info">
                            <Link to={productLink} style={{ textDecoration: "none", color: "inherit" }}>
                              <p className="profile-wishlist-name">{item.product_name}</p>
                            </Link>

                            {/* Color + Size */}
                            {(item.variant?.color || item.variant?.size) && (
                              <div className="profile-wishlist-variant">
                                {item.variant.color && (
                                  <span className="profile-wishlist-tag">{item.variant.color}</span>
                                )}
                                {item.variant.size && (
                                  <span className="profile-wishlist-tag">Talla {item.variant.size}</span>
                                )}
                              </div>
                            )}

                            {/* Price */}
                            <div className="profile-wishlist-price-row">
                              {item.has_discount ? (
                                <>
                                  <span className="profile-wishlist-price-sale">
                                    Bs {parseFloat(item.display_price || 0).toFixed(2)}
                                  </span>
                                  <span className="profile-wishlist-price-original">
                                    Bs {parseFloat(item.original_price || 0).toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="profile-wishlist-price-sale">
                                  Bs {parseFloat(item.display_price || item.original_price || 0).toFixed(2)}
                                </span>
                              )}
                            </div>

                            {/* Date + Remove */}
                            <div className="profile-wishlist-footer">
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                {item.created_at ? new Date(item.created_at).toLocaleDateString("es-BO", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                              </span>
                              <button
                                className="profile-wishlist-remove-btn"
                                onClick={() => toggleWishlist(item.product_id, item.variant_id)}
                                title="Quitar de favoritos"
                              >
                                <Heart size={13} fill="#ef4444" strokeWidth={0} />
                                Quitar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 6. CLUB VOXMAN / FIDELIDAD */}
            {activeTab === "loyalty" && (
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title-group">
                    <h2><Award size={22} /> Membresía VOXman Club</h2>
                    <p>Gana puntos con cada compra y accede a drops exclusivos.</p>
                  </div>
                </div>

                {/* Black Card de Membresía */}
                <div className="profile-membership-card">
                  <div className="membership-top-row">
                    <span className="membership-brand">VØXMAN</span>
                    <span className="membership-tier-badge" style={{ color: getMembershipTier(customerInfo?.points || 0).color }}>Nivel {getMembershipTier(customerInfo?.points || 0).name}</span>
                  </div>

                  <div className="membership-bottom-row">
                    <div>
                      <div className="membership-holder-label">Titular de la Membresía</div>
                      <div className="membership-holder-name">
                        {userData?.full_name || userData?.username || "Cliente VOXman"}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
                        CÓDIGO: {customerInfo?.customer_code || "CLI-VOX"}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div className="membership-holder-label">Puntos Disponibles</div>
                      <div className="membership-points-large">
                        {customerInfo?.points || 0} <span style={{ fontSize: "14px" }}>PTS</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Beneficios Desbloqueables */}
                <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "24px 0 12px 0" }}>Tus Beneficios Exclusivos</h3>
                <div className="profile-benefits-list">
                  <div className="profile-benefit-item">
                    <div className="profile-benefit-icon"><Sparkles size={20} /></div>
                    <div className="profile-benefit-info">
                      <h4>Acceso Anticipado</h4>
                      <p>Compra colecciones 24h antes que nadie.</p>
                    </div>
                  </div>

                  <div className="profile-benefit-item">
                    <div className="profile-benefit-icon"><Package size={20} /></div>
                    <div className="profile-benefit-info">
                      <h4>Envíos Preferenciales</h4>
                      <p>Entregas express prioritarias sin costo extra.</p>
                    </div>
                  </div>

                  <div className="profile-benefit-item">
                    <div className="profile-benefit-icon"><Award size={20} /></div>
                    <div className="profile-benefit-info">
                      <h4>Descuento de Cumpleaños</h4>
                      <p>15% OFF en todo tu mes de cumpleaños.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. PREFERENCIAS */}
            {activeTab === "preferences" && (
              <div className="profile-content-card">
                <div className="profile-card-header">
                  <div className="profile-card-title-group">
                    <h2><Settings size={22} /> Preferencias del Sistema</h2>
                    <p>Personaliza tu experiencia de navegación y avisos.</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    background: "var(--bg-input)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)"
                  }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600 }}>Tema de la Interfaz (Solo Perfil)</h4>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                        Actualmente en modo: <strong>{profileIsDark ? "Oscuro (Dark)" : "Claro (Light)"}</strong>
                      </p>
                    </div>
                    <button
                      className="profile-btn-outline"
                      onClick={toggleProfileTheme}
                    >
                      Cambiar a modo {profileIsDark ? "Claro" : "Oscuro"}
                    </button>
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    background: "var(--bg-input)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)"
                  }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600 }}>Avisos por WhatsApp</h4>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                        Recibir estado de envíos y promociones relámpago.
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked style={{ width: "20px", height: "20px", accentColor: "var(--color-primary)" }} />
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    background: "var(--bg-input)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)"
                  }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600 }}>Newsletter de Colecciones</h4>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                        Enterarte de los lanzamientos semanales por email.
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked style={{ width: "20px", height: "20px", accentColor: "var(--color-primary)" }} />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* MODAL DE CONFIRMACIÓN DE CARNET */}
      {showConfirmCodeModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10000 }}>
          <div style={{ background: "var(--bg-card, #fff)", padding: "24px", borderRadius: "12px", maxWidth: "400px", width: "90%", border: "1px solid var(--border-color)" }}>
            <h3 style={{ marginTop: 0, color: "var(--text-color, #000)" }}>Confirmar Cambio de Carnet</h3>
            <p style={{ color: "var(--text-muted, #666)", fontSize: "14px", lineHeight: "1.5" }}>
              Estás a punto de cambiar tu Número de Carnet a <strong>{profileForm.customer_code}</strong>.
              <br /><br />
              Atención: Si procedes, <strong>no podrás modificarlo de nuevo durante los próximos 2 meses</strong>. Piensa bien tu decisión, ¿estás seguro de que la información es correcta?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button 
                className="profile-btn-outline" 
                onClick={() => setShowConfirmCodeModal(false)}
                disabled={savingProfile}
              >
                Cancelar
              </button>
              <button 
                className="profile-btn-primary" 
                onClick={() => {
                  // Bypass the check by passing true, or just call executeProfileSubmit directly
                  executeProfileSubmit();
                }} 
                disabled={savingProfile}
              >
                {savingProfile ? "Guardando..." : "Sí, estoy seguro"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
