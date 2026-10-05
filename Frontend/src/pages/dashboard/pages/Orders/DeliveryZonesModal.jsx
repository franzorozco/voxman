import React, { useState, useEffect } from 'react';
import { getDeliveryZones, createDeliveryZone, updateDeliveryZone } from '../../../../api/admin/orderNetwork';
import { toast } from 'react-hot-toast';
import { MarkerF } from '@react-google-maps/api';
import GoogleMapWrapper from '../../../../components/ui/GoogleMapWrapper';
import { X, MapPin, Plus, ArrowLeft, Edit3, Globe, Share2, CheckSquare, Square, Copy } from 'lucide-react';
import CustomSelect from '../../../../components/ui/CustomSelect';
import '../Carts/Carts.css';

export default function DeliveryZonesModal({ onClose }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [editMode, setEditMode] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [selectedCities, setSelectedCities] = useState([]);
  
  // Add form state
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    base_cost: '',
    extra_cost_per_km: 0,
    latitude: null,
    longitude: null
  });
  
  const [mapCenter, setMapCenter] = useState({ lat: -16.4897, lng: -68.1193 }); // La Paz default

  const cityCoordinates = {
    "El Alto": { lat: -16.5000, lng: -68.1500 },
    "Centro": { lat: -16.4897, lng: -68.1193 },
    "Cochabamba": { lat: -17.3895, lng: -66.1568 },
    "Santa Cruz": { lat: -17.7833, lng: -63.1821 },
    "La Paz": { lat: -16.4897, lng: -68.1193 },
    "Oruro": { lat: -17.9833, lng: -67.1500 },
    "Potosí": { lat: -19.5836, lng: -65.7531 },
    "Tarija": { lat: -21.5355, lng: -64.7296 },
    "Sucre": { lat: -19.0333, lng: -65.2627 },
    "Beni": { lat: -14.8333, lng: -64.9000 },
    "Pando": { lat: -11.0267, lng: -68.7692 } // Cobija
  };

  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    setFormData({ ...formData, city: selectedCity });
    if (cityCoordinates[selectedCity]) {
      setMapCenter(cityCoordinates[selectedCity]);
    }
  };



  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await getDeliveryZones();
      const fetchedZones = res.data || res;
      setZones(fetchedZones);
      const uniqueCities = [...new Set(fetchedZones.map(z => z.city))];
      setSelectedCities(uniqueCities);
    } catch (error) {
      toast.error('Error al cargar puntos de entrega');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      toast.error("Por favor, selecciona una ubicación en el mapa");
      return;
    }
    
    setLoading(true);
    try {
      if (editMode && currentEditId) {
        await updateDeliveryZone(currentEditId, formData);
        toast.success("Punto de entrega actualizado exitosamente");
      } else {
        await createDeliveryZone(formData);
        toast.success("Punto de entrega creado exitosamente");
      }
      setView('list');
      setEditMode(false);
      setCurrentEditId(null);
      fetchZones();
      setFormData({
        name: '', city: '', base_cost: '', extra_cost_per_km: 0, latitude: null, longitude: null
      });
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || "Error al guardar punto de entrega");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (zone) => {
    setFormData({
      name: zone.name || '',
      city: zone.city || '',
      base_cost: zone.base_cost || '',
      extra_cost_per_km: 0,
      latitude: parseFloat(zone.latitude) || null,
      longitude: parseFloat(zone.longitude) || null
    });
    if (zone.latitude && zone.longitude) {
      setMapCenter({ lat: parseFloat(zone.latitude), lng: parseFloat(zone.longitude) });
    }
    setCurrentEditId(zone.id);
    setEditMode(true);
    setView('add');
  };

  const handleBackToList = () => {
    setView('list');
    setEditMode(false);
    setCurrentEditId(null);
    setFormData({ name: '', city: '', base_cost: '', extra_cost_per_km: 0, latitude: null, longitude: null });
  };

  const generateShareText = () => {
    let text = "🌟 📍 *PUNTOS DE ENTREGA DISPONIBLES* 📍 🌟\n\n";
    
    const grouped = zones.reduce((acc, zone) => {
      if (!acc[zone.city]) acc[zone.city] = [];
      acc[zone.city].push(zone);
      return acc;
    }, {});

    selectedCities.forEach(city => {
      if (grouped[city] && grouped[city].length > 0) {
        text += `🏙️ *${city.toUpperCase()}:*\n`;
        grouped[city].forEach(zone => {
          const costStr = Number(zone.base_cost) > 0 ? ` (Bs. ${Number(zone.base_cost).toFixed(2)} 💵)` : ' (Gratis 🆓)';
          text += `✨ 🔸 ${zone.name}${costStr}\n`;
        });
        text += "\n";
      }
    });
    
    text += "📦 🛵 _¡Hacemos envíos a todos estos puntos!_\n💬 *Escríbenos para coordinar tu entrega.* 👇";
    return text;
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(generateShareText());
    toast.success("¡Texto copiado al portapapeles!");
  };
  
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-wrapper fade-in" style={{ width: '100%', maxWidth: '700px', margin: '0 20px' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {view !== 'list' && (
              <button onClick={handleBackToList} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={22} color="var(--color-primary)" />
              {view === 'list' ? 'Puntos de Entrega' : (view === 'share' ? 'Compartir Puntos' : (editMode ? 'Editar Punto de Entrega' : 'Nuevo Punto de Entrega'))}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-input)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '0 0 16px 16px', maxHeight: '70vh', overflowY: 'auto' }}>
          
          {view === 'list' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '10px' }}>
                <button 
                  className="action-btn" 
                  onClick={() => setView('share')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)' }}
                >
                  <Share2 size={16} /> Compartir
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => setView('add')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none' }}
                >
                  <Plus size={16} /> Agregar Punto
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Cargando...</div>
              ) : zones.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No hay puntos de entrega registrados.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {zones.map(zone => (
                    <div key={zone.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-main)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-main)' }}>{zone.name}</h4>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{zone.city}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Globe size={12} /> {Number(zone.latitude).toFixed(4)}, {Number(zone.longitude).toFixed(4)}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>Bs. {Number(zone.base_cost).toFixed(2)}</div>
                          </div>
                          <button 
                            onClick={() => handleEditClick(zone)}
                            style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-main)' }}
                          >
                            <Edit3 size={12} /> Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {view === 'add' && (
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Nombre del Punto</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej: Zona Norte"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Ciudad</label>
                  <CustomSelect 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                    value={formData.city}
                    onChange={handleCityChange}
                    required
                  >
                    <option value="">Selecciona una ciudad</option>
                    <option value="La Paz">La Paz</option>
                    <option value="El Alto">El Alto</option>
                    <option value="Cochabamba">Cochabamba</option>
                    <option value="Santa Cruz">Santa Cruz</option>
                    <option value="Oruro">Oruro</option>
                    <option value="Potosí">Potosí</option>
                    <option value="Tarija">Tarija</option>
                    <option value="Sucre">Sucre</option>
                    <option value="Beni">Beni</option>
                    <option value="Pando">Pando</option>
                  </CustomSelect>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Costo Base (Bs.)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    className="form-control" 
                    value={formData.base_cost}
                    onChange={(e) => setFormData({...formData, base_cost: e.target.value})}
                    required
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Ubicación en el Mapa</label>
                <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <GoogleMapWrapper
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter}
                    zoom={13}
                    onClick={handleMapClick}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
                      styles: document.body.getAttribute('data-theme') === 'dark' ? [
                        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
                      ] : []
                    }}
                    loadingElement={
                      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)', borderRadius: '12px' }}>
                        Cargando mapa...
                      </div>
                    }
                  >
                    {formData.latitude && formData.longitude && (
                      <MarkerF position={{ lat: formData.latitude, lng: formData.longitude }} />
                    )}
                  </GoogleMapWrapper>
                </div>
                {!formData.latitude && (
                  <span style={{ fontSize: '12px', color: 'var(--color-danger)' }}>* Haz clic en el mapa para marcar la ubicación.</span>
                )}
              </div>

              <div style={{ marginTop: '10px' }}>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                >
                  {loading ? 'Guardando...' : (editMode ? 'Actualizar Punto de Entrega' : 'Guardar Punto de Entrega')}
                </button>
              </div>
            </form>
          )}

          {view === 'share' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-main)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} /> Selecciona las ciudades a incluir:
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {[...new Set(zones.map(z => z.city))].map(city => {
                    const isSelected = selectedCities.includes(city);
                    return (
                      <button
                        key={city}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCities(selectedCities.filter(c => c !== city));
                          } else {
                            setSelectedCities([...selectedCities, city]);
                          }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`, background: isSelected ? 'rgba(79, 70, 229, 0.1)' : 'var(--bg-card)', color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s' }}
                      >
                        {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Previsualización del Mensaje:</label>
                <textarea 
                  readOnly
                  value={generateShareText()}
                  style={{ width: '100%', height: '220px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '14px', resize: 'vertical', outline: 'none', lineHeight: '1.5' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  onClick={handleCopyShare}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <Copy size={16} /> Copiar para Redes
                </button>
                <button 
                  onClick={handleWhatsAppShare}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: '#25D366', color: '#fff' }}
                >
                  <Share2 size={16} /> Enviar por WhatsApp
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
