import "../HomeConfig/HomeConfig.css";
import "./NosotrosConfig.css";
import React, { useState, useEffect } from "react";
import { Save, Plus, Trash2, Edit2, ListOrdered, Image as ImageIcon, Layers, Eye, EyeOff, FileText, Users, Target } from "lucide-react";
import toast from "react-hot-toast";
import { getSystemSettings, updateSystemSetting } from "../../../../api/admin/systemSettings";
import { useThemeStore } from "../../../../store/themeStore";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";
import IconPickerModal from "../HomeConfig/IconPickerModal";
import * as Icons from "lucide-react";
import { URL_BASE_IMG } from "../../../../config/api";
import VideoPickerModal from "../EntregasConfig/VideoPickerModal";
import FounderImagePickerModal from "./FounderImagePickerModal";
import { getImageUrl } from "../../../../utils/imageUtils";
import { getVideoUrl } from "../../../../utils/videoUtils";

const TABS = [
  { id: "hero", label: "Hero", icon: <ImageIcon size={15} /> },
  { id: "history", label: "Historia", icon: <FileText size={15} /> },
  { id: "founders", label: "Fundadores", icon: <Users size={15} /> },
  { id: "mvp", label: "Misión/Visión", icon: <Target size={15} /> },
  { id: "sections", label: "Secciones", icon: <Layers size={15} /> }
];

