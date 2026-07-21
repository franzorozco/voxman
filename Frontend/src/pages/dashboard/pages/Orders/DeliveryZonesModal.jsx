import React, { useState, useEffect } from 'react';
import { getDeliveryZones, createDeliveryZone, updateDeliveryZone } from '../../../../api/admin/orderNetwork';
import { toast } from 'react-hot-toast';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { X, MapPin, Plus, ArrowLeft, Edit3, Globe } from 'lucide-react';
import '../Carts/Carts.css';

export default function DeliveryZonesModal({ onClose }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [editMode, setEditMode] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  
  // Add form state
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    base_cost: '',
    extra_cost_per_km: '',
    latitude: null,
    longitude: null
  });
  
  const [mapCenter, setMapCenter] = useState({ lat: -17.3895, lng: -66.1568 }); // Cochabamba default

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyD2GCanK5Gxm26zDyPrKc7MNy7WhAJZK7M"
  });

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await getDeliveryZones();
      setZones(res.data || res);
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
        name: '', city: '', base_cost: '', extra_cost_per_km: '', latitude: null, longitude: null
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
      extra_cost_per_km: zone.extra_cost_per_km || '',
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
    setFormData({ name: '', city: '', base_cost: '', extra_cost_per_km: '', latitude: null, longitude: null });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-wrapper fade-in" style={{ width: '100%', maxWidth: '700px', margin: '0 20px' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {view === 'add' && (
              <button onClick={handleBackToList} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={22} color="var(--color-primary)" />
              {view === 'list' ? 'Puntos de Entrega' : (editMode ? 'Editar Punto de Entrega' : 'Nuevo Punto de Entrega')}
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
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
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>+ Bs. {Number(zone.extra_cost_per_km).toFixed(2)}/km</div>
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
                    style={{ padding: '12px', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Ciudad</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej: Cochabamba"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    required
                    style={{ padding: '12px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                    style={{ padding: '12px', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Costo Extra por Km (Bs.)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    className="form-control" 
                    value={formData.extra_cost_per_km}
                    onChange={(e) => setFormData({...formData, extra_cost_per_km: e.target.value})}
                    required
                    style={{ padding: '12px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Ubicación en el Mapa</label>
                {isLoaded ? (
                  <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <GoogleMap
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
                    >
                      {formData.latitude && formData.longitude && (
                        <MarkerF position={{ lat: formData.latitude, lng: formData.longitude }} />
                      )}
                    </GoogleMap>
                  </div>
                ) : (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)', borderRadius: '12px' }}>
                    Cargando mapa...
                  </div>
                )}
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

        </div>
      </div>
    </div>
  );
}
