import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Navigation, MapPin, Search, X, Loader2 } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = "AIzaSyD2GCanK5Gxm26zDyPrKc7MNy7WhAJZK7M";
const LIBRARIES = ['places'];

// Bolivia center as default
const DEFAULT_CENTER = { lat: -16.5, lng: -68.15 };

const MAP_STYLES_DARK = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a9a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9c9cb0' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f0f23' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#252542' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
];

/**
 * Extracts a specific address component from Google's geocode result
 */
function getComponent(components, type, useShort = false) {
  const comp = components?.find(c => c.types.includes(type));
  return comp ? (useShort ? comp.short_name : comp.long_name) : '';
}

/**
 * Parses a Google Geocoder result into our address form fields
 */
function parseGeocodeResult(result) {
  const comps = result.address_components || [];
  const street_number = getComponent(comps, 'street_number');
  const route = getComponent(comps, 'route');
  const sublocality = getComponent(comps, 'sublocality_level_1') ||
                      getComponent(comps, 'sublocality') ||
                      getComponent(comps, 'neighborhood');
  const locality = getComponent(comps, 'locality');
  const admin1 = getComponent(comps, 'administrative_area_level_1');
  const country = getComponent(comps, 'country');

  const street = [route, street_number].filter(Boolean).join(' ') ||
                 result.formatted_address?.split(',')[0] || '';

  return {
    street: street.trim(),
    zone: sublocality.trim(),
    city: locality.trim(),
    state: admin1.trim(),
    country: country.trim() || 'Bolivia',
  };
}

/**
 * AddressMapPicker
 *
 * Props:
 *   onAddressSelect(fields): called when user picks a location
 *     fields = { lat, lng, street, zone, city, state, country }
 *   initialLat, initialLng: pre-existing marker (for edit mode)
 *   isDark: apply dark map style
 */
export default function AddressMapPicker({ onAddressSelect, initialLat, initialLng, isDark = true }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-address-picker',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [marker, setMarker] = useState(
    initialLat && initialLng ? { lat: Number(initialLat), lng: Number(initialLng) } : null
  );
  const [mapCenter, setMapCenter] = useState(
    initialLat && initialLng
      ? { lat: Number(initialLat), lng: Number(initialLng) }
      : DEFAULT_CENTER
  );
  const [zoom, setZoom] = useState(initialLat && initialLng ? 16 : 12);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const autocompleteRef = useRef(null);
  const geocoderRef = useRef(null);

  // Initialize geocoder once maps is loaded
  useEffect(() => {
    if (isLoaded && window.google) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  const reverseGeocode = useCallback((latLng) => {
    if (!geocoderRef.current) return;
    setGeocoding(true);
    setStatusMsg('Obteniendo dirección...');
    geocoderRef.current.geocode({ location: latLng }, (results, status) => {
      setGeocoding(false);
      if (status === 'OK' && results[0]) {
        const parsed = parseGeocodeResult(results[0]);
        setStatusMsg('✓ Dirección cargada');
        onAddressSelect({
          lat: latLng.lat,
          lng: latLng.lng,
          ...parsed,
        });
        setTimeout(() => setStatusMsg(''), 2500);
      } else {
        setStatusMsg('No se pudo obtener la dirección. Llena los campos manualmente.');
        onAddressSelect({ lat: latLng.lat, lng: latLng.lng });
      }
    });
  }, [onAddressSelect]);

  const handleMapClick = useCallback((e) => {
    const latLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarker(latLng);
    reverseGeocode(latLng);
  }, [reverseGeocode]);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatusMsg('Tu navegador no soporta geolocalización.');
      return;
    }
    setLocating(true);
    setStatusMsg('Obteniendo tu ubicación...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMarker(latLng);
        setMapCenter(latLng);
        setZoom(17);
        setLocating(false);
        reverseGeocode(latLng);
      },
      (err) => {
        setLocating(false);
        setStatusMsg('No se pudo obtener tu ubicación. Asegúrate de dar permisos.');
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [reverseGeocode]);

  const handleAutocompleteLoad = useCallback((autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;

    const latLng = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
    setMarker(latLng);
    setMapCenter(latLng);
    setZoom(17);

    const parsed = parseGeocodeResult(place);
    setStatusMsg('✓ Dirección cargada');
    onAddressSelect({ lat: latLng.lat, lng: latLng.lng, ...parsed });
    setTimeout(() => setStatusMsg(''), 2500);
  }, [onAddressSelect]);

  const handleClearMarker = useCallback(() => {
    setMarker(null);
    setStatusMsg('');
    onAddressSelect({ lat: null, lng: null });
  }, [onAddressSelect]);

  if (loadError) {
    return (
      <div style={{ padding: '16px', color: 'var(--color-danger, #ef4444)', fontSize: '13px' }}>
        Error cargando Google Maps. Verifica tu conexión o la clave API.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
        <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
        Cargando mapa...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Search bar + geolocate button */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{
            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none'
          }} />
          <Autocomplete
            onLoad={handleAutocompleteLoad}
            onPlaceChanged={handlePlaceChanged}
            options={{ componentRestrictions: { country: 'bo' }, fields: ['geometry', 'address_components', 'formatted_address'] }}
          >
            <input
              type="text"
              placeholder="Busca una dirección o lugar..."
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </Autocomplete>
        </div>

        {/* Geolocation button */}
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={locating}
          title="Usar mi ubicación actual"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            border: '1px solid var(--border-color)', background: 'var(--bg-input)',
            color: 'var(--text-main)', cursor: locating ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0, opacity: locating ? 0.7 : 1,
          }}
        >
          {locating
            ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
            : <Navigation size={14} />
          }
          <span className="map-geolocate-label">Mi ubicación</span>
        </button>

        {/* Clear marker button */}
        {marker && (
          <button
            type="button"
            onClick={handleClearMarker}
            title="Quitar marcador"
            style={{
              display: 'flex', alignItems: 'center', padding: '8px',
              borderRadius: '8px', border: '1px solid var(--border-color)',
              background: 'var(--bg-input)', color: 'var(--text-muted)', cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Status message */}
      {(statusMsg || geocoding) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '12px', color: geocoding ? 'var(--text-muted)' : 'var(--color-success, #10b981)',
          padding: '4px 0',
        }}>
          {geocoding && <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />}
          {statusMsg}
        </div>
      )}

      {/* Map */}
      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '260px' }}
          center={mapCenter}
          zoom={zoom}
          onClick={handleMapClick}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'cooperative',
            styles: isDark ? MAP_STYLES_DARK : [],
          }}
        >
          {marker && (
            <Marker
              position={marker}
              animation={window.google?.maps?.Animation?.DROP}
            />
          )}
        </GoogleMap>
      </div>

      {/* Helper hint */}
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <MapPin size={11} />
        Toca o haz clic en el mapa para marcar tu dirección exacta
      </p>
    </div>
  );
}
