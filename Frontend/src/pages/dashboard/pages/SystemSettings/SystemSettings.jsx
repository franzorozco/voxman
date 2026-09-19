import { getImageUrl } from '../../../../utils/imageUtils';
import React, { useState, useEffect, useRef } from 'react';
import { Settings2, Save, Image, Type, Hash, ToggleLeft, Link2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSystemSettings, updateSystemSetting } from '../../../../api/admin/systemSettings';
import { useThemeStore } from '../../../../store/themeStore';

const TYPE_ICONS = {
  image:   <Image   size={13} />,
  string:  <Type    size={13} />,
  integer: <Hash    size={13} />,
  boolean: <ToggleLeft size={13} />,
  url:     <Link2   size={13} />,
};

const TYPE_LABELS = {
  image:   'Imagen',
  string:  'Texto',
  integer: 'Número',
  boolean: 'Booleano',
  url:     'URL',
};

export default function SystemSettings() {
  const [settings, setSettings]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [dirtyFields, setDirtyFields] = useState(new Set());
  const isDark = useThemeStore((state) => state.isDark);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSystemSettings();
      setSettings(data);
      setDirtyFields(new Set());
    } catch {
      toast.error('Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key, newValue) => {
    setSettings(settings.map(s => s.key === key ? { ...s, value: newValue } : s));
    setDirtyFields(prev => new Set(prev).add(key));
  };

  const handleSaveAll = async () => {
    if (dirtyFields.size === 0) return;
    try {
      setIsSavingAll(true);
      const updates = Array.from(dirtyFields).map(async (key) => {
        const setting = settings.find(s => s.key === key);
        let payload;
        if (setting.value instanceof File) {
          payload = new FormData();
          payload.append('value_file', setting.value);
        } else {
          payload = { value: setting.value };
        }
        return updateSystemSetting(key, payload);
      });
      await Promise.all(updates);
      toast.success('Todos los cambios guardados correctamente');
      fetchSettings(); // Refresh to get the updated URLs for images
    } catch {
      toast.error('Ocurrió un error al guardar algunos cambios');
    } finally {
      setIsSavingAll(false);
    }
  };

  // Group settings by category
  const grouped = settings.reduce((acc, s) => {
    const cat = s.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const categoryOrder = ['Apariencia', 'General', 'Pagos y Pedidos', 'Entregas', 'Redes Sociales', 'Avanzado'];
  const orderedGroups = Object.entries(grouped).sort((a, b) => {
    let indexA = categoryOrder.indexOf(a[0]);
    let indexB = categoryOrder.indexOf(b[0]);
    if (indexA === -1) indexA = 99;
    if (indexB === -1) indexB = 99;
    return indexA - indexB;
  });

  const theme = isDark ? 'admin-theme-dark' : 'admin-theme';

  if (loading) {
    return (
      <div className={`${theme} flex items-center justify-center h-64`} style={{ background: 'var(--bg-main)', color: 'var(--text-muted)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
          <span className="text-sm">Cargando configuraciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={theme} style={{ background: 'var(--bg-main)', minHeight: '100%', color: 'var(--text-main)' }}>
      <div className="max-w-4xl mx-auto p-6 md:p-8 pb-28">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-text)' }}>
              <Settings2 size={18} />
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
              Configuración del Sistema
            </h1>
          </div>
          <p className="mt-1 text-sm ml-12" style={{ color: 'var(--text-muted)' }}>
            Administra los parámetros globales de tu plataforma
          </p>
        </div>

        {/* ── Grouped Settings ── */}
        {orderedGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
            <Settings2 size={40} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No hay configuraciones registradas</p>
          </div>
        ) : (
          orderedGroups.map(([category, items]) => (
            <div key={category} className="mb-8">
              {/* Category label */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {category}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
              </div>

              {/* Setting rows */}
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
                {items.map((setting, idx) => (
                  <SettingRow
                    key={setting.key}
                    setting={setting}
                    isDark={isDark}
                    isDirty={dirtyFields.has(setting.key)}
                    isLast={idx === items.length - 1}
                    onChange={(val) => handleValueChange(setting.key, val)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Floating Save Bar ── */}
      {dirtyFields.size > 0 && (
        <div 
          className="fixed bottom-0 left-0 right-0 p-4 border-t flex justify-center z-50 transition-all duration-300"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}
        >
          <div className="w-full max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                Tienes {dirtyFields.size} cambio{dirtyFields.size !== 1 ? 's' : ''} sin guardar
              </span>
              <span className="text-xs hidden md:inline-block" style={{ color: 'var(--text-muted)' }}>
                Recuerda guardarlos.
              </span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => fetchSettings()}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors"
                style={{ background: 'var(--bg-overlay)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
              >
                Descartar
              </button>
              <button
                onClick={handleSaveAll}
                disabled={isSavingAll}
                className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all"
                style={{
                  background: isSavingAll ? 'var(--border-color)' : 'var(--color-primary)',
                  color: isSavingAll ? 'var(--text-muted)' : 'var(--color-primary-text)',
                  cursor: isSavingAll ? 'not-allowed' : 'pointer',
                }}
              >
                {isSavingAll ? (
                  <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin inline-block"
                    style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} />
                ) : (
                  <Save size={16} />
                )}
                {isSavingAll ? 'Guardando...' : 'Guardar Todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────
   Single Setting Row
──────────────────────────────────────── */
function SettingRow({ setting, isDark, isDirty, isLast, onChange }) {
  const fileRef = useRef(null);
  const previewSrc = setting.value instanceof File
    ? URL.createObjectURL(setting.value)
    : (setting.value && setting.value !== '0' ? getImageUrl(setting.value) : null);

  return (
    <div
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
        background: isDirty ? 'var(--bg-overlay)' : 'var(--bg-card)',
        borderLeft: isDirty ? '3px solid var(--color-primary)' : '3px solid transparent'
      }}
      className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 transition-all"
    >
      {/* ── Left: label + description ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-main)' }}>
            {setting.display_name || setting.key}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
          >
            {TYPE_ICONS[setting.type] || <Type size={11} />}
            {TYPE_LABELS[setting.type] || setting.type}
          </span>
          {isDirty && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 ml-2">
              Modificado
            </span>
          )}
        </div>
        {setting.description && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {setting.description}
          </p>
        )}
      </div>

      {/* ── Right: control ── */}
      <div className="flex items-center justify-end gap-2 sm:w-[52%] shrink-0">
        {setting.type === 'image' ? (
          <ImageField
            previewSrc={previewSrc}
            fileRef={fileRef}
            onChange={onChange}
            isDark={isDark}
          />
        ) : setting.type === 'boolean' ? (
          <BooleanField value={setting.value} onChange={onChange} />
        ) : (
          <TextInput value={setting.value || ''} onChange={onChange} isDark={isDark} />
        )}
      </div>
    </div>
  );
}

/* ── Image Field ── */
function ImageField({ previewSrc, fileRef, onChange, isDark }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      {/* Preview thumbnail */}
      <div
        className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-color)' }}
      >
        {previewSrc
          ? <img src={previewSrc} alt="preview" className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
          : <Image size={16} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
        }
      </div>

      {/* Custom file button */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-main)',
        }}
      >
        <Upload size={13} />
        Subir imagen
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files[0])}
      />
    </div>
  );
}

/* ── Text Input ── */
function TextInput({ value, onChange, isDark }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Ingresar valor..."
      className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg outline-none transition-all"
      style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-main)',
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--border-focus)'; }}
      onBlur={e  => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

/* ── Boolean Toggle ── */
function BooleanField({ value, onChange }) {
  const active = value === 'true' || value === true || value === 1 || value === '1';
  return (
    <button
      type="button"
      onClick={() => onChange(active ? 'false' : 'true')}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
      style={{ background: active ? 'var(--color-success)' : 'var(--border-color)' }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: active ? 'translateX(22px)' : 'translateX(4px)' }}
      />
    </button>
  );
}


