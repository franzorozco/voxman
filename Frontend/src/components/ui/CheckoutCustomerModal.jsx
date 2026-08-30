import React, { useState, useEffect } from "react";
import { User, Phone, MapPin, Map, CheckCircle, X, Navigation, Crosshair, Map as MapIcon } from "lucide-react";
import toast from "react-hot-toast";
import { updateCustomerProfile } from "../../api/shopAuth";
import GoogleMapWrapper from "./GoogleMapWrapper";
import CustomSelect from "./CustomSelect";
import { Marker } from "@react-google-maps/api";

export default function CheckoutCustomerModal({ isOpen, onClose, onSuccess, theme = 'light', initialData = {} }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name_paternal: "",
    last_name_maternal: "",
    birthdate: "",
    gender: "",
    customer_code: "",
    phoneCode: "+591",
    phoneNumber: "",
    country: "Bolivia",
    state: "",
    city: "",
    zone: "",
    street: "",
    reference: "",
    latitude: null,
    longitude: null,
    tags: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Map configuration
  const defaultCenter = { lat: -16.4897, lng: -68.1193 }; // La Paz, Bolivia
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPos, setMarkerPos] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      let initialPhoneCode = "+591";
      let initialPhoneNumber = initialData.phone || "";
      
      // Basic logic to split if the phone has a country code
      if (initialPhoneNumber.startsWith("+")) {
        const parts = initialPhoneNumber.split(" ");
        if (parts.length > 1) {
          initialPhoneCode = parts[0];
          initialPhoneNumber = parts.slice(1).join(" ");
        }
      }

      let profileFirstName = initialData.first_name || initialData.profile?.first_name || "";
      if (initialData.username && profileFirstName === initialData.username) {
        profileFirstName = "";
      }

      setForm({
        first_name: profileFirstName,
        last_name_paternal: initialData.last_name_paternal || initialData.profile?.last_name_paternal || "",
        last_name_maternal: initialData.last_name_maternal || initialData.profile?.last_name_maternal || "",
        birthdate: initialData.birthdate || initialData.profile?.birthdate || "",
        gender: initialData.gender || initialData.profile?.gender || "",
        customer_code: initialData.customer_code || "",
        phoneCode: initialPhoneCode,
        phoneNumber: initialPhoneNumber,
        country: "Bolivia",
        state: "",
        city: "",
        zone: "",
        street: "",
        reference: "",
        latitude: null,
        longitude: null,
        tags: []
      });
      setErrors({});
      setMarkerPos(null);
      setMapCenter(defaultCenter);
      setIsMapOpen(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = (name, value, currentForm = form) => {
    let error = "";
    
    if (name === "first_name" && value.trim().length < 2) error = "El nombre es requerido";
    
    if (name === "last_name_paternal" || name === "last_name_maternal") {
      const paternal = name === "last_name_paternal" ? value : currentForm.last_name_paternal;
      const maternal = name === "last_name_maternal" ? value : currentForm.last_name_maternal;
      
      if (!paternal.trim() && !maternal.trim()) {
        setErrors((prev) => ({ 
          ...prev, 
          last_name_paternal: "Se requiere al menos un apellido",
          last_name_maternal: "Se requiere al menos un apellido"
        }));
        return;
      } else {
        setErrors((prev) => ({ 
          ...prev, 
          last_name_paternal: "",
          last_name_maternal: ""
        }));
        return;
      }
    }

    if (name === "customer_code" && value.trim().length < 5) error = "Cédula de identidad es requerida";
    if (name === "phoneNumber" && value.trim().length < 7) error = "Teléfono es requerido";
    
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    setForm(newForm);
    validate(name, value, newForm);
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });
    setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
    reverseGeocode(lat, lng);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      toast.loading("Obteniendo tu ubicación...", { id: 'geo' });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter({ lat, lng });
          setMarkerPos({ lat, lng });
          setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
          setIsMapOpen(true);
          toast.success("Ubicación obtenida", { id: 'geo' });
          reverseGeocode(lat, lng);
        },
        () => {
          toast.error("No se pudo obtener tu ubicación", { id: 'geo' });
        }
      );
    } else {
      toast.error("Geolocalización no soportada por el navegador");
    }
  };

  const reverseGeocode = (lat, lng) => {
    if (!window.google || !window.google.maps) return;
    setGeocoding(true);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      setGeocoding(false);
      if (status === "OK" && results[0]) {
        let city = "";
        let state = "";
        let country = "Bolivia";
        let street = "";
        let zone = "";

        results[0].address_components.forEach(component => {
          const types = component.types;
          if (types.includes("locality")) city = component.long_name;
          if (types.includes("administrative_area_level_1")) state = component.long_name;
          if (types.includes("country")) country = component.long_name;
          if (types.includes("route")) street = component.long_name;
          if (types.includes("sublocality") || types.includes("neighborhood")) zone = component.long_name;
        });

        // Si no detectó calle, usamos parte de la dirección formateada
        if (!street) {
            street = results[0].formatted_address.split(",")[0];
        }

        setForm(prev => ({
          ...prev,
          city: city || prev.city,
          state: state || prev.state,
          country: country || prev.country,
          street: street || prev.street,
          zone: zone || prev.zone,
        }));
        toast.success("Dirección autocompletada");
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || (!form.last_name_paternal && !form.last_name_maternal) || !form.customer_code || !form.phoneNumber) {
      toast.error("Por favor completa los campos requeridos (mínimo un apellido)");
      setErrors({
        first_name: !form.first_name ? "El nombre es requerido" : "",
        last_name_paternal: (!form.last_name_paternal && !form.last_name_maternal) ? "Se requiere al menos un apellido" : "",
        last_name_maternal: (!form.last_name_paternal && !form.last_name_maternal) ? "Se requiere al menos un apellido" : "",
        customer_code: !form.customer_code ? "Cédula de identidad es requerida" : "",
        phoneNumber: !form.phoneNumber ? "Teléfono es requerido" : ""
      });
      return;
    }

    const payload = {
      ...form,
      phone: `${form.phoneCode} ${form.phoneNumber}`,
      latitude: isMapOpen ? form.latitude : null,
      longitude: isMapOpen ? form.longitude : null
    };

    try {
      setLoading(true);
      const res = await updateCustomerProfile(payload);
      const updatedUser = res.data.user;
      localStorage.setItem("shop_user", JSON.stringify(updatedUser));
      
      toast.success("Perfil actualizado");
      onSuccess(updatedUser);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al guardar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const overlayBg = isDark ? "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0.6)";
  const modalBg = isDark ? "#111827" : "#ffffff";
  const textColor = isDark ? "#f3f4f6" : "#111827";
  const mutedColor = isDark ? "#9ca3af" : "#6b7280";
  const borderColor = isDark ? "#374151" : "#e5e7eb";
  const inputBg = isDark ? "#1f2937" : "#f9fafb";

  const renderInput = (name, placeholder, type = "text", Icon) => (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', backgroundColor: inputBg,
        border: `1px solid ${errors[name] ? '#ef4444' : borderColor}`, borderRadius: '8px', padding: '0 12px'
      }}>
        {Icon && <Icon size={18} color={mutedColor} />}
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={form[name] || ''}
          onChange={handleChange}
          style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px', color: textColor, fontSize: '15px', outline: 'none' }}
        />
      </div>
      {errors[name] && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block' }}>{errors[name]}</span>}
    </div>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: overlayBg, backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: '20px'
    }}>
      <div style={{
        backgroundColor: modalBg, borderRadius: '16px', width: '100%', maxWidth: '600px',
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden', position: 'relative', animation: 'modalSlideUp 0.3s ease-out', border: `1px solid ${borderColor}`,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '24px 24px 16px 24px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${borderColor}` }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: textColor }}>Completa tu Perfil</h2>
            <p style={{ margin: 0, color: mutedColor, fontSize: '14px' }}>Confirma estos datos para finalizar tu pedido.</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: mutedColor, cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <form id="customerProfileForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: textColor, marginBottom: '12px' }}>Datos Personales (Requerido)</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {renderInput("first_name", "Nombres", "text", User)}
                {renderInput("last_name_paternal", "Apellido Paterno", "text", User)}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {renderInput("last_name_maternal", "Apellido Materno", "text", User)}
                {renderInput("birthdate", "Fecha de nacimiento (Opcional)", "date", null)}
              </div>
              
              <div style={{ 
                marginBottom: '16px',
                '--bg-input': inputBg,
                '--border-color': borderColor,
                '--text-main': textColor,
                '--bg-card': modalBg,
                '--color-primary': '#C9A227',
                '--color-primary-alpha': 'rgba(201, 162, 39, 0.1)',
                '--text-muted': mutedColor
              }}>
                <CustomSelect
                  name="gender"
                  value={form.gender || ""}
                  onChange={handleChange}
                  placeholder="Seleccionar género (Opcional)"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                </CustomSelect>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {renderInput("customer_code", "Cédula de Identidad (CI)", "text", User)}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '80px', flexShrink: 0 }}>
                    {renderInput("phoneCode", "Ej: +591", "text", null)}
                  </div>
                  <div style={{ flex: 1 }}>
                    {renderInput("phoneNumber", "Celular / WhatsApp", "tel", Phone)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: textColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapIcon size={16} /> Ubicación de Envío (Opcional)
                </h3>
                <p style={{ fontSize: '13px', color: mutedColor, margin: '4px 0 0 0' }}>
                  Necesitamos que nos confirme su ubicación para lograr entregas a domicilio en un futuro.
                </p>
              </div>

              <div style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${borderColor}`, marginBottom: '16px', position: 'relative' }}>
                {!isMapOpen ? (
                  <div style={{ padding: '30px 20px', textAlign: 'center', backgroundColor: inputBg }}>
                    <button 
                      type="button" 
                      onClick={() => setIsMapOpen(true)} 
                      style={{ 
                        background: textColor, color: modalBg, padding: '10px 24px', 
                        borderRadius: '8px', border: 'none', cursor: 'pointer', 
                        fontWeight: '600', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px'
                      }}
                    >
                      <MapIcon size={16} /> Abrir mapa
                    </button>
                    <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: mutedColor }}>
                      (Opcional) Toca para ubicar tu dirección de entrega
                    </p>
                  </div>
                ) : (
                  <>
                    <button 
                      type="button" 
                      onClick={getUserLocation}
                      style={{ 
                        position: 'absolute', top: '10px', right: '10px', zIndex: 10,
                        display: 'flex', alignItems: 'center', gap: '6px', background: modalBg, 
                        color: textColor, border: `1px solid ${borderColor}`, padding: '8px 12px', borderRadius: '6px', 
                        fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      <Crosshair size={14} /> Usar mi ubicación actual
                    </button>
                    <GoogleMapWrapper 
                      mapContainerStyle={{ width: '100%', height: '200px' }} 
                      center={mapCenter} 
                      zoom={14} 
                      onClick={handleMapClick}
                      options={{ disableDefaultUI: true, zoomControl: true }}
                    >
                      {markerPos && <Marker position={markerPos} />}
                    </GoogleMapWrapper>
                    {!markerPos && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)' }}>
                        <span style={{ background: modalBg, color: textColor, padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                          Toca el mapa para fijar tu ubicación
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {renderInput("state", "Departamento", "text", Map)}
                {renderInput("city", "Ciudad", "text", MapPin)}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {renderInput("zone", "Zona / Barrio", "text", Navigation)}
                {renderInput("street", "Calle o Avenida", "text")}
              </div>

              {renderInput("reference", "Referencia (Ej. Casa blanca con rejas)", "text")}
            </div>

          </form>
        </div>

        <div style={{ padding: '16px 24px', borderTop: `1px solid ${borderColor}`, backgroundColor: isDark ? '#1f2937' : '#f9fafb' }}>
          <button 
            type="submit" 
            form="customerProfileForm"
            disabled={loading || geocoding}
            style={{
              width: '100%', background: textColor, color: modalBg, border: 'none',
              padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: '600',
              cursor: (loading || geocoding) ? 'not-allowed' : 'pointer', opacity: (loading || geocoding) ? 0.7 : 1,
            }}
          >
            {loading ? "Guardando..." : geocoding ? "Procesando dirección..." : "Guardar y Continuar"}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
