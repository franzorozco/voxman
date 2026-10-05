import React, { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag, Save, Eye, EyeOff, Grid, Columns, Type, Palette,
  SlidersHorizontal, Tag, LayoutGrid, Settings2, Image as ImageIcon
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getSystemSettings, updateSystemSetting } from "../../../../api/admin/systemSettings";
import { getCategories } from "../../../../api/admin/homeConfig";
import { useThemeStore } from "../../../../store/themeStore";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";
import CustomSelect from "../../../../components/ui/CustomSelect";
import "../HomeConfig/HomeConfig.css";

const TABS = [
  { id: "general", label: "General", icon: <Settings2 size={15} /> },
  { id: "grid", label: "Grilla y Layout", icon: <LayoutGrid size={15} /> },
  { id: "cards", label: "Tarjetas", icon: <ImageIcon size={15} /> },
  { id: "sidebar", label: "Sidebar y Filtros", icon: <SlidersHorizontal size={15} /> },
  { id: "badges", label: "Etiquetas", icon: <Tag size={15} /> },
  { id: "sections", label: "Secciones", icon: <Eye size={15} /> }
];

const SECTION_KEYS = [
  { key: "catalog_show_search", label: "Buscador", desc: "Campo de bÃºsqueda de productos en el sidebar." },
  { key: "catalog_show_breadcrumbs", label: "Breadcrumbs", desc: "Ruta de navegaciÃ³n (Inicio > CatÃ¡logo > CategorÃ­a)." },
  { key: "catalog_show_categories", label: "Filtro de CategorÃ­as", desc: "Lista jerÃ¡rquica de categorÃ­as en el sidebar." },
  { key: "catalog_show_price_filter", label: "Filtro de Precio", desc: "Campos de precio mÃ­nimo y mÃ¡ximo." },
  { key: "catalog_show_sort", label: "Ordenar por", desc: "Selector de ordenamiento (Recomendados, Precio, Nombre)." },
  { key: "catalog_show_view_toggle", label: "Toggle de Vista", desc: "Botones para alternar entre vista Por Prendas y Por Productos." },
  { key: "catalog_show_image_toggle", label: "Toggle de Imagen", desc: "Botones para alternar entre PresentaciÃ³n y VÃ­vido." },
  { key: "catalog_show_load_more", label: "BotÃ³n Cargar MÃ¡s", desc: "BotÃ³n para cargar mÃ¡s productos al final de la grilla." }
];

