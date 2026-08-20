import React from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = "AIzaSyD2GCanK5Gxm26zDyPrKc7MNy7WhAJZK7M";

export default function GoogleMapWrapper({
  mapContainerStyle = { width: '100%', height: '300px' },
  center,
  zoom = 13,
  onClick,
  options = { disableDefaultUI: true, zoomControl: true },
  children,
  loadingElement = <span style={{ color: 'var(--text-muted)' }}>Cargando mapa...</span>
}) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  if (!isLoaded) return loadingElement;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      onClick={onClick}
      options={options}
    >
      {children}
    </GoogleMap>
  );
}
