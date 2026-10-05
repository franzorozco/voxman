import "../HomeConfig/HomeConfig.css";
import "./EntregasConfig.css";
import React, { useState, useEffect } from "react";
import CustomSelect from "../../../../components/ui/CustomSelect";
import { Truck, MapPin, Save, Plus, Trash2, Edit2, ListOrdered, Image as ImageIcon, Layers, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { getSystemSettings, updateSystemSetting } from "../../../../api/admin/systemSettings";
import { useThemeStore } from "../../../../store/themeStore";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";
import IconPickerModal from "../HomeConfig/IconPickerModal";
import VideoPickerModal from "./VideoPickerModal";
import * as Icons from "lucide-react";
import { URL_BASE_VIDEOS } from "../../../../config/api";

const TABS = [
  { id: "hero", label: "Hero (Inicio)", icon: <ImageIcon size={15} /> },
  { id: "options", label: "Opciones de Envío", icon: <MapPin size={15} /> },
  { id: "process", label: "Proceso (Pasos)", icon: <ListOrdered size={15} /> },
  { id: "sections", label: "Secciones", icon: <Layers size={15} /> }
];

export default function EntregasConfig() {
  const isDark = useThemeStore(s => s.isDark);
  const theme = isDark ? "admin-theme-dark" : "admin-theme";
  const [activeTab, setActiveTab] = useState("hero");
  const [settings, setSettings] = useState({});
  const [dirty, setDirty] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Modal de iconos
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState(null); // { type: 'hero' } o { type: 'option', index }

  // Modal de videos
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await getSystemSettings();
      const parsed = {};
      res.forEach(item => {
        if (item.key.startsWith("shipping_")) {
          parsed[item.key] = item.value;
        }
      });
      setSettings(parsed);
      setDirty(new Set());
    } catch (e) {
      toast.error("Error al cargar configuraciones");
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const setSetting = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
    setDirty(prev => new Set(prev).add(key));
  };

  const getArraySetting = (key, defaultArr = []) => {
    try {
      return settings[key] ? JSON.parse(settings[key]) : defaultArr;
    } catch {
      return defaultArr;
    }
  };

  const updateArraySetting = (key, array) => {
    setSetting(key, JSON.stringify(array));
  };

  // --- Handlers para Opciones de Envío ---
  const defaultDelivery = [
    {
      title: "La Paz y El Alto",
      desc: "Entregas personales y coordinadas. Nos adaptamos a tus horarios y definimos un punto de encuentro o entrega a domicilio.",
      icon: "MapPin",
      features: "Entregas en 24h a 48h hábiles.\nPago contra entrega disponible."
    },
    {
      title: "Envíos Nacionales",
      desc: "Llegamos a los 9 departamentos de Bolivia mediante flotas seguras y empresas de courier de confianza.",
      icon: "Truck",
      features: "Despachos en 24h hábiles.\nEmpaque premium y seguro."
    }
  ];
  const deliveryMethods = getArraySetting("shipping_delivery_methods", defaultDelivery);
  
  const addDeliveryMethod = () => {
    const newArr = [...deliveryMethods, { title: "Nueva Opción", desc: "", icon: "Truck", features: "" }];
    updateArraySetting("shipping_delivery_methods", newArr);
  };

  const updateDeliveryMethod = (index, field, value) => {
    const newArr = [...deliveryMethods];
    newArr[index][field] = value;
    updateArraySetting("shipping_delivery_methods", newArr);
  };

  const removeDeliveryMethod = (index) => {
    if(!window.confirm("¿Eliminar esta opción?")) return;
    const newArr = deliveryMethods.filter((_, i) => i !== index);
    updateArraySetting("shipping_delivery_methods", newArr);
  };

  const moveDeliveryMethod = (index, direction) => {
    const newArr = [...deliveryMethods];
    if (direction === 'up' && index > 0) {
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      updateArraySetting("shipping_delivery_methods", newArr);
    } else if (direction === 'down' && index < deliveryMethods.length - 1) {
      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      updateArraySetting("shipping_delivery_methods", newArr);
    }
  };

  // --- Handlers para Proceso ---
  const defaultProcess = [
    { title: "Eliges y Confirmas", desc: "Realizas tu pedido a través de nuestra web o WhatsApp. Te confirmamos el stock inmediatamente." },
    { title: "Empaque y Preparación", desc: "Preparamos tu orden con nuestra firma de empaque premium, asegurando que tu prenda llegue impecable." },
    { title: "Despacho y Seguimiento", desc: "Coordinamos la entrega o realizamos el envío nacional. Te enviamos la guía o el comprobante para que sepas dónde está tu compra." }
  ];
  const processSteps = getArraySetting("shipping_process_steps", defaultProcess);
  
  const addProcessStep = () => {
    const newArr = [...processSteps, { title: "Nuevo Paso", desc: "" }];
    updateArraySetting("shipping_process_steps", newArr);
  };

  const updateProcessStep = (index, field, value) => {
    const newArr = [...processSteps];
    newArr[index][field] = value;
    updateArraySetting("shipping_process_steps", newArr);
  };

  const removeProcessStep = (index) => {
    if(!window.confirm("¿Eliminar este paso?")) return;
    const newArr = processSteps.filter((_, i) => i !== index);
    updateArraySetting("shipping_process_steps", newArr);
  };

  const moveProcessStep = (index, direction) => {
    const newArr = [...processSteps];
    if (direction === 'up' && index > 0) {
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      updateArraySetting("shipping_process_steps", newArr);
    } else if (direction === 'down' && index < processSteps.length - 1) {
      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      updateArraySetting("shipping_process_steps", newArr);
    }
  };

  // --- Handlers para Modal de Iconos ---
  const openIconPicker = (target) => {
    setIconPickerTarget(target);
    setIsIconModalOpen(true);
  };

  const handleSelectIcon = (iconName) => {
    if (iconPickerTarget.type === 'hero') {
      setSetting("shipping_hero_icon", iconName);
    } else if (iconPickerTarget.type === 'option') {
      updateDeliveryMethod(iconPickerTarget.index, 'icon', iconName);
    }
    setIsIconModalOpen(false);
  };

  const fetchPublicSettings = useShopSettingsStore(s => s.fetchSettings);

  const handleSave = async () => {
    if (dirty.size === 0) return;
    setSaving(true);
    let successCount = 0;
    try {
      for (const key of Array.from(dirty)) {
        await updateSystemSetting(key, { value: settings[key] });
        successCount++;
      }
      toast.success(`Configuraciones guardadas`);
      setDirty(new Set());
      // Forzar recarga en el store público para que los cambios se vean sin presionar F5
      fetchPublicSettings(true);
    } catch (e) {
      toast.error("Error al guardar algunos cambios");
    } finally {
      setSaving(false);
    }
  };

  const renderIcon = (iconName, size = 24) => {
    const IconCmp = Icons[iconName] || Icons.HelpCircle;
    return <IconCmp size={size} />;
  };

  if (loadingSettings) {
    return (
      <div className={`${theme} hc-style-1`}>
        <div className="hc-style-2">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin hc-style-3" />
          <span className="hc-style-4">Cargando configuracion...</span>
        </div>
      </div>
    );
  }

  const SECTION_KEYS = [
    { key: "shipping_section_hero_show", label: "Hero (Inicio)", desc: "El banner de video o imagen con texto animado." },
    { key: "shipping_section_methods_show", label: "Opciones de Envío", desc: "La cuadrícula con los métodos de entrega disponibles." },
    { key: "shipping_section_process_show", label: "Proceso (Pasos)", desc: "La lista de pasos o tarjetitas de cómo funciona la compra." }
  ];

  return (
    <div className={`${theme} hc-style-5`}>
      <div className="hc-style-6">
        
        {/* ── Header ── */}
        <div className="hc-style-7">
          <div className="hc-style-8">
            <div className="hc-style-9">
              <Truck size={18} />
            </div>
            <h1 className="hc-style-10">Configuración de Entregas</h1>
          </div>
          <p className="hc-style-11">
            Personaliza los textos, opciones y pasos de la página pública de entregas y envíos.
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="hc-style-12">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`ec-tab-btn ${activeTab === t.id ? "ec-active" : ""}`}
            >
              {t.icon} <span className="hc-style-13">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════
             TAB: SECTIONS
         ══════════════════════════════ */}
        {activeTab === "sections" && (
          <div className="hc-style-141">
            {SECTION_KEYS.map((s, idx) => {
              const active = settings[s.key] === undefined || String(settings[s.key]) !== "0";
              const isLast = idx === SECTION_KEYS.length - 1;
              return (
                <div key={s.key} className={`ec-section-item ${isLast ? "ec-section-item-last" : ""} ${dirty.has(s.key) ? "ec-dirty" : ""}`}>
                  <div className="hc-style-142">
                    <div className="hc-style-112">
                      {active ? <Eye size={15} className="hc-style-143" /> : <EyeOff size={15} className="hc-style-144" />}
                      <span className="hc-style-21">{s.label}</span>
                      {dirty.has(s.key) && <span className="hc-style-145">Modificado</span>}
                    </div>
                    <p className="hc-style-146">{s.desc}</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSetting(s.key, active ? "0" : "1")} 
                    className={`ec-switch-btn ${active ? "ec-active" : ""}`}
                  >
                    <span className="ec-switch-indicator" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════
             TAB: HERO
         ══════════════════════════════ */}
        {activeTab === "hero" && (
          <div>
            <div className="hc-style-14">
              <h3 className="hc-style-15">Textos Principales (Hero)</h3>
              
              <div className="ec-grid-2 ec-mb-20">
                <div>
                  <label className="hc-style-18 ec-block ec-mb-8">Ícono Principal</label>
                  <div className="ec-relative">
                    <div 
                      onClick={() => openIconPicker({ type: 'hero' })}
                      className="ec-icon-btn-lg"
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      title="Clic para cambiar ícono"
                    >
                      {settings.shipping_hero_icon ? renderIcon(settings.shipping_hero_icon, 28) : <span className="ec-empty-icon">Sin Ícono</span>}
                    </div>
                    {settings.shipping_hero_icon && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSetting("shipping_hero_icon", ""); }}
                        title="Quitar Ícono"
                        className="ec-btn-remove-icon"
                      >
                        <Icons.X size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="hc-style-18 ec-block ec-mb-8">Video de Fondo (Opcional)</label>
                  <div className="ec-relative">
                    <div 
                      onClick={() => setIsVideoModalOpen(true)}
                      className="ec-video-btn"
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      title="Clic para cambiar video"
                    >
                      {settings.shipping_hero_video ? (
                        <video src={settings.shipping_hero_video.startsWith('http') ? settings.shipping_hero_video : `${URL_BASE_VIDEOS}/${settings.shipping_hero_video}`} className="ec-video-preview" muted />
                      ) : (
                        <span className="ec-empty-icon">Añadir Video</span>
                      )}
                    </div>
                    {settings.shipping_hero_video && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSetting("shipping_hero_video", ""); }}
                        title="Quitar Video"
                        className="ec-btn-remove-icon"
                      >
                        <Icons.X size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">Título Principal (Opcional)</span>
                  <input
                    type="text"
                    value={settings.shipping_hero_title || ""}
                    onChange={e => setSetting("shipping_hero_title", e.target.value)}
                    onFocus={e => e.target.style.borderColor = "var(--color-primary)"}
                    onBlur={e => e.target.style.borderColor = "var(--border-color)"}
                    className="hc-style-19"
                    placeholder="Ej: LLEGAMOS DONDE TÚ ESTÉS. (Déjalo en blanco para ocultar)"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Subtítulo (Opcional)</span>
                  <input
                    type="text"
                    value={settings.shipping_hero_subtitle || ""}
                    onChange={e => setSetting("shipping_hero_subtitle", e.target.value)}
                    onFocus={e => e.target.style.borderColor = "var(--color-primary)"}
                    onBlur={e => e.target.style.borderColor = "var(--border-color)"}
                    className="hc-style-19"
                    placeholder="Ej: Envíos rápidos, seguros... (Déjalo en blanco para ocultar)"
                  />
                </label>
              </div>
            </div>

            <div className="hc-style-14 ec-mt-20">
              <h3 className="hc-style-15">Ajustes de Diseño Visual</h3>
              
              <div className="ec-grid-auto ec-mb-20">
                {/* Opacidad del Video */}
                <label className="hc-style-17">
                  <div className="ec-flex-between">
                    <span className="hc-style-18">Opacidad del Fondo Oscuro</span>
                    <span className="ec-percent-text">{settings.shipping_hero_overlay_opacity || "50"}%</span>
                  </div>
                  <input
                    type="range"
                    min="0" max="100"
                    value={settings.shipping_hero_overlay_opacity || "50"}
                    onChange={e => setSetting("shipping_hero_overlay_opacity", e.target.value)}
                    className="ec-range-input"
                  />
                  <div className="ec-range-labels">
                    <span>Claro</span>
                    <span>Oscuro</span>
                  </div>
                </label>

                {/* Color del Overlay */}
                <label className="hc-style-17">
                  <span className="hc-style-18">Color de Superposición</span>
                  <div className="ec-flex-center">
                    <input
                      type="color"
                      value={settings.shipping_hero_overlay_color || "#000000"}
                      onChange={e => setSetting("shipping_hero_overlay_color", e.target.value)}
                      className="ec-color-picker"
                    />
                    <span className="ec-color-hex">
                      {settings.shipping_hero_overlay_color || "#000000"}
                    </span>
                  </div>
                </label>

                {/* Color del Texto */}
                <label className="hc-style-17">
                  <span className="hc-style-18">Color de Textos</span>
                  <div className="ec-flex-center">
                    <input
                      type="color"
                      value={settings.shipping_hero_text_color || "#ffffff"}
                      onChange={e => setSetting("shipping_hero_text_color", e.target.value)}
                      className="ec-color-picker"
                    />
                    <span className="ec-color-hex">
                      {settings.shipping_hero_text_color || "#ffffff"}
                    </span>
                  </div>
                </label>

                {/* Alineación Vertical */}
                <label className="hc-style-17">
                  <span className="hc-style-18">Alineación Vertical</span>
                  <CustomSelect
                    value={settings.shipping_hero_align_v || "center"}
                    onChange={e => setSetting("shipping_hero_align_v", e.target.value)}
                    className="ec-cursor-pointer"
                  >
                    <option value="flex-start">Arriba</option>
                    <option value="center">Centro</option>
                    <option value="flex-end">Abajo</option>
                  </CustomSelect>
                </label>

                {/* Alineación Horizontal */}
                <label className="hc-style-17">
                  <span className="hc-style-18">Alineación Horizontal</span>
                  <CustomSelect
                    value={settings.shipping_hero_align_h || "center"}
                    onChange={e => setSetting("shipping_hero_align_h", e.target.value)}
                    className="ec-cursor-pointer"
                  >
                    <option value="flex-start">Izquierda</option>
                    <option value="center">Centro</option>
                    <option value="flex-end">Derecha</option>
                  </CustomSelect>
                </label>

                {/* Tamaño Título */}
                <label className="hc-style-17">
                  <span className="hc-style-18">Tamaño del Título</span>
                  <CustomSelect
                    value={settings.shipping_hero_title_size || "md"}
                    onChange={e => setSetting("shipping_hero_title_size", e.target.value)}
                    className="ec-cursor-pointer"
                  >
                    <option value="sm">Pequeño</option>
                    <option value="md">Normal</option>
                    <option value="lg">Grande</option>
                    <option value="xl">Extra Grande</option>
                  </CustomSelect>
                </label>

                {/* Tamaño Subtítulo */}
                <label className="hc-style-17">
                  <span className="hc-style-18">Tamaño del Subtítulo</span>
                  <CustomSelect
                    value={settings.shipping_hero_subtitle_size || "md"}
                    onChange={e => setSetting("shipping_hero_subtitle_size", e.target.value)}
                    className="ec-cursor-pointer"
                  >
                    <option value="sm">Pequeño</option>
                    <option value="md">Normal</option>
                    <option value="lg">Grande</option>
                  </CustomSelect>
                </label>
              </div>
            </div>

            <div className="hc-style-14 ec-mt-20">
              <h3 className="hc-style-15">Indicador de Scroll (Animación)</h3>
              
              <div className="ec-grid-auto ec-mb-20">
                {/* Mostrar Indicador */}
                <label className="hc-style-17">
                  <span className="hc-style-18">Mostrar Indicador</span>
                  <CustomSelect
                    value={settings.shipping_hero_scroll_show !== undefined ? settings.shipping_hero_scroll_show : "1"}
                    onChange={e => setSetting("shipping_hero_scroll_show", e.target.value)}
                    className="ec-cursor-pointer"
                  >
                    <option value="1">Sí, Mostrar</option>
                    <option value="0">No, Ocultar</option>
                  </CustomSelect>
                </label>

                {/* Tipo de Animación */}
                <label className="hc-style-17">
                  <span className="hc-style-18">Tipo de Animación</span>
                  <CustomSelect
                    value={settings.shipping_hero_scroll_type || "mouse"}
                    onChange={e => setSetting("shipping_hero_scroll_type", e.target.value)}
                    className="ec-cursor-pointer"
                  >
                    <option value="mouse">Ratón Scrolleando (Clásico)</option>
                    <option value="arrow">Flecha Rebotando</option>
                    <option value="dot">Punto Parpadeante</option>
                  </CustomSelect>
                </label>

                {/* Posición */}
                <label className="hc-style-17">
                  <span className="hc-style-18">Posición en Pantalla</span>
                  <CustomSelect
                    value={settings.shipping_hero_scroll_pos || "bottom_center"}
                    onChange={e => setSetting("shipping_hero_scroll_pos", e.target.value)}
                    className="ec-cursor-pointer"
                  >
                    <option value="bottom_center">Abajo (Centro)</option>
                    <option value="bottom_left">Abajo (Izquierda)</option>
                    <option value="bottom_right">Abajo (Derecha)</option>
                    <option value="center_left">Centro (Izquierda)</option>
                    <option value="center_right">Centro (Derecha)</option>
                    <option value="top_center">Arriba (Centro)</option>
                  </CustomSelect>
                </label>

                {/* Tamaño */}
                <label className="hc-style-17">
                  <span className="hc-style-18">Tamaño</span>
                  <CustomSelect
                    value={settings.shipping_hero_scroll_size || "md"}
                    onChange={e => setSetting("shipping_hero_scroll_size", e.target.value)}
                    className="ec-cursor-pointer"
                  >
                    <option value="sm">Pequeño</option>
                    <option value="md">Normal</option>
                    <option value="lg">Grande</option>
                  </CustomSelect>
                </label>

                {/* Color */}
                <label className="hc-style-17">
                  <span className="hc-style-18">Color</span>
                  <div className="ec-flex-center">
                    <input
                      type="color"
                      value={settings.shipping_hero_scroll_color || "#ffffff"}
                      onChange={e => setSetting("shipping_hero_scroll_color", e.target.value)}
                      className="ec-color-picker"
                    />
                    <span className="ec-color-hex">
                      {settings.shipping_hero_scroll_color || "#ffffff"}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
             TAB: OPTIONS
         ══════════════════════════════ */}
        {activeTab === "options" && (
          <div>
            <div className="ec-header-between">
              <p className="hc-style-11 ec-m-0">Opciones de entrega disponibles para los clientes.</p>
              <button onClick={addDeliveryMethod} className="ec-btn-add">
                <Plus size={16} /> Añadir Opción
              </button>
            </div>

            <div className="hc-style-14 ec-mb-20">
              <h3 className="hc-style-15">Textos y Animación de la Sección</h3>
              <div className="hc-style-16">
                <div className="ec-grid-auto-15">
                  <label className="hc-style-17">
                    <span className="hc-style-18">Sobre-título (Pequeño)</span>
                    <input
                      type="text"
                      value={settings.shipping_methods_overline ?? "Nuestras Rutas"}
                      onChange={e => setSetting("shipping_methods_overline", e.target.value)}
                      className="hc-style-19"
                    />
                  </label>
                  <label className="hc-style-17">
                    <span className="hc-style-18">Título Principal</span>
                    <input
                      type="text"
                      value={settings.shipping_methods_title ?? "Opciones de Entrega"}
                      onChange={e => setSetting("shipping_methods_title", e.target.value)}
                      className="hc-style-19"
                    />
                  </label>
                  <label className="hc-style-17">
                    <span className="hc-style-18">Estilo de Animación</span>
                    <CustomSelect
                      value={settings.shipping_methods_animation || "fade-up"}
                      onChange={e => setSetting("shipping_methods_animation", e.target.value)}
                      className="ec-cursor-pointer"
                    >
                      <option value="fade-up">Aparecer hacia arriba</option>
                      <option value="fade-left">Aparecer desde la derecha</option>
                      <option value="fade-right">Aparecer desde la izquierda</option>
                      <option value="alternate">Alternado (Der-Izq-Der)</option>
                    </CustomSelect>
                  </label>
                </div>
                <label className="hc-style-17">
                  <span className="hc-style-18">Subtítulo</span>
                  <input
                    type="text"
                    value={settings.shipping_methods_subtitle ?? "Diseñadas para adaptarse a tu ritmo y a tu ubicación."}
                    onChange={e => setSetting("shipping_methods_subtitle", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
              </div>
            </div>

            {deliveryMethods.length === 0 && (
              <div className="ec-empty-state">
                No hay opciones configuradas.
              </div>
            )}

            {deliveryMethods.map((method, index) => (
              <div key={index} className="hc-style-14 ec-card-relative">
                <div className="ec-card-actions">
                  <button onClick={() => moveDeliveryMethod(index, 'up')} disabled={index === 0} className="ec-btn-icon" title="Mover Arriba">
                    <Icons.ArrowUp size={18} />
                  </button>
                  <button onClick={() => moveDeliveryMethod(index, 'down')} disabled={index === deliveryMethods.length - 1} className="ec-btn-icon" title="Mover Abajo">
                    <Icons.ArrowDown size={18} />
                  </button>
                  <button onClick={() => removeDeliveryMethod(index)} className="ec-btn-icon-danger" title="Eliminar">
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <h3 className="hc-style-15">Opción {index + 1}</h3>
                
                <div className="ec-grid-icon-title">
                  <div>
                    <label className="hc-style-18 ec-block ec-mb-8">Ícono</label>
                    <div 
                      onClick={() => openIconPicker({ type: 'option', index })}
                      className="ec-icon-btn-sm"
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      title="Clic para cambiar ícono"
                    >
                      {renderIcon(method.icon || "MapPin", 22)}
                    </div>
                  </div>
                  <div className="hc-style-16 ec-flex-col-center">
                    <label className="hc-style-17">
                      <span className="hc-style-18">Título</span>
                      <input
                        type="text"
                        value={method.title || ""}
                        onChange={e => updateDeliveryMethod(index, "title", e.target.value)}
                        className="hc-style-19"
                        placeholder="Ej: Envíos Nacionales"
                      />
                    </label>
                  </div>
                </div>

                <div className="ec-flex-col">
                  <label className="hc-style-17">
                    <span className="hc-style-18">Descripción</span>
                    <textarea
                      rows={2}
                      value={method.desc || ""}
                      onChange={e => updateDeliveryMethod(index, "desc", e.target.value)}
                      className="hc-style-19 ec-textarea-resize"
                      placeholder="Ej: Recibe tu pedido directamente en tu puerta..."
                    />
                  </label>
                  <label className="hc-style-17">
                    <span className="hc-style-18">Características adicionales (Una por línea)</span>
                    <textarea
                      rows={3}
                      value={method.features || ""}
                      onChange={e => updateDeliveryMethod(index, "features", e.target.value)}
                      className="hc-style-19 ec-textarea-resize"
                      placeholder="Entregas en 24h&#10;Pago contra entrega"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════
             TAB: PROCESS
         ══════════════════════════════ */}
        {activeTab === "process" && (
          <div>
            <div className="ec-header-between">
              <p className="hc-style-11 ec-m-0">Pasos del proceso de compra y envío.</p>
              <button onClick={addProcessStep} className="ec-btn-add">
                <Plus size={16} /> Añadir Paso
              </button>
            </div>

            <div className="hc-style-14 ec-mb-20">
              <h3 className="hc-style-15">Textos, Layout y Animación de la Sección</h3>
              <div className="hc-style-16">
                <div className="ec-grid-auto-15">
                  <label className="hc-style-17">
                    <span className="hc-style-18">Sobre-título (Pequeño)</span>
                    <input
                      type="text"
                      value={settings.shipping_process_overline ?? "Paso a Paso"}
                      onChange={e => setSetting("shipping_process_overline", e.target.value)}
                      className="hc-style-19"
                    />
                  </label>
                  <label className="hc-style-17">
                    <span className="hc-style-18">Título Principal</span>
                    <input
                      type="text"
                      value={settings.shipping_process_title ?? "¿Cómo es el proceso?"}
                      onChange={e => setSetting("shipping_process_title", e.target.value)}
                      className="hc-style-19"
                    />
                  </label>
                  <label className="hc-style-17">
                    <span className="hc-style-18">Estilo de Animación</span>
                    <CustomSelect
                      value={settings.shipping_process_animation || "fade-left"}
                      onChange={e => setSetting("shipping_process_animation", e.target.value)}
                      className="ec-cursor-pointer"
                    >
                      <option value="fade-up">Aparecer hacia arriba</option>
                      <option value="fade-left">Aparecer desde la derecha</option>
                      <option value="fade-right">Aparecer desde la izquierda</option>
                      <option value="alternate">Alternado (Der-Izq-Der)</option>
                    </CustomSelect>
                  </label>
                  <label className="hc-style-17">
                    <span className="hc-style-18">Formato Visual (Layout)</span>
                    <CustomSelect
                      value={settings.shipping_process_layout || "list"}
                      onChange={e => setSetting("shipping_process_layout", e.target.value)}
                      className="ec-cursor-pointer"
                    >
                      <option value="list">Lista Vertical (Clásica)</option>
                      <option value="cards">Tarjetas en Grilla</option>
                    </CustomSelect>
                  </label>
                </div>
              </div>
            </div>

            {processSteps.length === 0 && (
              <div className="ec-empty-state">
                No hay pasos configurados.
              </div>
            )}

            {processSteps.map((step, index) => (
              <div key={index} className="hc-style-14 ec-card-relative">
                <div className="ec-card-actions">
                  <button onClick={() => moveProcessStep(index, 'up')} disabled={index === 0} className="ec-btn-icon" title="Mover Arriba">
                    <Icons.ArrowUp size={18} />
                  </button>
                  <button onClick={() => moveProcessStep(index, 'down')} disabled={index === processSteps.length - 1} className="ec-btn-icon" title="Mover Abajo">
                    <Icons.ArrowDown size={18} />
                  </button>
                  <button onClick={() => removeProcessStep(index)} className="ec-btn-icon-danger" title="Eliminar">
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <h3 className="hc-style-15">Paso {String(index + 1).padStart(2, '0')}</h3>
                
                <div className="ec-flex-col">
                  <label className="hc-style-17">
                    <span className="hc-style-18">Título del Paso</span>
                    <input
                      type="text"
                      value={step.title || ""}
                      onChange={e => updateProcessStep(index, "title", e.target.value)}
                      className="hc-style-19"
                      placeholder="Ej: Empaque y Preparación"
                    />
                  </label>
                  <label className="hc-style-17">
                    <span className="hc-style-18">Descripción</span>
                    <textarea
                      rows={2}
                      value={step.desc || ""}
                      onChange={e => updateProcessStep(index, "desc", e.target.value)}
                      className="hc-style-19 ec-textarea-resize"
                      placeholder="Ej: Preparamos tu orden asegurando que..."
                    />
                  </label>
                  <div className="ec-grid-auto-15">
                    <label className="hc-style-17">
                      <span className="hc-style-18">Texto del Enlace (Opcional)</span>
                      <input
                        type="text"
                        value={step.link_text || ""}
                        onChange={e => updateProcessStep(index, "link_text", e.target.value)}
                        className="hc-style-19"
                        placeholder="Ej: Ver detalles de empaque"
                      />
                    </label>
                    <label className="hc-style-17">
                      <span className="hc-style-18">URL del Enlace (Opcional)</span>
                      <input
                        type="text"
                        value={step.link_url || ""}
                        onChange={e => updateProcessStep(index, "link_url", e.target.value)}
                        className="hc-style-19"
                        placeholder="Ej: https://..."
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Icon Picker Modal ── */}
      <IconPickerModal 
        isOpen={isIconModalOpen}
        onClose={() => setIsIconModalOpen(false)}
        onSelect={handleSelectIcon}
      />

      {/* ── Video Picker Modal ── */}
      <VideoPickerModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        currentVideo={settings.shipping_hero_video}
        onSelect={(url) => setSetting("shipping_hero_video", url)}
      />

      {/* ── Floating Save Bar ── */}
      {dirty.size > 0 && (
        <div className="hc-style-147">
          <div className="hc-style-148">
            <span className="hc-style-85">
              {dirty.size} cambio{dirty.size !== 1 ? "s" : ""} sin guardar
            </span>
            <div className="hc-style-149">
              <button onClick={fetchSettings} className="hc-style-150">
                Descartar
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 20px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                background: saving ? "var(--border-color)" : "var(--color-primary)",
                color: saving ? "var(--text-muted)" : "var(--color-primary-text)",
                border: "none"
              }}>
                {saving ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin hc-style-151" /> : <Save size={15} />}
                {saving ? "Guardando..." : "Guardar Todo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
