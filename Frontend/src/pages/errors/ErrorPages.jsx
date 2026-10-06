import React from 'react';
import ErrorPage from './ErrorPage';

export const NotFound = () => (
  <ErrorPage 
    code="404" 
    title="Página no encontrada" 
    description="Lo sentimos, no pudimos encontrar la página que estás buscando. Puede que haya sido movida, eliminada o ya no exista." 
  />
);

export const ServerError = () => (
  <ErrorPage 
    code="500" 
    title="Error interno del servidor" 
    description="Vaya, algo salió mal en nuestros servidores. Estamos trabajando para solucionarlo lo antes posible." 
  />
);

export const NotImplemented = () => (
  <ErrorPage 
    code="501" 
    title="No implementado" 
    description="Esta funcionalidad aún no está disponible en la plataforma. Vuelve pronto para ver las novedades." 
  />
);

export const Maintenance = () => (
  <ErrorPage 
    code="503" 
    title="Servicio no disponible" 
    description="Nuestros servidores están en mantenimiento temporal. Estaremos de vuelta muy pronto." 
    actionText="Recargar página" 
    onAction={() => window.location.reload()} 
  />
);

// Fallback for any other specific error passed by URL
export const GenericError = ({ code = "Error", title = "Ha ocurrido un problema", description = "Hemos encontrado un error inesperado. Por favor, intenta de nuevo más tarde." }) => (
  <ErrorPage 
    code={code} 
    title={title} 
    description={description} 
  />
);
