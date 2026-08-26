import React, { useState, useEffect } from 'react';
import { Settings2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSystemSettings, updateSystemSetting } from '../../../../api/admin/systemSettings';
import { useThemeStore } from '../../../../store/themeStore';

export default function SystemSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const isDark = useThemeStore((state) => state.isDark);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSystemSettings();
      setSettings(data);
    } catch (error) {
      toast.error('Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key, newValue) => {
    setSettings(settings.map(s => s.key === key ? { ...s, value: newValue } : s));
  };

  const handleSave = async (setting) => {
    try {
      setSaving({ ...saving, [setting.key]: true });
      
      let payload;
      if (setting.value instanceof File) {
        payload = new FormData();
        payload.append('value_file', setting.value);
      } else {
        payload = { value: setting.value };
      }
      
      await updateSystemSetting(setting.key, payload);
      toast.success('Configuración actualizada');
      fetchSettings(); // Refresh to get the updated URL
    } catch (error) {
      toast.error('Error al actualizar la configuración');
    } finally {
      setSaving({ ...saving, [setting.key]: false });
    }
  };

  if (loading) return <div className="p-6">Cargando configuraciones...</div>;

  return (
    <div className={`p-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      <div className="flex items-center gap-3 mb-6">
        <Settings2 size={28} className="text-blue-500" />
        <h1 className="text-2xl font-bold">Ajustes Globales del Sistema</h1>
      </div>

      <div className="flex flex-col gap-4 max-w-5xl">
        {settings.map((setting) => (
          <div 
            key={setting.key} 
            className={`flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border transition-all ${isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'} shadow-sm gap-4`}
          >
            <div className="flex-1 pr-4">
              <h3 className="text-[16px] font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-2">
                {setting.display_name || setting.key}
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                  {setting.type}
                </span>
              </h3>
              <p className={`text-[14px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {setting.description}
              </p>
              <p className="text-[12px] font-mono text-gray-400 mt-2">
                Llave interna: {setting.key}
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-[45%] lg:w-[40%] shrink-0">
              {setting.type === 'image' ? (
                <div className="flex-1 flex items-center gap-3 w-full">
                  {setting.value && (
                    <img 
                      src={setting.value instanceof File ? URL.createObjectURL(setting.value) : `${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api/v1', '').replace('/api', '')}${setting.value}`} 
                      alt="Setting Preview" 
                      className="w-12 h-12 rounded object-cover border"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleValueChange(setting.key, e.target.files[0])}
                    className={`flex-1 w-full text-[13px] rounded-lg border outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={setting.value || ''}
                  onChange={(e) => handleValueChange(setting.key, e.target.value)}
                  className={`flex-1 w-full p-3 text-[15px] rounded-lg border outline-none transition-all focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${isDark ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`}
                  placeholder="Ingresa un valor..."
                />
              )}
              <button
                onClick={() => handleSave(setting)}
                disabled={saving[setting.key]}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all whitespace-nowrap shadow-sm ${saving[setting.key] ? 'bg-blue-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white hover:shadow-md'}`}
              >
                <Save size={18} className={saving[setting.key] ? 'animate-pulse' : ''} />
                {saving[setting.key] ? 'Guardando' : 'Guardar'}
              </button>
            </div>
          </div>
        ))}

        {settings.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed rounded-2xl border-gray-300 dark:border-gray-700 text-gray-500 flex flex-col items-center justify-center gap-3">
            <Settings2 size={48} className="text-gray-400 opacity-50" />
            <p className="text-lg font-medium">No hay configuraciones registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
