import React, { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, Image, EyeOff, Eye, Save, RefreshCw, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { getSystemSettings, updateSystemSetting } from "../../../../api/admin/systemSettings";
import { getVariantImages } from "../../../../api/admin/homeConfig";
import { getImageUrl } from "../../../../utils/imageUtils";
import { useThemeStore } from "../../../../store/themeStore";

const TABS = [
  { id: "hero",     label: "Hero",      icon: <Image size={15} /> },
  { id: "sections", label: "Secciones", icon: <LayoutDashboard size={15} /> },
];

const SECTION_KEYS = [
  { key: "home_show_hero",       label: "Hero (banner principal)",     desc: "La seccion con las imagenes y el titulo de bienvenida." },
  { key: "home_show_featured",   label: "Productos Destacados",         desc: "Grilla de productos marcados como destacados." },
  { key: "home_show_categories", label: "Categorias",                   desc: "Grilla de categorias de productos." },
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

  /* heroImages = array parsed from JSON setting */
  const heroImages = (() => {
    try { return JSON.parse(settings.home_hero_images || "[]"); } catch { return []; }
  })();

  /* ── Fetch settings ── */
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
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-main)" }}>Configuracion de Inicio</h1>
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
              {t.icon} {t.label}
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
                  <Image size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
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
                        // save index being dragged in dataTransfer or a local state? 
                        // HTML5 dnd is easier with dataTransfer:
                        e.dataTransfer.setData('text/plain', i.toString());
                      }}
                      onDragEnd={(e) => {
                        e.target.style.opacity = '1';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault(); // necessary to allow dropping
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (isNaN(draggedIdx) || draggedIdx === i) return;

                        const current = [...heroImages];
                        const [draggedItem] = current.splice(draggedIdx, 1);
                        current.splice(i, 0, draggedItem);
                        
                        setSetting("home_hero_images", JSON.stringify(current));
                      }}
                      style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "3/4", border: "2px solid var(--color-primary)", cursor: 'grab' }}
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
    </div>
  );
}
