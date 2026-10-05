import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit, Trash2, Layers, Image as ImageIcon, Film, Save, Eye, EyeOff, Grid, Star, Check, X, Upload, Link as LinkIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { getShopShorts, deleteShopShort } from "../../../../api/admin/shopShorts";
import { getSystemSettings, updateSystemSetting } from "../../../../api/admin/systemSettings";
import { getCategories, getVariantImages, uploadCategoryImage } from "../../../../api/admin/homeConfig";
import { getImageUrl } from "../../../../utils/imageUtils";
import { useThemeStore } from "../../../../store/themeStore";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";
import CustomSelect from "../../../../components/ui/CustomSelect";
import ShopShortModal from "./ShopShortModal";
import "../Products/Products.css"; 
import "./ShopShorts.css";
import "../HomeConfig/HomeConfig.css";
import { VideoPlayer } from "../../../../components/ui/videoHelpers";

const TABS = [
  { id: "hero", label: "Hero (Inicio)", icon: <ImageIcon size={15} /> },
  { id: "collage", label: "Collage", icon: <Grid size={15} /> },
  { id: "categories", label: "Categorías", icon: <Grid size={15} /> },
  { id: "new_arrivals", label: "Novedades", icon: <Star size={15} /> },
  { id: "sections", label: "Secciones", icon: <Layers size={15} /> }
];

