import "./HomeConfig.css";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { LayoutDashboard, Image, EyeOff, Eye, Save, RefreshCw, Check, X, Grid, Upload, Link as LinkIcon, Megaphone } from "lucide-react";
import toast from "react-hot-toast";
import { getSystemSettings, updateSystemSetting } from "../../../../api/admin/systemSettings";
import { getVariantImages, getCategories, uploadCategoryImage, uploadBackgroundImage, getBackgroundImages } from "../../../../api/admin/homeConfig";
import { getImageUrl } from "../../../../utils/imageUtils";
import { useThemeStore } from "../../../../store/themeStore";
import IconPickerModal from "./IconPickerModal";
import * as Icons from "lucide-react";
import TopBar from "../../../home/components/TopBar";
import CustomSelect from "../../../../components/ui/CustomSelect";
const TABS = [{
  id: "hero",
  label: "Hero",
  icon: <Image size={15} />
}, {
  id: "categories",
  label: "Categorías",
  icon: <Grid size={15} />
}, {
  id: "carousel",
  label: "Carrusel",
  icon: <LayoutDashboard size={15} />
}, {
  id: "value_props",
  label: "Beneficios",
  icon: <LayoutDashboard size={15} />
}, {
  id: "topbars",
  label: "Top Bars",
  icon: <Megaphone size={15} />
}, {
  id: "sections",
  label: "Secciones",
  icon: <LayoutDashboard size={15} />
}];
const SECTION_KEYS = [{
  key: "home_show_hero",
  label: "Hero (banner principal)",
  desc: "La seccion con las imagenes y el titulo de bienvenida."
}, {
  key: "home_show_value_props",
  label: "Barra de Beneficios",
  desc: "Muestra la barra con iconos informativos debajo del hero."
}, {
  key: "home_show_carousel",
  label: "Carrusel de Productos",
  desc: "Carrusel de Novedades, Más Vendidos, etc."
}, {
  key: "home_show_categories",
  label: "Categorias",
  desc: "Grilla de categorias de productos."
}, {
  key: "home_show_top_bars",
  label: "Top Bars (Cintillos)",
  desc: "Activa o desactiva todos los cintillos de anuncios del Home."
}];
export default function HomeConfig() {
  const isDark = useThemeStore(s => s.isDark);
  const theme = isDark ? "admin-theme-dark" : "admin-theme";
  const [activeTab, setActiveTab] = useState("hero");
  const [settings, setSettings] = useState({});
  const [dirty, setDirty] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  /* ── variant images picker state ── */
  const [allImages, setAllImages] = useState([]);
  const [loadingImgs, setLoadingImgs] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  /* ── categories state ── */
  const [allCategories, setAllCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
  const [editingTopBarIcon, setEditingTopBarIcon] = useState(null); // { id: number, field: "icon" | "iconRight" }

  /* heroImages = array parsed from JSON setting */
  const heroImages = (() => {
    try {
      return JSON.parse(settings.home_hero_images || "[]");
    } catch {
      return [];
    }
  })();

  /* featuredCategories = array parsed from JSON setting */
  const featuredCategories = (() => {
    try {
      return JSON.parse(settings.home_featured_categories || "[]");
    } catch {
      return [];
    }
  })();
  const DEFAULT_VALUE_PROPS = [{
    icon: 'MessageCircle',
    title: 'Contacto Directo',
    desc: 'Coordina tu entrega de forma rápida sin registros obligatorios.'
  }, {
    icon: 'Truck',
    title: 'Envíos y Delivery',
    desc: 'Entregas en La Paz, El Alto, Zona Sur, y envíos seguros a nivel nacional.'
  }, {
    icon: 'PackageCheck',
    title: 'Reservas Flexibles',
    desc: 'Asegura tu pedido con un adelanto y coordina fecha, hora y lugar.'
  }, {
    icon: 'UserPlus',
    title: 'Ventajas Exclusivas',
    desc: 'Crea tu cuenta (opcional) para agilizar envíos y guardar direcciones.'
  }];

  /* valueProps = array parsed from JSON setting */
  const valueProps = (() => {
    if (!settings.home_value_props) return DEFAULT_VALUE_PROPS;
    try {
      const parsed = JSON.parse(settings.home_value_props);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_VALUE_PROPS;
    } catch {
      return DEFAULT_VALUE_PROPS;
    }
  })();

  /* topBars = array parsed from JSON setting */
  const topBars = (() => {
    try {
      const parsed = JSON.parse(settings.home_top_bars || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  /* ── Top Bars position options ── */
  const POSITION_OPTIONS = [{
    value: "above_hero",
    label: "Encima del Hero (arriba de todo)"
  }, {
    value: "below_hero",
    label: "Debajo del Hero"
  }, {
    value: "below_value_props",
    label: "Debajo de Beneficios"
  }, {
    value: "below_carousel",
    label: "Debajo del Carrusel"
  }, {
    value: "below_categories",
    label: "Debajo de Categorías"
  }, {
    value: "above_footer",
    label: "Antes del Footer"
  }];
  const fetchSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const data = await getSystemSettings();
      const map = {};
      data.forEach(s => {
        map[s.key] = s.value;
      });
      setSettings(map);
      setDirty(new Set());
    } catch {
      toast.error("Error al cargar configuraciones");
    } finally {
      setLoadingSettings(false);
    }
  }, []);
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /* ── Fetch variant images ── */
  const fetchVariantImages = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoadingImgs(true);
      const res = await getVariantImages(pageNum);
      if (append) {
        setAllImages(prev => {
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
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setDirty(prev => new Set(prev).add(key));
  };
  const toggleHeroImage = url => {
    const current = heroImages;
    let next;
    if (current.includes(url)) {
      next = current.filter(u => u !== url);
    } else {
      if (current.length >= 4) {
        toast.error("Maximo 4 imagenes para el hero.");
        return;
      }
      next = [...current, url];
    }
    setSetting("home_hero_images", JSON.stringify(next));
  };
  const removeHeroImage = url => {
    const next = heroImages.filter(u => u !== url);
    setSetting("home_hero_images", JSON.stringify(next));
  };
  const toggleFeaturedCategory = cat => {
    const current = [...featuredCategories];
    const existingIdx = current.findIndex(c => c.id === cat.id);
    if (existingIdx >= 0) {
      current.splice(existingIdx, 1);
    } else {
      if (current.length >= 5) {
        toast.error("Máximo 5 categorías destacadas permitidas.");
        return;
      }
      current.push({
        id: cat.id,
        name: cat.name,
        image: null,
        order: current.length + 1
      });
    }
    setSetting("home_featured_categories", JSON.stringify(current));
  };
  const updateCategoryImage = (catId, imageUrl) => {
    const current = [...featuredCategories];
    const cat = current.find(c => c.id === catId);
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
    const next = [...valueProps, {
      icon: 'Star',
      title: 'Nuevo Beneficio',
      desc: 'Descripción del beneficio'
    }];
    setSetting("home_value_props", JSON.stringify(next));
  };
  const removeValueProp = index => {
    const next = valueProps.filter((_, i) => i !== index);
    setSetting("home_value_props", JSON.stringify(next));
  };

  /* ── TopBars CRUD ── */
  const addTopBar = () => {
    if (topBars.length >= 6) {
      toast.error("Máximo 6 cintillos permitidos.");
      return;
    }
    const next = [...topBars, {
      id: Date.now(),
      text: "¡Nuevo anuncio! Escribe tu mensaje aquí.",
      bgColor: "#000000",
      textColor: "#ffffff",
      linkUrl: "",
      linkText: "",
      position: "above_hero",
      isVisible: true
    }];
    setSetting("home_top_bars", JSON.stringify(next));
  };
  const updateTopBar = (id, field, value) => {
    const next = topBars.map(b => b.id === id ? {
      ...b,
      [field]: value
    } : b);
    setSetting("home_top_bars", JSON.stringify(next));
  };
  const removeTopBar = id => {
    const next = topBars.filter(b => b.id !== id);
    setSetting("home_top_bars", JSON.stringify(next));
  };
  const handleFileUpload = async e => {
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
  const updateBackgroundImage = url => {
    setSetting("home_value_props_bg", url);
    setSelectingBackground(false);
    setBgModalTab("gallery");
    setPastedBgUrl("");
  };
  const handleBgFileUpload = async e => {
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
      await Promise.all(Array.from(dirty).map(key => updateSystemSetting(key, {
        value: settings[key]
      })));
      toast.success("Configuracion guardada correctamente");
      fetchSettings();
    } catch {
      toast.error("Error al guardar la configuracion");
    } finally {
      setSaving(false);
    }
  };

  /* ── Filtered images ── */
  const filtered = search ? allImages.filter(u => u.toLowerCase().includes(search.toLowerCase())) : allImages;
  if (loadingSettings) {
    return <div className={`${theme} hc-style-1`}>
        <div className="hc-style-2">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin hc-style-3" />
          <span className="hc-style-4">Cargando configuracion...</span>
        </div>
      </div>;
  }
  return <div className={`${theme} hc-style-5`}>
      <div className="hc-style-6">

        {/* ── Header ── */}
        <div className="hc-style-7">
          <div className="hc-style-8">
            <div className="hc-style-9">
              <LayoutDashboard size={18} />
            </div>
            <h1 className="hc-style-10">Configuracion de Inicio</h1>
          </div>
          <p className="hc-style-11">
            Personaliza el hero, las secciones y el contenido de tu pagina principal.
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className="hc-style-12">
          {TABS.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
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
        }}>
              {t.icon} <span className="hc-style-13">{t.label}</span>
            </button>)}
        </div>

        {/* ══════════════════════════════
             TAB: HERO
         ══════════════════════════════ */}
        {activeTab === "hero" && <div>
            {/* Textos del hero */}
            <div className="hc-style-14">
              <h3 className="hc-style-15">Textos del Hero</h3>
              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">Titulo principal</span>
                  <input type="text" value={settings.home_hero_title || ""} onChange={e => setSetting("home_hero_title", e.target.value)} onFocus={e => e.target.style.borderColor = "var(--color-primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} className="hc-style-19" />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Subtitulo</span>
                  <input type="text" value={settings.home_hero_subtitle || ""} onChange={e => setSetting("home_hero_subtitle", e.target.value)} onFocus={e => e.target.style.borderColor = "var(--color-primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} className="hc-style-19" />
                </label>
              </div>
            </div>

            {/* Imagenes seleccionadas */}
            <div className="hc-style-14">
              <div className="hc-style-20">
                <div>
                  <h3 className="hc-style-21">Imagenes seleccionadas para el Hero</h3>
                  <p className="hc-style-22">Maximo 4. El orden de seleccion es el orden de aparicion.</p>
                </div>
                <span style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 20,
              background: heroImages.length === 4 ? "var(--color-danger, #e53e3e)" : "var(--bg-overlay)",
              color: heroImages.length === 4 ? "#fff" : "var(--text-muted)"
            }}>
                  {heroImages.length} / 4
                </span>
              </div>

              {heroImages.length === 0 ? <div className="hc-style-23">
                  <Image size={32} className="hc-style-24" />
                  <p>Ninguna imagen seleccionada.</p>
                  <p className="hc-style-25">Selecciona imagenes desde el galeria de abajo.</p>
                </div> : <div className="hc-style-26">
                  {heroImages.map((url, i) => <div key={url} draggable onDragStart={e => {
              e.dataTransfer.effectAllowed = 'move';
              e.target.style.opacity = '0.5';
              e.dataTransfer.setData('text/plain', i.toString());
            }} onDragEnd={e => {
              e.target.style.opacity = '1';
              setDragOverHeroIdx(null);
            }} onDragOver={e => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverHeroIdx !== i) setDragOverHeroIdx(i);
            }} onDragLeave={() => {
              if (dragOverHeroIdx === i) setDragOverHeroIdx(null);
            }} onDrop={e => {
              e.preventDefault();
              setDragOverHeroIdx(null);
              const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
              if (isNaN(draggedIdx) || draggedIdx === i) return;
              const current = [...heroImages];
              const [draggedItem] = current.splice(draggedIdx, 1);
              current.splice(i, 0, draggedItem);
              setSetting("home_hero_images", JSON.stringify(current));
            }} style={{
              position: "relative",
              borderRadius: 10,
              overflow: "hidden",
              aspectRatio: "3/4",
              cursor: 'grab',
              border: dragOverHeroIdx === i ? "4px dashed var(--color-primary)" : "2px solid var(--color-primary)",
              transform: dragOverHeroIdx === i ? "scale(1.05)" : "scale(1)",
              transition: "all 0.2s"
            }}>
                      <img src={getImageUrl(url)} alt="" className="hc-style-27" />
                      <div className="hc-style-28">
                        #{i + 1}
                      </div>
                      <button onClick={() => removeHeroImage(url)} title="Quitar" className="hc-style-29">
                        <X size={12} />
                      </button>
                    </div>)}
                </div>}
            </div>

            {/* Galeria de variantes */}
            <div className="hc-style-30">
              <div className="hc-style-31">
                <div>
                  <h3 className="hc-style-21">Galeria de Imagenes de Variantes</h3>
                  <p className="hc-style-22">Haz click en una imagen para agregarla o quitarla del hero.</p>
                </div>
                <button onClick={() => fetchVariantImages(1, false)} className="hc-style-32">
                  <RefreshCw size={13} /> Recargar
                </button>
              </div>

              <input type="text" placeholder="Buscar por nombre de archivo..." value={search} onChange={e => setSearch(e.target.value)} className="hc-style-33" />

              {loadingImgs && page === 1 ? <div className="hc-style-34">
                  <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin hc-style-35" />
                  <span className="hc-style-36">Cargando imagenes...</span>
                </div> : filtered.length === 0 ? <div className="hc-style-37">No se encontraron imagenes.</div> : <div className="hc-style-38">
                  <div className="hc-style-39">
                    {filtered.map(url => {
                const selected = heroImages.includes(url);
                return <div key={url} onClick={() => toggleHeroImage(url)} title={url} style={{
                  position: "relative",
                  borderRadius: 8,
                  overflow: "hidden",
                  aspectRatio: "3/4",
                  cursor: "pointer",
                  border: selected ? "2.5px solid var(--color-primary)" : "2px solid var(--border-color)",
                  transition: "border-color 0.15s, transform 0.1s",
                  transform: selected ? "scale(1.02)" : "scale(1)",
                  opacity: !selected && heroImages.length >= 4 ? 0.4 : 1
                }}>
                          <img src={getImageUrl(url)} alt="" loading="lazy" onError={e => {
                    e.target.src = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_white.jfif";
                  }} className="hc-style-40" />
                          {selected && <div className="hc-style-41">
                              <div className="hc-style-42">
                                <Check size={14} color="#fff" />
                              </div>
                            </div>}
                        </div>;
              })}
                  </div>

                  {hasMore && !search && <div className="hc-style-43">
                      <button onClick={() => fetchVariantImages(page + 1, true)} disabled={loadingImgs} style={{
                padding: "8px 24px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                background: "var(--bg-overlay)",
                border: "1px solid var(--border-color)",
                color: "var(--text-main)",
                cursor: loadingImgs ? "not-allowed" : "pointer",
                opacity: loadingImgs ? 0.7 : 1
              }}>
                        {loadingImgs ? "Cargando..." : "Cargar más imágenes"}
                      </button>
                    </div>}
                </div>}
            </div>
          </div>}

        {/* ══════════════════════════════
             TAB: CATEGORIAS
         ══════════════════════════════ */}
        {activeTab === "categories" && <div>
            {/* Categorías seleccionadas (estilo tarjetas arrastrables) */}
            <div className="hc-style-14">
              <div className="hc-style-20">
                <div>
                  <h3 className="hc-style-21">Categorías seleccionadas</h3>
                  <p className="hc-style-22">Máximo 5 recomendadas. Haz click en la tarjeta para elegir miniatura, arrastra para reordenar.</p>
                </div>
                <span style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 20,
              background: featuredCategories.length === 5 ? "var(--color-danger, #e53e3e)" : "var(--bg-overlay)",
              color: featuredCategories.length === 5 ? "#fff" : "var(--text-muted)"
            }}>
                  {featuredCategories.length} seleccionadas
                </span>
              </div>

              {featuredCategories.length === 0 ? <div className="hc-style-23">
                  <Grid size={32} className="hc-style-24" />
                  <p>Ninguna categoría seleccionada.</p>
                  <p className="hc-style-25">Selecciona categorías desde la lista de abajo.</p>
                </div> : <div className="hc-style-26">
                  {featuredCategories.map((cat, i) => <div key={cat.id} draggable onDragStart={e => {
              e.dataTransfer.effectAllowed = 'move';
              e.target.style.opacity = '0.5';
              e.dataTransfer.setData('text/plain', i.toString());
            }} onDragEnd={e => {
              e.target.style.opacity = '1';
              setDragOverCatIdx(null);
            }} onDragOver={e => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverCatIdx !== i) setDragOverCatIdx(i);
            }} onDragLeave={() => {
              if (dragOverCatIdx === i) setDragOverCatIdx(null);
            }} onDrop={e => {
              e.preventDefault();
              setDragOverCatIdx(null);
              const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
              if (isNaN(draggedIdx) || draggedIdx === i) return;
              const current = [...featuredCategories];
              const [draggedItem] = current.splice(draggedIdx, 1);
              current.splice(i, 0, draggedItem);
              current.forEach((c, idx) => c.order = idx + 1);
              setSetting("home_featured_categories", JSON.stringify(current));
            }} onClick={() => setSelectingImageForCat(cat.id)} style={{
              position: "relative",
              borderRadius: 10,
              overflow: "hidden",
              aspectRatio: "3/4",
              cursor: 'grab',
              border: dragOverCatIdx === i ? "4px dashed var(--color-primary)" : "2px solid var(--color-primary)",
              transform: dragOverCatIdx === i ? "scale(1.05)" : "scale(1)",
              transition: "all 0.2s"
            }}>
                      {cat.image ? <img src={getImageUrl(cat.image)} alt="" className="hc-style-44" /> : <div className="hc-style-45">
                          <Image size={24} className="hc-style-46" />
                          <span className="hc-style-47">Click para miniatura</span>
                        </div>}
                      
                      <div className="hc-style-48">
                        #{i + 1}
                      </div>

                      <div className="hc-style-49">
                        {cat.name}
                      </div>

                      <button onClick={e => {
                e.stopPropagation();
                toggleFeaturedCategory(cat);
              }} title="Quitar" className="hc-style-29">
                        <X size={12} />
                      </button>
                    </div>)}
                </div>}
            </div>

            {/* Categorías Disponibles */}
            <div className="hc-style-30">
              <div className="hc-style-20">
                <div>
                  <h3 className="hc-style-21">Categorías Disponibles</h3>
                  <p className="hc-style-22">Haz click en una categoría para agregarla o quitarla de las destacadas.</p>
                </div>
              </div>

              {loadingCats ? <div className="hc-style-50">Cargando categorías...</div> : <div className="hc-style-51">
                  {allCategories.map(cat => {
              const isSelected = featuredCategories.some(c => c.id === cat.id);
              return <div key={cat.id} onClick={() => toggleFeaturedCategory(cat)} style={{
                position: "relative",
                borderRadius: 8,
                overflow: "hidden",
                cursor: "pointer",
                background: "var(--bg-overlay)",
                border: isSelected ? "2.5px solid var(--color-primary)" : "2px solid var(--border-color)",
                transition: "border-color 0.15s, transform 0.1s",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
                opacity: !isSelected && featuredCategories.length >= 5 ? 0.4 : 1,
                padding: "12px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: 60
              }}>
                        <span className="hc-style-52">{cat.name}</span>
                        {isSelected && <div className="hc-style-53">
                            <Check size={10} color="#fff" />
                          </div>}
                      </div>;
            })}
                </div>}
            </div>

            {/* MODAL para seleccionar miniatura */}
            {selectingImageForCat && <div className="hc-style-54">
                <div className="hc-style-55">
                  
                  {/* Modal Header */}
                  <div className="hc-style-56">
                    <h3 className="hc-style-57">
                      Miniatura para: <span className="hc-style-58">{featuredCategories.find(c => c.id === selectingImageForCat)?.name}</span>
                    </h3>
                    <button onClick={() => setSelectingImageForCat(null)} className="hc-style-59">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Modal Tabs */}
                  <div className="hc-style-60">
                    {[{
                id: "upload",
                label: "Subir desde PC",
                icon: <Upload size={14} />
              }, {
                id: "url",
                label: "Pegar URL",
                icon: <LinkIcon size={14} />
              }, {
                id: "gallery",
                label: "Galería de Variantes",
                icon: <Image size={14} />
              }].map(tab => <button key={tab.id} onClick={() => setModalTab(tab.id)} style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px 0",
                border: "none",
                borderBottom: modalTab === tab.id ? "2px solid var(--color-primary)" : "2px solid transparent",
                background: modalTab === tab.id ? "var(--bg-card)" : "transparent",
                color: modalTab === tab.id ? "var(--color-primary)" : "var(--text-muted)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer"
              }}>
                        {tab.icon} <span className="hc-style-13">{tab.label}</span>
                      </button>)}
                  </div>
                  
                  {/* Modal Body */}
                  <div className="hc-style-61">
                    
                    {/* TAB: UPLOAD */}
                    {modalTab === "upload" && <div className="hc-style-62">
                        <div className="hc-style-63">
                          <Upload size={40} className="hc-style-64" />
                          <h4 className="hc-style-65">Sube una imagen desde tu equipo</h4>
                          <p className="hc-style-66">Formato recomendado: Vertical (Aspect Ratio 3:4).</p>
                          
                          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hc-style-67" />
                          <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} style={{
                    padding: "10px 24px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: uploadingImage ? "not-allowed" : "pointer",
                    background: "var(--color-primary)",
                    color: "var(--color-primary-text)",
                    border: "none"
                  }}>
                            {uploadingImage ? "Subiendo..." : "Seleccionar archivo"}
                          </button>
                        </div>
                      </div>}

                    {/* TAB: URL */}
                    {modalTab === "url" && <div className="hc-style-68">
                        <div className="hc-style-69">
                          <label className="hc-style-70">URL de la Imagen</label>
                          <div className="hc-style-71">
                            <input type="text" placeholder="https://ejemplo.com/imagen.jpg" value={pastedUrl} onChange={e => setPastedUrl(e.target.value)} className="hc-style-72" />
                            <button onClick={handleApplyPastedUrl} disabled={!pastedUrl} style={{
                      padding: "10px 20px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      background: "var(--color-primary)",
                      color: "var(--color-primary-text)",
                      border: "none",
                      cursor: pastedUrl ? "pointer" : "not-allowed",
                      opacity: pastedUrl ? 1 : 0.5
                    }}>
                              Aplicar
                            </button>
                          </div>
                        </div>

                        {pastedUrl && <div className="hc-style-73">
                            <p className="hc-style-74">Previsualización:</p>
                            <div className="hc-style-75">
                              <img src={pastedUrl} alt="Preview" onError={e => {
                      e.target.src = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_white.jfif";
                    }} className="hc-style-40" />
                            </div>
                          </div>}
                      </div>}

                    {/* TAB: GALLERY */}
                    {modalTab === "gallery" && <>
                        <input type="text" placeholder="Buscar imagen..." value={search} onChange={e => setSearch(e.target.value)} className="hc-style-76" />

                        {loadingImgs && page === 1 ? <div className="hc-style-77">Cargando imágenes...</div> : <div className="hc-style-78">
                            {filtered.map(url => <div key={url} onClick={() => updateCategoryImage(selectingImageForCat, url)} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-primary)"} onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"} className="hc-style-79">
                                <img src={getImageUrl(url)} alt="" className="hc-style-40" />
                              </div>)}
                          </div>}
                        
                        {hasMore && !search && <div className="hc-style-80">
                            <button onClick={() => fetchVariantImages(page + 1, true)} disabled={loadingImgs} style={{
                    padding: "8px 24px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    background: "var(--bg-overlay)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-main)",
                    cursor: loadingImgs ? "not-allowed" : "pointer"
                  }}>
                              {loadingImgs ? "Cargando..." : "Cargar más imágenes"}
                            </button>
                          </div>}
                      </>}

                  </div>
                </div>
              </div>}
          </div>}

        {/* ══════════════════════════════
             TAB: CARRUSEL
         ══════════════════════════════ */}
        {activeTab === "carousel" && <div className="hc-style-14">
            <h3 className="hc-style-15">Configuración del Carrusel</h3>
            <div className="hc-style-16">
              <label className="hc-style-17">
                <span className="hc-style-18">Título del Carrusel</span>
                <input type="text" value={settings.home_carousel_title || ""} placeholder="Ej: LO MÁS VENDIDO" onChange={e => setSetting("home_carousel_title", e.target.value)} onFocus={e => e.target.style.borderColor = "var(--color-primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} className="hc-style-19" />
              </label>
              
              <label className="hc-style-17">
                <span className="hc-style-18">Tipo de lista a mostrar</span>
                <CustomSelect value={settings.home_carousel_type || "newest"} onChange={e => setSetting("home_carousel_type", e.target.value)}>
                  <option value="newest">Lo más nuevo (Lanzamientos)</option>
                  <option value="trending">Lo más visto / destacado (Best Sellers)</option>
                  <option value="random">Aleatorio</option>
                </CustomSelect>
              </label>
            </div>
          </div>}

        {/* ══════════════════════════════
             TAB: BENEFICIOS
         ══════════════════════════════ */}
        {activeTab === "value_props" && <div className="hc-style-14">
            <div className="hc-style-82">
              <div>
                <h3 className="hc-style-21">Barra de Beneficios</h3>
                <p className="hc-style-22">Máximo 4 iconos que se mostrarán bajo el hero principal.</p>
              </div>
              <button onClick={addValueProp} className="hc-style-83">
                + Añadir Beneficio
              </button>
            </div>
            
            <div className="hc-style-84">
              <span className="hc-style-85">Imagen de Fondo (Opcional)</span>
              <p className="hc-style-86">Se mostrará con un degradado y efecto fijo (parallax) detrás de los beneficios.</p>
              
              <div onClick={() => {
            setSelectingBackground(true);
            if (allBackgrounds.length === 0) fetchBackgrounds();
          }} style={{
            marginTop: 8,
            height: 120,
            width: "100%",
            borderRadius: 10,
            border: "2px dashed var(--border-color)",
            background: settings.home_value_props_bg ? `url(${getImageUrl(settings.home_value_props_bg)}) center/cover` : "var(--bg-overlay)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden"
          }}>
                {!settings.home_value_props_bg && <>
                    <Image size={24} className="hc-style-87" />
                    <span className="hc-style-88">Click para elegir fondo</span>
                  </>}
                {settings.home_value_props_bg && <div onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0} className="hc-style-89">
                    <span className="hc-style-90">Cambiar fondo</span>
                  </div>}
              </div>
              
              {settings.home_value_props_bg && <button onClick={() => updateBackgroundImage("")} className="hc-style-91">
                  Quitar fondo
                </button>}
            </div>

            <div className="hc-style-92">
              {valueProps.map((prop, idx) => <div key={idx} className="hc-style-93">
                  
                  <div className="hc-style-94">
                    <span className="hc-style-95">Ícono (Lucide)</span>
                    <button onClick={() => setEditingIconIndex(idx)} className="hc-style-96">
                      {(() => {
                  const IconCmp = Icons[prop.icon];
                  return IconCmp ? <IconCmp size={16} /> : <Icons.HelpCircle size={16} />;
                })()}
                      <span className="hc-style-97">
                        {prop.icon || "Seleccionar..."}
                      </span>
                    </button>
                  </div>

                  <div className="hc-style-98">
                    <span className="hc-style-95">Título</span>
                    <input type="text" value={prop.title || ""} onChange={e => updateValueProp(idx, 'title', e.target.value)} placeholder="Ej: Envíos Nacionales" className="hc-style-99" />
                  </div>

                  <div className="hc-style-100">
                    <span className="hc-style-95">Descripción</span>
                    <input type="text" value={prop.desc || ""} onChange={e => updateValueProp(idx, 'desc', e.target.value)} placeholder="Breve descripción del beneficio..." className="hc-style-99" />
                  </div>

                  <button onClick={() => removeValueProp(idx)} title="Eliminar" style={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "var(--color-danger, #e53e3e)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
                    <X size={14} />
                  </button>
                </div>)}
            </div>
          </div>}

        {/* ══════════════════════════════
             TAB: TOP BARS
         ══════════════════════════════ */}
        {activeTab === "topbars" && <div>
            {/* Header + Add button */}
            <div className="hc-style-101">
              <div>
                <h3 className="hc-style-102">Cintillos de Anuncios</h3>
                <p className="hc-style-103">
                  Agrega hasta 6 barras. Cada una puede ir en una posición distinta dentro de la página Home.
                </p>
              </div>
              <button onClick={addTopBar} className="hc-style-104">
                <Megaphone size={14} /> Agregar Barra
              </button>
            </div>

            {topBars.length === 0 ? <div className="hc-style-105">
                <Megaphone size={32} className="hc-style-106" />
                <p className="hc-style-107">Sin cintillos configurados.</p>
                <p className="hc-style-108">Presiona "Agregar Barra" para crear tu primer anuncio.</p>
              </div> : <div className="hc-style-16">
                {topBars.map((bar, idx) => <div key={bar.id} style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: 12,
            overflow: "hidden",
            borderLeft: bar.isVisible ? `4px solid ${bar.bgColor}` : "4px solid var(--border-color)"
          }}>
                    {/* Preview strip */}
                    <div style={{
              pointerEvents: "none",
              marginBottom: 0,
              opacity: bar.isVisible ? 1 : 0.4
            }}>
                       <TopBar {...bar} />
                    </div>

                    {/* Controls */}
                    <div className="hc-style-109">

                      {/* Header Row: Visible, Position, Delete */}
                      <div className="hc-style-110">
                        <div className="hc-style-111">
                          {/* Toggle visible */}
                          <div className="hc-style-112">
                            <button type="button" onClick={() => updateTopBar(bar.id, "isVisible", !bar.isVisible)} style={{
                      position: "relative",
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      border: "none",
                      cursor: "pointer",
                      flexShrink: 0,
                      background: bar.isVisible ? "var(--color-success, #48bb78)" : "var(--border-color)",
                      transition: "background 0.2s"
                    }}>
                              <span style={{
                        position: "absolute",
                        top: 2,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        transition: "left 0.2s",
                        left: bar.isVisible ? 22 : 2
                      }} />
                            </button>
                            <span className="hc-style-113">
                              {bar.isVisible ? "Activo" : "Oculto"}
                            </span>
                          </div>

                          {/* Position select */}
                          <div className="hc-style-114">
                            <CustomSelect value={bar.position} onChange={e => updateTopBar(bar.id, "position", e.target.value)} className="hc-style-115">
                              {POSITION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </CustomSelect>
                          </div>
                        </div>

                        {/* Delete */}
                        <button onClick={() => removeTopBar(bar.id)} title="Eliminar cintillo" className="hc-style-116">
                          <X size={15} /> <span>Eliminar</span>
                        </button>
                      </div>

                      <div className="hc-style-117"></div>

                      {/* Content Row: Text, Links */}
                      <div className="hc-style-118">
                        <div className="hc-style-119">
                          <label className="hc-style-120">
                            Texto del anuncio
                          </label>
                          <input type="text" value={bar.text} onChange={e => updateTopBar(bar.id, "text", e.target.value)} placeholder="Ej: Envío gratis en pedidos mayores a Bs 300" onFocus={e => e.target.style.borderColor = "var(--color-primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} className="hc-style-121" />
                        </div>
                        <div className="hc-style-122">
                          <label className="hc-style-120">
                            URL del enlace (opcional)
                          </label>
                          <input type="text" value={bar.linkUrl} onChange={e => updateTopBar(bar.id, "linkUrl", e.target.value)} placeholder="/shop/catalog o https://..." onFocus={e => e.target.style.borderColor = "var(--color-primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} className="hc-style-121" />
                        </div>
                        <div className="hc-style-123">
                          <label className="hc-style-120">
                            Texto del enlace (opcional)
                          </label>
                          <input type="text" value={bar.linkText} onChange={e => updateTopBar(bar.id, "linkText", e.target.value)} placeholder="Ver tienda →" onFocus={e => e.target.style.borderColor = "var(--color-primary)"} onBlur={e => e.target.style.borderColor = "var(--border-color)"} className="hc-style-121" />
                        </div>
                      </div>
                      
                      {/* Icons Row */}
                      <div className="hc-style-118">
                        <div className="hc-style-124">
                          <label className="hc-style-120">
                            Ícono Inicio (Izquierda)
                          </label>
                          <button onClick={() => setEditingTopBarIcon({
                    id: bar.id,
                    field: "icon"
                  })} className="hc-style-125">
                            {(() => {
                      const IconCmp = bar.icon && Icons[bar.icon];
                      return IconCmp ? <IconCmp size={16} /> : <Icons.Plus size={16} />;
                    })()}
                            <span className="hc-style-97">
                              {bar.icon || "Agregar ícono..."}
                            </span>
                          </button>
                          {bar.icon && <button onClick={() => updateTopBar(bar.id, "icon", "")} className="hc-style-126">Quitar ícono</button>}
                        </div>

                        <div className="hc-style-124">
                          <label className="hc-style-120">
                            Ícono Final (Derecha)
                          </label>
                          <button onClick={() => setEditingTopBarIcon({
                    id: bar.id,
                    field: "iconRight"
                  })} className="hc-style-125">
                            {(() => {
                      const IconRightCmp = bar.iconRight && Icons[bar.iconRight];
                      return IconRightCmp ? <IconRightCmp size={16} /> : <Icons.Plus size={16} />;
                    })()}
                            <span className="hc-style-97">
                              {bar.iconRight || "Agregar ícono..."}
                            </span>
                          </button>
                          {bar.iconRight && <button onClick={() => updateTopBar(bar.id, "iconRight", "")} className="hc-style-126">Quitar ícono</button>}
                        </div>
                        
                        <div className="hc-style-127" />
                      </div>

                      {/* Styling & Typography Row */}
                      <div className="hc-style-128">
                        <span className="hc-style-129">Estilos y Apariencia</span>
                        
                        {/* Row 1: Colors */}
                        <div className="hc-style-130">
                          <div className="hc-style-131">
                            <span className="hc-style-95">Color de fondo</span>
                            <div className="hc-style-132">
                              <label style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: bar.bgColor,
                        flexShrink: 0,
                        cursor: "pointer",
                        display: "block",
                        border: "1px solid rgba(0,0,0,0.1)",
                        position: "relative",
                        overflow: "hidden"
                      }}>
                                <input type="color" value={bar.bgColor} onChange={e => updateTopBar(bar.id, "bgColor", e.target.value)} className="hc-style-133" />
                              </label>
                              <input type="text" value={bar.bgColor} onChange={e => updateTopBar(bar.id, "bgColor", e.target.value)} className="hc-style-134" />
                            </div>
                          </div>
                          
                          <div className="hc-style-131">
                            <span className="hc-style-95">Color del texto</span>
                            <div className="hc-style-132">
                              <label style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: bar.textColor,
                        flexShrink: 0,
                        cursor: "pointer",
                        display: "block",
                        border: "1px solid rgba(0,0,0,0.1)",
                        position: "relative",
                        overflow: "hidden"
                      }}>
                                <input type="color" value={bar.textColor} onChange={e => updateTopBar(bar.id, "textColor", e.target.value)} className="hc-style-133" />
                              </label>
                              <input type="text" value={bar.textColor} onChange={e => updateTopBar(bar.id, "textColor", e.target.value)} className="hc-style-134" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Row 2: Typography */}
                        <div className="hc-style-135">
                          <label className="hc-style-136">
                            <span className="hc-style-95">Tamaño Letra</span>
                            <CustomSelect value={bar.textSize || "13px"} onChange={e => updateTopBar(bar.id, "textSize", e.target.value)} className="hc-style-115">
                              <option value="12px">Pequeña</option>
                              <option value="13px">Normal</option>
                              <option value="14px">Mediana</option>
                              <option value="16px">Grande</option>
                            </CustomSelect>
                          </label>

                          <label className="hc-style-136">
                            <span className="hc-style-95">Grosor Letra</span>
                            <CustomSelect value={bar.fontWeight || "500"} onChange={e => updateTopBar(bar.id, "fontWeight", e.target.value)} className="hc-style-115">
                              <option value="400">Normal</option>
                              <option value="500">Media</option>
                              <option value="600">Seminegrita</option>
                              <option value="700">Negrita</option>
                            </CustomSelect>
                          </label>

                          <label className="hc-style-136">
                            <span className="hc-style-95">Tamaño Ícono</span>
                            <CustomSelect value={bar.iconSize || 16} onChange={e => updateTopBar(bar.id, "iconSize", e.target.value)} className="hc-style-115">
                              <option value="14">Pequeño</option>
                              <option value="16">Normal</option>
                              <option value="18">Mediano</option>
                              <option value="20">Grande</option>
                              <option value="24">Extra</option>
                            </CustomSelect>
                          </label>

                          <label className="hc-style-136">
                            <span className="hc-style-95">Grosor Cintillo</span>
                            <CustomSelect value={bar.padding || "12px 20px"} onChange={e => updateTopBar(bar.id, "padding", e.target.value)} className="hc-style-115">
                              <option value="6px 20px">Delgado</option>
                              <option value="12px 20px">Normal</option>
                              <option value="24px 20px">Grueso</option>
                              <option value="40px 20px">Extra Grueso</option>
                            </CustomSelect>
                          </label>
                        </div>

                        {/* Row 3: Effects & Toggles */}
                        <div className="hc-style-130">
                          <label className="hc-style-137">
                            <span className="hc-style-95">Efecto Visual</span>
                            <CustomSelect value={bar.effect || "none"} onChange={e => updateTopBar(bar.id, "effect", e.target.value)} className="hc-style-115">
                              <option value="none">Ninguno</option>
                              <option value="border-glow">Bordes Iluminados (Fijo)</option>
                              <option value="gradient-flow">Fondo Flotante (Gradiente)</option>
                              <option value="rainbow-text">Texto Arcoíris (Fluido)</option>
                              <option value="cyberpunk">Cyberpunk</option>
                              <option value="text-breathe">Respiración de Texto</option>
                              <option value="retro-wave">Onda Retro (Synthwave)</option>
                              <option value="spotlight">Foco de Luz (Spotlight)</option>
                              <option value="pulse">Latido (Pulse)</option>
                              <option value="pulse-glow">Latido Resplandeciente</option>
                              <option value="glow">Resplandor (Glow)</option>
                              <option value="marquee">Deslizante (Marquee)</option>
                              <option value="shimmer">Brillo (Shimmer)</option>
                              <option value="bounce">Rebote (Bounce)</option>
                              <option value="neon">Neón (Neon)</option>
                              <option value="typewriter">Máquina de escribir</option>
                              <option value="glitch">Glitch / Error</option>
                              <option value="color-cycle">Ciclo Arcoíris</option>
                              <option value="scanline">Escáner Láser</option>
                              <option value="shake">Vibración (Shake)</option>
                            </CustomSelect>
                          </label>

                          <div className="hc-style-138">
                            <label className="hc-style-139">
                              <input type="checkbox" checked={!!bar.useGradient} onChange={e => updateTopBar(bar.id, "useGradient", e.target.checked)} className="hc-style-140" />
                              <span className="hc-style-85">Fondo Degradado</span>
                            </label>
                            
                            <label className="hc-style-139">
                              <input type="checkbox" checked={!!bar.isCloseable} onChange={e => updateTopBar(bar.id, "isCloseable", e.target.checked)} className="hc-style-140" />
                              <span className="hc-style-85">Botón (X)</span>
                            </label>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>)}
              </div>}
          </div>}

        {/* ══════════════════════════════
             TAB: SECCIONES
         ══════════════════════════════ */}
        {activeTab === "sections" && <div className="hc-style-141">
            {SECTION_KEYS.map((s, idx) => {
          const active = settings[s.key] === "true" || settings[s.key] === true;
          const isLast = idx === SECTION_KEYS.length - 1;
          return <div key={s.key} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: isLast ? "none" : "1px solid var(--border-color)",
            background: dirty.has(s.key) ? "var(--bg-overlay)" : "var(--bg-card)",
            borderLeft: dirty.has(s.key) ? "3px solid var(--color-primary)" : "3px solid transparent",
            gap: 16
          }}>
                  <div className="hc-style-142">
                    <div className="hc-style-112">
                      {active ? <Eye size={15} className="hc-style-143" /> : <EyeOff size={15} className="hc-style-144" />}
                      <span className="hc-style-21">{s.label}</span>
                      {dirty.has(s.key) && <span className="hc-style-145">Modificado</span>}
                    </div>
                    <p className="hc-style-146">{s.desc}</p>
                  </div>
                  <button type="button" onClick={() => setSetting(s.key, active ? "false" : "true")} style={{
              position: "relative",
              width: 44,
              height: 24,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: active ? "var(--color-success, #48bb78)" : "var(--border-color)",
              transition: "background 0.2s",
              flexShrink: 0
            }}>
                    <span style={{
                position: "absolute",
                top: 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                transition: "left 0.2s",
                left: active ? 23 : 3
              }} />
                  </button>
                </div>;
        })}
          </div>}
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
      
      {/* MODAL para seleccionar fondo de beneficios */}
      {selectingBackground && <div className="hc-style-54">
          <div className="hc-style-55">
            
            {/* Modal Header */}
            <div className="hc-style-56">
              <h3 className="hc-style-57">
                Fondo para: <span className="hc-style-58">Beneficios</span>
              </h3>
              <button onClick={() => setSelectingBackground(false)} className="hc-style-59">
                <X size={16} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="hc-style-60">
              {[{
            id: "upload",
            label: "Subir desde PC",
            icon: <Upload size={14} />
          }, {
            id: "url",
            label: "Pegar URL",
            icon: <LinkIcon size={14} />
          }, {
            id: "gallery",
            label: "Galería de Fondos",
            icon: <Image size={14} />
          }].map(tab => <button key={tab.id} onClick={() => setBgModalTab(tab.id)} style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 0",
            border: "none",
            borderBottom: bgModalTab === tab.id ? "2px solid var(--color-primary)" : "2px solid transparent",
            background: bgModalTab === tab.id ? "var(--bg-card)" : "transparent",
            color: bgModalTab === tab.id ? "var(--color-primary)" : "var(--text-muted)",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer"
          }}>
                  {tab.icon} <span className="hc-style-13">{tab.label}</span>
                </button>)}
            </div>
            
            {/* Modal Body */}
            <div className="hc-style-61">
              
              {/* TAB: UPLOAD */}
              {bgModalTab === "upload" && <div className="hc-style-62">
                  <div className="hc-style-63">
                    <Upload size={40} className="hc-style-64" />
                    <h4 className="hc-style-65">Sube una imagen desde tu equipo</h4>
                    <p className="hc-style-66">Se guardará en /system/funds/</p>
                    
                    <input type="file" accept="image/*" ref={bgFileInputRef} onChange={handleBgFileUpload} className="hc-style-67" />
                    <button onClick={() => bgFileInputRef.current?.click()} disabled={uploadingImage} style={{
                padding: "10px 24px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: uploadingImage ? "not-allowed" : "pointer",
                background: "var(--color-primary)",
                color: "var(--color-primary-text)",
                border: "none"
              }}>
                      {uploadingImage ? "Subiendo..." : "Seleccionar archivo"}
                    </button>
                  </div>
                </div>}

              {/* TAB: URL */}
              {bgModalTab === "url" && <div className="hc-style-68">
                  <div className="hc-style-69">
                    <label className="hc-style-70">URL de la Imagen</label>
                    <div className="hc-style-71">
                      <input type="text" placeholder="https://ejemplo.com/fondo.jpg" value={pastedBgUrl} onChange={e => setPastedBgUrl(e.target.value)} className="hc-style-72" />
                      <button onClick={handleApplyPastedBgUrl} disabled={!pastedBgUrl} style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  background: "var(--color-primary)",
                  color: "var(--color-primary-text)",
                  border: "none",
                  cursor: pastedBgUrl ? "pointer" : "not-allowed",
                  opacity: pastedBgUrl ? 1 : 0.5
                }}>
                        Aplicar
                      </button>
                    </div>
                  </div>

                  {pastedBgUrl && <div className="hc-style-152">
                      <p className="hc-style-74">Previsualización:</p>
                      <div className="hc-style-153">
                        <img src={pastedBgUrl} alt="Preview" onError={e => {
                  e.target.src = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_white.jfif";
                }} className="hc-style-40" />
                      </div>
                    </div>}
                </div>}

              {/* TAB: GALLERY */}
              {bgModalTab === "gallery" && <>
                  {loadingBgs ? <div className="hc-style-77">Cargando fondos...</div> : allBackgrounds.length === 0 ? <div className="hc-style-77">No hay fondos en la galería.</div> : <div className="hc-style-154">
                      {allBackgrounds.map(url => <div key={url} onClick={() => updateBackgroundImage(url)} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-primary)"} onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"} className="hc-style-155">
                          <img src={getImageUrl(url)} alt="" className="hc-style-40" />
                        </div>)}
                    </div>}
                </>}

            </div>
          </div>
        </div>}
      
      <IconPickerModal isOpen={editingIconIndex !== null} onClose={() => setEditingIconIndex(null)} onSelect={icon => updateValueProp(editingIconIndex, 'icon', icon)} />

      <IconPickerModal isOpen={editingTopBarIcon !== null} onClose={() => setEditingTopBarIcon(null)} onSelect={icon => {
      if (editingTopBarIcon) {
        updateTopBar(editingTopBarIcon.id, editingTopBarIcon.field, icon);
        setEditingTopBarIcon(null);
      }
    }} />
    </div>;
}