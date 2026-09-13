import React, { useState, useEffect, useCallback } from "react";
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
import "./Profile.css";

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
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // User Profile Data
  const [userData, setUserData] = useState(null);
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name_paternal: "",
    last_name_maternal: "",
    phone: "",
    birthdate: "",
    gender: "Prefiero no decirlo"
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
      const res = await getProfile();
      if (res?.user) {
        setUserData(res.user);
        
        // Populate profile form
        const prof = res.user.profile || {};
        setProfileForm({
          first_name: prof.first_name || "",
          last_name_paternal: prof.last_name_paternal || "",
          last_name_maternal: prof.last_name_maternal || "",
          phone: prof.phone || "",
          birthdate: prof.birthdate ? prof.birthdate.split("T")[0] : "",
          gender: ["Masculino", "Femenino", "Prefiero no decirlo"].includes(prof.gender) ? prof.gender : "Prefiero no decirlo"
        });

        // Populate addresses from customers collection
        const customer = res.user.customers?.[0];
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
      
      // Fallback to local authUser if available for other errors (e.g. network error)
      if (authUser) {
        setUserData(authUser);
        const prof = authUser.profile || {};
        setProfileForm({
          first_name: prof.first_name || "",
          last_name_paternal: prof.last_name_paternal || "",
          last_name_maternal: prof.last_name_maternal || "",
          phone: prof.phone || "",
          birthdate: prof.birthdate ? prof.birthdate.split("T")[0] : "",
          gender: ["Masculino", "Femenino", "Prefiero no decirlo"].includes(prof.gender) ? prof.gender : "Prefiero no decirlo"
        });
        const customer = authUser.customers?.[0];
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

  // Frontend auth validation: redirect if logged out from elsewhere (e.g. Navbar)
  useEffect(() => {
    if (!loading && !authUser && !token) {
      toast.error("Por favor inicia sesión para acceder a tu perfil.");
      navigate("/login");
    }
  }, [authUser, token, loading, navigate]);

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.first_name.trim()) {
      toast.error("El nombre es requerido.");
      return;
    }

    try {
      setSavingProfile(true);
      // Sanitize: send null instead of empty strings for optional fields
      const payload = {
        ...profileForm,
        birthdate: profileForm.birthdate?.trim() || null,
        phone: profileForm.phone?.trim() || null,
        last_name_paternal: profileForm.last_name_paternal?.trim() || null,
        last_name_maternal: profileForm.last_name_maternal?.trim() || null,
        gender: profileForm.gender?.trim() || null,
      };
      const res = await updateProfile(payload);
      toast.success("Perfil actualizado con éxito.");
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
  const userInitials = (userData?.full_name?.trim())
    ? userData.full_name.trim().split(/\s+/).map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase()
    : (userData?.username || userData?.email || "U").slice(0, 2).toUpperCase();

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

  return (
    <div className="profile-page-wrapper">
      <Navbar isDarkThemeOverride={profileIsDark} />

      <main className="profile-main-container">
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
              <h1>
                {userData?.full_name?.trim() || userData?.username || "Usuario"}
                <span className="profile-tag-badge tag-vip">
                  <Sparkles size={12} /> Cliente VOX
                </span>
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
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="profile-stats-grid">
            <div className="profile-stat-box">
              <span className="profile-stat-value">
                Bs. {Number(customerInfo?.total_purchases || 0).toFixed(2)}
              </span>
              <span className="profile-stat-label">Compras Totales</span>
            </div>

            <div className="profile-stat-box">
              <span className="profile-stat-value">{addresses.length}</span>
              <span className="profile-stat-label">Direcciones</span>
            </div>

            <div className="profile-stat-box">
              <span className="profile-stat-value" style={{ color: customerInfo?.is_active !== false ? "var(--color-success)" : "var(--text-muted)" }}>
                {customerInfo?.is_active !== false ? "Activo" : "Inactivo"}
              </span>
              <span className="profile-stat-label">Estado</span>
            </div>
          </div>
        </div>

        {/* =========================================
            BODY LAYOUT: SIDEBAR + SECCIONES
            ========================================= */}
        <div className="profile-body-layout">
          {/* SIDEBAR NAVEGACION */}
          <aside className="profile-sidebar">
            <div className="profile-nav-group-title">Mi Cuenta</div>

            <button
              className={`profile-nav-btn ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <span className="profile-nav-btn-left">
                <User size={18} /> Datos Personales
              </span>
              <ChevronRight size={16} />
            </button>

            <button
              className={`profile-nav-btn ${activeTab === "addresses" ? "active" : ""}`}
              onClick={() => setActiveTab("addresses")}
            >
              <span className="profile-nav-btn-left">
                <MapPin size={18} /> Direcciones de Envío
              </span>
              <span className="profile-nav-badge-new">{addresses.length}</span>
            </button>

            <button
              className={`profile-nav-btn ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <span className="profile-nav-btn-left">
                <Lock size={18} /> Seguridad & Acceso
              </span>
              <ChevronRight size={16} />
            </button>

            <div className="profile-sidebar-divider" />
            <div className="profile-nav-group-title">Actividad & Compras</div>

            <button
              className={`profile-nav-btn ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <span className="profile-nav-btn-left">
                <Package size={18} /> Mis Pedidos
              </span>
              <ChevronRight size={16} />
            </button>

            <button
              className={`profile-nav-btn ${activeTab === "wishlist" ? "active" : ""}`}
              onClick={() => setActiveTab("wishlist")}
            >
              <span className="profile-nav-btn-left">
                <Heart size={18} /> Lista de Deseos
              </span>
              <ChevronRight size={16} />
            </button>

            <button
              className={`profile-nav-btn ${activeTab === "loyalty" ? "active" : ""}`}
              onClick={() => setActiveTab("loyalty")}
            >
              <span className="profile-nav-btn-left">
                <Award size={18} /> Puntos & Club VIP
              </span>
              <span className="profile-nav-badge-new">NUEVO</span>
            </button>

            <div className="profile-sidebar-divider" />
            <div className="profile-nav-group-title">Ajustes</div>

            <button
              className={`profile-nav-btn ${activeTab === "preferences" ? "active" : ""}`}
              onClick={() => setActiveTab("preferences")}
            >
              <span className="profile-nav-btn-left">
                <Settings size={18} /> Preferencias
              </span>
              <ChevronRight size={16} />
            </button>

            <button
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
                    <h2><User size={22} /> Datos Personales</h2>
                    <p>Mantén tu información actualizada para tus envíos y facturación.</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit}>
                  <div className="profile-form-grid">
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
                      <label className="profile-label">Teléfono / Celular</label>
                      <input
                        type="text"
                        className="profile-input"
                        placeholder="Ej. +591 70000000"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      />
                    </div>

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

                    <div className="profile-form-group">
                      <label className="profile-label">Fecha de Nacimiento</label>
                      <input
                        type="date"
                        className="profile-input"
                        value={profileForm.birthdate}
                        onChange={(e) => setProfileForm({ ...profileForm, birthdate: e.target.value })}
                      />
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

                      // Same calculation as /dashboard/sales
                      const computedShippingCost = mainShipment?.shipping_payment_type !== 'collect' ? Number(mainShipment?.shipping_cost || 0) : 0;
                      const computedAgencyCost = Number(mainShipment?.agency_dispatch_cost || 0);
                      const grandTotal = Number(order.dynamic_total || 0) + computedShippingCost + computedAgencyCost;
                      const totalPaid = order.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
                      const displayTotal = order.status === 'paid' ? grandTotal : (grandTotal - totalPaid);

                      return (
                        <div key={order.id} className="profile-order-card">
                          <div className="order-meta-group">
                            <h4>Pedido {order.invoice_number ? `#${order.invoice_number}` : `#${order.id.slice(0, 8).toUpperCase()}`}</h4>
                            <p>Realizado el {orderDate} • {order.items_count} artículo{order.items_count !== 1 ? "s" : ""}</p>
                          </div>
                          <span className={`order-status-badge ${statusInfo.cssClass}`} style={{ backgroundColor: `${statusInfo.color}15`, color: statusInfo.color, borderColor: statusInfo.color }}>
                            {statusInfo.label}
                          </span>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: "15px" }}>Bs. {Number(displayTotal).toFixed(2)}</span>
                            {Number(order.dynamic_global_discount || 0) > 0 && (
                              <div style={{ fontSize: "11px", color: "var(--color-danger, #ef4444)" }}>
                                Desc: -Bs. {Number(order.dynamic_global_discount).toFixed(2)}
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

      <Footer />
    </div>
  );
}
