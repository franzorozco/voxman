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
  Clock,
  RotateCw,
  ShoppingCart,
  MessageCircle,
  Bell,
  Send,
  Hourglass,
  AlertTriangle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import useShopWishlistStore from "../../store/shop/useShopWishlistStore";
import useShopCartStore from "../../store/shop/useShopCartStore";
import { useShopSettingsStore } from "../../store/shop/useShopSettingsStore";
import Navbar from "../home/components/Navbar";
import Footer from "../../components/layout/Footer";
import { 
  getProfile, 
  updateProfile, 
  changePassword, 
  addAddress, 
  updateAddress, 
  deleteAddress,
  getMyOrders,
  getMyCarts,
  deleteMyCart,
  remindMyCart,
  revokeOtherSessions
} from "../../api/profile/profileApi";
import { getImageUrl, getVariantImageUrl } from "../../utils/imageUtils";
import AddressMapPicker from "../../components/ui/AddressMapPicker";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { verifyRegisterCode, resendRegisterCode } from "../../api/admin/auth";
import "./Profile.css";

const CartCountdown = ({ expiresAt, status }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setIsExpired(status === "abandoned" || status === "expired");
      return;
    }

    const calculateTime = () => {
      const now = Date.now();
      const exp = new Date(expiresAt).getTime();
      const diff = exp - now;

      if (diff <= 0 || status === "abandoned" || status === "expired") {
        setTimeLeft(0);
        setIsExpired(true);
      } else {
        setTimeLeft(diff);
        setIsExpired(false);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, status]);

  if (["ordered", "converted", "completed", "cancelled", "disabled", "inactive"].includes(status)) {
    return null;
  }

  if (isExpired || (expiresAt && timeLeft !== null && timeLeft <= 0)) {
    return (
      <div className="profile-cart-countdown-bar expired">
        <span className="countdown-status-dot expired" />
        <span className="countdown-bar-label">Reserva expirada</span>
        <span className="countdown-bar-sep">·</span>
        <span className="countdown-bar-hint">
          Reactivar por WhatsApp o botón Reactivar
        </span>
      </div>
    );
  }

  if (timeLeft === null || !expiresAt) {
    return null;
  }

  const totalSeconds = Math.floor(timeLeft / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const isUrgent = timeLeft < 3600 * 1000;
  const pad = (n) => String(n).padStart(2, "0");

  const formattedTime = days > 0 
    ? `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s` 
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return (
    <div className={`profile-cart-countdown-bar ${isUrgent ? "urgent" : "active"}`}>
      <span className={`countdown-status-dot ${isUrgent ? "urgent" : "active"}`} />
      <span className="countdown-bar-label">{isUrgent ? "Expira en:" : "Reserva activa:"}</span>
      <span className="countdown-timer-val">{formattedTime}</span>
    </div>
  );
};


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
  const [revokingSessions, setRevokingSessions] = useState(false);
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
  const [orderFilter, setOrderFilter] = useState("all"); // all, pending, in_transit, completed, carts
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Carts State
  const [carts, setCarts] = useState([]);
  const [cartsLoading, setCartsLoading] = useState(false);
  const [expandedCartId, setExpandedCartId] = useState(null);
  const [remindingCartId, setRemindingCartId] = useState(null);

  // Shop Settings Store (WhatsApp phone, store info)
  const { settings: shopSettings, fetchSettings: fetchShopSettings } = useShopSettingsStore();

  useEffect(() => {
    fetchShopSettings();
  }, [fetchShopSettings]);

  // Wishlist Store & Cart Store
  const { items: wishlistItems, loading: wishlistLoading, fetchWishlist, toggleWishlist } = useShopWishlistStore();
  const { addToCart } = useShopCartStore();
  const [addingToCartItemId, setAddingToCartItemId] = useState(null);

  const handleAddWishlistItemToCart = async (item) => {
    // If bundle or no variant specified, take them to the product/bundle page to pick choices
    if (item.is_bundle || !item.variant_id) {
      const basePath = item.is_bundle
        ? `/shop/bundle/${item.product_id}`
        : `/shop/product/${item.product_id}`;
      const params = new URLSearchParams();
      if (item.variant?.color) params.set("color", item.variant.color);
      const productLink = params.toString() ? `${basePath}?${params}` : basePath;
      
      toast("Selecciona tu talla y color para agregar a tu carrito.", { icon: "🛍️" });
      navigate(productLink);
      return;
    }

    try {
      setAddingToCartItemId(item.id);
      await addToCart(item.product_id, item.variant_id, 1, item.variant?.color || null);
      toast.success(`¡${item.product_name || "Prenda"} añadida al carrito!`, {
        icon: "🛒"
      });
    } catch (err) {
      console.error("Error adding wishlist item to cart:", err);
      const errMsg = err.response?.data?.message || "No se pudo añadir al carrito. Revisa la disponibilidad.";
      toast.error(errMsg);
    } finally {
      setAddingToCartItemId(null);
    }
  };

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
    if (profileForm.customer_code?.trim() !== originalCode) {
      openConfirmModal({
        title: "Confirmar Cambio de Carnet",
        message: `Estás a punto de cambiar tu Número de Carnet a ${profileForm.customer_code}. Recuerda que no podrás modificarlo nuevamente en los próximos 2 meses. ¿Deseas guardar los cambios?`,
        confirmText: "Sí, guardar",
        cancelText: "Cancelar",
        type: "warning",
        onConfirm: () => executeProfileSubmit()
      });
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

  // Handle Revoking Other Active Sessions
  const handleRevokeOtherSessions = () => {
    openConfirmModal({
      title: "Cerrar otras sesiones",
      message: "¿Estás seguro de que deseas cerrar todas las demás sesiones activas en otros dispositivos o navegadores? Tu sesión actual en este navegador permanecerá abierta.",
      confirmText: "Cerrar otras sesiones",
      cancelText: "Cancelar",
      type: "warning",
      onConfirm: async () => {
        try {
          setRevokingSessions(true);
          const res = await revokeOtherSessions();
          toast.success(res?.message || "Otras sesiones cerradas exitosamente.");
        } catch (err) {
          console.error("Error revoking other sessions:", err);
          toast.error(err.response?.data?.message || "No se pudieron cerrar las otras sesiones.");
        } finally {
          setRevokingSessions(false);
        }
      }
    });
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

  // Generic Confirm Modal State
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    type: "warning",
    onConfirm: () => {}
  });

  const openConfirmModal = ({ title, message, confirmText = "Confirmar", cancelText = "Cancelar", type = "warning", onConfirm }) => {
    setConfirmModalConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm
    });
  };

  const closeConfirmModal = () => {
    setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeleteAddress = (id) => {
    openConfirmModal({
      title: "Eliminar dirección",
      message: "¿Estás seguro de que deseas eliminar esta dirección de envío?",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteAddress(id);
          toast.success("Dirección eliminada.");
          setAddresses(prev => prev.filter(a => a.id !== id));
        } catch (err) {
          console.error("Error deleting address:", err);
          toast.error("Error al eliminar la dirección.");
        }
      }
    });
  };

  const handleLogout = () => {
    openConfirmModal({
      title: "Cerrar sesión",
      message: "¿Estás seguro de que deseas cerrar sesión?",
      confirmText: "Sí, salir",
      cancelText: "Cancelar",
      type: "warning",
      onConfirm: () => {
        logout();
        toast.success("Sesión cerrada.");
        navigate("/");
      }
    });
  };

  // Load orders when tab is activated or filter changes
  const loadOrders = useCallback(async (filter) => {
    try {
      setOrdersLoading(true);
      const params = {};
      if (filter && filter !== "all" && filter !== "carts") {
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

  // Load registered carts from /carts
  const loadCarts = useCallback(async () => {
    try {
      setCartsLoading(true);
      const data = await getMyCarts();
      setCarts(Array.isArray(data) ? data : (data?.carts || []));
    } catch (err) {
      console.error("Error loading carts:", err);
      toast.error("Error al cargar tus carritos.");
    } finally {
      setCartsLoading(false);
    }
  }, []);

  const handleDeleteCart = (cartId) => {
    openConfirmModal({
      title: "Eliminar carrito",
      message: "¿Estás seguro de que deseas eliminar este carrito registrado? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteMyCart(cartId);
          toast.success("Carrito eliminado correctamente.");
          setCarts(prev => prev.filter(c => c.id !== cartId));
        } catch (err) {
          console.error("Error deleting cart:", err);
          toast.error(err.response?.data?.message || "No se pudo eliminar el carrito.");
        }
      }
    });
  };

  // Generate customized WhatsApp URL based on cart expiration status
  const generateCartWhatsAppUrl = (cart) => {
    const rawPhone = shopSettings?.store_phone || "+59157003312";
    const phone = rawPhone.replace(/[^0-9]/g, "");
    const refCode = cart.reference_number || (cart.id ? `#${cart.id.slice(0, 8).toUpperCase()}` : "N/A");
    const isExpired = cart.status === "abandoned" || cart.status === "expired" || (cart.expires_at && new Date(cart.expires_at).getTime() < Date.now());
    const customerName = userData?.full_name || [userData?.profile?.first_name, userData?.profile?.last_name_paternal].filter(Boolean).join(" ") || userData?.username || "Cliente VOXMAN";
    const total = Number(cart.total_amount_calculated ?? cart.total_amount ?? 0).toFixed(2);

    const message = isExpired
      ? `Hola VOXMAN, soy ${customerName}. Tengo mi carrito pendiente ${refCode} (Total: Bs. ${total}) que ha expirado y no pude atender a tiempo. Quiero reactivar mi pedido, todos mis datos registrados son correctos.`
      : `Hola VOXMAN, soy ${customerName}. Tengo mi carrito pendiente ${refCode} (Total: Bs. ${total}) y deseo coordinar la entrega y detalles para concretar mi compra. Todos mis datos registrados son correctos.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // Handle sending reminder or reactivation request to owners (max 1 per 24 hours)
  const handleRemindCart = (cart) => {
    const isConvertedOrDisabled = ["ordered", "converted", "completed", "cancelled", "disabled", "inactive"].includes(cart.status) || cart.is_actionable === false;
    if (isConvertedOrDisabled) {
      toast.error("Este carrito ya fue convertido a entrega o desactivado.");
      return;
    }

    const isExpired = cart.status === "abandoned" || cart.status === "expired" || (cart.expires_at && new Date(cart.expires_at).getTime() < Date.now());
    const refCode = cart.reference_number || (cart.id ? `#${cart.id.slice(0, 8).toUpperCase()}` : "N/A");

    openConfirmModal({
      title: isExpired ? "Solicitar Reactivación de Carrito" : "Recordatorio de Entrega",
      message: isExpired
        ? `¿Deseas enviar una notificación por correo a los encargados de los productos para reactivar tu carrito ${refCode}? Solo puedes enviar 1 solicitud al día.`
        : `¿Deseas enviar un recordatorio por correo a los encargados para agendar la entrega de tu pedido ${refCode}? Solo puedes enviar 1 recordatorio al día.`,
      confirmText: isExpired ? "Solicitar Reactivación" : "Enviar Recordatorio",
      cancelText: "Cancelar",
      type: "info",
      onConfirm: async () => {
        try {
          setRemindingCartId(cart.id);
          const res = await remindMyCart(cart.id);
          toast.success(res?.message || "Notificación enviada con éxito.");
          setCarts(prev => prev.map(c => c.id === cart.id ? {
            ...c,
            can_remind: false,
            last_reminder_sent_at: res?.last_reminder_sent_at || new Date().toISOString(),
            next_reminder_at: res?.next_reminder_at || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          } : c));
        } catch (err) {
          console.error("Error sending cart reminder:", err);
          toast.error(err.response?.data?.message || "No se pudo enviar el recordatorio.");
        } finally {
          setRemindingCartId(null);
        }
      }
    });
  };

  // Helper for cart status badge
  const getCartStatusInfo = (status, expiresAt) => {
    if (expiresAt && new Date(expiresAt).getTime() < Date.now() && status === 'active') {
      return { label: 'Expirado', key: 'expired' };
    }
    switch (status) {
      case 'active':
        return { label: 'Activo', key: 'active' };
      case 'proforma':
        return { label: 'Proforma', key: 'proforma' };
      case 'ordered':
      case 'converted':
        return { label: 'Comprado', key: 'converted' };
      case 'abandoned':
      case 'expired':
        return { label: 'Expirado', key: 'expired' };
      default:
        return { label: status || 'Registrado', key: 'default' };
    }
  };

  // Helper for cart item image using the official Voxman variant image hierarchy
  const getCartItemImage = (item) => {
    if (!item) return null;
    const variant = item.product_variant || item.variant;
    if (variant) {
      const img = getVariantImageUrl(variant);
      if (img) return img;
    }
    if (item.image) {
      return getImageUrl(item.image);
    }
    return null;
  };

  // Helper for formatted destination details (minimalist & clean, eliminates "null", "undefined")
  const getCartDeliveryText = (deliveryDetails) => {
    if (!deliveryDetails) return null;
    if (typeof deliveryDetails === "string") {
      const trimmed = deliveryDetails.trim();
      if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined" || trimmed === "{}") return null;
      return trimmed;
    }
    if (typeof deliveryDetails === "object") {
      const parts = [
        deliveryDetails.department,
        deliveryDetails.state,
        deliveryDetails.city,
        deliveryDetails.zone,
        deliveryDetails.street,
        deliveryDetails.address,
        deliveryDetails.reference,
        deliveryDetails.notes
      ].filter(p => {
        if (!p) return false;
        const str = String(p).trim();
        return str.length > 0 && str.toLowerCase() !== "null" && str.toLowerCase() !== "undefined";
      });
      return parts.length > 0 ? parts.join(" • ") : null;
    }
    return null;
  };

  // Helper for order item image using variant or primary image
  const getOrderItemImage = (item) => {
    if (!item) return null;
    const variant = item.product_variant || item.variant;
    if (variant) {
      const img = getVariantImageUrl(variant);
      if (img) return img;
    }
    if (item.image) {
      return getImageUrl(item.image);
    }
    return null;
  };

  // Helper for order delivery address text
  const getOrderDeliveryText = (order) => {
    const mainShipment = order.shipments?.[0];
    if (!mainShipment) return null;
    if (mainShipment.delivery_type === "pickup") {
      return "Retiro en tienda / sucursal";
    }
    const addr = mainShipment.address;
    if (!addr) return null;
    if (typeof addr === "string") {
      const trimmed = addr.trim();
      if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return null;
      return trimmed;
    }
    if (typeof addr === "object") {
      const parts = [
        addr.department || addr.state,
        addr.city,
        addr.zone,
        addr.street,
        addr.reference ? `Ref: ${addr.reference}` : null
      ].filter(p => {
        if (!p) return false;
        const str = String(p).trim();
        return str.length > 0 && str.toLowerCase() !== "null" && str.toLowerCase() !== "undefined";
      });
      return parts.length > 0 ? parts.join(" • ") : null;
    }
    return null;
  };

  // Helper for order WhatsApp contact link
  const generateOrderWhatsAppUrl = (order) => {
    const rawPhone = shopSettings?.store_phone || "+59157003312";
    const phone = rawPhone.replace(/[^0-9]/g, "");
    const orderRef = order.invoice_number ? `#${order.invoice_number}` : (order.id ? `#${order.id.slice(0, 8).toUpperCase()}` : "N/A");
    const customerName = userData?.full_name || [userData?.profile?.first_name, userData?.profile?.last_name_paternal].filter(Boolean).join(" ") || userData?.username || "Cliente VOXMAN";
    const grandTotal = Number(order.financials?.grand_total ?? order.total ?? order.dynamic_total ?? 0).toFixed(2);
    const mainShipment = order.shipments?.[0];
    const schedule = mainShipment?.delivery_schedule;
    const statusInfo = getDeliveryStatusInfo(schedule, mainShipment);

    const message = `Hola VOXMAN, soy ${customerName}. Tengo una consulta sobre mi pedido ${orderRef} (Total: Bs. ${grandTotal}, Estado: ${statusInfo.label}).`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // Fetch data when switching tabs
  useEffect(() => {
    if (activeTab === "orders") {
      loadCarts(); // preload carts count
      if (orderFilter === "carts") {
        loadCarts();
      } else {
        loadOrders(orderFilter);
      }
    } else if (activeTab === "wishlist") {
      fetchWishlist();
    }
  }, [activeTab]);

  // Refetch orders or carts when filter changes
  useEffect(() => {
    if (activeTab === "orders") {
      if (orderFilter === "carts") {
        loadCarts();
      } else {
        loadOrders(orderFilter);
      }
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
        { id: "loyalty", label: "Puntos & Club VIP", icon: Award, desc: "Puntos y recompensas", tag: "PRÓXIMAMENTE" },
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
    <div className={`profile-page-wrapper ${profileIsDark ? "profile-dark-mode" : "profile-light-mode"}`}>
      <Navbar isDarkThemeOverride={profileIsDark} />

      <main className="profile-main-container">
        {/* =========================================
            BANNER DE VERIFICACIÓN DE CORREO DIFERIDA (OPCIÓN B)
            ========================================= */}
        {userData && !userData.is_email_verified && !userData.email_verified_at && (
          <div className="profile-email-verify-card">
            <div className="profile-email-verify-content">
              <div className="profile-email-verify-icon">
                <Mail size={22} />
              </div>
              <div className="profile-email-verify-text">
                <div className="profile-email-verify-title-row">
                  <h3 className="profile-email-verify-title">
                    Confirma tu correo electrónico
                  </h3>
                  <span className="profile-email-verify-badge">
                    <Clock size={11} /> Acción requerida
                  </span>
                </div>
                <p className="profile-email-verify-desc">
                  Hemos enviado un código de 6 dígitos a <strong className="profile-email-target">{userData.email}</strong>. Ingrésalo para verificar tu cuenta y mantenerla activa.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyEmailCode} className="profile-email-verify-form">
              <div className="profile-email-verify-input-wrapper">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Código de 6 dígitos"
                  value={verifyCodeInput}
                  onChange={(e) => setVerifyCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="profile-email-verify-input"
                  aria-label="Código de verificación"
                />
              </div>

              <button
                type="submit"
                disabled={verifyingEmail || verifyCodeInput.length !== 6}
                className="profile-email-verify-btn-confirm"
              >
                {verifyingEmail ? (
                  <>
                    <Loader2 size={15} className="profile-email-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>Confirmar código</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendEmailCode}
                disabled={resendingEmail || resendCooldown > 0}
                className="profile-email-verify-btn-resend"
              >
                {resendingEmail ? (
                  <>
                    <Loader2 size={13} className="profile-email-spin" />
                    <span>Enviando...</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <Clock size={13} />
                    <span>Reenviar ({resendCooldown}s)</span>
                  </>
                ) : (
                  <>
                    <RotateCw size={13} />
                    <span>Reenviar código</span>
                  </>
                )}
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
                      <button
                        type="button"
                        className="profile-btn-outline"
                        style={{
                          fontSize: "11px",
                          padding: "6px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                        onClick={handleRevokeOtherSessions}
                        disabled={revokingSessions}
                        title="Cerrar sesiones en otros dispositivos manteniendo la actual"
                      >
                        {revokingSessions ? (
                          <>
                            <Loader2 size={12} style={{ animation: "profileSpin 0.8s linear infinite" }} />
                            <span>Cerrando...</span>
                          </>
                        ) : (
                          "Cerrar otras"
                        )}
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
                    { key: "completed", label: "Entregados" },
                    { key: "carts", label: "Carritos", icon: ShoppingCart }
                  ].map(f => (
                    <button
                      key={f.key}
                      className={`profile-tab-pill ${orderFilter === f.key ? "active" : ""}`}
                      onClick={() => setOrderFilter(f.key)}
                    >
                      {f.icon && <f.icon size={13} style={{ marginRight: "5px", verticalAlign: "middle" }} />}
                      {f.label}
                      {f.key === "carts" && carts.length > 0 && (
                        <span className="profile-pill-badge">{carts.length}</span>
                      )}
                    </button>
                  ))}
                </div>

                {orderFilter === "carts" ? (
                  cartsLoading ? (
                    <div className="profile-empty-state" style={{ padding: "40px 0" }}>
                      <Loader2 size={32} style={{ animation: "profileSpin 0.8s linear infinite" }} />
                      <p>Cargando carritos...</p>
                    </div>
                  ) : carts.length === 0 ? (
                    <div className="profile-empty-state" style={{ padding: "32px 0" }}>
                      <ShoppingCart size={48} />
                      <h3>No tienes carritos registrados</h3>
                      <p>Los productos que agregues a tu carrito aparecerán registrados aquí.</p>
                      <Link to="/shop/catalog" className="profile-btn-primary" style={{ display: "inline-flex", marginTop: "8px" }}>
                        Explorar Catálogo
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {carts.map((cart) => {
                        const statusInfo = getCartStatusInfo(cart.status, cart.expires_at);
                        const cartDate = cart.created_at
                          ? new Date(cart.created_at).toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "";
                        const itemsCount = cart.items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 0;
                        const grandTotal = Number(cart.total_amount_calculated ?? cart.total_amount ?? 0);
                        const globalDiscount = Number(cart.global_discount_calculated ?? cart.total_discount ?? 0);
                        const isExpanded = expandedCartId === cart.id;
                        const deliveryText = getCartDeliveryText(cart.delivery_details);
                        const isConvertedOrDisabled = ["ordered", "converted", "completed", "cancelled", "disabled", "inactive"].includes(cart.status) || cart.is_actionable === false;
                        const isExpired = !isConvertedOrDisabled && (cart.status === "abandoned" || cart.status === "expired" || (cart.expires_at && new Date(cart.expires_at).getTime() < Date.now()));
                        const waUrl = isConvertedOrDisabled ? "#" : generateCartWhatsAppUrl(cart);
                        const canRemind = !isConvertedOrDisabled && cart.can_remind !== false;

                        return (
                          <div key={cart.id} className="profile-cart-card">
                            <div className="profile-cart-header">
                              <div className="profile-cart-header-left">
                                <div className="profile-cart-ref-badge">
                                  <ShoppingCart size={15} />
                                  <span>Carrito #{cart.reference_number || cart.id.slice(0, 8).toUpperCase()}</span>
                                </div>
                                <span className="profile-cart-meta-date">
                                  <Clock size={12} /> {cartDate}
                                </span>
                                {cart.source && (
                                  <span className="profile-cart-source-tag">
                                    {cart.source.toUpperCase()}
                                  </span>
                                )}
                              </div>

                              <div className="profile-cart-header-right">
                                <span className={`profile-cart-status-badge ${statusInfo.key}`}>
                                  {statusInfo.label}
                                </span>
                                <div className="profile-cart-total-badge">
                                  <span className="profile-cart-total-val">Bs. {grandTotal.toFixed(2)}</span>
                                  {globalDiscount > 0 && (
                                    <span className="profile-cart-discount-val">
                                      -Bs. {globalDiscount.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Live Countdown & Expiration Banner */}
                            <CartCountdown expiresAt={cart.expires_at} status={cart.status} />

                            {/* Stock warning banner if any item in cart has stock issues */}
                            {!isConvertedOrDisabled && cart.has_stock_issues && (
                              <div className="profile-cart-alert-bar stock-warning">
                                <AlertTriangle size={13} />
                                <span>Atención: Uno o más artículos de este carrito están agotados o con existencias limitadas en tienda.</span>
                              </div>
                            )}

                            {/* Quick Thumbnails Row */}
                            <div className="profile-cart-preview-row">
                              <div className="profile-cart-thumbnails">
                                {cart.items?.slice(0, 5).map((item, idx) => {
                                  const imgUrl = getCartItemImage(item);
                                  const prodName = item.product_variant?.product?.name || "Prenda";
                                  const itemHasIssue = !isConvertedOrDisabled && (item.has_stock === false || item.stock_status === 'out_of_stock' || item.stock_status === 'insufficient');

                                  return (
                                    <div key={item.id || idx} className={`profile-cart-thumb ${itemHasIssue ? "has-stock-issue" : ""}`} title={prodName}>
                                      {imgUrl ? (
                                        <img 
                                          src={imgUrl} 
                                          alt={prodName}
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            if (e.currentTarget.nextSibling) {
                                              e.currentTarget.nextSibling.style.display = 'flex';
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div className="profile-cart-thumb-placeholder" style={{ display: imgUrl ? 'none' : 'flex' }}>
                                        <ShoppingBag size={15} />
                                      </div>
                                      {item.quantity > 1 && (
                                        <span className="profile-cart-thumb-qty">x{item.quantity}</span>
                                      )}
                                      {itemHasIssue && (
                                        <span className="profile-cart-thumb-issue-dot" title="Stock limitado o agotado" />
                                      )}
                                    </div>
                                  );
                                })}
                                {cart.items?.length > 5 && (
                                  <div className="profile-cart-thumb-more">
                                    +{cart.items.length - 5}
                                  </div>
                                )}
                              </div>

                              <div className="profile-cart-actions">
                                {isConvertedOrDisabled ? (
                                  <button
                                    type="button"
                                    className="profile-cart-wa-btn disabled"
                                    disabled
                                    title="Este carrito ya fue convertido a entrega o desactivado"
                                  >
                                    <MessageCircle size={14} />
                                    <span>WhatsApp</span>
                                  </button>
                                ) : (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="profile-cart-wa-btn"
                                    title="Contactar y coordinar o reactivar por WhatsApp"
                                  >
                                    <MessageCircle size={14} />
                                    <span>WhatsApp</span>
                                  </a>
                                )}

                                <button
                                  type="button"
                                  className={`profile-cart-remind-btn ${isExpired ? "expired-mode" : ""}`}
                                  onClick={() => handleRemindCart(cart)}
                                  disabled={isConvertedOrDisabled || !canRemind || remindingCartId === cart.id}
                                  title={
                                    isConvertedOrDisabled
                                      ? "Este carrito ya fue convertido a entrega o desactivado"
                                      : !canRemind
                                        ? "Solo puedes enviar 1 recordatorio cada 24 horas"
                                        : isExpired
                                          ? "Solicitar reactivación a encargados"
                                          : "Recordar agendar entrega"
                                  }
                                >
                                  {remindingCartId === cart.id ? (
                                    <Loader2 size={14} style={{ animation: "profileSpin 0.8s linear infinite" }} />
                                  ) : (
                                    <Bell size={14} />
                                  )}
                                  <span>
                                    {isConvertedOrDisabled
                                      ? "Recordar"
                                      : !canRemind
                                        ? "Enviado hoy"
                                        : isExpired
                                          ? "Reactivar"
                                          : "Recordar"}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  className="profile-cart-toggle-btn"
                                  onClick={() => setExpandedCartId(isExpanded ? null : cart.id)}
                                >
                                  <span>{isExpanded ? "Ocultar" : `Ver (${itemsCount})`}</span>
                                  <ChevronDown
                                    size={15}
                                    style={{
                                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                      transition: "transform 0.2s ease"
                                    }}
                                  />
                                </button>
                                <button
                                  type="button"
                                  className="profile-cart-delete-btn"
                                  onClick={() => handleDeleteCart(cart.id)}
                                  title="Eliminar carrito"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            {/* Collapsible Items Breakdown */}
                            {isExpanded && (
                              <div className="profile-cart-expanded-body">
                                {!isConvertedOrDisabled && cart.global_discount_expired && (
                                  <div className="profile-cart-alert-bar discount-expired">
                                    <AlertCircle size={13} />
                                    <span>{cart.global_discount_error || "El cupón de descuento global aplicado ha expirado o ya no está disponible."}</span>
                                  </div>
                                )}

                                <div className="profile-cart-items-list">
                                  {cart.items?.map((item) => {
                                    const imgUrl = getCartItemImage(item);
                                    const productName = item.product_variant?.product?.name || "Producto";
                                    const sizeName = item.product_variant?.size?.name;
                                    const fitName = item.product_variant?.fit?.name;
                                    const colorAttr = item.product_variant?.variant_attribute_values
                                      ?.map(v => v.attribute_value?.name || v.attribute_value?.value)
                                      .filter(Boolean)
                                      .join(", ");
                                    const unitPrice = Number(item.calculated_unit_price ?? item.dynamic_unit_price ?? item.product_variant?.price ?? 0);
                                    const originalPrice = Number(item.original_unit_price ?? item.regular_price ?? item.product_variant?.price ?? unitPrice);
                                    const subtotal = Number(item.calculated_subtotal ?? item.dynamic_subtotal ?? (unitPrice * item.quantity));
                                    const hasActiveDiscount = Boolean(item.has_active_discount || (item.appliedDiscount && !item.discount_is_expired && originalPrice > unitPrice));
                                    const discountExpired = !isConvertedOrDisabled && Boolean(item.discount_is_expired);
                                    const stockStatus = item.stock_status || "in_stock";
                                    const availableStock = Number(item.available_stock ?? item.product_variant?.inventories?.reduce((s, inv) => s + (inv.stock || 0), 0) ?? 0);

                                    return (
                                      <div key={item.id} className="profile-cart-item-row">
                                        <div className="profile-cart-item-img-wrap">
                                          {imgUrl ? (
                                            <img 
                                              src={imgUrl} 
                                              alt={productName}
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                if (e.currentTarget.nextSibling) {
                                                  e.currentTarget.nextSibling.style.display = 'flex';
                                                }
                                              }}
                                            />
                                          ) : null}
                                          <div className="profile-cart-thumb-placeholder" style={{ display: imgUrl ? 'none' : 'flex' }}>
                                            <ShoppingBag size={18} />
                                          </div>
                                        </div>

                                        <div className="profile-cart-item-info">
                                          <div className="profile-cart-item-title-row">
                                            <h5 className="profile-cart-item-title">{productName}</h5>
                                            <div className="profile-cart-item-subtotal-box">
                                              {hasActiveDiscount && originalPrice * item.quantity > subtotal && (
                                                <span className="profile-cart-item-orig-subtotal">
                                                  Bs. {(originalPrice * item.quantity).toFixed(2)}
                                                </span>
                                              )}
                                              <span className="profile-cart-item-subtotal">Bs. {subtotal.toFixed(2)}</span>
                                            </div>
                                          </div>

                                          <div className="profile-cart-item-meta">
                                            {sizeName && <span className="profile-cart-pill">Talla: {sizeName}</span>}
                                            {fitName && <span className="profile-cart-pill">Corte: {fitName}</span>}
                                            {colorAttr && <span className="profile-cart-pill">Color: {colorAttr}</span>}
                                            {item.product_variant?.sku && (
                                              <span className="profile-cart-pill-sku">SKU: {item.product_variant.sku}</span>
                                            )}
                                            {/* Stock Status Badge (only on non-converted carts) */}
                                            {!isConvertedOrDisabled && (
                                              stockStatus === "out_of_stock" || stockStatus === "unavailable" ? (
                                                <span className="profile-cart-stock-badge out-of-stock" title="No hay stock disponible en el inventario">
                                                  Agotado
                                                </span>
                                              ) : stockStatus === "insufficient" ? (
                                                <span className="profile-cart-stock-badge insufficient" title={`Solo quedan ${availableStock} unidades disponibles`}>
                                                  Solo quedan {availableStock} disp.
                                                </span>
                                              ) : (
                                                <span className="profile-cart-stock-badge in-stock">
                                                  En stock ({availableStock})
                                                </span>
                                              )
                                            )}
                                          </div>

                                          <div className="profile-cart-item-pricing">
                                            <span>Cant: <strong>{item.quantity}</strong></span>
                                            <span>•</span>
                                            <span className="profile-cart-price-block">
                                              Precio unitario:{" "}
                                              {hasActiveDiscount && originalPrice > unitPrice ? (
                                                <>
                                                  <span className="profile-cart-item-old-price">
                                                    Bs. {originalPrice.toFixed(2)}
                                                  </span>
                                                  <strong className="profile-cart-item-current-price">
                                                    Bs. {unitPrice.toFixed(2)}
                                                  </strong>
                                                </>
                                              ) : (
                                                <strong>Bs. {unitPrice.toFixed(2)}</strong>
                                              )}
                                            </span>
                                            {hasActiveDiscount && (
                                              <span className="profile-cart-item-discount-tag">
                                                {item.discount_label || item.discount_name || item.appliedDiscount?.name || "Descuento aplicado"}
                                              </span>
                                            )}
                                            {discountExpired && (
                                              <span className="profile-cart-item-discount-expired-tag" title={item.discount_expired_reason || "El descuento ha expirado o ya no aplica"}>
                                                Descuento expirado
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Delivery details note only if present */}
                                {deliveryText && (
                                  <div className="profile-cart-delivery-note">
                                    <MapPin size={13} />
                                    <span>
                                      <strong>Destino:</strong> {deliveryText}
                                    </span>
                                  </div>
                                )}

                                {/* Cart Footer Actions */}
                                <div className="profile-cart-footer">
                                  <div className="profile-cart-footer-left">
                                    {cart.status === "active" && !isExpired && !isConvertedOrDisabled && (
                                      <Link to="/shop/cart" className="profile-cart-checkout-btn">
                                        <ShoppingCart size={15} />
                                        Ir al Carrito
                                      </Link>
                                    )}

                                    {isConvertedOrDisabled ? (
                                      <button
                                        type="button"
                                        className="profile-cart-wa-btn disabled"
                                        disabled
                                        title="Este carrito ya fue convertido a entrega o desactivado"
                                      >
                                        <MessageCircle size={14} />
                                        <span>WhatsApp</span>
                                      </button>
                                    ) : (
                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="profile-cart-wa-btn"
                                        title="Enviar mensaje por WhatsApp"
                                      >
                                        <MessageCircle size={14} />
                                        <span>WhatsApp</span>
                                      </a>
                                    )}

                                    <button
                                      type="button"
                                      className={`profile-cart-remind-btn ${isExpired ? "expired-mode" : ""}`}
                                      onClick={() => handleRemindCart(cart)}
                                      disabled={isConvertedOrDisabled || !canRemind || remindingCartId === cart.id}
                                      title={
                                        isConvertedOrDisabled
                                          ? "Este carrito ya fue convertido a entrega o desactivado"
                                          : !canRemind
                                            ? "Solo puedes enviar 1 recordatorio cada 24 horas"
                                            : isExpired
                                              ? "Solicitar reactivación a los encargados"
                                              : "Recordar agendar entrega"
                                      }
                                    >
                                      {remindingCartId === cart.id ? (
                                        <Loader2 size={14} style={{ animation: "profileSpin 0.8s linear infinite" }} />
                                      ) : (
                                        <Bell size={14} />
                                      )}
                                      <span>
                                        {isConvertedOrDisabled
                                          ? "Recordar Entrega"
                                          : !canRemind 
                                            ? "Recordatorio enviado hoy" 
                                            : isExpired 
                                              ? "Solicitar Reactivación" 
                                              : "Recordar Entrega"}
                                      </span>
                                    </button>
                                  </div>
                                  <div className="profile-cart-footer-totals">
                                    <div className="profile-cart-summary-line">
                                      <span>Subtotal:</span>
                                      <span>Bs. {Number(cart.subtotal_calculated ?? grandTotal).toFixed(2)}</span>
                                    </div>
                                    {globalDiscount > 0 && !cart.global_discount_expired && (
                                      <div className="profile-cart-summary-line discount">
                                        <span>Descuento global:</span>
                                        <span>-Bs. {globalDiscount.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {cart.global_discount_expired && (
                                      <div className="profile-cart-summary-line discount-expired-notice">
                                        <span>Descuento global:</span>
                                        <span>Expirado</span>
                                      </div>
                                    )}
                                    <div className="profile-cart-summary-line total">
                                      <span>Total:</span>
                                      <span>Bs. {grandTotal.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  ordersLoading ? (
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {orders.map((order) => {
                        const mainShipment = order.shipments?.[0];
                        const schedule = mainShipment?.delivery_schedule;
                        const statusInfo = getDeliveryStatusInfo(schedule, mainShipment);
                        const orderDate = order.created_at
                          ? new Date(order.created_at).toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "";
                        const trackingId = schedule?.id || mainShipment?.id;

                        const grandTotal = Number(order.financials?.grand_total ?? order.total ?? order.dynamic_total ?? 0);
                        const totalPaid = Number(order.financials?.total_paid ?? 0);
                        const balanceDue = Number(order.financials?.balance_due ?? 0);
                        const globalDiscount = Number(order.financials?.global_discount ?? order.dynamic_global_discount ?? 0);
                        const isPaid = order.status === 'paid' || order.financials?.is_fully_paid === true || (grandTotal > 0 && totalPaid >= grandTotal);

                        const orderItems = order.items || order.sale_details || [];
                        const itemsCount = order.financials?.items_count ?? orderItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
                        const isExpanded = expandedOrderId === order.id;
                        const deliveryText = getOrderDeliveryText(order);
                        const waUrl = generateOrderWhatsAppUrl(order);

                        return (
                          <div key={order.id} className="profile-cart-card">
                            <div className="profile-cart-header">
                              <div className="profile-cart-header-left">
                                <div className="profile-cart-ref-badge">
                                  <Package size={15} />
                                  <span>Pedido {order.invoice_number ? `#${order.invoice_number}` : `#${order.id.slice(0, 8).toUpperCase()}`}</span>
                                </div>
                                <span className="profile-cart-meta-date">
                                  <Clock size={12} /> {orderDate}
                                </span>
                                {order.source && (
                                  <span className="profile-cart-source-tag">
                                    {order.source.toUpperCase()}
                                  </span>
                                )}
                              </div>

                              <div className="profile-cart-header-right">
                                <span
                                  className="profile-cart-status-badge"
                                  style={{
                                    backgroundColor: `${statusInfo.color}15`,
                                    color: statusInfo.color,
                                    border: `1px solid ${statusInfo.color}40`
                                  }}
                                >
                                  {statusInfo.label}
                                </span>
                                <div className="profile-cart-total-badge">
                                  <span className="profile-cart-total-val">Bs. {grandTotal.toFixed(2)}</span>
                                  {globalDiscount > 0 && (
                                    <span className="profile-cart-discount-val">
                                      -Bs. {globalDiscount.toFixed(2)}
                                    </span>
                                  )}
                                  {isPaid ? (
                                    <span className="profile-order-header-paid-tag">✓ Pagado</span>
                                  ) : balanceDue > 0 ? (
                                    <span className="profile-order-header-pending-tag">Saldo: Bs. {balanceDue.toFixed(2)}</span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {/* Quick Thumbnails & Actions Row */}
                            <div className="profile-cart-preview-row">
                              <div className="profile-cart-thumbnails">
                                {orderItems.slice(0, 5).map((item, idx) => {
                                  const imgUrl = getOrderItemImage(item);
                                  const prodName = item.product_name || item.product_variant?.product?.name || "Prenda";

                                  return (
                                    <div key={item.id || idx} className="profile-cart-thumb" title={prodName}>
                                      {imgUrl ? (
                                        <img 
                                          src={imgUrl} 
                                          alt={prodName}
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            if (e.currentTarget.nextSibling) {
                                              e.currentTarget.nextSibling.style.display = 'flex';
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div className="profile-cart-thumb-placeholder" style={{ display: imgUrl ? 'none' : 'flex' }}>
                                        <ShoppingBag size={15} />
                                      </div>
                                      {(item.quantity || 1) > 1 && (
                                        <span className="profile-cart-thumb-qty">x{item.quantity}</span>
                                      )}
                                    </div>
                                  );
                                })}
                                {orderItems.length > 5 && (
                                  <div className="profile-cart-thumb-more">
                                    +{orderItems.length - 5}
                                  </div>
                                )}
                              </div>

                              <div className="profile-cart-actions">
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="profile-cart-wa-btn"
                                  title="Consultar sobre este pedido por WhatsApp"
                                >
                                  <MessageCircle size={14} />
                                  <span>WhatsApp</span>
                                </a>

                                {trackingId && (
                                  <Link
                                    to={`/tracking/${trackingId}`}
                                    className="profile-order-track-btn"
                                    title="Ver seguimiento de entrega"
                                  >
                                    <Truck size={14} />
                                    <span>Seguimiento</span>
                                  </Link>
                                )}

                                <button
                                  type="button"
                                  className="profile-cart-toggle-btn"
                                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                >
                                  <span>{isExpanded ? "Ocultar" : `Ver (${itemsCount})`}</span>
                                  <ChevronDown
                                    size={15}
                                    style={{
                                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                      transition: "transform 0.2s ease"
                                    }}
                                  />
                                </button>
                              </div>
                            </div>

                            {/* Collapsible Items Breakdown */}
                            {isExpanded && (
                              <div className="profile-cart-expanded-body">
                                <div className="profile-cart-items-list">
                                  {orderItems.map((item, idx) => {
                                    const imgUrl = getOrderItemImage(item);
                                    const productName = item.product_name || item.product_variant?.product?.name || "Producto";
                                    const sizeName = item.size || item.product_variant?.size?.name;
                                    const fitName = item.fit || item.product_variant?.fit?.name;
                                    const colorAttr = item.product_variant?.variant_attribute_values
                                      ?.map(v => v.attribute_value?.name || v.attribute_value?.value)
                                      .filter(Boolean)
                                      .join(", ") || item.color;
                                    const sku = item.sku || item.product_variant?.sku;
                                    const unitPrice = Number(item.unit_price ?? item.dynamic_unit_price ?? item.final_price ?? 0);
                                    const originalPrice = Number(item.original_price ?? unitPrice);
                                    const subtotal = Number(item.final_price ?? item.dynamic_subtotal ?? (unitPrice * (item.quantity || 1)));
                                    const hasDiscount = originalPrice > unitPrice;

                                    return (
                                      <div key={item.id || idx} className="profile-cart-item-row">
                                        <div className="profile-cart-item-img-wrap">
                                          {imgUrl ? (
                                            <img 
                                              src={imgUrl} 
                                              alt={productName}
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                if (e.currentTarget.nextSibling) {
                                                  e.currentTarget.nextSibling.style.display = 'flex';
                                                }
                                              }}
                                            />
                                          ) : null}
                                          <div className="profile-cart-thumb-placeholder" style={{ display: imgUrl ? 'none' : 'flex' }}>
                                            <ShoppingBag size={18} />
                                          </div>
                                        </div>

                                        <div className="profile-cart-item-info">
                                          <div className="profile-cart-item-title-row">
                                            <h5 className="profile-cart-item-title">{productName}</h5>
                                            <div className="profile-cart-item-subtotal-box">
                                              {hasDiscount && originalPrice * (item.quantity || 1) > subtotal && (
                                                <span className="profile-cart-item-orig-subtotal">
                                                  Bs. {(originalPrice * (item.quantity || 1)).toFixed(2)}
                                                </span>
                                              )}
                                              <span className="profile-cart-item-subtotal">Bs. {subtotal.toFixed(2)}</span>
                                            </div>
                                          </div>

                                          <div className="profile-cart-item-meta">
                                            {sizeName && <span className="profile-cart-pill">Talla: {sizeName}</span>}
                                            {fitName && <span className="profile-cart-pill">Corte: {fitName}</span>}
                                            {colorAttr && <span className="profile-cart-pill">Color: {colorAttr}</span>}
                                            {sku && <span className="profile-cart-pill-sku">SKU: {sku}</span>}
                                          </div>

                                          <div className="profile-cart-item-pricing">
                                            <span>Cant: <strong>{item.quantity || 1}</strong></span>
                                            <span>•</span>
                                            <span className="profile-cart-price-block">
                                              Precio unitario:{" "}
                                              {hasDiscount ? (
                                                <>
                                                  <span className="profile-cart-item-old-price">
                                                    Bs. {originalPrice.toFixed(2)}
                                                  </span>
                                                  <strong className="profile-cart-item-current-price">
                                                    Bs. {unitPrice.toFixed(2)}
                                                  </strong>
                                                </>
                                              ) : (
                                                <strong>Bs. {unitPrice.toFixed(2)}</strong>
                                              )}
                                            </span>
                                            {hasDiscount && (
                                              <span className="profile-cart-item-discount-tag">
                                                Descuento aplicado
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Delivery details note */}
                                {deliveryText && (
                                  <div className="profile-cart-delivery-note">
                                    <MapPin size={13} />
                                    <span>
                                      <strong>Destino de entrega:</strong> {deliveryText}
                                    </span>
                                  </div>
                                )}

                                {/* Order Footer Totals */}
                                <div className="profile-cart-footer">
                                  <div className="profile-cart-footer-left">
                                    {trackingId && (
                                      <Link to={`/tracking/${trackingId}`} className="profile-cart-checkout-btn">
                                        <Truck size={15} />
                                        Ver Seguimiento
                                      </Link>
                                    )}
                                    <a
                                      href={waUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="profile-cart-wa-btn"
                                      title="Consultar por WhatsApp"
                                    >
                                      <MessageCircle size={14} />
                                      <span>WhatsApp</span>
                                    </a>
                                  </div>
                                  <div className="profile-cart-footer-totals">
                                    <div className="profile-cart-summary-line">
                                      <span>Subtotal artículos:</span>
                                      <span>Bs. {Number(order.financials?.subtotal ?? (grandTotal - (order.financials?.shipping_total || 0))).toFixed(2)}</span>
                                    </div>
                                    {globalDiscount > 0 && (
                                      <div className="profile-cart-summary-line discount">
                                        <span>Descuento global:</span>
                                        <span>-Bs. {globalDiscount.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {Number(order.financials?.shipping_total || 0) > 0 && (
                                      <div className="profile-cart-summary-line">
                                        <span>Costo de envío:</span>
                                        <span>Bs. {Number(order.financials.shipping_total).toFixed(2)}</span>
                                      </div>
                                    )}
                                    <div className="profile-cart-summary-line total">
                                      <span>Total Pedido:</span>
                                      <span>Bs. {grandTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="profile-order-payment-status-row">
                                      {isPaid ? (
                                        <span className="profile-order-paid-badge">
                                          <Check size={12} /> Pagado en su totalidad
                                        </span>
                                      ) : balanceDue > 0 ? (
                                        <span className="profile-order-pending-badge">
                                          <Clock size={12} /> Saldo pendiente: Bs. {balanceDue.toFixed(2)}
                                        </span>
                                      ) : (
                                        <span className="profile-order-pending-badge">
                                          <Clock size={12} /> Pendiente de confirmación
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
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

                            {/* Direct Add to Cart Action */}
                            <button
                              type="button"
                              className="profile-wishlist-add-btn"
                              onClick={() => handleAddWishlistItemToCart(item)}
                              disabled={addingToCartItemId === item.id}
                              title="Añadir a mi carrito de compras"
                            >
                              {addingToCartItemId === item.id ? (
                                <>
                                  <Loader2 size={13} style={{ animation: "profileSpin 0.8s linear infinite" }} />
                                  <span>Añadiendo...</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingCart size={13} />
                                  <span>Añadir al Carrito</span>
                                </>
                              )}
                            </button>

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

                {/* Letrero Grande "Próximamente" */}
                <div className="profile-coming-soon-banner">
                  <div className="profile-coming-soon-badge">
                    <Sparkles size={13} />
                    <span>CLUB DE BENEFICIOS</span>
                  </div>
                  <h1 className="profile-coming-soon-title">PRÓXIMAMENTE</h1>
                  <p className="profile-coming-soon-desc">
                    Estamos preparando el nuevo sistema de <strong>Puntos & Club VIP de VOXMAN</strong>. Muy pronto podrás acumular puntos en todas tus compras y desbloquear descuentos y accesos prioritarios.
                  </p>
                  <div className="profile-coming-soon-pill">
                    <Clock size={13} />
                    <span>Disponible en las próximas actualizaciones</span>
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

      {/* MODAL DE CONFIRMACIÓN ELEGANTE (CERRAR SESIÓN, ELIMINAR CARRITO, ELIMINAR DIRECCIÓN, CAMBIO DE CARNET) */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        type={confirmModalConfig.type}
        theme={profileIsDark ? "dark" : "light"}
      />

      <Footer />
    </div>
  );
}
