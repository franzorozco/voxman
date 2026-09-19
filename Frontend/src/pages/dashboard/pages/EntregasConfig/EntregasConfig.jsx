import "../HomeConfig/HomeConfig.css";
import React, { useState, useEffect } from "react";
import { Truck, MapPin, Save, Plus, Trash2, Edit2, ListOrdered, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { getSystemSettings, updateSystemSetting } from "../../../../api/admin/systemSettings";
import { useThemeStore } from "../../../../store/themeStore";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";
import IconPickerModal from "../HomeConfig/IconPickerModal";
import * as Icons from "lucide-react";

const TABS = [
  { id: "hero", label: "Hero (Inicio)", icon: <ImageIcon size={15} /> },
  { id: "options", label: "Opciones de Envío", icon: <MapPin size={15} /> },
  { id: "process", label: "Proceso (Pasos)", icon: <ListOrdered size={15} /> }
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: "8px 8px 0 0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid transparent",
                borderBottom: "none",
                background: activeTab === t.id ? "var(--bg-card)" : "transparent",
                color: activeTab === t.id ? "var(--color-primary)" : "var(--text-muted)",
                borderColor: activeTab === t.id ? "var(--border-color)" : "transparent",
                marginBottom: activeTab === t.id ? -1 : 0
              }}
            >
              {t.icon} <span className="hc-style-13">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════
             TAB: HERO
         ══════════════════════════════ */}
        {activeTab === "hero" && (
          <div>
            <div className="hc-style-14">
              <h3 className="hc-style-15">Textos Principales (Hero)</h3>
              
              <div style={{ marginBottom: 20 }}>
                <label className="hc-style-18" style={{ display: 'block', marginBottom: 8 }}>Ícono Principal</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color)' }}>
                    {renderIcon(settings.shipping_hero_icon || "Package", 24)}
                  </div>
                  <button onClick={() => openIconPicker({ type: 'hero' })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-color)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    <Edit2 size={14} /> Cambiar Ícono
                  </button>
                </div>
              </div>

              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">Título Principal</span>
                  <input
                    type="text"
                    value={settings.shipping_hero_title || ""}
                    onChange={e => setSetting("shipping_hero_title", e.target.value)}
                    onFocus={e => e.target.style.borderColor = "var(--color-primary)"}
                    onBlur={e => e.target.style.borderColor = "var(--border-color)"}
                    className="hc-style-19"
                    placeholder="Ej: LLEGAMOS DONDE TÚ ESTÉS."
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Subtítulo</span>
                  <input
                    type="text"
                    value={settings.shipping_hero_subtitle || ""}
                    onChange={e => setSetting("shipping_hero_subtitle", e.target.value)}
                    onFocus={e => e.target.style.borderColor = "var(--color-primary)"}
                    onBlur={e => e.target.style.borderColor = "var(--border-color)"}
                    className="hc-style-19"
                    placeholder="Ej: Envíos rápidos, seguros..."
                  />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p className="hc-style-11" style={{ margin: 0 }}>Opciones de entrega disponibles para los clientes.</p>
              <button onClick={addDeliveryMethod} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <Plus size={16} /> Añadir Opción
              </button>
            </div>

            {deliveryMethods.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-main)', border: '1px dashed var(--border-color)', borderRadius: 8, color: 'var(--text-muted)' }}>
                No hay opciones configuradas.
              </div>
            )}

            {deliveryMethods.map((method, index) => (
              <div key={index} className="hc-style-14" style={{ marginBottom: 20, position: 'relative' }}>
                <button onClick={() => removeDeliveryMethod(index)} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: 'var(--color-danger, #e53e3e)', cursor: 'pointer', padding: 5 }}>
                  <Trash2 size={18} />
                </button>
                
                <h3 className="hc-style-15">Opción {index + 1}</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color)' }}>
                    {renderIcon(method.icon || "MapPin", 20)}
                  </div>
                  <button onClick={() => openIconPicker({ type: 'option', index })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', borderRadius: 6, color: 'var(--text-color)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                    <Edit2 size={14} /> Elegir Ícono
                  </button>
                </div>

                <div className="hc-style-16">
                  <label className="hc-style-17">
                    <span className="hc-style-18">Título</span>
                    <input
                      type="text"
                      value={method.title || ""}
                      onChange={e => updateDeliveryMethod(index, "title", e.target.value)}
                      className="hc-style-19"
                    />
                  </label>
                  <label className="hc-style-17" style={{ gridColumn: "1 / -1" }}>
                    <span className="hc-style-18">Descripción</span>
                    <textarea
                      rows={2}
                      value={method.desc || ""}
                      onChange={e => updateDeliveryMethod(index, "desc", e.target.value)}
                      className="hc-style-19"
                      style={{ resize: "vertical" }}
                    />
                  </label>
                  <label className="hc-style-17" style={{ gridColumn: "1 / -1" }}>
                    <span className="hc-style-18">Características adicionales (Una por línea)</span>
                    <textarea
                      rows={3}
                      value={method.features || ""}
                      onChange={e => updateDeliveryMethod(index, "features", e.target.value)}
                      className="hc-style-19"
                      style={{ resize: "vertical" }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p className="hc-style-11" style={{ margin: 0 }}>Pasos del proceso de compra y envío.</p>
              <button onClick={addProcessStep} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <Plus size={16} /> Añadir Paso
              </button>
            </div>

            {processSteps.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-main)', border: '1px dashed var(--border-color)', borderRadius: 8, color: 'var(--text-muted)' }}>
                No hay pasos configurados.
              </div>
            )}

            {processSteps.map((step, index) => (
              <div key={index} className="hc-style-14" style={{ marginBottom: 20, position: 'relative' }}>
                <button onClick={() => removeProcessStep(index)} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: 'var(--color-danger, #e53e3e)', cursor: 'pointer', padding: 5 }}>
                  <Trash2 size={18} />
                </button>
                
                <h3 className="hc-style-15">Paso {String(index + 1).padStart(2, '0')}</h3>
                
                <div className="hc-style-16">
                  <label className="hc-style-17" style={{ gridColumn: "1 / -1" }}>
                    <span className="hc-style-18">Título del Paso</span>
                    <input
                      type="text"
                      value={step.title || ""}
                      onChange={e => updateProcessStep(index, "title", e.target.value)}
                      className="hc-style-19"
                    />
                  </label>
                  <label className="hc-style-17" style={{ gridColumn: "1 / -1" }}>
                    <span className="hc-style-18">Descripción</span>
                    <textarea
                      rows={2}
                      value={step.desc || ""}
                      onChange={e => updateProcessStep(index, "desc", e.target.value)}
                      className="hc-style-19"
                      style={{ resize: "vertical" }}
                    />
                  </label>
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
