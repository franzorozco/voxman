import { useState, useEffect } from "react";
import { registerUser, checkRegisterEmail, verifyRegisterCode, resendRegisterCode, getGoogleAuthUrl } from "../../api/admin/auth";
import { useAuthStore } from "../../store/authStore";
import { useShopSettingsStore } from "../../store/shop/useShopSettingsStore";
import { getImageUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";
import "./Auth.css";
import { useNavigate, Link, useLocation } from "react-router-dom";
import fondo from "../../assets/global/fondos/premium_fashion_bg.png";
import { Mail, Lock, UserCheck, Eye, EyeOff, AlertCircle, AlertTriangle, CheckCircle, ShieldAlert, Shield, ShieldCheck, Phone, ArrowLeft, KeyRound, RefreshCw } from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_HAS_NUMBERS_REGEX = /\d/;

// Extrae automáticamente el nombre de cuenta (username) desde el correo sin ningún @dominio
const extractUsernameFromEmail = (rawEmail = "") => {
  const clean = (rawEmail || "").trim().toLowerCase();
  if (!clean) return "";
  return clean.includes("@") ? clean.split("@")[0].trim() : clean;
};

export default function Register() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { settings, fetchSettings } = useShopSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isGoogleReg, setIsGoogleReg] = useState(false);
  const [googleRegToken, setGoogleRegToken] = useState("");

  // Estado de verificación de correo por código de 6 dígitos
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    password_confirmation: "",
    first_name: "",
    last_name_paternal: "",
    last_name_maternal: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [emailCheck, setEmailCheck] = useState({
    checking: false,
    status: null, // 'available' | 'active_exists' | 'unverified_exists' | 'deleted_under_60' | 'deleted_over_60' | 'invalid_format'
    message: "",
    days_deleted: null,
    days_remaining: null,
  });
  const [passwordStrength, setPasswordStrength] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("google_reg_token");
    const email = params.get("email");
    const nameStr = params.get("name") || "";

    if (token) {
      setIsGoogleReg(true);
      setGoogleRegToken(token);

      const defaultUsername = extractUsernameFromEmail(email || "");

      let firstName = "";
      let lastName = "";
      if (nameStr) {
        const parts = nameStr.split(" ");
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }

      setForm((prev) => ({
        ...prev,
        email: email || "",
        username: defaultUsername,
        first_name: firstName,
        last_name_paternal: lastName,
      }));
    }
  }, [location]);

  // Validación en tiempo real del correo contra el backend (activo vs sin verificar vs eliminado < 60 días vs >= 60 días)
  useEffect(() => {
    if (isGoogleReg || verificationStep) return;

    const email = (form.email || "").trim().toLowerCase();
    if (!email) {
      setEmailCheck({
        checking: false,
        status: null,
        message: "",
        days_deleted: null,
        days_remaining: null,
      });
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setEmailCheck({
        checking: false,
        status: "invalid_format",
        message: "Correo electrónico inválido",
        days_deleted: null,
        days_remaining: null,
      });
      return;
    }

    let isCancelled = false;
    setEmailCheck((prev) => ({ ...prev, checking: true }));

    const timer = setTimeout(async () => {
      try {
        const res = await checkRegisterEmail(email);
        if (!isCancelled) {
          setEmailCheck({
            checking: false,
            status: res.data.status,
            message: res.data.message,
            days_deleted: res.data.days_deleted ?? null,
            days_remaining: res.data.days_remaining ?? null,
          });
        }
      } catch (err) {
        if (!isCancelled) {
          setEmailCheck({
            checking: false,
            status: null,
            message: "",
            days_deleted: null,
            days_remaining: null,
          });
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [form.email, isGoogleReg, verificationStep]);

  // VALIDACIONES DE CAMPOS
  const validate = (name, value, currentForm = form) => {
    let error = "";

    if (name === "email") {
      if (!value.trim()) error = "El correo electrónico es obligatorio";
      else if (!EMAIL_REGEX.test(value.trim())) error = "Correo inválido";
    }

    if (name === "password") {
      const hasNumbers = /\d/.test(value);
      const hasLetters = /[a-zA-Z]/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      if (value.length < 8) {
        error = "Mínimo 8 caracteres";
        setPasswordStrength("");
      } else if (value.length > 72) {
        error = "Máximo 72 caracteres";
      } else if (!hasLetters || !hasNumbers) {
        error = "Debe incluir letras y números";
        setPasswordStrength("Débil");
      } else if (hasSpecial) {
        setPasswordStrength("Fuerte");
      } else {
        setPasswordStrength("Media");
      }

      if (currentForm.password_confirmation) {
        setErrors((prev) => ({
          ...prev,
          password_confirmation:
            currentForm.password_confirmation !== value ? "Las contraseñas no coinciden" : "",
        }));
      }
    }

    if (name === "password_confirmation") {
      if (value !== currentForm.password) {
        error = "Las contraseñas no coinciden";
      }
    }

    if (name === "first_name") {
      if (!value.trim() || value.trim().length < 2) {
        error = "El nombre debe tener al menos 2 caracteres";
      } else if (NAME_HAS_NUMBERS_REGEX.test(value)) {
        error = "El nombre no debe contener números";
      }
    }

    if (name === "last_name_paternal" || name === "last_name_maternal") {
      if (value && NAME_HAS_NUMBERS_REGEX.test(value)) {
        error = "El apellido no debe contener números";
      }
    }

    if (name === "phone") {
      if (value && /[^0-9+\-\s()]/.test(value)) {
        error = "El teléfono solo debe contener números";
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };

    // Si cambia el correo, autogenerar el username sin ningún dominio (@gmail.com, @hotmail.com, etc.)
    if (name === "email") {
      nextForm.username = extractUsernameFromEmail(value);
    }

    setForm(nextForm);
    validate(name, value, nextForm);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const res = await getGoogleAuthUrl();
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      toast.error("Error al conectar con Google");
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const cleanCode = (verificationCode || "").replace(/\D/g, "").trim();
    if (cleanCode.length !== 6) {
      toast.error("Ingresa el código de 6 dígitos enviado a tu correo");
      return;
    }

    try {
      setVerifyingCode(true);
      const res = await verifyRegisterCode({
        email: verificationEmail,
        code: cleanCode,
      });

      const token = res.data?.token;
      const user = res.data?.user;

      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        login({ user, token });
      }

      toast.success(res.data?.message || "¡Correo verificado con éxito!");
      setSuccess(true);
      setTimeout(() => {
        navigate(token ? "/" : "/login");
      }, 1200);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat()[0] : null) ||
        "Código de verificación inválido o expirado";
      toast.error(msg);
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resendingCode) return;

    try {
      setResendingCode(true);
      const res = await resendRegisterCode({ email: verificationEmail });
      toast.success(res.data?.message || "Se envió un nuevo código a tu correo");
      setResendCooldown(res.data?.cooldown_seconds || 60);
    } catch (error) {
      if (error.response?.data?.cooldown_seconds) {
        setResendCooldown(error.response.data.cooldown_seconds);
      }
      toast.error(error.response?.data?.message || "No se pudo reenviar el código");
    } finally {
      setResendingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptedTerms) {
      toast.error("Debes aceptar los términos y condiciones");
      return;
    }

    const autoUsername = extractUsernameFromEmail(form.email);

    if (isGoogleReg) {
      const fname = (form.first_name || "").trim();
      if (!fname || fname.length < 2) {
        toast.error("Advertencia: El nombre es obligatorio (mínimo 2 caracteres)");
        return;
      }
      if (
        NAME_HAS_NUMBERS_REGEX.test(fname) ||
        NAME_HAS_NUMBERS_REGEX.test(form.last_name_paternal || "") ||
        NAME_HAS_NUMBERS_REGEX.test(form.last_name_maternal || "")
      ) {
        toast.error("Advertencia: Los nombres y apellidos no deben contener números");
        return;
      }

      try {
        setLoading(true);
        const { completeGoogleRegistration } = await import("../../api/admin/auth");
        const res = await completeGoogleRegistration({
          ...form,
          username: autoUsername,
          google_reg_token: googleRegToken,
        });

        if (res && res.data) {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          setSuccess(true);
          useAuthStore.getState().login({ user: res.data.user, token: res.data.token });
          setTimeout(() => {
            navigate("/");
          }, 1200);
        }
      } catch (error) {
        if (!error.response || error.code === "ERR_NETWORK") {
          toast.error("No se pudo conectar con el servidor de autenticación. Revisa tu conexión.", { id: "network-error-toast" });
        } else {
          const backendMsg =
            error.response?.data?.message ||
            (error.response?.data?.errors ? Object.values(error.response.data.errors).flat()[0] : null) ||
            "Error al completar registro con Google";
          toast.error(backendMsg);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    const cleanEmail = (form.email || "").trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      toast.error("Advertencia: Ingresa un correo electrónico válido");
      return;
    }

    if (!autoUsername) {
      toast.error("Advertencia: No se pudo generar el nombre de cuenta desde el correo");
      return;
    }

    if (emailCheck.status === "active_exists") {
      toast.error("Advertencia: Este correo electrónico ya está registrado y verificado. No se puede sobrescribir una cuenta activa.");
      return;
    }

    if (emailCheck.status === "deleted_under_60") {
      toast.error(
        `Advertencia: Este correo pertenece a una cuenta eliminada hace ${emailCheck.days_deleted} día(s). Deben pasar más de 60 días para poder volver a crearla (faltan ${emailCheck.days_remaining} día(s)).`
      );
      return;
    }

    if (Object.values(errors).some((err) => err) || !form.password || !form.password_confirmation) {
      toast.error("Corrige los errores del formulario antes de continuar");
      return;
    }

    if (form.password !== form.password_confirmation) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    try {
      setLoading(true);

      // Verificación final de correo antes de enviar
      try {
        const checkRes = await checkRegisterEmail(cleanEmail);
        if (checkRes.data.status === "active_exists") {
          toast.error("Advertencia: Este correo electrónico ya está registrado y verificado. No se puede sobrescribir una cuenta activa.");
          setEmailCheck({
            checking: false,
            status: checkRes.data.status,
            message: checkRes.data.message,
            days_deleted: null,
            days_remaining: null,
          });
          setLoading(false);
          return;
        }
        if (checkRes.data.status === "deleted_under_60") {
          toast.error(checkRes.data.message);
          setEmailCheck({
            checking: false,
            status: checkRes.data.status,
            message: checkRes.data.message,
            days_deleted: checkRes.data.days_deleted ?? null,
            days_remaining: checkRes.data.days_remaining ?? null,
          });
          setLoading(false);
          return;
        }
      } catch (e) {
        // Si falla la consulta previa, el backend validará en POST /register
      }

      const payload = {
        ...form,
        email: cleanEmail,
        username: autoUsername, // Enviado de forma automática sin @dominio
      };

      const res = await registerUser(payload);

      if (res && res.data) {
        if (res.data.token && res.data.user) {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          login({ user: res.data.user, token: res.data.token });
        }

        toast.success(
          res.data.message ||
            "¡Cuenta creada! Te enviamos un código a tu correo para que confirmes tu cuenta desde tu perfil."
        );

        setSuccess(true);
        setTimeout(() => {
          navigate(res.data.token ? "/" : "/login");
        }, 1200);
      }
    } catch (error) {
      if (!error.response || error.code === "ERR_NETWORK") {
        toast.error("No se pudo conectar con el servidor de autenticación. Revisa tu conexión.", { id: "network-error-toast" });
      } else {
        const backendMsg =
          (error.response?.data?.errors ? Object.values(error.response.data.errors).flat()[0] : null) ||
          error.response?.data?.message ||
          "Error en registro";
        toast.error(backendMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStrengthIcon = () => {
    if (!passwordStrength) return null;
    const str = passwordStrength.toLowerCase();
    if (str === "débil") return <ShieldAlert size={14} />;
    if (str === "media") return <Shield size={14} />;
    if (str === "fuerte") return <ShieldCheck size={14} />;
    return null;
  };

  const isEmailBlocked =
    !isGoogleReg &&
    (emailCheck.status === "active_exists" ||
      emailCheck.status === "deleted_under_60" ||
      Boolean(errors.email));

  const logoUrl = settings?.store_logo_dark
    ? getImageUrl(settings.store_logo_dark)
    : "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/lodo_default_for_black.png";

  return (
    <div className="auth-page-wrapper">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="auth-back-btn"
      >
        <ArrowLeft size={18} /> Volver
      </button>

      <div className="auth-split-container">

        {/* Left Side: Image */}
        <div className="auth-image-side" style={{ backgroundImage: `url(${fondo})` }}></div>

        {/* Right Side: Form */}
        <div className="auth-form-side" style={{ overflowY: "auto" }}>

          <div className="auth-logo-container">
            <img src={logoUrl} alt="VOXMAN Logo" />
          </div>
          <p className="auth-subtitle">Únete al estilo</p>

          {success ? (
            <div className="success-message">
              <CheckCircle size={48} color="#33d9b2" />
              <span>¡Cuenta creada con éxito!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>

              {/* EMAIL */}
              <div className="floating-input-group" style={{ marginBottom: (errors.email && !isGoogleReg) ? "30px" : "16px" }}>
                <Mail size={18} className="input-icon" />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={150}
                  placeholder=" "
                  value={form.email}
                  onChange={handleChange}
                  disabled={isGoogleReg}
                  className="floating-input"
                  style={{
                    borderColor:
                      !isGoogleReg && (errors.email || emailCheck.status === "active_exists" || emailCheck.status === "deleted_under_60")
                        ? "#ef4444"
                        : !isGoogleReg && (emailCheck.status === "available" || emailCheck.status === "deleted_over_60" || emailCheck.status === "unverified_exists")
                        ? "#10b981"
                        : undefined,
                  }}
                />
                <label className="floating-label">Correo electrónico</label>
                {errors.email && !isGoogleReg && (
                  <div style={{ position: "absolute", bottom: "-22px", left: 0, display: "flex", alignItems: "center", gap: "4px", color: "#ef4444", fontSize: "12px" }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Advertencias en tiempo real del correo (activo vs sin verificar vs eliminado < 60 días vs >= 60 días) */}
              {!isGoogleReg && !errors.email && emailCheck.status === "active_exists" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "10px 12px",
                    marginBottom: "16px",
                    borderRadius: "10px",
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    color: "#f87171",
                    fontSize: "12px",
                    lineHeight: "1.4",
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px", color: "#ef4444" }} />
                  <span>{emailCheck.message}</span>
                </div>
              )}

              {!isGoogleReg && !errors.email && emailCheck.status === "unverified_exists" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "10px 12px",
                    marginBottom: "16px",
                    borderRadius: "10px",
                    background: "rgba(99, 102, 241, 0.12)",
                    border: "1px solid rgba(99, 102, 241, 0.35)",
                    color: "#a5b4fc",
                    fontSize: "12px",
                    lineHeight: "1.4",
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "1px", color: "#818cf8" }} />
                  <span>{emailCheck.message}</span>
                </div>
              )}

              {!isGoogleReg && !errors.email && emailCheck.status === "deleted_under_60" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "10px 12px",
                    marginBottom: "16px",
                    borderRadius: "10px",
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                    color: "#fbbf24",
                    fontSize: "12px",
                    lineHeight: "1.4",
                  }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "1px", color: "#f59e0b" }} />
                  <span>{emailCheck.message}</span>
                </div>
              )}

              {!isGoogleReg && !errors.email && emailCheck.status === "deleted_over_60" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "10px 12px",
                    marginBottom: "16px",
                    borderRadius: "10px",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    color: "#34d399",
                    fontSize: "12px",
                    lineHeight: "1.4",
                  }}
                >
                  <CheckCircle size={16} style={{ flexShrink: 0, marginTop: "1px", color: "#10b981" }} />
                  <span>{emailCheck.message}</span>
                </div>
              )}

              {isGoogleReg ? (
                <>
                  <div className="floating-input-group" style={{ marginBottom: errors.first_name ? "30px" : "20px" }}>
                    <UserCheck size={18} className="input-icon" />
                    <input
                      name="first_name"
                      maxLength={100}
                      placeholder=" "
                      value={form.first_name}
                      onChange={handleChange}
                      required
                      className="floating-input"
                      style={{ borderColor: errors.first_name ? "#ef4444" : undefined }}
                    />
                    <label className="floating-label">Nombre(s)</label>
                    {errors.first_name && (
                      <div style={{ position: "absolute", bottom: "-22px", left: 0, display: "flex", alignItems: "center", gap: "4px", color: "#ef4444", fontSize: "12px" }}>
                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span>{errors.first_name}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div className="floating-input-group" style={{ flex: 1 }}>
                      <input
                        name="last_name_paternal"
                        maxLength={100}
                        placeholder=" "
                        value={form.last_name_paternal}
                        onChange={handleChange}
                        className="floating-input"
                        style={{ paddingLeft: "16px", borderColor: errors.last_name_paternal ? "#ef4444" : undefined }}
                      />
                      <label className="floating-label" style={{ left: "16px" }}>Ap. Paterno</label>
                    </div>
                    <div className="floating-input-group" style={{ flex: 1 }}>
                      <input
                        name="last_name_maternal"
                        maxLength={100}
                        placeholder=" "
                        value={form.last_name_maternal}
                        onChange={handleChange}
                        className="floating-input"
                        style={{ paddingLeft: "16px", borderColor: errors.last_name_maternal ? "#ef4444" : undefined }}
                      />
                      <label className="floating-label" style={{ left: "16px" }}>Ap. Materno</label>
                    </div>
                  </div>
                  <div className="floating-input-group">
                    <Phone size={18} className="input-icon" />
                    <input
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      maxLength={30}
                      placeholder=" "
                      value={form.phone}
                      onChange={handleChange}
                      className="floating-input"
                      style={{ borderColor: errors.phone ? "#ef4444" : undefined }}
                    />
                    <label className="floating-label">Teléfono</label>
                  </div>
                </>
              ) : (
                <>
                  {/* PASSWORD */}
                  <div className="password-group">
                    <div className="floating-input-group" style={{ marginBottom: 8 }}>
                      <Lock size={18} className="input-icon" />
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        maxLength={72}
                        placeholder=" "
                        onChange={handleChange}
                        className="floating-input"
                        style={{ borderColor: errors.password ? "#ef4444" : undefined }}
                      />
                      <label className="floating-label">Contraseña</label>
                      <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* BARRA DE SEGURIDAD */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", padding: "0 4px" }}>
                      <div style={{ flex: 1, height: "4px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden", marginRight: "12px" }}>
                        <div
                          style={{
                            height: "100%",
                            width: passwordStrength === "Débil" ? "33%" : passwordStrength === "Media" ? "66%" : passwordStrength === "Fuerte" ? "100%" : "0%",
                            backgroundColor: passwordStrength === "Débil" ? "#ef4444" : passwordStrength === "Media" ? "#f59e0b" : passwordStrength === "Fuerte" ? "#10b981" : "transparent",
                            transition: "all 0.4s ease",
                          }}
                        ></div>
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px", color: passwordStrength === "Débil" ? "#ef4444" : passwordStrength === "Media" ? "#f59e0b" : passwordStrength === "Fuerte" ? "#10b981" : "#777" }}>
                        {renderStrengthIcon()} {passwordStrength || "—"}
                      </div>
                    </div>
                  </div>

                  {errors.password && (
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px", color: "#ef4444", fontSize: "12px", marginTop: "-12px", marginBottom: "16px", paddingLeft: "4px" }}>
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      <span>{errors.password}</span>
                    </div>
                  )}

                  {/* CONFIRM PASSWORD */}
                  <div className="floating-input-group" style={{ marginBottom: errors.password_confirmation ? "30px" : "20px" }}>
                    <Lock size={18} className="input-icon" />
                    <input
                      name="password_confirmation"
                      type={showPassword ? "text" : "password"}
                      placeholder=" "
                      onChange={handleChange}
                      className="floating-input"
                      style={{ borderColor: errors.password_confirmation ? "#ef4444" : undefined }}
                    />
                    <label className="floating-label">Confirmar contraseña</label>
                    {errors.password_confirmation && (
                      <div style={{ position: "absolute", bottom: "-22px", left: 0, display: "flex", alignItems: "center", gap: "4px", color: "#ef4444", fontSize: "12px" }}>
                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span>{errors.password_confirmation}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TERMS AND CONDITIONS */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "var(--color-primary)" }}
                />
                <label htmlFor="terms" style={{ fontSize: "13px", color: "#ccc", cursor: "pointer" }}>
                  Acepto los{" "}
                  <span
                    style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "underline" }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTermsModal(true);
                    }}
                  >
                    Términos y Condiciones
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="auth-btn-primary"
                disabled={!acceptedTerms || loading || isEmailBlocked}
                style={{
                  opacity: !acceptedTerms || loading || isEmailBlocked ? 0.7 : 1,
                  cursor: !acceptedTerms || loading || isEmailBlocked ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ width: "20px", height: "20px", border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  </div>
                ) : isGoogleReg ? (
                  "Completar Registro"
                ) : (
                  "Crear cuenta"
                )}
              </button>

              {!isGoogleReg && (
                <>
                  <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
                    <hr style={{ flex: 1, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)" }} />
                    <span style={{ padding: "0 10px", color: "#777", fontSize: "12px" }}>O REGÍSTRATE CON</span>
                    <hr style={{ flex: 1, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="auth-btn-google"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continuar con Google
                  </button>
                </>
              )}

              <div className="auth-footer">
                ¿Ya tienes cuenta?
                <Link to="/login" className="auth-link">Inicia sesión</Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* TERMS MODAL */}
      {showTermsModal && (
        <div className="fade-in" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-content" style={{ maxWidth: "500px", width: "90%", background: "var(--bg-card, #1f2937)", borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "20px", color: "var(--text-main)" }}>Términos y Condiciones</h3>
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px", color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
              <p>1. <strong>Aceptación:</strong> Al crear una cuenta, aceptas estar sujeto a estos términos y condiciones.</p>
              <p>2. <strong>Uso de cuenta:</strong> Eres responsable de mantener la confidencialidad de tu contraseña.</p>
              <p>3. <strong>Privacidad:</strong> Tu información personal será tratada conforme a nuestra política de privacidad.</p>
              <p><em>(Aquí puedes agregar todo el texto legal de tu empresa más adelante...)</em></p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "var(--color-primary)", color: "#fff", cursor: "pointer", fontWeight: 600 }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}