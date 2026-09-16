import React, { useState, useEffect, useCallback, useRef } from "react";
import { LayoutDashboard, Image, EyeOff, Eye, Save, RefreshCw, Check, X, Grid, Upload, Link as LinkIcon, Megaphone } from "lucide-react";
import toast from "react-hot-toast";
import { getSystemSettings, updateSystemSetting } from "../../../../api/admin/systemSettings";
import { getVariantImages, getCategories, uploadCategoryImage, uploadBackgroundImage, getBackgroundImages } from "../../../../api/admin/homeConfig";
import { getImageUrl } from "../../../../utils/imageUtils";
import { useThemeStore } from "../../../../store/themeStore";
import IconPickerModal from "./IconPickerModal";
import * as Icons from "lucide-react";

const TABS = [
  { id: "hero",       label: "Hero",        icon: <Image size={15} /> },
  { id: "categories", label: "Categorías",  icon: <Grid size={15} /> },
  { id: "carousel",   label: "Carrusel",    icon: <LayoutDashboard size={15} /> },
  { id: "value_props",label: "Beneficios",  icon: <LayoutDashboard size={15} /> },
  { id: "topbars",    label: "Top Bars",    icon: <Megaphone size={15} /> },
  { id: "sections",   label: "Secciones",   icon: <LayoutDashboard size={15} /> },
];

const SECTION_KEYS = [
  { key: "home_show_hero",       label: "Hero (banner principal)",     desc: "La seccion con las imagenes y el titulo de bienvenida." },
  { key: "home_show_value_props",label: "Barra de Beneficios",        desc: "Muestra la barra con iconos informativos debajo del hero." },
  { key: "home_show_carousel",   label: "Carrusel de Productos",        desc: "Carrusel de Novedades, Más Vendidos, etc." },
  { key: "home_show_categories", label: "Categorias",                   desc: "Grilla de categorias de productos." },
  { key: "home_show_top_bars",   label: "Top Bars (Cintillos)",         desc: "Activa o desactiva todos los cintillos de anuncios del Home." },
  { key: "home_show_newsletter", label: "Newsletter / Suscripcion",    desc: "Formulario para que los clientes se suscriban." },
];

