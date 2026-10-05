import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML que viene de la base de datos (p. ej. descripciones de productos)
 * antes de renderizarlo con dangerouslySetInnerHTML.
 *
 * Por quÃ©: el token de sesiÃ³n vive en localStorage, asÃ­ que un <script> o un
 * onerror="..." guardado en una descripciÃ³n podrÃ­a robar la sesiÃ³n de TODOS los
 * clientes que abran ese producto.
 *
 * Permite el formato habitual (negritas, listas, enlaces, saltos de lÃ­nea) y
 * elimina scripts, handlers on*, iframes, estilos y URLs javascript:.
 */
const ALLOWED_TAGS = [
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'a', 'blockquote', 'hr',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'title'];

// Forzar rel seguro en enlaces que abren en otra pestaÃ±a
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export const sanitizeHtml = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
};
