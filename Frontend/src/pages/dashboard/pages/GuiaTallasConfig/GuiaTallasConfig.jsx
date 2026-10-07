import "../HomeConfig/HomeConfig.css";
import "./GuiaTallasConfig.css";
import React, { useState, useEffect } from "react";
import { Save, Plus, Trash2, Eye, EyeOff, Ruler, GripVertical, ChevronUp, ChevronDown, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { getSystemSettings, updateSystemSetting } from "../../../../api/admin/systemSettings";
import { useThemeStore } from "../../../../store/themeStore";
import { useShopSettingsStore } from "../../../../store/shop/useShopSettingsStore";
import LabelEditorModal from "./components/LabelEditorModal";

/* ────────────────────────────────────────────
   DEFAULT DATA – matches the current hardcoded page
   ──────────────────────────────────────────── */
const DEFAULT_GARMENTS = [
  {
    id: "tops_long",
    title: "TOPS MANGA LARGA (Polerones, Hoodies, Chaquetas)",
    image: "/assets/img/guia-tallas/top.jpg",
    description: "Coloca tu prenda favorita en una superficie plana y mide de extremo a extremo.",
    visible: true,
    order: 1,
    labels: [
      { text: "Largo", className: "label-largo-top" },
      { text: "Ancho\n(Pecho)", className: "label-ancho-top" },
      { text: "Largo de\nManga", className: "label-manga-top" }
    ]
  },
  {
    id: "tops_short",
    title: "TOPS MANGA CORTA (Camisas, Polos, Poleras)",
    image: "/assets/img/guia-tallas/short_sleeve.jpg",
    description: "Mide el ancho de hombro a hombro, el pecho de axila a axila y el largo total.",
    visible: true,
    order: 2,
    labels: [
      { text: "Hombro", className: "label-hombro-short" },
      { text: "Ancho\n(Pecho)", className: "label-ancho-short" },
      { text: "Largo", className: "label-largo-short" },
      { text: "Manga", className: "label-manga-short" }
    ]
  },
  {
    id: "bottoms",
    title: "BOTTOMS (Pantalones, Jeans, Shorts)",
    image: "/assets/img/guia-tallas/bottom.jpg",
    description: "Mide la cintura de lado a lado y el largo exterior desde la cintura al tobillo.",
    visible: true,
    order: 3,
    labels: [
      { text: "Cintura", className: "label-cintura-bot" },
      { text: "Tiro", className: "label-tiro-bot" },
      { text: "Largo\nTotal", className: "label-largo-bot" }
    ]
  },
  {
    id: "hats",
    title: "ACCESORIOS (Gorros, Sombreros)",
    image: "/assets/img/guia-tallas/hat.jpg",
    description: "Mide el contorno de tu cabeza a la altura de la frente.",
    visible: true,
    order: 4,
    labels: [
      { text: "Circunferencia", className: "label-circ-hat" },
      { text: "Alto", className: "label-alto-hat" }
    ]
  },
  {
    id: "watches",
    title: "RELOJES",
    image: "/assets/img/guia-tallas/watch.jpg",
    description: "El diámetro de la caja te dará una idea de qué tan grande se verá en tu muñeca.",
    visible: true,
    order: 5,
    labels: [
      { text: "Diámetro\nCaja", className: "label-diametro-watch" },
      { text: "Largo Total\n(Correa)", className: "label-largo-watch" }
    ]
  }
];

export default function GuiaTallasConfig() {
  const isDark = useThemeStore(s => s.isDark);
  const theme = isDark ? "admin-theme-dark" : "admin-theme";
  const [settings, setSettings] = useState({});
  const [dirty, setDirty] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [editingLabelsForGarment, setEditingLabelsForGarment] = useState(null);
  const fetchPublicSettings = useShopSettingsStore(s => s.fetchSettings);

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      const data = await getSystemSettings();
      const st = {};
      data.forEach(item => {
        st[item.key] = item.value;
      });
      setSettings(st);
    } catch {
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

  /* ── Garments ── */
  const garments = getArraySetting("size_page_garments", DEFAULT_GARMENTS);

  const updateGarment = (index, field, value) => {
    const next = [...garments];
    next[index] = { ...next[index], [field]: value };
    updateArraySetting("size_page_garments", next);
  };

  const toggleGarmentVisibility = (index) => {
    updateGarment(index, "visible", !garments[index].visible);
  };

  const moveGarment = (index, direction) => {
    const next = [...garments];
    if (direction === "up" && index > 0) {
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      updateArraySetting("size_page_garments", next);
    } else if (direction === "down" && index < garments.length - 1) {
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      updateArraySetting("size_page_garments", next);
    }
  };

  const removeGarment = (index) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta prenda?")) return;
    const next = garments.filter((_, i) => i !== index);
    updateArraySetting("size_page_garments", next);
  };

  const addGarment = () => {
    const next = [...garments, {
      id: `custom_${Date.now()}`,
      title: "NUEVA PRENDA",
      image: "/assets/img/guia-tallas/top.jpg",
      description: "Descripción de cómo medir esta prenda.",
      visible: true,
      order: garments.length + 1,
      labels: [
        { text: "Medida 1", className: "label-largo-top" }
      ]
    }];
    updateArraySetting("size_page_garments", next);
  };

  /* ── Labels ── */
  const addLabel = (garmentIndex) => {
    const next = [...garments];
    next[garmentIndex].labels = [...(next[garmentIndex].labels || []), { text: "Nueva Medida", top: 50, left: 50, className: "" }];
    updateArraySetting("size_page_garments", next);
  };

  const updateLabel = (garmentIndex, labelIndex, field, value) => {
    const next = [...garments];
    next[garmentIndex].labels[labelIndex] = { ...next[garmentIndex].labels[labelIndex], [field]: value };
    updateArraySetting("size_page_garments", next);
  };

  const removeLabel = (garmentIndex, labelIndex) => {
    const next = [...garments];
    next[garmentIndex].labels = next[garmentIndex].labels.filter((_, i) => i !== labelIndex);
    updateArraySetting("size_page_garments", next);
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (dirty.size === 0) return;
    setSaving(true);
    try {
      for (const key of Array.from(dirty)) {
        await updateSystemSetting(key, { value: settings[key], category: 'size_page_config' });
      }
      toast.success("Configuración guardada correctamente");
      setDirty(new Set());
      await fetchPublicSettings(true);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  /* ── LOADING ── */
  if (loadingSettings) {
    return (
      <div className={`${theme} hc-style-1`}>
        <div className="hc-style-2">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin hc-style-3" />
          <span className="hc-style-4">Cargando configuración...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme} hc-style-5`}>
      <div className="hc-style-6">
        {/* HEADER */}
        <div className="hc-style-7">
          <div className="hc-style-8">
            <div className="hc-style-9">
              <Ruler size={18} />
            </div>
            <h1 className="hc-style-10">Configuración Guía de Tallas</h1>
          </div>
          <p className="hc-style-11">
            Personaliza los textos, títulos y la visibilidad de cada prenda en la guía de tallas pública.
          </p>
        </div>

        {/* ══════════════════════════════
             SECCIÓN: TEXTOS PRINCIPALES
         ══════════════════════════════ */}
        <div className="hc-style-14" style={{ marginBottom: 24 }}>
          <h3 className="hc-style-15">Textos Principales</h3>
          <div className="hc-style-16">
            <label className="hc-style-17">
              <span className="hc-style-18">Título de la Página</span>
              <input
                type="text"
                value={settings.size_page_title ?? "GUÍA DE TALLAS"}
                onChange={e => setSetting("size_page_title", e.target.value)}
                className="hc-style-19"
              />
            </label>
            <label className="hc-style-17">
              <span className="hc-style-18">Subtítulo / Descripción</span>
              <textarea
                rows={3}
                value={settings.size_page_subtitle ?? "Cada una de nuestras prendas tiene un corte y caída únicos según su diseño. A continuación, te mostramos cómo medimos nuestras prendas para que puedas compararlas con tu ropa favorita y encontrar tu fit ideal."}
                onChange={e => setSetting("size_page_subtitle", e.target.value)}
                className="hc-style-19"
                style={{ resize: "vertical", minHeight: 60 }}
              />
            </label>
          </div>
        </div>

        {/* ══════════════════════════════
             SECCIÓN: PRENDAS
         ══════════════════════════════ */}
        <div className="hc-style-14">
          <div className="hc-style-20">
            <h3 className="hc-style-15" style={{ margin: 0 }}>Prendas</h3>
            <button onClick={addGarment} className="gtc-add-btn">
              <Plus size={14} /> Agregar Prenda
            </button>
          </div>

          <div className="gtc-garments-list">
            {garments.map((g, idx) => (
              <div key={g.id || idx} className={`gtc-garment-card ${!g.visible ? "gtc-hidden" : ""} ${dirty.has("size_page_garments") ? "" : ""}`}>
                {/* TOP BAR */}
                <div className="gtc-garment-header">
                  <div className="gtc-garment-header-left">
                    <GripVertical size={16} className="gtc-grip" />
                    <div className="gtc-order-btns">
                      <button onClick={() => moveGarment(idx, "up")} disabled={idx === 0} className="gtc-move-btn">
                        <ChevronUp size={14} />
                      </button>
                      <button onClick={() => moveGarment(idx, "down")} disabled={idx === garments.length - 1} className="gtc-move-btn">
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <span className="gtc-garment-title-preview">{g.title || "Sin título"}</span>
                  </div>
                  <div className="gtc-garment-header-right">
                    <button 
                      onClick={() => setEditingLabelsForGarment(idx)} 
                      className="gtc-edit-labels-btn"
                      title="Configurar Etiquetas (Arrastrar y Soltar)"
                    >
                      <Pencil size={14} /> Configurar Etiquetas
                    </button>
                    <button onClick={() => toggleGarmentVisibility(idx)} className={`gtc-vis-btn ${g.visible ? "gtc-vis-active" : ""}`}>
                      {g.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      {g.visible ? "Visible" : "Oculto"}
                    </button>
                    <button onClick={() => removeGarment(idx)} className="gtc-delete-btn">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* BODY */}
                <div className="gtc-garment-body">
                  {/* Preview image */}
                  <div className="gtc-garment-preview">
                    <img src={g.image} alt={g.title} />
                  </div>

                  {/* Fields */}
                  <div className="gtc-garment-fields">
                    <label className="hc-style-17">
                      <span className="hc-style-18">Título</span>
                      <input
                        type="text"
                        value={g.title}
                        onChange={e => updateGarment(idx, "title", e.target.value)}
                        className="hc-style-19"
                      />
                    </label>
                    <label className="hc-style-17">
                      <span className="hc-style-18">URL de Imagen</span>
                      <input
                        type="text"
                        value={g.image}
                        onChange={e => updateGarment(idx, "image", e.target.value)}
                        className="hc-style-19"
                        placeholder="/assets/img/guia-tallas/..."
                      />
                    </label>
                    <label className="hc-style-17">
                      <span className="hc-style-18">Descripción</span>
                      <textarea
                        rows={2}
                        value={g.description}
                        onChange={e => updateGarment(idx, "description", e.target.value)}
                        className="hc-style-19"
                        style={{ resize: "vertical" }}
                      />
                    </label>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════
             FLOATING SAVE BUTTON
         ══════════════════════════════ */}
        {dirty.size > 0 && (
          <div className="gtc-save-bar">
            <span className="gtc-save-count">{dirty.size} cambio{dirty.size > 1 ? "s" : ""} sin guardar</span>
            <button onClick={handleSave} disabled={saving} className="gtc-save-btn">
              <Save size={16} />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        )}
      </div>

      {editingLabelsForGarment !== null && (
        <LabelEditorModal
          garment={garments[editingLabelsForGarment]}
          onClose={() => setEditingLabelsForGarment(null)}
          onSave={(newLabels, productTypeId) => {
            const next = [...garments];
            next[editingLabelsForGarment] = { 
              ...next[editingLabelsForGarment], 
              labels: newLabels,
              product_type_id: productTypeId
            };
            updateArraySetting("size_page_garments", next);
            setEditingLabelsForGarment(null);
          }}
        />
      )}
    </div>
  );
}