export default function ShopShorts() {
  const isDark = useThemeStore(s => s.isDark);
  const theme = isDark ? "admin-theme-dark" : "admin-theme";
  const [activeTab, setActiveTab] = useState("hero");
  
  // Settings State
  const [settings, setSettings] = useState({});
  const [dirty, setDirty] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  // Shorts State
  const [shorts, setShorts] = useState([]);
  const [loadingShorts, setLoadingShorts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShort, setSelectedShort] = useState(null);

  // Categories State
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);

  const fetchPublicSettings = useShopSettingsStore(s => s.fetchSettings);

  const featuredCategories = (() => {
    try {
      return JSON.parse(settings.shop_home_featured_categories || "[]");
    } catch {
      return [];
    }
  })();

  const [dragOverCatIdx, setDragOverCatIdx] = useState(null);
  const [selectingImageForCat, setSelectingImageForCat] = useState(null);
  const [modalTab, setModalTab] = useState("gallery");
  const [pastedUrl, setPastedUrl] = useState("");
  const [allImages, setAllImages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingImgs, setLoadingImgs] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = React.useRef(null);

  const fetchVariantImages = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoadingImgs(true);
      const res = await getVariantImages(pageNum);
      if (append) {
        setAllImages(prev => {
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
    if (activeTab === "categories" && allImages.length === 0) {
      fetchVariantImages(1, false);
    }
  }, [activeTab, fetchVariantImages, allImages.length]);

  const toggleFeaturedCategory = (cat) => {
    const current = [...featuredCategories];
    const existingIdx = current.findIndex(c => c.id === cat.id);
    if (existingIdx >= 0) {
      current.splice(existingIdx, 1);
    } else {
      if (current.length >= 5) {
        toast.error("Máximo 5 categorías destacadas permitidas.");
        return;
      }
      current.push({ id: cat.id, name: cat.name, image: null, order: current.length + 1 });
    }
    setSetting("shop_home_featured_categories", JSON.stringify(current));
  };

  const updateCategoryImage = (catId, imageUrl) => {
    const current = [...featuredCategories];
    const cat = current.find(c => c.id === catId);
    if (cat) {
      cat.image = imageUrl;
      setSetting("shop_home_featured_categories", JSON.stringify(current));
    }
    setSelectingImageForCat(null);
    setModalTab("gallery");
    setPastedUrl("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const res = await uploadCategoryImage(file);
      updateCategoryImage(selectingImageForCat, res.url);
      toast.success("Imagen subida y asignada con éxito");
    } catch (err) {
      toast.error("Error al subir la imagen");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handlePastedUrl = () => {
    if (!pastedUrl) return;
    updateCategoryImage(selectingImageForCat, pastedUrl);
    toast.success("Imagen enlazada con éxito");
  };

  useEffect(() => {
    fetchSettings();
    fetchShorts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCats(true);
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      toast.error("Error al cargar categorías");
    } finally {
      setLoadingCats(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const data = await getSystemSettings();
      const st = {};
      data.forEach(item => {
        st[item.key] = item.value;
      });
      setSettings(st);
      setDirty(new Set());
    } catch (err) {
      toast.error("Error al cargar configuraciones");
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchShorts = async () => {
    try {
      setLoadingShorts(true);
      const res = await getShopShorts();
      setShorts(res.data);
    } catch (error) {
      toast.error("Error al cargar los videos cortos");
    } finally {
      setLoadingShorts(false);
    }
  };

  const setSetting = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
    setDirty(prev => new Set(prev).add(key));
  };

  const handleSaveSettings = async () => {
    if (dirty.size === 0) return;
    setSaving(true);
    try {
      for (const key of Array.from(dirty)) {
        await updateSystemSetting(key, { value: settings[key], category: 'Shop_page_config' });
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

  const handleOpenModal = (short = null) => {
    setSelectedShort(short);
    setIsModalOpen(true);
  };

  const handleDeleteShort = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este video?")) return;
    try {
      await deleteShopShort(id);
      toast.success("Video eliminado");
      fetchShorts();
    } catch (error) {
      toast.error("Error al eliminar el video");
    }
  };

  const filteredShorts = shorts.filter(s => {
    const term = searchQuery.toLowerCase();
    const titleMatch = s.title && s.title.toLowerCase().includes(term);
    const productMatch = s.product && s.product.name.toLowerCase().includes(term);
    return titleMatch || productMatch;
  });

  const SECTION_KEYS = [
    { key: "shop_home_show_hero", label: "Hero (Inicio)", desc: "El banner principal de la tienda." },
    { key: "shop_home_show_categories", label: "Categorías Destacadas", desc: "La cuadrícula de categorías con miniaturas personalizadas." },
    { key: "shop_home_show_collage", label: "Collage de Shorts/Productos", desc: "La cuadrícula mixta de videos y productos." },
    { key: "shop_home_show_new_arrivals", label: "Carrusel de Novedades", desc: "El carrusel inferior de nuevos productos." }
  ];

  return (
    <div className={`${theme} hc-style-5`}>
      <div className="hc-style-6">
        <div className="hc-style-7">
          <div className="hc-style-8">
            <div className="hc-style-9">
              <Film size={18} />
            </div>
            <h1 className="hc-style-10">Configuración Tienda (Shop)</h1>
          </div>
          <p className="hc-style-11">
            Personaliza el Hero, secciones de la tienda y administra los videos cortos (Shorts).
          </p>
        </div>

        <div className="hc-style-12">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                borderRadius: "8px 8px 0 0", fontSize: 13, fontWeight: 600,
                cursor: "pointer", border: "1px solid transparent", borderBottom: "none",
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

        {activeTab === "sections" && (
          <div className="hc-style-141">
            {SECTION_KEYS.map((s, idx) => {
              const active = settings[s.key] === undefined || String(settings[s.key]) !== "0";
              const isLast = idx === SECTION_KEYS.length - 1;
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: isLast ? 'none' : '1px solid var(--border-color)', background: 'var(--bg-card)', borderLeft: dirty.has(s.key) ? '3px solid var(--color-primary)' : '3px solid transparent' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {active ? <Eye size={15} style={{ color: 'var(--color-success, #48bb78)' }} /> : <EyeOff size={15} style={{ color: 'var(--text-muted)' }} />}
                      <span className="hc-style-21">{s.label}</span>
                      {dirty.has(s.key) && <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: '#dbeafe', color: '#1d4ed8' }}>Modificado</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', marginLeft: '23px' }}>{s.desc}</p>
                  </div>
                  <button type="button" onClick={() => setSetting(s.key, active ? "0" : "1")} 
                    style={{ position: 'relative', width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: active ? 'var(--color-success, #48bb78)' : 'var(--border-color)', transition: 'background 0.2s', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.2s', left: active ? '23px' : '3px' }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "hero" && (
          <div>
            <div className="hc-style-14">
              <h3 className="hc-style-15">Textos del Hero (Inicio Tienda)</h3>
              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">Título Principal</span>
                  <input type="text" value={settings.shop_home_hero_title ?? "LO MÁS DESTACADO"} onChange={e => setSetting("shop_home_hero_title", e.target.value)} className="hc-style-19" />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Subtítulo</span>
                  <input type="text" value={settings.shop_home_hero_subtitle ?? "Descubre las tendencias en moda masculina"} onChange={e => setSetting("shop_home_hero_subtitle", e.target.value)} className="hc-style-19" />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Texto del Botón</span>
                  <input type="text" value={settings.shop_home_hero_btn_text ?? "Ver catálogo completo"} onChange={e => setSetting("shop_home_hero_btn_text", e.target.value)} className="hc-style-19" />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div>
            <div className="hc-style-14">
              <div className="hc-style-20">
                <div>
                  <h3 className="hc-style-21">Categorías seleccionadas</h3>
                  <p className="hc-style-22">Máximo 5 recomendadas. Haz click en la tarjeta para elegir miniatura, arrastra para reordenar.</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: featuredCategories.length === 5 ? "var(--color-danger, #e53e3e)" : "var(--bg-overlay)", color: featuredCategories.length === 5 ? "#fff" : "var(--text-muted)" }}>
                  {featuredCategories.length} seleccionadas
                </span>
              </div>

              {featuredCategories.length === 0 ? (
                <div className="hc-style-23">
                  <Grid size={32} className="hc-style-24" />
                  <p>Ninguna categoría seleccionada.</p>
                  <p className="hc-style-25">Selecciona categorías desde la lista de abajo.</p>
                </div>
              ) : (
                <div className="hc-style-26">
                  {featuredCategories.map((cat, i) => (
                    <div key={cat.id} draggable onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.target.style.opacity = '0.5'; e.dataTransfer.setData('text/plain', i.toString()); }} onDragEnd={e => { e.target.style.opacity = '1'; setDragOverCatIdx(null); }} onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverCatIdx !== i) setDragOverCatIdx(i); }} onDragLeave={() => { if (dragOverCatIdx === i) setDragOverCatIdx(null); }} onDrop={e => { e.preventDefault(); setDragOverCatIdx(null); const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'), 10); if (isNaN(draggedIdx) || draggedIdx === i) return; const current = [...featuredCategories]; const [draggedItem] = current.splice(draggedIdx, 1); current.splice(i, 0, draggedItem); current.forEach((c, idx) => c.order = idx + 1); setSetting("shop_home_featured_categories", JSON.stringify(current)); }} onClick={() => setSelectingImageForCat(cat.id)} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "3/4", cursor: 'grab', border: dragOverCatIdx === i ? "4px dashed var(--color-primary)" : "2px solid var(--color-primary)", transform: dragOverCatIdx === i ? "scale(1.05)" : "scale(1)", transition: "all 0.2s" }}>
                      {cat.image ? <img src={getImageUrl(cat.image)} alt="" className="hc-style-44" /> : <div className="hc-style-45"><ImageIcon size={24} className="hc-style-46" /><span className="hc-style-47">Click para miniatura</span></div>}
                      <div className="hc-style-48">#{i + 1}</div>
                      <div className="hc-style-49">{cat.name}</div>
                      <button onClick={e => { e.stopPropagation(); toggleFeaturedCategory(cat); }} title="Quitar" className="hc-style-29"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="hc-style-30">
              <div className="hc-style-20">
                <div>
                  <h3 className="hc-style-21">Categorías Disponibles</h3>
                  <p className="hc-style-22">Haz click en una categoría para agregarla o quitarla de las destacadas.</p>
                </div>
              </div>

              {loadingCats ? (
                <div className="hc-style-50">Cargando categorías...</div>
              ) : (
                <div className="hc-style-51">
                  {categories.map(cat => {
                    const isSelected = featuredCategories.some(c => c.id === cat.id);
                    return (
                      <div key={cat.id} onClick={() => toggleFeaturedCategory(cat)} style={{ position: "relative", borderRadius: 8, overflow: "hidden", cursor: "pointer", background: "var(--bg-overlay)", border: isSelected ? "2.5px solid var(--color-primary)" : "2px solid var(--border-color)", transition: "border-color 0.15s, transform 0.1s", transform: isSelected ? "scale(1.02)" : "scale(1)", opacity: !isSelected && featuredCategories.length >= 5 ? 0.4 : 1, padding: "12px 10px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 60 }}>
                        <span className="hc-style-52">{cat.name}</span>
                        {isSelected && <div className="hc-style-53"><Check size={10} color="#fff" /></div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectingImageForCat && (
              <div className="hc-style-54">
                <div className="hc-style-55">
                  <div className="hc-style-56">
                    <h3 className="hc-style-57">Miniatura para: <span className="hc-style-58">{featuredCategories.find(c => c.id === selectingImageForCat)?.name}</span></h3>
                    <button onClick={() => setSelectingImageForCat(null)} className="hc-style-59"><X size={16} /></button>
                  </div>

                  <div className="hc-style-60">
                    {[{ id: "upload", label: "Subir desde PC", icon: <Upload size={14} /> }, { id: "url", label: "Pegar URL", icon: <LinkIcon size={14} /> }, { id: "gallery", label: "Galería de Variantes", icon: <ImageIcon size={14} /> }].map(tab => (
                      <button key={tab.id} onClick={() => setModalTab(tab.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", border: "none", borderBottom: modalTab === tab.id ? "2px solid var(--color-primary)" : "2px solid transparent", background: modalTab === tab.id ? "var(--bg-card)" : "transparent", color: modalTab === tab.id ? "var(--color-primary)" : "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                        {tab.icon} <span className="hc-style-13">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="hc-style-61">
                    {modalTab === "upload" && (
                      <div className="hc-style-62">
                        <div className="hc-style-63">
                          <Upload size={40} className="hc-style-64" />
                          <h4 className="hc-style-65">Sube una imagen desde tu equipo</h4>
                          <p className="hc-style-66">Formato recomendado: Vertical (Aspect Ratio 3:4).</p>
                          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hc-style-67" />
                          <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} style={{ padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: uploadingImage ? "not-allowed" : "pointer", background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none" }}>
                            {uploadingImage ? "Subiendo..." : "Seleccionar archivo"}
                          </button>
                        </div>
                      </div>
                    )}

                    {modalTab === "url" && (
                      <div className="hc-style-68">
                        <div className="hc-style-69">
                          <label className="hc-style-70">URL de la Imagen</label>
                          <div className="hc-style-71">
                            <input type="text" placeholder="https://ejemplo.com/imagen.jpg" value={pastedUrl} onChange={e => setPastedUrl(e.target.value)} className="hc-style-72" />
                            <button onClick={handlePastedUrl} disabled={!pastedUrl} style={{ padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--color-primary)", color: "var(--color-primary-text)", border: "none", cursor: pastedUrl ? "pointer" : "not-allowed", opacity: pastedUrl ? 1 : 0.5 }}>Aplicar</button>
                          </div>
                        </div>
                        {pastedUrl && (
                          <div className="hc-style-73">
                            <p className="hc-style-74">Previsualización:</p>
                            <div className="hc-style-75">
                              <img src={pastedUrl} alt="Preview" onError={e => { e.target.src = "https://pub-17cc16459862449d8dcc55ee775a8a3f.r2.dev/system/not-found/image_not_found_white.jfif"; }} className="hc-style-40" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {modalTab === "gallery" && (
                      <>
                        {loadingImgs && page === 1 ? (
                          <div className="hc-style-77">Cargando imágenes...</div>
                        ) : (
                          <div className="hc-style-78">
                            {allImages.map(url => (
                              <div key={url} onClick={() => updateCategoryImage(selectingImageForCat, url)} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-primary)"} onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"} className="hc-style-79">
                                <img src={getImageUrl(url)} alt="" className="hc-style-40" />
                              </div>
                            ))}
                          </div>
                        )}
                        {hasMore && (
                          <div className="hc-style-80">
                            <button onClick={() => fetchVariantImages(page + 1, true)} disabled={loadingImgs} style={{ padding: "8px 24px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: "var(--bg-overlay)", border: "1px solid var(--border-color)", color: "var(--text-main)", cursor: loadingImgs ? "not-allowed" : "pointer" }}>
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

        {activeTab === "collage" && (
          <div className="hc-style-141">
            <div className="hc-style-14" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <h3 className="hc-style-15">Criterio de Ordenamiento (Productos)</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>¿Qué productos se deben destacar primero en el collage?</p>
              <CustomSelect 
                value={settings.shop_home_collage_sort || "newest"} 
                onChange={(e) => setSetting("shop_home_collage_sort", e.target.value)}
              >
                <option value="newest">Novedades (Más recientes)</option>
                <option value="best_sellers">Más vendidos</option>
                <option value="most_viewed">Más vistos / Populares</option>
                <option value="price_desc">Mayor precio primero</option>
                <option value="price_asc">Menor precio primero</option>
              </CustomSelect>
            </div>

            <div className="hc-style-14">
              <h3 className="hc-style-15">Filtro de Categorías</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>¿Qué tipo de prendas deseas incluir en el collage?</p>
              
              <CustomSelect 
                value={settings.shop_home_collage_category_filter || "all"} 
                onChange={(e) => setSetting("shop_home_collage_category_filter", e.target.value)}
                style={{ marginBottom: '15px' }}
              >
                <option value="all">Mostrar TODAS las categorías</option>
                <option value="include">SOLO mostrar ciertas categorías</option>
                <option value="exclude">OCULTAR ciertas categorías</option>
              </CustomSelect>

              {(settings.shop_home_collage_category_filter === 'include' || settings.shop_home_collage_category_filter === 'exclude') && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                  {loadingCats ? <span style={{ fontSize: '12px' }}>Cargando categorías...</span> : categories.map(cat => {
                    let selectedCats = [];
                    try {
                      selectedCats = JSON.parse(settings.shop_home_collage_categories || "[]");
                    } catch {}
                    const isSelected = selectedCats.includes(cat.id);
                    
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          let newSelected = [...selectedCats];
                          if (isSelected) {
                            newSelected = newSelected.filter(id => id !== cat.id);
                          } else {
                            newSelected.push(cat.id);
                          }
                          setSetting("shop_home_collage_categories", JSON.stringify(newSelected));
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                          background: isSelected ? 'var(--color-primary)' : 'var(--bg-card)',
                          color: isSelected ? 'var(--color-primary-text)' : 'var(--text-main)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="hc-style-14" style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="hc-style-15" style={{ margin: 0 }}>Gestión de Videos (Shorts)</h3>
                <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px', borderRadius: '8px', background: 'var(--color-primary)', color: 'var(--color-primary-text)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  <Plus size={16} /> Nuevo Video
                </button>
              </div>

              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none', fontSize: '13px' }}
                  placeholder="Buscar por título o producto..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {loadingShorts ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando videos...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {filteredShorts.map((short) => (
                    <div key={short.id} style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', height: '280px', background: '#000' }}>
                        <VideoPlayer 
                          url={short.video_url}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          autoPlay={false}
                          onMouseOver={(e) => { if(e.target.play) e.target.play(); }}
                          onMouseOut={(e) => { if(e.target.pause) { e.target.pause(); e.target.currentTime = 0; } }}
                        />
                        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                          <button onClick={() => handleOpenModal(short)} title="Editar" style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteShort(short.id)} title="Eliminar" style={{ background: 'var(--color-danger)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div style={{ padding: '12px' }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{short.title || 'Sin título'}</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{short.product ? short.product.name : 'Sin producto'}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                          <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: short.is_active ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            {short.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Prio: {short.priority}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredShorts.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No se encontraron videos
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "new_arrivals" && (
          <div className="hc-style-141">
            
            <div className="hc-style-14" style={{ marginBottom: '20px' }}>
              <h3 className="hc-style-15">Textos del Carrusel</h3>
              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">Título</span>
                  <input type="text" value={settings.shop_home_new_arrivals_title ?? "LO ÚLTIMO"} onChange={e => setSetting("shop_home_new_arrivals_title", e.target.value)} className="hc-style-19" />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Subtítulo</span>
                  <input type="text" value={settings.shop_home_new_arrivals_subtitle ?? "Piezas recién llegadas a la tienda"} onChange={e => setSetting("shop_home_new_arrivals_subtitle", e.target.value)} className="hc-style-19" />
                </label>
              </div>
            </div>

            <div className="hc-style-14" style={{ marginBottom: '20px' }}>
              <h3 className="hc-style-15">Criterio de Ordenamiento (Productos)</h3>
              <CustomSelect 
                value={settings.shop_home_new_arrivals_sort || "newest"} 
                onChange={(e) => setSetting("shop_home_new_arrivals_sort", e.target.value)}
                style={{ marginBottom: '15px' }}
              >
                <option value="newest">Novedades (Más recientes)</option>
                <option value="best_sellers">Más vendidos</option>
                <option value="most_viewed">Más vistos / Populares</option>
                <option value="price_desc">Mayor precio primero</option>
                <option value="price_asc">Menor precio primero</option>
                <option value="random">Aleatorio</option>
              </CustomSelect>

              <label className="hc-style-17">
                <span className="hc-style-18">Cantidad de Productos a mostrar</span>
                <input type="number" min="4" max="24" value={settings.shop_home_new_arrivals_limit ?? 8} onChange={e => setSetting("shop_home_new_arrivals_limit", e.target.value)} className="hc-style-19" />
              </label>
            </div>

            <div className="hc-style-14" style={{ marginBottom: '20px' }}>
              <h3 className="hc-style-15">Filtro de Categorías</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Selecciona qué productos participan en el carrusel.</p>
              
              <CustomSelect 
                value={settings.shop_home_new_arrivals_category_filter || "all"} 
                onChange={(e) => setSetting("shop_home_new_arrivals_category_filter", e.target.value)}
                style={{ marginBottom: '15px' }}
              >
                <option value="all">Mostrar TODAS las categorías</option>
                <option value="include">SOLO mostrar ciertas categorías</option>
                <option value="exclude">OCULTAR ciertas categorías</option>
              </CustomSelect>

              {(settings.shop_home_new_arrivals_category_filter === 'include' || settings.shop_home_new_arrivals_category_filter === 'exclude') && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                  {loadingCats ? <span style={{ fontSize: '12px' }}>Cargando categorías...</span> : categories.map(cat => {
                    let selectedCats = [];
                    try { selectedCats = JSON.parse(settings.shop_home_new_arrivals_categories || "[]"); } catch {}
                    const isSelected = selectedCats.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          let newSelected = [...selectedCats];
                          if (isSelected) newSelected = newSelected.filter(id => id !== cat.id);
                          else newSelected.push(cat.id);
                          setSetting("shop_home_new_arrivals_categories", JSON.stringify(newSelected));
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: '20px', border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                          background: isSelected ? 'var(--color-primary)' : 'var(--bg-card)', color: isSelected ? 'var(--color-primary-text)' : 'var(--text-main)',
                          fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="hc-style-14">
              <h3 className="hc-style-15">Estilos de las Tarjetas (Productos)</h3>
              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">Color de Fondo de Tarjeta</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="color" value={settings.shop_home_new_arrivals_card_bg || "#ffffff"} onChange={e => setSetting("shop_home_new_arrivals_card_bg", e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                    <input type="text" value={settings.shop_home_new_arrivals_card_bg || "#ffffff"} onChange={e => setSetting("shop_home_new_arrivals_card_bg", e.target.value)} className="hc-style-19" style={{ flex: 1 }} />
                  </div>
                </label>
                
                <label className="hc-style-17">
                  <span className="hc-style-18">Color del Texto</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="color" value={settings.shop_home_new_arrivals_text_color || "#000000"} onChange={e => setSetting("shop_home_new_arrivals_text_color", e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                    <input type="text" value={settings.shop_home_new_arrivals_text_color || "#000000"} onChange={e => setSetting("shop_home_new_arrivals_text_color", e.target.value)} className="hc-style-19" style={{ flex: 1 }} />
                  </div>
                </label>
                
                <label className="hc-style-17">
                  <span className="hc-style-18">Redondeo de Bordes (px)</span>
                  <input type="number" value={settings.shop_home_new_arrivals_card_radius ?? 0} onChange={e => setSetting("shop_home_new_arrivals_card_radius", e.target.value)} className="hc-style-19" />
                </label>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                  <span className="hc-style-18">¿Sombreado en tarjetas?</span>
                  <button type="button" onClick={() => setSetting("shop_home_new_arrivals_card_shadow", settings.shop_home_new_arrivals_card_shadow === "1" ? "0" : "1")} 
                    style={{ position: 'relative', width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: settings.shop_home_new_arrivals_card_shadow === "1" ? 'var(--color-success, #48bb78)' : 'var(--border-color)', transition: 'background 0.2s', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.2s', left: settings.shop_home_new_arrivals_card_shadow === "1" ? '23px' : '3px' }} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {dirty.size > 0 && (
        <div className="hc-style-147">
          <div className="hc-style-148">
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
              {dirty.size} cambio{dirty.size !== 1 ? "s" : ""} sin guardar
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={fetchSettings} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: 'var(--bg-overlay)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}>
                Descartar
              </button>
              <button onClick={handleSaveSettings} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", background: saving ? "var(--border-color)" : "var(--color-primary)", color: saving ? "var(--text-muted)" : "var(--color-primary-text)", border: "none" }}>
                {saving ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin hc-style-151" /> : <Save size={15} />}
                {saving ? "Guardando..." : "Guardar Todo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ShopShortModal
          short={selectedShort}
          onClose={() => setIsModalOpen(false)}
          onSaved={fetchShorts}
        />
      )}
    </div>
  );
}