export default function NosotrosConfig() {
  const isDark = useThemeStore(s => s.isDark);
  const theme = isDark ? "admin-theme-dark" : "admin-theme";
  const [activeTab, setActiveTab] = useState("hero");
  const [settings, setSettings] = useState({});
  const [dirty, setDirty] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Modal de iconos
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState(null); 

  // Modal de video
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Modal de founder image
  const [selectingFounderImage, setSelectingFounderImage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getSystemSettings();
      const st = {};
      data.forEach(item => {
        st[item.key] = item.value;
      });
      setSettings(st);
    } catch (err) {
      toast.error("Error al cargar configuraciones");
    } finally {
      setLoadingSettings(false);
    }
  };

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

  // --- Handlers: Historia ---
  const storyParagraphs = getArraySetting("about_story_paragraphs", [
    "VOXman no nació en una sala de juntas. Nació de conversaciones a altas horas de la noche...",
    "Esta marca es el reflejo vivo de nuestra historia...",
    "No importa cuántas veces la vida se ponga difícil..."
  ]);
  const addStoryParagraph = () => updateArraySetting("about_story_paragraphs", [...storyParagraphs, ""]);
  const updateStoryParagraph = (index, value) => {
    const newArr = [...storyParagraphs];
    newArr[index] = value;
    updateArraySetting("about_story_paragraphs", newArr);
  };
  const removeStoryParagraph = (index) => {
    const newArr = storyParagraphs.filter((_, i) => i !== index);
    updateArraySetting("about_story_paragraphs", newArr);
  };

  // --- Handlers: Fundadores ---
  const defaultFounders = [
    { name: "Franz Orozco", role: "Desarrollo y Visión Estratégica", text: "La lógica, el código...", image: "/system/global/Franz.jpg" },
    { name: "Rous Vidal", role: "Estética, Arte y Dirección Visual", text: "El alma creativa...", image: "/system/global/Rous.jpg" }
  ];
  const founders = getArraySetting("about_founders_list", defaultFounders);
  const addFounder = () => updateArraySetting("about_founders_list", [...founders, { name: "Nuevo", role: "", text: "", image: "" }]);
  const updateFounder = (index, field, value) => {
    const newArr = [...founders];
    newArr[index][field] = value;
    updateArraySetting("about_founders_list", newArr);
  };
  const removeFounder = (index) => {
    if(!window.confirm("¿Eliminar?")) return;
    const newArr = founders.filter((_, i) => i !== index);
    updateArraySetting("about_founders_list", newArr);
  };
  const moveFounder = (index, direction) => {
    const newArr = [...founders];
    if (direction === 'up' && index > 0) {
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      updateArraySetting("about_founders_list", newArr);
    } else if (direction === 'down' && index < founders.length - 1) {
      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      updateArraySetting("about_founders_list", newArr);
    }
  };

  // --- Handlers: Valores ---
  const defaultValues = [
    { title: "Autenticidad", text: "No seguimos moldes...", icon: "Award" },
    { title: "Calidad", text: "Atención obsesiva...", icon: "Star" },
    { title: "Resiliencia", text: "Crecemos ante la adversidad...", icon: "Shield" }
  ];
  const valuesList = getArraySetting("about_values_list", defaultValues);
  const addValue = () => updateArraySetting("about_values_list", [...valuesList, { title: "Nuevo", text: "", icon: "Star" }]);
  const updateValue = (index, field, val) => {
    const newArr = [...valuesList];
    newArr[index][field] = val;
    updateArraySetting("about_values_list", newArr);
  };
  const removeValue = (index) => {
    if(!window.confirm("¿Eliminar?")) return;
    const newArr = valuesList.filter((_, i) => i !== index);
    updateArraySetting("about_values_list", newArr);
  };
  const moveValue = (index, direction) => {
    const newArr = [...valuesList];
    if (direction === 'up' && index > 0) {
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      updateArraySetting("about_values_list", newArr);
    } else if (direction === 'down' && index < valuesList.length - 1) {
      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      updateArraySetting("about_values_list", newArr);
    }
  };

  // --- Icons ---
  const openIconPicker = (target) => {
    setIconPickerTarget(target);
    setIsIconModalOpen(true);
  };
  const handleSelectIcon = (iconName) => {
    if (iconPickerTarget.type === 'story') {
      setSetting("about_story_card_icon", iconName);
    } else if (iconPickerTarget.type === 'mission') {
      setSetting("about_mvp_mission_icon", iconName);
    } else if (iconPickerTarget.type === 'vision') {
      setSetting("about_mvp_vision_icon", iconName);
    } else if (iconPickerTarget.type === 'value') {
      updateValue(iconPickerTarget.index, 'icon', iconName);
    }
    setIsIconModalOpen(false);
  };

  const fetchPublicSettings = useShopSettingsStore(s => s.fetchSettings);

  const handleSave = async () => {
    if (dirty.size === 0) return;
    setSaving(true);
    try {
      for (const key of Array.from(dirty)) {
        await updateSystemSetting(key, { value: settings[key], category: 'About_Us_page_config' });
      }
      toast.success(`Configuraciones guardadas`);
      setDirty(new Set());
      await fetchPublicSettings(true);
    } catch (err) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const renderIcon = (iconName, size = 24) => {
    if (!iconName) return <Icons.HelpCircle size={size} />;
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
    { key: "about_section_hero_show", label: "Hero (Inicio)", desc: "El banner de bienvenida de Nosotros." },
    { key: "about_section_history_show", label: "Nuestra Historia", desc: "La sección que cuenta el origen de la marca." },
    { key: "about_section_founders_show", label: "Los Fundadores", desc: "La cuadrícula con los fundadores/dueños." },
    { key: "about_section_mvp_show", label: "Misión, Visión y Valores", desc: "Las tarjetas de misión, visión y los pilares." }
  ];

  return (
    <div className={`${theme} hc-style-5`}>
      <div className="hc-style-6">
        <div className="hc-style-7">
          <div className="hc-style-8">
            <div className="hc-style-9">
              <Users size={18} />
            </div>
            <h1 className="hc-style-10">Configuración Nosotros</h1>
          </div>
          <p className="hc-style-11">
            Personaliza los textos, opciones y la historia de tu marca.
          </p>
        </div>

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
             TAB: SECTIONS
         ══════════════════════════════ */}
        {activeTab === "sections" && (
          <div className="hc-style-141">
            {SECTION_KEYS.map((s, idx) => {
              const active = settings[s.key] === undefined || String(settings[s.key]) !== "0";
              const isLast = idx === SECTION_KEYS.length - 1;
              return (
                <div key={s.key} className={`nc-section-item ${isLast ? "nc-section-item-last" : ""} ${dirty.has(s.key) ? "nc-dirty" : ""}`}>
                  <div className="hc-style-142">
                    <div className="hc-style-112">
                      {active ? <Eye size={15} className="hc-style-143" /> : <EyeOff size={15} className="hc-style-144" />}
                      <span className="hc-style-21">{s.label}</span>
                      {dirty.has(s.key) && <span className="hc-style-145">Modificado</span>}
                    </div>
                    <p className="hc-style-146">{s.desc}</p>
                  </div>
                  <button type="button" onClick={() => setSetting(s.key, active ? "0" : "1")} 
                    className={`nc-switch-btn ${active ? "nc-active" : ""}`}>
                    <span className="nc-switch-indicator" />
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
              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">Título</span>
                  <input type="text" value={settings.about_hero_title ?? "MÁS QUE ROPA, UNA IDENTIDAD."} onChange={e => setSetting("about_hero_title", e.target.value)} className="hc-style-19" />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Subtítulo</span>
                  <textarea rows={2} value={settings.about_hero_subtitle ?? "Forjados en la perseverancia. Construidos con pasión."} onChange={e => setSetting("about_hero_subtitle", e.target.value)} className="hc-style-19 nc-textarea-resize" />
                </label>
              </div>
            </div>
            
            <div className="hc-style-14 nc-mt-20">
              <h3 className="hc-style-15">Video de Fondo</h3>
              <p className="nc-text-muted-sm">Puedes poner un video de fondo. Si lo dejas vacío, será negro o usará el fondo predeterminado.</p>
              {settings.about_hero_video ? (
                <div 
                  onClick={() => setIsVideoModalOpen(true)}
                  style={{
                    position: "relative",
                    borderRadius: 10,
                    overflow: "hidden",
                    width: "100%",
                    maxWidth: "400px",
                    aspectRatio: "16/9",
                    cursor: "pointer",
                    border: "2px solid transparent",
                    transition: "all 0.2s",
                    backgroundColor: "var(--bg-overlay)"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                >
                  <video 
                    src={getVideoUrl(settings.about_hero_video)} 
                    autoPlay 
                    muted 
                    loop 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: "brightness(0.8)" }} 
                  />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSetting("about_hero_video", "");
                    }} 
                    title="Quitar" 
                    className="hc-style-29"
                  >
                    <Icons.X size={12} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => setIsVideoModalOpen(true)}
                  style={{
                    position: "relative",
                    borderRadius: 10,
                    overflow: "hidden",
                    width: "100%",
                    maxWidth: "400px",
                    aspectRatio: "16/9",
                    cursor: "pointer",
                    border: "2px solid transparent",
                    transition: "all 0.2s",
                    backgroundColor: "var(--bg-overlay)"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                >
                  <div className="hc-style-45" style={{ height: '100%' }}>
                    <ImageIcon size={24} className="hc-style-46" />
                    <span className="hc-style-47">Click para seleccionar video</span>
                  </div>
                </div>
              )}
            </div>

            <div className="hc-style-14 nc-mt-20">
              <h3 className="hc-style-15">Ajustes Visuales</h3>
              <div className="hc-style-16">
                <div className="nc-grid-auto">
                  <label className="hc-style-17">
                    <span className="hc-style-18">Color de Superposición</span>
                    <div className="nc-color-input-wrapper">
                      <input type="color" value={settings.about_hero_overlay_color || "#000000"} onChange={e => setSetting("about_hero_overlay_color", e.target.value)} className="nc-color-picker" />
                      <input type="text" value={settings.about_hero_overlay_color || "#000000"} onChange={e => setSetting("about_hero_overlay_color", e.target.value)} className="hc-style-19 nc-flex-1" />
                    </div>
                  </label>
                  <label className="hc-style-17">
                    <span className="hc-style-18">Opacidad ({settings.about_hero_overlay_opacity || 50}%)</span>
                    <input type="range" min="0" max="100" value={settings.about_hero_overlay_opacity || 50} onChange={e => setSetting("about_hero_overlay_opacity", e.target.value)} className="nc-range-input" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
             TAB: HISTORY
         ══════════════════════════════ */}
        {activeTab === "history" && (
          <div>
            <div className="hc-style-14">
              <h3 className="hc-style-15">Nuestra Historia</h3>
              <div className="hc-style-16">
                <div className="nc-grid-2">
                  <label className="hc-style-17">
                    <span className="hc-style-18">Sobre-título</span>
                    <input type="text" value={settings.about_story_overline ?? "El Origen"} onChange={e => setSetting("about_story_overline", e.target.value)} className="hc-style-19" />
                  </label>
                  <label className="hc-style-17">
                    <span className="hc-style-18">Título Principal</span>
                    <input type="text" value={settings.about_story_title ?? "El Inicio de un Sueño"} onChange={e => setSetting("about_story_title", e.target.value)} className="hc-style-19" />
                  </label>
                </div>

                <div className="nc-mt-20">
                  <h4 className="hc-style-18 nc-mb-10">Párrafos de la Historia</h4>
                  {storyParagraphs.map((p, i) => (
                    <div key={i} className="nc-paragraph-row">
                      <textarea rows={2} value={p} onChange={e => updateStoryParagraph(i, e.target.value)} className="hc-style-19 nc-textarea-flex" />
                      <button onClick={() => removeStoryParagraph(i)} className="nc-btn-icon-danger"><Trash2 size={18} /></button>
                    </div>
                  ))}
                  <button onClick={addStoryParagraph} className="nc-btn-add"><Plus size={14} /> Añadir Párrafo</button>
                </div>
              </div>
            </div>

            <div className="hc-style-14 nc-mt-20">
              <h3 className="hc-style-15">Tarjeta de Promesa (Derecha)</h3>
              <div className="hc-style-16 nc-grid-promise">
                <div>
                  <label className="hc-style-18 nc-block nc-mb-8">Ícono</label>
                  <div onClick={() => openIconPicker({ type: 'story' })} className="nc-icon-box">
                    {renderIcon(settings.about_story_card_icon || "Heart", 22)}
                  </div>
                </div>
                <div className="nc-flex-col-15">
                  <label className="hc-style-17">
                    <span className="hc-style-18">Título de Tarjeta</span>
                    <input type="text" value={settings.about_story_card_title ?? "Nuestra Promesa"} onChange={e => setSetting("about_story_card_title", e.target.value)} className="hc-style-19" />
                  </label>
                  <label className="hc-style-17">
                    <span className="hc-style-18">Texto de Tarjeta</span>
                    <textarea rows={2} value={settings.about_story_card_text ?? "\"Construir algo verdadero...\""} onChange={e => setSetting("about_story_card_text", e.target.value)} className="hc-style-19 nc-textarea-resize" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
             TAB: FOUNDERS
         ══════════════════════════════ */}
        {activeTab === "founders" && (
          <div>
            <div className="hc-style-14 nc-mb-20">
              <h3 className="hc-style-15">Textos de Sección</h3>
              <div className="hc-style-16 nc-grid-auto">
                <label className="hc-style-17">
                  <span className="hc-style-18">Sobre-título</span>
                  <input type="text" value={settings.about_founders_overline ?? "Los Creadores"} onChange={e => setSetting("about_founders_overline", e.target.value)} className="hc-style-19" />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Título</span>
                  <input type="text" value={settings.about_founders_title ?? "Quienes Somos"} onChange={e => setSetting("about_founders_title", e.target.value)} className="hc-style-19" />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Subtítulo</span>
                  <input type="text" value={settings.about_founders_subtitle ?? "Dos mentes, un solo corazón..."} onChange={e => setSetting("about_founders_subtitle", e.target.value)} className="hc-style-19" />
                </label>
              </div>
            </div>

            <div className="nc-header-between">
              <h3 className="hc-style-21 nc-m-0">Listado de Fundadores / Equipo</h3>
              <button onClick={addFounder} className="nc-btn-add-primary"><Plus size={16} /> Añadir Persona</button>
            </div>

            {founders.map((f, index) => (
              <div key={index} className="hc-style-14 nc-card-relative">
                <div className="nc-card-actions">
                  <button onClick={() => moveFounder(index, 'up')} disabled={index === 0} className="nc-btn-icon"><Icons.ArrowUp size={18} /></button>
                  <button onClick={() => moveFounder(index, 'down')} disabled={index === founders.length - 1} className="nc-btn-icon"><Icons.ArrowDown size={18} /></button>
                  <button onClick={() => removeFounder(index)} className="nc-btn-icon-danger-sm"><Trash2 size={18} /></button>
                </div>
                
                <h3 className="hc-style-15">Persona {index + 1}</h3>
                
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
                  {/* Left: Image */}
                  <div className="hc-style-17" style={{ flexShrink: 0 }}>
                    <span className="hc-style-18">Fotografía</span>
                    <div 
                      onClick={() => setSelectingFounderImage(index)}
                      style={{
                        position: "relative",
                        borderRadius: 10,
                        overflow: "hidden",
                        width: "150px",
                        height: "150px",
                        cursor: "pointer",
                        border: "2px solid transparent",
                        transition: "all 0.2s",
                        backgroundColor: "var(--bg-overlay)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                    >
                      {f.image ? (
                        <>
                          <img 
                            src={getImageUrl(f.image)} 
                            alt={f.name} 
                            className="hc-style-44" 
                            style={{ filter: "brightness(0.8)" }}
                            onError={(e) => {
                              e.target.src = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_white.jfif";
                            }}
                          />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              updateFounder(index, "image", "");
                            }} 
                            title="Quitar" 
                            className="hc-style-29"
                          >
                            <Icons.X size={12} />
                          </button>
                        </>
                      ) : (
                        <div className="hc-style-45">
                          <ImageIcon size={24} className="hc-style-46" />
                          <span className="hc-style-47">Click para seleccionar</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Form fields */}
                  <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div className="nc-grid-2">
                      <label className="hc-style-17">
                        <span className="hc-style-18">Nombre</span>
                        <input type="text" value={f.name || ""} onChange={e => updateFounder(index, "name", e.target.value)} className="hc-style-19" />
                      </label>
                      <label className="hc-style-17">
                        <span className="hc-style-18">Rol / Cargo</span>
                        <input type="text" value={f.role || ""} onChange={e => updateFounder(index, "role", e.target.value)} className="hc-style-19" />
                      </label>
                    </div>
                    <label className="hc-style-17" style={{ flex: 1 }}>
                      <span className="hc-style-18">Descripción</span>
                      <textarea rows={3} value={f.text || ""} onChange={e => updateFounder(index, "text", e.target.value)} className="hc-style-19 nc-textarea-flex" style={{ minHeight: "84px" }} />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════
             TAB: MVP
         ══════════════════════════════ */}
        {activeTab === "mvp" && (
          <div>
            <div className="hc-style-14 nc-mb-20">
              <h3 className="hc-style-15">Misión y Visión</h3>
              <div className="hc-style-16 nc-grid-mvp">
                {/* Mision */}
                <div>
                  <h4 className="nc-mvp-title">Misión</h4>
                  <div className="nc-flex-gap-15-mb">
                    <div onClick={() => openIconPicker({ type: 'mission' })} className="nc-icon-box-sm">
                      {renderIcon(settings.about_mvp_mission_icon || "Target", 20)}
                    </div>
                    <input type="text" value={settings.about_mvp_mission_title ?? "Nuestra Misión"} onChange={e => setSetting("about_mvp_mission_title", e.target.value)} className="hc-style-19" />
                  </div>
                  <textarea rows={3} value={settings.about_mvp_mission_text ?? "Ofrecer más que prendas..."} onChange={e => setSetting("about_mvp_mission_text", e.target.value)} className="hc-style-19 nc-textarea-resize" />
                </div>
                {/* Vision */}
                <div>
                  <h4 className="nc-mvp-title">Visión</h4>
                  <div className="nc-flex-gap-15-mb">
                    <div onClick={() => openIconPicker({ type: 'vision' })} className="nc-icon-box-sm">
                      {renderIcon(settings.about_mvp_vision_icon || "Compass", 20)}
                    </div>
                    <input type="text" value={settings.about_mvp_vision_title ?? "Nuestra Visión"} onChange={e => setSetting("about_mvp_vision_title", e.target.value)} className="hc-style-19" />
                  </div>
                  <textarea rows={3} value={settings.about_mvp_vision_text ?? "Posicionarnos como referente..."} onChange={e => setSetting("about_mvp_vision_text", e.target.value)} className="hc-style-19 nc-textarea-resize" />
                </div>
              </div>
            </div>

            <div className="hc-style-14 nc-mb-20">
              <h3 className="hc-style-15">Textos de Valores / Pilares</h3>
              <div className="hc-style-16 nc-grid-2">
                <label className="hc-style-17"><span className="hc-style-18">Sobre-título</span><input type="text" value={settings.about_values_overline ?? "La Esencia"} onChange={e => setSetting("about_values_overline", e.target.value)} className="hc-style-19" /></label>
                <label className="hc-style-17"><span className="hc-style-18">Título</span><input type="text" value={settings.about_values_title ?? "Nuestros Pilares"} onChange={e => setSetting("about_values_title", e.target.value)} className="hc-style-19" /></label>
              </div>
            </div>

            <div className="nc-header-between">
              <h3 className="hc-style-21 nc-m-0">Listado de Valores</h3>
              <button onClick={addValue} className="nc-btn-add-primary"><Plus size={16} /> Añadir Valor</button>
            </div>

            {valuesList.map((v, index) => (
              <div key={index} className="hc-style-14 nc-card-relative">
                <div className="nc-card-actions">
                  <button onClick={() => moveValue(index, 'up')} disabled={index === 0} className="nc-btn-icon"><Icons.ArrowUp size={18} /></button>
                  <button onClick={() => moveValue(index, 'down')} disabled={index === valuesList.length - 1} className="nc-btn-icon"><Icons.ArrowDown size={18} /></button>
                  <button onClick={() => removeValue(index)} className="nc-btn-icon-danger-sm"><Trash2 size={18} /></button>
                </div>
                
                <div className="nc-flex-gap-15">
                  <div onClick={() => openIconPicker({ type: 'value', index })} className="nc-icon-box nc-mt-25">
                    {renderIcon(v.icon || "Star", 22)}
                  </div>
                  <div className="nc-flex-col-15-flex1">
                    <label className="hc-style-17"><span className="hc-style-18">Título del Valor</span><input type="text" value={v.title || ""} onChange={e => updateValue(index, "title", e.target.value)} className="hc-style-19" /></label>
                    <label className="hc-style-17"><span className="hc-style-18">Descripción</span><textarea rows={2} value={v.text || ""} onChange={e => updateValue(index, "text", e.target.value)} className="hc-style-19 nc-textarea-resize" /></label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Floating Save Bar ── */}
      {dirty.size > 0 && <div className="hc-style-147">
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
        </div>}

      <IconPickerModal isOpen={isIconModalOpen} onClose={() => setIsIconModalOpen(false)} onSelectIcon={handleSelectIcon} isDark={isDark} />
      <VideoPickerModal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} isDark={isDark} onSelect={(v) => setSetting("about_hero_video", v)} />
      
      <FounderImagePickerModal
        isOpen={selectingFounderImage !== null}
        onClose={() => setSelectingFounderImage(null)}
        currentimage={selectingFounderImage !== null ? founders[selectingFounderImage]?.image : null}
        onSelect={(url) => {
          if (selectingFounderImage !== null) {
            updateFounder(selectingFounderImage, "image", url);
          }
        }}
      />
    </div>
  );
}