export default function HomeConfig() {
  const isDark = useThemeStore((s) => s.isDark);
  const theme  = isDark ? "admin-theme-dark" : "admin-theme";

  const [activeTab,   setActiveTab]   = useState("hero");
  const [settings,    setSettings]    = useState({});
  const [dirty,       setDirty]       = useState(new Set());
  const [saving,      setSaving]      = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  /* ── variant images picker state ── */
  const [allImages,   setAllImages]   = useState([]);
  const [loadingImgs, setLoadingImgs] = useState(false);
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);

  /* ── categories state ── */
  const [allCategories, setAllCategories] = useState([]);
  const [loadingCats,   setLoadingCats]   = useState(false);
  
  const [selectingImageForCat, setSelectingImageForCat] = useState(null); // id of category being edited
  const [modalTab, setModalTab] = useState("gallery"); // gallery | upload | url
  const [pastedUrl, setPastedUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  
  const [dragOverHeroIdx, setDragOverHeroIdx] = useState(null);
  const [dragOverCatIdx, setDragOverCatIdx] = useState(null);

  /* ── backgrounds state ── */
  const [selectingBackground, setSelectingBackground] = useState(false);
  const [bgModalTab, setBgModalTab] = useState("gallery"); // gallery | upload | url
  const [allBackgrounds, setAllBackgrounds] = useState([]);
  const [loadingBgs, setLoadingBgs] = useState(false);
  const bgFileInputRef = useRef(null);
  const [pastedBgUrl, setPastedBgUrl] = useState("");

  const fetchBackgrounds = async () => {
    setLoadingBgs(true);
    try {
      const res = await getBackgroundImages();
      setAllBackgrounds(res.data || []);
    } catch (e) {
      toast.error("Error al cargar fondos");
    } finally {
      setLoadingBgs(false);
    }
  };

  const [editingIconIndex, setEditingIconIndex] = useState(null);

  /* heroImages = array parsed from JSON setting */
  const heroImages = (() => {
    try { return JSON.parse(settings.home_hero_images || "[]"); } catch { return []; }
  })();

  /* featuredCategories = array parsed from JSON setting */
  const featuredCategories = (() => {
    try { return JSON.parse(settings.home_featured_categories || "[]"); } catch { return []; }
  })();

  const DEFAULT_VALUE_PROPS = [
    { icon: 'MessageCircle', title: 'Contacto Directo', desc: 'Coordina tu entrega de forma rápida sin registros obligatorios.' },
    { icon: 'Truck', title: 'Envíos y Delivery', desc: 'Entregas en La Paz, El Alto, Zona Sur, y envíos seguros a nivel nacional.' },
    { icon: 'PackageCheck', title: 'Reservas Flexibles', desc: 'Asegura tu pedido con un adelanto y coordina fecha, hora y lugar.' },
    { icon: 'UserPlus', title: 'Ventajas Exclusivas', desc: 'Crea tu cuenta (opcional) para agilizar envíos y guardar direcciones.' }
  ];

  /* valueProps = array parsed from JSON setting */
  const valueProps = (() => {
    if (!settings.home_value_props) return DEFAULT_VALUE_PROPS;
    try { 
      const parsed = JSON.parse(settings.home_value_props);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_VALUE_PROPS;
    } catch { return DEFAULT_VALUE_PROPS; }
  })();

  /* topBars = array parsed from JSON setting */
  const topBars = (() => {
    try {
      const parsed = JSON.parse(settings.home_top_bars || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();

  /* ── Top Bars position options ── */
  const POSITION_OPTIONS = [
    { value: "above_hero",        label: "Encima del Hero (arriba de todo)" },
    { value: "below_hero",        label: "Debajo del Hero" },
    { value: "below_value_props", label: "Debajo de Beneficios" },
    { value: "below_carousel",    label: "Debajo del Carrusel" },
    { value: "below_categories",  label: "Debajo de Categorías" },
    { value: "above_footer",      label: "Antes del Footer" },
  ];


  const fetchSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const data = await getSystemSettings();
      const map  = {};
      data.forEach((s) => { map[s.key] = s.value; });
      setSettings(map);
      setDirty(new Set());
    } catch {
      toast.error("Error al cargar configuraciones");
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  /* ── Fetch variant images ── */
  const fetchVariantImages = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoadingImgs(true);
      const res = await getVariantImages(pageNum);
      
      if (append) {
        setAllImages((prev) => {
           // simple deduplication just in case
           const currentSet = new Set(prev);
           const newItems = res.data.filter(u => !currentSet.has(u));
           return [...prev, ...newItems];
        });
      } else {
        setAllImages(res.data);
      }
      
      setPage(res.current_page);
      setHasMore(res.current_page < res.last_page);
    } catch {
      toast.error("Error al cargar imagenes de variantes");
    } finally {
      setLoadingImgs(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "hero" && allImages.length === 0) fetchVariantImages(1, false);
  }, [activeTab, fetchVariantImages, allImages.length]);

  /* ── Fetch categories ── */
  const fetchCategoriesList = useCallback(async () => {
    try {
      setLoadingCats(true);
      const data = await getCategories();
      setAllCategories(data);
    } catch {
      toast.error("Error al cargar categorías");
    } finally {
      setLoadingCats(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "categories" && allCategories.length === 0) {
      fetchCategoriesList();
      if (allImages.length === 0) fetchVariantImages(1, false); // También necesitamos imágenes para las categorías
    }
  }, [activeTab, fetchCategoriesList, fetchVariantImages, allCategories.length, allImages.length]);

  /* ── Helpers ── */
  const setSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => new Set(prev).add(key));
  };

  const toggleHeroImage = (url) => {
    const current = heroImages;
    let next;
    if (current.includes(url)) {
      next = current.filter((u) => u !== url);
    } else {
      if (current.length >= 4) {
        toast.error("Maximo 4 imagenes para el hero.");
        return;
      }
      next = [...current, url];
    }
    setSetting("home_hero_images", JSON.stringify(next));
  };

  const removeHeroImage = (url) => {
    const next = heroImages.filter((u) => u !== url);
    setSetting("home_hero_images", JSON.stringify(next));
  };

  const toggleFeaturedCategory = (cat) => {
    const current = [...featuredCategories];
    const existingIdx = current.findIndex((c) => c.id === cat.id);
    
    if (existingIdx >= 0) {
      current.splice(existingIdx, 1);
    } else {
      if (current.length >= 5) {
        toast.error("Máximo 5 categorías destacadas permitidas.");
        return;
      }
      current.push({ id: cat.id, name: cat.name, image: null, order: current.length + 1 });
    }
    setSetting("home_featured_categories", JSON.stringify(current));
  };

  const updateCategoryImage = (catId, imageUrl) => {
    const current = [...featuredCategories];
    const cat = current.find((c) => c.id === catId);
    if (cat) {
      cat.image = imageUrl;
      setSetting("home_featured_categories", JSON.stringify(current));
    }
    setSelectingImageForCat(null);
    setModalTab("gallery");
    setPastedUrl("");
  };

  const updateValueProp = (index, field, value) => {
    const next = [...valueProps];
    next[index][field] = value;
    setSetting("home_value_props", JSON.stringify(next));
  };

  const addValueProp = () => {
    if (valueProps.length >= 4) {
      toast.error("Máximo 4 beneficios.");
      return;
    }
    const next = [...valueProps, { icon: 'Star', title: 'Nuevo Beneficio', desc: 'Descripción del beneficio' }];
    setSetting("home_value_props", JSON.stringify(next));
  };

  const removeValueProp = (index) => {
    const next = valueProps.filter((_, i) => i !== index);
    setSetting("home_value_props", JSON.stringify(next));
  };

  /* ── TopBars CRUD ── */
  const addTopBar = () => {
    if (topBars.length >= 6) {
      toast.error("Máximo 6 cintillos permitidos.");
      return;
    }
    const next = [
      ...topBars,
      {
        id: Date.now(),
        text: "¡Nuevo anuncio! Escribe tu mensaje aquí.",
        bgColor: "#000000",
        textColor: "#ffffff",
        linkUrl: "",
        linkText: "",
        position: "above_hero",
        isVisible: true,
      },
    ];
    setSetting("home_top_bars", JSON.stringify(next));
  };

  const updateTopBar = (id, field, value) => {
    const next = topBars.map((b) => b.id === id ? { ...b, [field]: value } : b);
    setSetting("home_top_bars", JSON.stringify(next));
  };

  const removeTopBar = (id) => {
    const next = topBars.filter((b) => b.id !== id);
    setSetting("home_top_bars", JSON.stringify(next));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await uploadCategoryImage(file);
      updateCategoryImage(selectingImageForCat, res.url);
      toast.success("Imagen subida correctamente");
    } catch {
      toast.error("Error al subir imagen");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApplyPastedUrl = () => {
    if (!pastedUrl) return;
    updateCategoryImage(selectingImageForCat, pastedUrl);
  };

  const updateBackgroundImage = (url) => {
    setSetting("home_value_props_bg", url);
    setSelectingBackground(false);
    setBgModalTab("gallery");
    setPastedBgUrl("");
  };

  const handleBgFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const res = await uploadBackgroundImage(file);
      updateBackgroundImage(res.url);
      toast.success("Fondo subido correctamente");
    } catch {
      toast.error("Error al subir fondo");
    } finally {
      setUploadingImage(false);
      if (bgFileInputRef.current) bgFileInputRef.current.value = "";
    }
  };

  const handleApplyPastedBgUrl = () => {
    if (!pastedBgUrl) return;
    updateBackgroundImage(pastedBgUrl);
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (dirty.size === 0) return;
    try {
      setSaving(true);
      await Promise.all(
        Array.from(dirty).map((key) =>
          updateSystemSetting(key, { value: settings[key] })
        )
      );
      toast.success("Configuracion guardada correctamente");
      fetchSettings();
    } catch {
      toast.error("Error al guardar la configuracion");
    } finally {
      setSaving(false);
    }
  };

  /* ── Filtered images ── */
  const filtered = search
    ? allImages.filter((u) => u.toLowerCase().includes(search.toLowerCase()))
    : allImages;

  if (loadingSettings) {
    return (
      <div className={theme} style={{ background: "var(--bg-main)", minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "var(--text-muted)" }}>
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
          <span style={{ fontSize: 14 }}>Cargando configuracion...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={theme} style={{ background: "var(--bg-main)", minHeight: "100%", color: "var(--text-main)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 120px" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--color-primary)", color: "var(--color-primary-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LayoutDashboard size={18} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-main)", lineHeight: 1, paddingTop: 2 }}>Configuracion de Inicio</h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 48 }}>
            Personaliza el hero, las secciones y el contenido de tu pagina principal.
          </p>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: "1px solid var(--border-color)", paddingBottom: 0 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: "8px 8px 0 0",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: "1px solid transparent",
                borderBottom: "none",
                background: activeTab === t.id ? "var(--bg-card)" : "transparent",
                color:      activeTab === t.id ? "var(--color-primary)" : "var(--text-muted)",
                borderColor: activeTab === t.id ? "var(--border-color)" : "transparent",
                marginBottom: activeTab === t.id ? -1 : 0,
              }}
            >
              {t.icon} <span style={{ lineHeight: 1, paddingTop: 2 }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════
             TAB: HERO
        ══════════════════════════════ */}
        {activeTab === "hero" && (
          <div>
            {/* Textos del hero */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--text-main)" }}>Textos del Hero</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>Titulo principal</span>
                  <input
                    type="text"
                    value={settings.home_hero_title || ""}
                    onChange={(e) => setSetting("home_hero_title", e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 8, fontSize: 14, background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-main)", outline: "none" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>Subtitulo</span>
                  <input
                    type="text"
                    value={settings.home_hero_subtitle || ""}
                    onChange={(e) => setSetting("home_hero_subtitle", e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 8, fontSize: 14, background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-main)", outline: "none" }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
                  />
                </label>
              </div>
            </div>

            {/* Imagenes seleccionadas */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>Imagenes seleccionadas para el Hero</h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Maximo 4. El orden de seleccion es el orden de aparicion.</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: heroImages.length === 4 ? "var(--color-danger, #e53e3e)" : "var(--bg-overlay)", color: heroImages.length === 4 ? "#fff" : "var(--text-muted)" }}>
                  {heroImages.length} / 4
                </span>
              </div>

              {heroImages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 13, border: "2px dashed var(--border-color)", borderRadius: 10 }}>
                  <Image size={32} style={{ opacity: 0.3, margin: "0 auto 8px auto", display: "block" }} />
                  <p>Ninguna imagen seleccionada.</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Selecciona imagenes desde el galeria de abajo.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                  {heroImages.map((url, i) => (
                    <div 
                      key={url} 
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.target.style.opacity = '0.5';
                        e.dataTransfer.setData('text/plain', i.toString());
                      }}
                      onDragEnd={(e) => {
                        e.target.style.opacity = '1';
                        setDragOverHeroIdx(null);
                      }}
                      onDragOver={(e) => { 
                        e.preventDefault(); 
                        e.dataTransfer.dropEffect = 'move'; 
                        if (dragOverHeroIdx !== i) setDragOverHeroIdx(i);
                      }}
                      onDragLeave={() => {
                        if (dragOverHeroIdx === i) setDragOverHeroIdx(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverHeroIdx(null);
                        const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (isNaN(draggedIdx) || draggedIdx === i) return;

                        const current = [...heroImages];
                        const [draggedItem] = current.splice(draggedIdx, 1);
                        current.splice(i, 0, draggedItem);
                        
                        setSetting("home_hero_images", JSON.stringify(current));
                      }}
                      style={{ 
                        position: "relative", 
                        borderRadius: 10, 
                        overflow: "hidden", 
                        aspectRatio: "3/4", 
                        cursor: 'grab',
                        border: dragOverHeroIdx === i ? "4px dashed var(--color-primary)" : "2px solid var(--color-primary)",
                        transform: dragOverHeroIdx === i ? "scale(1.05)" : "scale(1)",
                        transition: "all 0.2s"
                      }}
                    >
                      <img src={getImageUrl(url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                      <div style={{ position: "absolute", top: 0, left: 0, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: "0 0 8px 0" }}>
                        #{i + 1}
                      </div>
                      <button
                        onClick={() => removeHeroImage(url)}
                        title="Quitar"
                        style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none" }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Galeria de variantes */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>Galeria de Imagenes de Variantes</h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Haz click en una imagen para agregarla o quitarla del hero.</p>
                </div>
                <button
                  onClick={() => fetchVariantImages(1, false)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "var(--bg-overlay)", border: "1px solid var(--border-color)", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <RefreshCw size={13} /> Recargar
                </button>
              </div>

              <input
                type="text"
                placeholder="Buscar por nombre de archivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13, background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-main)", outline: "none", marginBottom: 14, boxSizing: "border-box" }}
              />

              {loadingImgs && page === 1 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
                  <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent", margin: "0 auto 10px" }} />
                  <span style={{ fontSize: 13 }}>Cargando imagenes...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 13 }}>No se encontraron imagenes.</div>
              ) : (
                <div style={{ maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
                    {filtered.map((url) => {
                      const selected = heroImages.includes(url);
                      return (
                        <div
                          key={url}
                          onClick={() => toggleHeroImage(url)}
                          title={url}
                          style={{
                            position: "relative", borderRadius: 8, overflow: "hidden", aspectRatio: "3/4", cursor: "pointer",
                            border: selected ? "2.5px solid var(--color-primary)" : "2px solid var(--border-color)",
                            transition: "border-color 0.15s, transform 0.1s",
                            transform: selected ? "scale(1.02)" : "scale(1)",
                            opacity: !selected && heroImages.length >= 4 ? 0.4 : 1,
                          }}
                        >
                          <img
                            src={getImageUrl(url)}
                            alt=""
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { e.target.src = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_white.jfif"; }}
                          />
                          {selected && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Check size={14} color="#fff" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {hasMore && !search && (
                    <div style={{ textAlign: "center", marginTop: 16 }}>
                      <button
                        onClick={() => fetchVariantImages(page + 1, true)}
                        disabled={loadingImgs}
                        style={{ padding: "8px 24px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: "var(--bg-overlay)", border: "1px solid var(--border-color)", color: "var(--text-main)", cursor: loadingImgs ? "not-allowed" : "pointer", opacity: loadingImgs ? 0.7 : 1 }}
                      >
                        {loadingImgs ? "Cargando..." : "Cargar más imágenes"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════
             TAB: CATEGORIAS
        ══════════════════════════════ */}
        {activeTab === "categories" && (
          <div>
            {/* Categorías seleccionadas (estilo tarjetas arrastrables) */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>Categorías seleccionadas</h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Máximo 5 recomendadas. Haz click en la tarjeta para elegir miniatura, arrastra para reordenar.</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: featuredCategories.length === 5 ? "var(--color-danger, #e53e3e)" : "var(--bg-overlay)", color: featuredCategories.length === 5 ? "#fff" : "var(--text-muted)" }}>
                  {featuredCategories.length} seleccionadas
                </span>
              </div>

              {featuredCategories.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 13, border: "2px dashed var(--border-color)", borderRadius: 10 }}>
                  <Grid size={32} style={{ opacity: 0.3, margin: "0 auto 8px auto", display: "block" }} />
                  <p>Ninguna categoría seleccionada.</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Selecciona categorías desde la lista de abajo.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                  {featuredCategories.map((cat, i) => (
                    <div 
                      key={cat.id} 
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.target.style.opacity = '0.5';
                        e.dataTransfer.setData('text/plain', i.toString());
                      }}
                      onDragEnd={(e) => {
                        e.target.style.opacity = '1';
                        setDragOverCatIdx(null);
                      }}
                      onDragOver={(e) => { 
                        e.preventDefault(); 
                        e.dataTransfer.dropEffect = 'move'; 
                        if (dragOverCatIdx !== i) setDragOverCatIdx(i);
                      }}
                      onDragLeave={() => {
                        if (dragOverCatIdx === i) setDragOverCatIdx(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverCatIdx(null);
                        const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (isNaN(draggedIdx) || draggedIdx === i) return;
                        const current = [...featuredCategories];
                        const [draggedItem] = current.splice(draggedIdx, 1);
                        current.splice(i, 0, draggedItem);
                        current.forEach((c, idx) => c.order = idx + 1);
                        setSetting("home_featured_categories", JSON.stringify(current));
                      }}
                      onClick={() => setSelectingImageForCat(cat.id)}
                      style={{ 
                        position: "relative", 
                        borderRadius: 10, 
                        overflow: "hidden", 
                        aspectRatio: "3/4", 
                        cursor: 'grab',
                        border: dragOverCatIdx === i ? "4px dashed var(--color-primary)" : "2px solid var(--color-primary)",
                        transform: dragOverCatIdx === i ? "scale(1.05)" : "scale(1)",
                        transition: "all 0.2s"
                      }}
                    >
                      {cat.image ? (
                        <img src={getImageUrl(cat.image)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", filter: "brightness(0.7)" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "var(--bg-overlay)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                          <Image size={24} style={{ opacity: 0.5, marginBottom: 8 }} />
                          <span style={{ fontSize: 11, textAlign: "center", padding: "0 10px" }}>Click para miniatura</span>
                        </div>
                      )}
                      
                      <div style={{ position: "absolute", top: 0, left: 0, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: "0 0 8px 0", pointerEvents: "none" }}>
                        #{i + 1}
                      </div>

                      <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "8px 4px", textAlign: "center", pointerEvents: "none" }}>
                        {cat.name}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFeaturedCategory(cat); }}
                        title="Quitar"
                        style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none" }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Categorías Disponibles */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>Categorías Disponibles</h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Haz click en una categoría para agregarla o quitarla de las destacadas.</p>
                </div>
              </div>

              {loadingCats ? (
                <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>Cargando categorías...</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
                  {allCategories.map(cat => {
                    const isSelected = featuredCategories.some(c => c.id === cat.id);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => toggleFeaturedCategory(cat)}
                        style={{
                          position: "relative", borderRadius: 8, overflow: "hidden", cursor: "pointer",
                          background: "var(--bg-overlay)",
                          border: isSelected ? "2.5px solid var(--color-primary)" : "2px solid var(--border-color)",
                          transition: "border-color 0.15s, transform 0.1s",
                          transform: isSelected ? "scale(1.02)" : "scale(1)",
                          opacity: !isSelected && featuredCategories.length >= 5 ? 0.4 : 1,
                          padding: "12px 10px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 60
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-main)", zIndex: 2 }}>{cat.name}</span>
                        {isSelected && (
                          <div style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                            <Check size={10} color="#fff" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MODAL para seleccionar miniatura */}
            {selectingImageForCat && (
              <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div style={{ background: "var(--bg-card)", borderRadius: 12, width: "100%", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                  
                  {/* Modal Header */}
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-main)", margin: 0 }}>
                      Miniatura para: <span style={{ color: "var(--color-primary)" }}>{featuredCategories.find(c => c.id === selectingImageForCat)?.name}</span>
                    </h3>
                    <button onClick={() => setSelectingImageForCat(null)} style={{ background: "var(--bg-overlay)", border: "none", color: "var(--text-main)", cursor: "pointer", width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={16} />
                    </button>
                  </div>

                  {/* Modal Tabs */}
                  <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", background: "var(--bg-main)" }}>
                    {[
                      { id: "upload", label: "Subir desde PC", icon: <Upload size={14} /> },
                      { id: "url", label: "Pegar URL", icon: <LinkIcon size={14} /> },
                      { id: "gallery", label: "Galería de Variantes", icon: <Image size={14} /> }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setModalTab(tab.id)}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0",
                          border: "none", borderBottom: modalTab === tab.id ? "2px solid var(--color-primary)" : "2px solid transparent",
                          background: modalTab === tab.id ? "var(--bg-card)" : "transparent",
                          color: modalTab === tab.id ? "var(--color-primary)" : "var(--text-muted)",
                          fontWeight: 600, fontSize: 13, cursor: "pointer"
                        }}
                      >
                        {tab.icon} <span style={{ lineHeight: 1, paddingTop: 2 }}>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Modal Body */}
                  <div style={{ padding: 24, flex: 1, overflowY: "auto", minHeight: 400 }}>
                    
                    {/* TAB: UPLOAD */}
                    {modalTab === "upload" && (
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ border: "2px dashed var(--border-color)", borderRadius: 12, padding: "40px 20px", width: "100%", maxWidth: 400, textAlign: "center" }}>
                          <Upload size={40} style={{ color: "var(--text-muted)", margin: "0 auto 16px auto", display: "block" }} />
                          <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-main)", margin: "0 0 8px" }}>Sube una imagen desde tu equipo</h4>
                          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 24px" }}>Formato recomendado: Vertical (Aspect Ratio 3:4).</p>
                          
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={handleFileUpload}
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            style={{
                              padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: uploadingImage ? "not-allowed" : "pointer",
                              background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none"
                            }}
                          >
                            {uploadingImage ? "Subiendo..." : "Seleccionar archivo"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TAB: URL */}
                    {modalTab === "url" && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                        <div style={{ width: "100%", maxWidth: 500 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-main)", marginBottom: 8 }}>URL de la Imagen</label>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              type="text"
                              placeholder="https://ejemplo.com/imagen.jpg"
                              value={pastedUrl}
                              onChange={(e) => setPastedUrl(e.target.value)}
                              style={{ flex: 1, padding: "10px 14px", borderRadius: 8, fontSize: 14, background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-main)", outline: "none" }}
                            />
                            <button
                              onClick={handleApplyPastedUrl}
                              disabled={!pastedUrl}
                              style={{ padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none", cursor: pastedUrl ? "pointer" : "not-allowed", opacity: pastedUrl ? 1 : 0.5 }}
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>

                        {pastedUrl && (
                          <div style={{ marginTop: 20, textAlign: "center" }}>
                            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Previsualización:</p>
                            <div style={{ width: 200, aspectRatio: "3/4", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-color)", margin: "0 auto" }}>
                              <img src={pastedUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.src = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_white.jfif"; }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB: GALLERY */}
                    {modalTab === "gallery" && (
                      <>
                        <input
                          type="text"
                          placeholder="Buscar imagen..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 13, background: "var(--bg-input)", border: "1px solid var(--border-color)", outline: "none", marginBottom: 20, color: "var(--text-main)" }}
                        />

                        {loadingImgs && page === 1 ? (
                          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>Cargando imágenes...</div>
                        ) : (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
                            {filtered.map(url => (
                              <div
                                key={url}
                                onClick={() => updateCategoryImage(selectingImageForCat, url)}
                                style={{ aspectRatio: "3/4", borderRadius: 8, overflow: "hidden", cursor: "pointer", border: "2px solid transparent", transition: "border-color 0.2s" }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                              >
                                <img src={getImageUrl(url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {hasMore && !search && (
                          <div style={{ textAlign: "center", marginTop: 24 }}>
                            <button
                              onClick={() => fetchVariantImages(page + 1, true)}
                              disabled={loadingImgs}
                              style={{ padding: "8px 24px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: "var(--bg-overlay)", border: "1px solid var(--border-color)", color: "var(--text-main)", cursor: loadingImgs ? "not-allowed" : "pointer" }}
                            >
                              {loadingImgs ? "Cargando..." : "Cargar más imágenes"}
                            </button>
                          </div>
                        )}
                      </>
                    )}

                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════
             TAB: CARRUSEL
        ══════════════════════════════ */}
        {activeTab === "carousel" && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--text-main)" }}>Configuración del Carrusel</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>Título del Carrusel</span>
                <input
                  type="text"
                  value={settings.home_carousel_title || ""}
                  placeholder="Ej: LO MÁS VENDIDO"
                  onChange={(e) => setSetting("home_carousel_title", e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: 8, fontSize: 14, background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-main)", outline: "none" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
                />
              </label>
              
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>Tipo de lista a mostrar</span>
                <select
                  value={settings.home_carousel_type || "newest"}
                  onChange={(e) => setSetting("home_carousel_type", e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: 8, fontSize: 14, background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-main)", outline: "none" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
                >
                  <option value="newest">Lo más nuevo (Lanzamientos)</option>
                  <option value="trending">Lo más visto / destacado (Best Sellers)</option>
                  <option value="random">Aleatorio</option>
                </select>
              </label>
            </div>
          </div>
        )}
        {/* ══════════════════════════════
             TAB: BENEFICIOS
        ══════════════════════════════ */}
        {activeTab === "value_props" && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>Barra de Beneficios</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Máximo 4 iconos que se mostrarán bajo el hero principal.</p>
              </div>
              <button 
                onClick={addValueProp}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none", cursor: "pointer" }}
              >
                + Añadir Beneficio
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>Imagen de Fondo (Opcional)</span>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Se mostrará con un degradado y efecto fijo (parallax) detrás de los beneficios.</p>
              
              <div 
                onClick={() => {
                  setSelectingBackground(true);
                  if (allBackgrounds.length === 0) fetchBackgrounds();
                }}
                style={{ 
                  marginTop: 8, height: 120, width: "100%", borderRadius: 10, border: "2px dashed var(--border-color)", 
                  background: settings.home_value_props_bg ? `url(${getImageUrl(settings.home_value_props_bg)}) center/cover` : "var(--bg-overlay)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", overflow: "hidden"
                }}
              >
                {!settings.home_value_props_bg && (
                  <>
                    <Image size={24} style={{ opacity: 0.5, marginBottom: 8, color: "var(--text-muted)" }} />
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Click para elegir fondo</span>
                  </>
                )}
                {settings.home_value_props_bg && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                    <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, background: "rgba(0,0,0,0.7)", padding: "6px 12px", borderRadius: 20 }}>Cambiar fondo</span>
                  </div>
                )}
              </div>
              
              {settings.home_value_props_bg && (
                <button 
                  onClick={() => updateBackgroundImage("")}
                  style={{ alignSelf: "flex-start", marginTop: 4, background: "none", border: "none", color: "var(--color-danger, #e53e3e)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
                >
                  Quitar fondo
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {valueProps.map((prop, idx) => (
                <div key={idx} style={{ display: "flex", gap: 12, padding: 16, background: "var(--bg-overlay)", border: "1px solid var(--border-color)", borderRadius: 8, position: "relative" }}>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 140 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Ícono (Lucide)</span>
                    <button
                      onClick={() => setEditingIconIndex(idx)}
                      style={{ 
                        display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", 
                        borderRadius: 6, fontSize: 13, background: "var(--bg-input)", 
                        border: "1px solid var(--border-color)", color: "var(--text-main)",
                        cursor: "pointer", justifyContent: "flex-start"
                      }}
                    >
                      {(() => {
                        const IconCmp = Icons[prop.icon];
                        return IconCmp ? <IconCmp size={16} /> : <Icons.HelpCircle size={16} />;
                      })()}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {prop.icon || "Seleccionar..."}
                      </span>
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Título</span>
                    <input
                      type="text"
                      value={prop.title || ""}
                      onChange={(e) => updateValueProp(idx, 'title', e.target.value)}
                      placeholder="Ej: Envíos Nacionales"
                      style={{ padding: "8px", borderRadius: 6, fontSize: 13, background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-main)" }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Descripción</span>
                    <input
                      type="text"
                      value={prop.desc || ""}
                      onChange={(e) => updateValueProp(idx, 'desc', e.target.value)}
                      placeholder="Breve descripción del beneficio..."
                      style={{ padding: "8px", borderRadius: 6, fontSize: 13, background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-main)" }}
                    />
                  </div>

                  <button 
                    onClick={() => removeValueProp(idx)}
                    title="Eliminar"
                    style={{ position: "absolute", top: -8, right: -8, width: 24, height: 24, borderRadius: "50%", background: "var(--color-danger, #e53e3e)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════
             TAB: TOP BARS
        ══════════════════════════════ */}
        {activeTab === "topbars" && (
          <div>
            {/* Header + Add button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)", margin: 0 }}>Cintillos de Anuncios</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  Agrega hasta 6 barras. Cada una puede ir en una posición distinta dentro de la página Home.
                </p>
              </div>
              <button
                onClick={addTopBar}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: "var(--color-primary)", color: "var(--color-primary-text)",
                  border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                <Megaphone size={14} /> Agregar Barra
              </button>
            </div>

            {topBars.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "48px 24px",
                border: "2px dashed var(--border-color)", borderRadius: 12,
                color: "var(--text-muted)", fontSize: 13,
              }}>
                <Megaphone size={32} style={{ opacity: 0.25, display: "block", margin: "0 auto 12px" }} />
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin cintillos configurados.</p>
                <p style={{ fontSize: 12 }}>Presiona "Agregar Barra" para crear tu primer anuncio.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {topBars.map((bar, idx) => (
                  <div
                    key={bar.id}
                    style={{
                      background: "var(--bg-card)", border: "1px solid var(--border-color)",
                      borderRadius: 12, overflow: "hidden",
                      borderLeft: bar.isVisible ? `4px solid ${bar.bgColor}` : "4px solid var(--border-color)",
                    }}
                  >
                    {/* Preview strip */}
                    <div
                      style={{
                        backgroundColor: bar.bgColor, color: bar.textColor,
                        padding: "8px 16px", fontSize: 12, fontWeight: 500,
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        opacity: bar.isVisible ? 1 : 0.4,
                      }}
                    >
                      <span style={{ flex: 1, textAlign: "center" }}>
                        {bar.text || "— Vista previa —"}
                        {bar.linkText && (
                          <span style={{ marginLeft: 10, textDecoration: "underline", opacity: 0.8 }}>{bar.linkText}</span>
                        )}
                      </span>
                    </div>

                    {/* Controls */}
                    <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>

                      {/* Row: visible toggle + position + delete */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        {/* Toggle visible */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => updateTopBar(bar.id, "isVisible", !bar.isVisible)}
                            style={{
                              position: "relative", width: 40, height: 22, borderRadius: 11,
                              border: "none", cursor: "pointer", flexShrink: 0,
                              background: bar.isVisible ? "var(--color-success, #48bb78)" : "var(--border-color)",
                              transition: "background 0.2s",
                            }}
                          >
                            <span style={{
                              position: "absolute", top: 2, width: 18, height: 18, borderRadius: "50%",
                              background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                              transition: "left 0.2s", left: bar.isVisible ? 20 : 2,
                            }} />
                          </button>
                          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                            {bar.isVisible ? "Visible" : "Oculta"}
                          </span>
                        </div>

                        {/* Position select */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <select
                            value={bar.position}
                            onChange={(e) => updateTopBar(bar.id, "position", e.target.value)}
                            style={{
                              width: "100%", padding: "7px 10px", borderRadius: 8, fontSize: 12,
                              background: "var(--bg-input)", border: "1px solid var(--border-color)",
                              color: "var(--text-main)", cursor: "pointer", outline: "none",
                            }}
                          >
                            {POSITION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => removeTopBar(bar.id)}
                          style={{
                            padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: "var(--color-danger-light, #fee2e2)", color: "var(--color-danger, #dc2626)",
                            border: "1px solid var(--color-danger-border, #fca5a5)", cursor: "pointer",
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* Texto del anuncio */}
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5 }}>
                          Texto del anuncio
                        </label>
                        <input
                          type="text"
                          value={bar.text}
                          onChange={(e) => updateTopBar(bar.id, "text", e.target.value)}
                          placeholder="Ej: Envío gratis en pedidos mayores a Bs 300"
                          style={{
                            width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13,
                            background: "var(--bg-input)", border: "1px solid var(--border-color)",
                            color: "var(--text-main)", outline: "none", boxSizing: "border-box",
                          }}
                          onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
                          onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
                        />
                      </div>

                      {/* Colors row */}
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 140 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Color de fondo</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="color"
                              value={bar.bgColor}
                              onChange={(e) => updateTopBar(bar.id, "bgColor", e.target.value)}
                              style={{ width: 36, height: 32, borderRadius: 6, border: "1px solid var(--border-color)", cursor: "pointer", padding: 2 }}
                            />
                            <input
                              type="text"
                              value={bar.bgColor}
                              onChange={(e) => updateTopBar(bar.id, "bgColor", e.target.value)}
                              style={{
                                flex: 1, padding: "7px 10px", borderRadius: 8, fontSize: 12,
                                background: "var(--bg-input)", border: "1px solid var(--border-color)",
                                color: "var(--text-main)", outline: "none", fontFamily: "monospace",
                              }}
                            />
                          </div>
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 140 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Color del texto</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="color"
                              value={bar.textColor}
                              onChange={(e) => updateTopBar(bar.id, "textColor", e.target.value)}
                              style={{ width: 36, height: 32, borderRadius: 6, border: "1px solid var(--border-color)", cursor: "pointer", padding: 2 }}
                            />
                            <input
                              type="text"
                              value={bar.textColor}
                              onChange={(e) => updateTopBar(bar.id, "textColor", e.target.value)}
                              style={{
                                flex: 1, padding: "7px 10px", borderRadius: 8, fontSize: 12,
                                background: "var(--bg-input)", border: "1px solid var(--border-color)",
                                color: "var(--text-main)", outline: "none", fontFamily: "monospace",
                              }}
                            />
                          </div>
                        </label>
                      </div>

                      {/* Link (optional) */}
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5 }}>
                            URL del enlace (opcional)
                          </label>
                          <input
                            type="text"
                            value={bar.linkUrl}
                            onChange={(e) => updateTopBar(bar.id, "linkUrl", e.target.value)}
                            placeholder="/shop/catalog o https://..."
                            style={{
                              width: "100%", padding: "7px 10px", borderRadius: 8, fontSize: 12,
                              background: "var(--bg-input)", border: "1px solid var(--border-color)",
                              color: "var(--text-main)", outline: "none", boxSizing: "border-box",
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 150 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5 }}>
                            Texto del enlace (opcional)
                          </label>
                          <input
                            type="text"
                            value={bar.linkText}
                            onChange={(e) => updateTopBar(bar.id, "linkText", e.target.value)}
                            placeholder="Ver tienda →"
                            style={{
                              width: "100%", padding: "7px 10px", borderRadius: 8, fontSize: 12,
                              background: "var(--bg-input)", border: "1px solid var(--border-color)",
                              color: "var(--text-main)", outline: "none", boxSizing: "border-box",
                            }}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════
             TAB: SECCIONES
        ══════════════════════════════ */}
        {activeTab === "sections" && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, overflow: "hidden" }}>
            {SECTION_KEYS.map((s, idx) => {
              const active = settings[s.key] === "true" || settings[s.key] === true;
              const isLast = idx === SECTION_KEYS.length - 1;
              return (
                <div
                  key={s.key}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px",
                    borderBottom: isLast ? "none" : "1px solid var(--border-color)",
                    background: dirty.has(s.key) ? "var(--bg-overlay)" : "var(--bg-card)",
                    borderLeft: dirty.has(s.key) ? "3px solid var(--color-primary)" : "3px solid transparent",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {active ? <Eye size={15} style={{ color: "var(--color-success, #48bb78)" }} /> : <EyeOff size={15} style={{ color: "var(--text-muted)" }} />}
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)" }}>{s.label}</span>
                      {dirty.has(s.key) && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#dbeafe", color: "#1d4ed8" }}>Modificado</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3, marginLeft: 23 }}>{s.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSetting(s.key, active ? "false" : "true")}
                    style={{
                      position: "relative", width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                      background: active ? "var(--color-success, #48bb78)" : "var(--border-color)", transition: "background 0.2s", flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      transition: "left 0.2s", left: active ? 23 : 3,
                    }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Floating Save Bar ── */}
      {dirty.size > 0 && (
        <div
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 24px",
            borderTop: "1px solid var(--border-color)", background: "var(--bg-card)",
            boxShadow: "0 -4px 16px rgba(0,0,0,0.07)", display: "flex", justifyContent: "center", zIndex: 50,
          }}
        >
          <div style={{ width: "100%", maxWidth: 900, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>
              {dirty.size} cambio{dirty.size !== 1 ? "s" : ""} sin guardar
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={fetchSettings}
                style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--bg-overlay)", border: "1px solid var(--border-color)", color: "var(--text-main)", cursor: "pointer" }}
              >
                Descartar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                  background: saving ? "var(--border-color)" : "var(--color-primary)",
                  color: saving ? "var(--text-muted)" : "var(--color-primary-text)",
                  border: "none",
                }}
              >
                {saving ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--text-muted)", borderTopColor: "transparent" }} /> : <Save size={15} />}
                {saving ? "Guardando..." : "Guardar Todo"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL para seleccionar fondo de beneficios */}
      {selectingBackground && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 12, width: "100%", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid var(--border-color)" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-main)", margin: 0 }}>
                Fondo para: <span style={{ color: "var(--color-primary)" }}>Beneficios</span>
              </h3>
              <button onClick={() => setSelectingBackground(false)} style={{ background: "var(--bg-overlay)", border: "none", color: "var(--text-main)", cursor: "pointer", width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", background: "var(--bg-main)" }}>
              {[
                { id: "upload", label: "Subir desde PC", icon: <Upload size={14} /> },
                { id: "url", label: "Pegar URL", icon: <LinkIcon size={14} /> },
                { id: "gallery", label: "Galería de Fondos", icon: <Image size={14} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setBgModalTab(tab.id)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0",
                    border: "none", borderBottom: bgModalTab === tab.id ? "2px solid var(--color-primary)" : "2px solid transparent",
                    background: bgModalTab === tab.id ? "var(--bg-card)" : "transparent",
                    color: bgModalTab === tab.id ? "var(--color-primary)" : "var(--text-muted)",
                    fontWeight: 600, fontSize: 13, cursor: "pointer"
                  }}
                >
                  {tab.icon} <span style={{ lineHeight: 1, paddingTop: 2 }}>{tab.label}</span>
                </button>
              ))}
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: 24, flex: 1, overflowY: "auto", minHeight: 400 }}>
              
              {/* TAB: UPLOAD */}
              {bgModalTab === "upload" && (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ border: "2px dashed var(--border-color)", borderRadius: 12, padding: "40px 20px", width: "100%", maxWidth: 400, textAlign: "center" }}>
                    <Upload size={40} style={{ color: "var(--text-muted)", margin: "0 auto 16px auto", display: "block" }} />
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-main)", margin: "0 0 8px" }}>Sube una imagen desde tu equipo</h4>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 24px" }}>Se guardará en /system/funds/</p>
                    
                    <input
                      type="file"
                      accept="image/*"
                      ref={bgFileInputRef}
                      style={{ display: "none" }}
                      onChange={handleBgFileUpload}
                    />
                    <button
                      onClick={() => bgFileInputRef.current?.click()}
                      disabled={uploadingImage}
                      style={{
                        padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: uploadingImage ? "not-allowed" : "pointer",
                        background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none"
                      }}
                    >
                      {uploadingImage ? "Subiendo..." : "Seleccionar archivo"}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: URL */}
              {bgModalTab === "url" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
                  <div style={{ width: "100%", maxWidth: 500 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-main)", marginBottom: 8 }}>URL de la Imagen</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        placeholder="https://ejemplo.com/fondo.jpg"
                        value={pastedBgUrl}
                        onChange={(e) => setPastedBgUrl(e.target.value)}
                        style={{ flex: 1, padding: "10px 14px", borderRadius: 8, fontSize: 14, background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-main)", outline: "none" }}
                      />
                      <button
                        onClick={handleApplyPastedBgUrl}
                        disabled={!pastedBgUrl}
                        style={{ padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none", cursor: pastedBgUrl ? "pointer" : "not-allowed", opacity: pastedBgUrl ? 1 : 0.5 }}
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>

                  {pastedBgUrl && (
                    <div style={{ marginTop: 20, textAlign: "center", width: "100%" }}>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Previsualización:</p>
                      <div style={{ width: "100%", height: 200, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-color)", margin: "0 auto" }}>
                        <img src={pastedBgUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.src = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_white.jfif"; }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: GALLERY */}
              {bgModalTab === "gallery" && (
                <>
                  {loadingBgs ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>Cargando fondos...</div>
                  ) : allBackgrounds.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>No hay fondos en la galería.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                      {allBackgrounds.map(url => (
                        <div
                          key={url}
                          onClick={() => updateBackgroundImage(url)}
                          style={{ height: 120, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: "2px solid transparent", transition: "border-color 0.2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                        >
                          <img src={getImageUrl(url)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}
      
      <IconPickerModal
        isOpen={editingIconIndex !== null}
        onClose={() => setEditingIconIndex(null)}
        onSelect={(icon) => updateValueProp(editingIconIndex, 'icon', icon)}
      />
    </div>
  );
}