export default function ShopCatalogConfig() {
  const isDark = useThemeStore(s => s.isDark);
  const theme = isDark ? "admin-theme-dark" : "admin-theme";
  const [activeTab, setActiveTab] = useState("general");

  // Settings State
  const [settings, setSettings] = useState({});
  const [dirty, setDirty] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Categories State
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);

  const fetchPublicSettings = useShopSettingsStore(s => s.fetchSettings);

  useEffect(() => {
    fetchSettings();
    fetchCategoriesList();
  }, []);

  const fetchCategoriesList = async () => {
    try {
      setLoadingCats(true);
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      toast.error("Error al cargar categorÃ­as");
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

  const setSetting = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
    setDirty(prev => new Set(prev).add(key));
  };

  const handleSaveSettings = async () => {
    if (dirty.size === 0) return;
    setSaving(true);
    try {
      for (const key of Array.from(dirty)) {
        await updateSystemSetting(key, { value: settings[key], category: 'Catalog_page_config' });
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

  // Loading state
  if (loadingSettings) {
    return (
      <div className={`${theme} hc-style-1`}>
        <div className="hc-style-2">
          <div className="w-8 h-8 rounded-full border-2 animate-spin hc-style-3" />
          <span className="hc-style-4">Cargando configuraciÃ³nâ€¦</span>
        </div>
      </div>
    );
  }

  // Render a toggle switch
  const ToggleSwitch = ({ value, onChange }) => {
    const active = value === undefined || String(value) !== "0";
    return (
      <button
        type="button"
        onClick={() => onChange(active ? "0" : "1")}
        style={{
          position: 'relative', width: '44px', height: '24px', borderRadius: '12px',
          border: 'none', cursor: 'pointer', flexShrink: 0,
          background: active ? 'var(--color-success, #48bb78)' : 'var(--border-color)',
          transition: 'background 0.2s'
        }}
      >
        <span style={{
          position: 'absolute', top: '3px', width: '18px', height: '18px',
          borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'left 0.2s', left: active ? '23px' : '3px'
        }} />
      </button>
    );
  };

  // Render a color picker with text input
  const ColorPicker = ({ label, settingKey, defaultValue }) => (
    <label className="hc-style-17">
      <span className="hc-style-18">{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="color"
          value={settings[settingKey] || defaultValue}
          onChange={e => setSetting(settingKey, e.target.value)}
          style={{ width: '40px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }}
        />
        <input
          type="text"
          value={settings[settingKey] || defaultValue}
          onChange={e => setSetting(settingKey, e.target.value)}
          className="hc-style-19"
          style={{ flex: 1 }}
        />
      </div>
    </label>
  );

  return (
    <div className={`${theme} hc-style-5`}>
      <div className="hc-style-6">
        {/* HEADER */}
        <div className="hc-style-7">
          <div className="hc-style-8">
            <div className="hc-style-9">
              <ShoppingBag size={18} />
            </div>
            <h1 className="hc-style-10">ConfiguraciÃ³n del CatÃ¡logo (Shop)</h1>
          </div>
          <p className="hc-style-11">
            Personaliza el diseÃ±o, la grilla, las tarjetas, los filtros y las etiquetas de la pÃ¡gina de catÃ¡logo de la tienda online.
          </p>
        </div>

        {/* TABS */}
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

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            TAB: GENERAL
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === "general" && (
          <div>
            {/* TÃ­tulo de la PÃ¡gina */}
            <div className="hc-style-14">
              <h3 className="hc-style-15">Textos de la PÃ¡gina</h3>
              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">TÃ­tulo Principal</span>
                  <input
                    type="text"
                    value={settings.catalog_title ?? "CatÃ¡logo"}
                    onChange={e => setSetting("catalog_title", e.target.value)}
                    className="hc-style-19"
                    placeholder="CatÃ¡logo"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Texto del Breadcrumb Inicio</span>
                  <input
                    type="text"
                    value={settings.catalog_breadcrumb_home ?? "Inicio"}
                    onChange={e => setSetting("catalog_breadcrumb_home", e.target.value)}
                    className="hc-style-19"
                    placeholder="Inicio"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Placeholder del Buscador</span>
                  <input
                    type="text"
                    value={settings.catalog_search_placeholder ?? "Buscar producto..."}
                    onChange={e => setSetting("catalog_search_placeholder", e.target.value)}
                    className="hc-style-19"
                    placeholder="Buscar producto..."
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Texto del BotÃ³n "Cargar MÃ¡s"</span>
                  <input
                    type="text"
                    value={settings.catalog_load_more_text ?? "Cargar MÃ¡s"}
                    onChange={e => setSetting("catalog_load_more_text", e.target.value)}
                    className="hc-style-19"
                    placeholder="Cargar MÃ¡s"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Texto "Sin resultados"</span>
                  <input
                    type="text"
                    value={settings.catalog_empty_text ?? "No se encontraron elementos."}
                    onChange={e => setSetting("catalog_empty_text", e.target.value)}
                    className="hc-style-19"
                    placeholder="No se encontraron elementos."
                  />
                </label>
              </div>
            </div>

            {/* Comportamiento por Defecto */}
            <div className="hc-style-14">
              <h3 className="hc-style-15">Comportamiento por Defecto</h3>
              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">Vista por Defecto</span>
                  <CustomSelect
                    value={settings.catalog_default_view || "prendas"}
                    onChange={e => setSetting("catalog_default_view", e.target.value)}
                  >
                    <option value="prendas">Por Prendas (desglosado por colores)</option>
                    <option value="producto">Por Productos (agrupado)</option>
                  </CustomSelect>
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Modo de Imagen por Defecto</span>
                  <CustomSelect
                    value={settings.catalog_default_image_mode || "presentacion"}
                    onChange={e => setSetting("catalog_default_image_mode", e.target.value)}
                  >
                    <option value="presentacion">PresentaciÃ³n (imagen principal)</option>
                    <option value="vivido">VÃ­vido (imagen alternativa / puesta)</option>
                  </CustomSelect>
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Ordenamiento por Defecto</span>
                  <CustomSelect
                    value={settings.catalog_default_sort || "recomendados"}
                    onChange={e => setSetting("catalog_default_sort", e.target.value)}
                  >
                    <option value="recomendados">Recomendados (orden del backend)</option>
                    <option value="price_asc">Precio: Menor a Mayor</option>
                    <option value="price_desc">Precio: Mayor a Menor</option>
                    <option value="name_asc">Nombre: A - Z</option>
                  </CustomSelect>
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Productos por PÃ¡gina (carga inicial)</span>
                  <input
                    type="number"
                    min="4"
                    max="48"
                    value={settings.catalog_products_per_page ?? 12}
                    onChange={e => setSetting("catalog_products_per_page", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Productos adicionales al "Cargar MÃ¡s"</span>
                  <input
                    type="number"
                    min="4"
                    max="48"
                    value={settings.catalog_load_more_count ?? 12}
                    onChange={e => setSetting("catalog_load_more_count", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
              </div>
            </div>

            {/* Filtro de CategorÃ­as (cuÃ¡les se muestran) */}
            <div className="hc-style-14">
              <h3 className="hc-style-15">CategorÃ­as Visibles en el CatÃ¡logo</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Selecciona quÃ© categorÃ­as estarÃ¡n disponibles en el filtro del catÃ¡logo. Por defecto se muestran todas.
              </p>
              <CustomSelect
                value={settings.catalog_category_filter || "all"}
                onChange={e => setSetting("catalog_category_filter", e.target.value)}
                style={{ marginBottom: '15px' }}
              >
                <option value="all">Mostrar TODAS las categorÃ­as</option>
                <option value="include">SOLO mostrar ciertas categorÃ­as</option>
                <option value="exclude">OCULTAR ciertas categorÃ­as</option>
              </CustomSelect>

              {(settings.catalog_category_filter === 'include' || settings.catalog_category_filter === 'exclude') && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                  {loadingCats ? <span style={{ fontSize: '12px' }}>Cargando categorÃ­as...</span> : categories.map(cat => {
                    let selectedCats = [];
                    try {
                      selectedCats = JSON.parse(settings.catalog_visible_categories || "[]");
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
                          setSetting("catalog_visible_categories", JSON.stringify(newSelected));
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
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            TAB: GRILLA Y LAYOUT
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === "grid" && (
          <div>
            <div className="hc-style-14">
              <h3 className="hc-style-15">Columnas de la Grilla</h3>
              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">Columnas en Desktop (â‰¥1025px)</span>
                  <CustomSelect
                    value={settings.catalog_grid_cols_desktop || "3"}
                    onChange={e => setSetting("catalog_grid_cols_desktop", e.target.value)}
                  >
                    <option value="2">2 columnas</option>
                    <option value="3">3 columnas</option>
                    <option value="4">4 columnas</option>
                  </CustomSelect>
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Columnas en Tablet (769px â€“ 1024px)</span>
                  <CustomSelect
                    value={settings.catalog_grid_cols_tablet || "2"}
                    onChange={e => setSetting("catalog_grid_cols_tablet", e.target.value)}
                  >
                    <option value="2">2 columnas</option>
                    <option value="3">3 columnas</option>
                  </CustomSelect>
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Columnas en MÃ³vil (â‰¤768px)</span>
                  <CustomSelect
                    value={settings.catalog_grid_cols_mobile || "2"}
                    onChange={e => setSetting("catalog_grid_cols_mobile", e.target.value)}
                  >
                    <option value="1">1 columna</option>
                    <option value="2">2 columnas</option>
                  </CustomSelect>
                </label>
              </div>
            </div>

            <div className="hc-style-14">
              <h3 className="hc-style-15">Espaciado</h3>
              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">SeparaciÃ³n entre Tarjetas (Gap) â€” px</span>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={settings.catalog_grid_gap ?? 24}
                    onChange={e => setSetting("catalog_grid_gap", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Ancho del Sidebar (px)</span>
                  <input
                    type="number"
                    min="150"
                    max="350"
                    value={settings.catalog_sidebar_width ?? 220}
                    onChange={e => setSetting("catalog_sidebar_width", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">SeparaciÃ³n Sidebar â†” Grilla (px)</span>
                  <input
                    type="number"
                    min="10"
                    max="80"
                    value={settings.catalog_sidebar_gap ?? 40}
                    onChange={e => setSetting("catalog_sidebar_gap", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Ancho MÃ¡ximo del Contenedor (px)</span>
                  <input
                    type="number"
                    min="900"
                    max="1920"
                    value={settings.catalog_max_width ?? 1280}
                    onChange={e => setSetting("catalog_max_width", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
              </div>
            </div>

            {/* Preview de la grilla */}
            <div className="hc-style-14">
              <h3 className="hc-style-15">PrevisualizaciÃ³n del Grid</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Vista aproximada de cÃ³mo se verÃ¡ la grilla con la configuraciÃ³n actual (Desktop).
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${settings.catalog_grid_cols_desktop || 3}, 1fr)`,
                gap: `${settings.catalog_grid_gap ?? 24}px`,
                background: 'var(--bg-overlay)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                {Array.from({ length: parseInt(settings.catalog_grid_cols_desktop || 3) * 2 }).map((_, i) => (
                  <div key={i} style={{
                    aspectRatio: settings.catalog_card_aspect_ratio || '1 / 1',
                    background: settings.catalog_card_bg || '#f5f5f5',
                    borderRadius: `${settings.catalog_card_border_radius ?? 8}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: '1px dashed var(--border-color)'
                  }}>
                    <ImageIcon size={20} style={{ opacity: 0.3, marginBottom: '4px' }} />
                    Producto {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            TAB: TARJETAS
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === "cards" && (
          <div>
            <div className="hc-style-14">
              <h3 className="hc-style-15">Imagen del Producto</h3>
              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">ProporciÃ³n de Imagen (Aspect Ratio)</span>
                  <CustomSelect
                    value={settings.catalog_card_aspect_ratio || "1 / 1"}
                    onChange={e => setSetting("catalog_card_aspect_ratio", e.target.value)}
                  >
                    <option value="1 / 1">Cuadrada (1:1)</option>
                    <option value="3 / 4">Vertical (3:4)</option>
                    <option value="4 / 5">Alta (4:5)</option>
                    <option value="2 / 3">MÃ¡s Alta (2:3)</option>
                    <option value="4 / 3">Horizontal (4:3)</option>
                  </CustomSelect>
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Ajuste de Imagen (Object Fit)</span>
                  <CustomSelect
                    value={settings.catalog_card_object_fit || "contain"}
                    onChange={e => setSetting("catalog_card_object_fit", e.target.value)}
                  >
                    <option value="contain">Contener (contain) â€” sin recorte</option>
                    <option value="cover">Cubrir (cover) â€” puede recortar</option>
                    <option value="fill">Rellenar (fill) â€” puede deformar</option>
                  </CustomSelect>
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Redondeo de Bordes de Imagen (px)</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={settings.catalog_card_border_radius ?? 8}
                    onChange={e => setSetting("catalog_card_border_radius", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
              </div>
            </div>

            <div className="hc-style-14">
              <h3 className="hc-style-15">Colores de la Tarjeta</h3>
              <div className="hc-style-16">
                <ColorPicker label="Color de Fondo de Imagen" settingKey="catalog_card_bg" defaultValue="#f5f5f5" />
                <ColorPicker label="Color del Nombre del Producto" settingKey="catalog_card_name_color" defaultValue="#000000" />
                <ColorPicker label="Color del Precio" settingKey="catalog_card_price_color" defaultValue="#000000" />
                <ColorPicker label="Color del Precio Tachado" settingKey="catalog_card_price_old_color" defaultValue="#9ca3af" />
              </div>
            </div>

            <div className="hc-style-14">
              <h3 className="hc-style-15">TipografÃ­a</h3>
              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">TamaÃ±o del Nombre (px)</span>
                  <input
                    type="number"
                    min="10"
                    max="24"
                    value={settings.catalog_card_name_size ?? 13}
                    onChange={e => setSetting("catalog_card_name_size", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Peso del Nombre (font-weight)</span>
                  <CustomSelect
                    value={settings.catalog_card_name_weight || "400"}
                    onChange={e => setSetting("catalog_card_name_weight", e.target.value)}
                  >
                    <option value="300">Ligero (300)</option>
                    <option value="400">Normal (400)</option>
                    <option value="500">Medio (500)</option>
                    <option value="600">Semi-Negrita (600)</option>
                    <option value="700">Negrita (700)</option>
                  </CustomSelect>
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">TamaÃ±o del Precio (px)</span>
                  <input
                    type="number"
                    min="10"
                    max="24"
                    value={settings.catalog_card_price_size ?? 14}
                    onChange={e => setSetting("catalog_card_price_size", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">LÃ­neas MÃ¡ximas del Nombre</span>
                  <CustomSelect
                    value={settings.catalog_card_name_lines || "2"}
                    onChange={e => setSetting("catalog_card_name_lines", e.target.value)}
                  >
                    <option value="1">1 lÃ­nea</option>
                    <option value="2">2 lÃ­neas</option>
                    <option value="3">3 lÃ­neas</option>
                    <option value="none">Sin lÃ­mite</option>
                  </CustomSelect>
                </label>
              </div>
            </div>

            <div className="hc-style-14">
              <h3 className="hc-style-15">Swatches de Color</h3>
              <div className="hc-style-16">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span className="hc-style-21">Mostrar Swatches de Color</span>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      PequeÃ±os cÃ­rculos de color debajo del precio.
                    </p>
                  </div>
                  <ToggleSwitch
                    value={settings.catalog_show_swatches}
                    onChange={val => setSetting("catalog_show_swatches", val)}
                  />
                </div>
                <label className="hc-style-17">
                  <span className="hc-style-18">MÃ¡ximo Swatches Visibles</span>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={settings.catalog_max_swatches ?? 5}
                    onChange={e => setSetting("catalog_max_swatches", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">TamaÃ±o de Swatch (px)</span>
                  <input
                    type="number"
                    min="8"
                    max="24"
                    value={settings.catalog_swatch_size ?? 13}
                    onChange={e => setSetting("catalog_swatch_size", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
              </div>
            </div>

            <div className="hc-style-14">
              <h3 className="hc-style-15">BotÃ³n "AÃ±adir RÃ¡pido"</h3>
              <div className="hc-style-16">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span className="hc-style-21">Mostrar BotÃ³n de AÃ±adir RÃ¡pido</span>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      BotÃ³n circular con Ã­cono de bolsa para agregar rÃ¡pido.
                    </p>
                  </div>
                  <ToggleSwitch
                    value={settings.catalog_show_quick_add}
                    onChange={val => setSetting("catalog_show_quick_add", val)}
                  />
                </div>
                <label className="hc-style-17">
                  <span className="hc-style-18">TamaÃ±o del BotÃ³n (px)</span>
                  <input
                    type="number"
                    min="24"
                    max="50"
                    value={settings.catalog_quick_add_size ?? 34}
                    onChange={e => setSetting("catalog_quick_add_size", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            TAB: SIDEBAR Y FILTROS
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === "sidebar" && (
          <div>
            <div className="hc-style-14">
              <h3 className="hc-style-15">TÃ­tulo de Secciones del Sidebar</h3>
              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">TÃ­tulo de "CategorÃ­as"</span>
                  <input
                    type="text"
                    value={settings.catalog_sidebar_categories_title ?? "CategorÃ­as"}
                    onChange={e => setSetting("catalog_sidebar_categories_title", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Texto "Todas las CategorÃ­as"</span>
                  <input
                    type="text"
                    value={settings.catalog_sidebar_all_categories ?? "Todas las CategorÃ­as"}
                    onChange={e => setSetting("catalog_sidebar_all_categories", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">TÃ­tulo de "Precio"</span>
                  <input
                    type="text"
                    value={settings.catalog_sidebar_price_title ?? "Precio (Bs)"}
                    onChange={e => setSetting("catalog_sidebar_price_title", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">TÃ­tulo de "Ordenar por"</span>
                  <input
                    type="text"
                    value={settings.catalog_sidebar_sort_title ?? "Ordenar por"}
                    onChange={e => setSetting("catalog_sidebar_sort_title", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
              </div>
            </div>

            <div className="hc-style-14">
              <h3 className="hc-style-15">Opciones de Ordenamiento</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Selecciona quÃ© opciones de ordenamiento estarÃ¡n disponibles para el usuario.
              </p>
              {[
                { key: "catalog_sort_show_recomendados", label: "Recomendados", defaultVal: "1" },
                { key: "catalog_sort_show_price_asc", label: "Precio: Menor a Mayor", defaultVal: "1" },
                { key: "catalog_sort_show_price_desc", label: "Precio: Mayor a Menor", defaultVal: "1" },
                { key: "catalog_sort_show_name_asc", label: "Nombre: A - Z", defaultVal: "1" }
              ].map(opt => (
                <div key={opt.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{opt.label}</span>
                  <ToggleSwitch
                    value={settings[opt.key] ?? opt.defaultVal}
                    onChange={val => setSetting(opt.key, val)}
                  />
                </div>
              ))}
            </div>

            <div className="hc-style-14">
              <h3 className="hc-style-15">Textos de los Toggles de Vista</h3>
              <div className="hc-style-16">
                <label className="hc-style-17">
                  <span className="hc-style-18">Texto "Por Prendas"</span>
                  <input
                    type="text"
                    value={settings.catalog_label_prendas ?? "Por Prendas"}
                    onChange={e => setSetting("catalog_label_prendas", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Texto "Por Productos"</span>
                  <input
                    type="text"
                    value={settings.catalog_label_productos ?? "Por Productos"}
                    onChange={e => setSetting("catalog_label_productos", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Texto "PresentaciÃ³n"</span>
                  <input
                    type="text"
                    value={settings.catalog_label_presentacion ?? "PresentaciÃ³n"}
                    onChange={e => setSetting("catalog_label_presentacion", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Texto "VÃ­vido"</span>
                  <input
                    type="text"
                    value={settings.catalog_label_vivido ?? "VÃ­vido"}
                    onChange={e => setSetting("catalog_label_vivido", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            TAB: ETIQUETAS (BADGES)
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === "badges" && (
          <div>
            {/* Badge Descuento */}
            <div className="hc-style-14">
              <h3 className="hc-style-15">Etiqueta de Descuento</h3>
              <div className="hc-style-16">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="hc-style-21">Mostrar Etiqueta de Descuento</span>
                  <ToggleSwitch
                    value={settings.catalog_badge_show_discount}
                    onChange={val => setSetting("catalog_badge_show_discount", val)}
                  />
                </div>
                <ColorPicker label="Color de Fondo" settingKey="catalog_badge_discount_bg" defaultValue="#000000" />
                <ColorPicker label="Color de Texto" settingKey="catalog_badge_discount_text" defaultValue="#ffffff" />
                <label className="hc-style-17">
                  <span className="hc-style-18">TamaÃ±o de Fuente (px)</span>
                  <input
                    type="number"
                    min="8"
                    max="20"
                    value={settings.catalog_badge_discount_size ?? 14}
                    onChange={e => setSetting("catalog_badge_discount_size", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <label className="hc-style-17">
                  <span className="hc-style-18">Redondeo (px)</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={settings.catalog_badge_discount_radius ?? 4}
                    onChange={e => setSetting("catalog_badge_discount_radius", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
              </div>
            </div>

            {/* Badge Nuevo */}
            <div className="hc-style-14">
              <h3 className="hc-style-15">Etiqueta "Nuevo"</h3>
              <div className="hc-style-16">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="hc-style-21">Mostrar Etiqueta "Nuevo"</span>
                  <ToggleSwitch
                    value={settings.catalog_badge_show_new}
                    onChange={val => setSetting("catalog_badge_show_new", val)}
                  />
                </div>
                <label className="hc-style-17">
                  <span className="hc-style-18">Texto de la Etiqueta</span>
                  <input
                    type="text"
                    value={settings.catalog_badge_new_text ?? "Nuevo"}
                    onChange={e => setSetting("catalog_badge_new_text", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <ColorPicker label="Color de Fondo" settingKey="catalog_badge_new_bg" defaultValue="#eab308" />
                <ColorPicker label="Color de Texto" settingKey="catalog_badge_new_text_color" defaultValue="#ffffff" />
              </div>
            </div>

            {/* Badge Agotado */}
            <div className="hc-style-14">
              <h3 className="hc-style-15">Etiqueta "Agotado"</h3>
              <div className="hc-style-16">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="hc-style-21">Mostrar Etiqueta "Agotado"</span>
                  <ToggleSwitch
                    value={settings.catalog_badge_show_soldout}
                    onChange={val => setSetting("catalog_badge_show_soldout", val)}
                  />
                </div>
                <label className="hc-style-17">
                  <span className="hc-style-18">Texto de la Etiqueta</span>
                  <input
                    type="text"
                    value={settings.catalog_badge_soldout_text ?? "Agotado"}
                    onChange={e => setSetting("catalog_badge_soldout_text", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <ColorPicker label="Color de Fondo" settingKey="catalog_badge_soldout_bg" defaultValue="#ef4444" />
                <ColorPicker label="Color de Texto" settingKey="catalog_badge_soldout_text_color" defaultValue="#ffffff" />
              </div>
            </div>

            {/* Badge Conjunto */}
            <div className="hc-style-14">
              <h3 className="hc-style-15">Etiqueta "Conjunto"</h3>
              <div className="hc-style-16">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span className="hc-style-21">Mostrar Etiqueta "Conjunto"</span>
                  <ToggleSwitch
                    value={settings.catalog_badge_show_bundle}
                    onChange={val => setSetting("catalog_badge_show_bundle", val)}
                  />
                </div>
                <label className="hc-style-17">
                  <span className="hc-style-18">Texto de la Etiqueta</span>
                  <input
                    type="text"
                    value={settings.catalog_badge_bundle_text ?? "Conjunto"}
                    onChange={e => setSetting("catalog_badge_bundle_text", e.target.value)}
                    className="hc-style-19"
                  />
                </label>
                <ColorPicker label="Color de Fondo" settingKey="catalog_badge_bundle_bg" defaultValue="#111111" />
                <ColorPicker label="Color de Texto" settingKey="catalog_badge_bundle_text_color" defaultValue="#ffffff" />
              </div>
            </div>

            {/* Preview de badges */}
            <div className="hc-style-14">
              <h3 className="hc-style-15">PrevisualizaciÃ³n de Etiquetas</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '20px', background: 'var(--bg-overlay)', borderRadius: '8px' }}>
                {(settings.catalog_badge_show_discount === undefined || String(settings.catalog_badge_show_discount) !== "0") && (
                  <div style={{
                    backgroundColor: settings.catalog_badge_discount_bg || '#000',
                    color: settings.catalog_badge_discount_text || '#fff',
                    fontSize: `${settings.catalog_badge_discount_size ?? 14}px`,
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: `${settings.catalog_badge_discount_radius ?? 4}px`,
                    letterSpacing: '0.05em'
                  }}>
                    - Bs 50.00
                  </div>
                )}
                {(settings.catalog_badge_show_new === undefined || String(settings.catalog_badge_show_new) !== "0") && (
                  <div style={{
                    backgroundColor: settings.catalog_badge_new_bg || '#eab308',
                    color: settings.catalog_badge_new_text_color || '#fff',
                    fontSize: '10px', fontWeight: 700, padding: '4px 8px',
                    borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px'
                  }}>
                    {settings.catalog_badge_new_text ?? "Nuevo"}
                  </div>
                )}
                {(settings.catalog_badge_show_soldout === undefined || String(settings.catalog_badge_show_soldout) !== "0") && (
                  <div style={{
                    backgroundColor: settings.catalog_badge_soldout_bg || '#ef4444',
                    color: settings.catalog_badge_soldout_text_color || '#fff',
                    fontSize: '10px', fontWeight: 700, padding: '4px 8px',
                    borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px'
                  }}>
                    {settings.catalog_badge_soldout_text ?? "Agotado"}
                  </div>
                )}
                {(settings.catalog_badge_show_bundle === undefined || String(settings.catalog_badge_show_bundle) !== "0") && (
                  <div style={{
                    backgroundColor: settings.catalog_badge_bundle_bg || '#111',
                    color: settings.catalog_badge_bundle_text_color || '#fff',
                    fontSize: '10px', fontWeight: 700, padding: '4px 8px',
                    borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px'
                  }}>
                    {settings.catalog_badge_bundle_text ?? "Conjunto"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            TAB: SECCIONES (TOGGLES DE VISIBILIDAD)
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {activeTab === "sections" && (
          <div className="hc-style-141">
            {SECTION_KEYS.map((s, idx) => {
              const active = settings[s.key] === undefined || String(settings[s.key]) !== "0";
              const isLast = idx === SECTION_KEYS.length - 1;
              return (
                <div key={s.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  borderLeft: dirty.has(s.key) ? '3px solid var(--color-primary)' : '3px solid transparent'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {active
                        ? <Eye size={15} style={{ color: 'var(--color-success, #48bb78)' }} />
                        : <EyeOff size={15} style={{ color: 'var(--text-muted)' }} />
                      }
                      <span className="hc-style-21">{s.label}</span>
                      {dirty.has(s.key) && (
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: '#dbeafe', color: '#1d4ed8' }}>
                          Modificado
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', marginLeft: '23px' }}>
                      {s.desc}
                    </p>
                  </div>
                  <ToggleSwitch
                    value={settings[s.key]}
                    onChange={val => setSetting(s.key, val)}
                  />
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          BARRA DE GUARDADO FLOTANTE
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {dirty.size > 0 && (
        <div className="hc-style-147">
          <div className="hc-style-148">
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
              {dirty.size} cambio{dirty.size !== 1 ? "s" : ""} sin guardar
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={fetchSettings}
                style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                  background: 'var(--bg-overlay)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', cursor: 'pointer'
                }}
              >
                Descartar
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  background: saving ? "var(--border-color)" : "var(--color-primary)",
                  color: saving ? "var(--text-muted)" : "var(--color-primary-text)",
                  border: "none"
                }}
              >
                {saving
                  ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin hc-style-151" />
                  : <Save size={15} />
                }
                {saving ? "Guardando..." : "Guardar Todo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
