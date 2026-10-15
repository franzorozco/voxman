import { API_BASE_URL, URL_BASE_IMG } from '../config/api';

export const getImageUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return null;
  }
  const clean = url.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('blob:') || clean.startsWith('data:')) {
    return clean;
  }

  let cleanUrl = clean.startsWith('/') ? clean.substring(1) : clean;
  
  return URL_BASE_IMG + '/' + cleanUrl;
};

/**
 * Obtener la URL relativa o completa de la imagen de una variante de producto.
 * Sigue la jerarquía estándar de Voxman:
 * 1. Imagen unitaria de la variante (variant_images)
 * 2. Imagen por color/atributo (attribute_value_images coincidente con variant_attribute_values)
 * 3. Imagen principal del producto (product_images)
 * 4. Fallback a imágenes de atributo o producto
 */
export const getVariantImage = (variant) => {
  if (!variant) return null;

  // Si ya tiene una imagen directa asignada (string)
  if (typeof variant.image === 'string' && variant.image.trim()) {
    return variant.image.trim();
  }
  if (typeof variant.image_url === 'string' && variant.image_url.trim()) {
    return variant.image_url.trim();
  }
  if (typeof variant.url === 'string' && variant.url.trim()) {
    return variant.url.trim();
  }

  // 1. Imagen unitaria de la variante
  if (variant.variant_images && variant.variant_images.length > 0) {
    const v = variant.variant_images[0];
    if (v.url || v.image_path) return v.url || v.image_path;
  }

  // 2. Imagen por color / atributo (coincidiendo attribute_value_id)
  const attrImages = variant.product?.attribute_value_images || variant.attribute_value_images;
  if (variant.variant_attribute_values?.length > 0 && attrImages?.length > 0) {
    for (const vav of variant.variant_attribute_values) {
      const colorImages = attrImages.filter(
        img => img.attribute_value_id === vav.attribute_value_id
      );
      if (colorImages.length > 0) {
        const colorImg = colorImages.find(img => img.is_main) || colorImages[0];
        if (colorImg && (colorImg.url || colorImg.image_path)) {
          return colorImg.url || colorImg.image_path;
        }
      }
    }
  }

  // 3. Fallback a imagen del producto (priorizando is_main)
  const prodImages = variant.product?.product_images || variant.product_images;
  if (prodImages && prodImages.length > 0) {
    const mainImg = prodImages.find(img => img.is_main) || prodImages[0];
    if (mainImg && (mainImg.url || mainImg.image_path)) {
      return mainImg.url || mainImg.image_path;
    }
  }

  // 4. Fallback a cualquier imagen de atributo del producto
  if (attrImages && attrImages.length > 0) {
    const anyAttr = attrImages.find(img => img.is_main) || attrImages[0];
    if (anyAttr && (anyAttr.url || anyAttr.image_path)) {
      return anyAttr.url || anyAttr.image_path;
    }
  }

  // 5. Fallback a main_image en producto
  if (variant.product?.main_image) return variant.product.main_image;
  if (variant.product?.image) return variant.product.image;

  return null;
};

/**
 * Obtener la URL completa y lista para <img src="..." /> de la variante
 */
export const getVariantImageUrl = (variant) => {
  const rawUrl = getVariantImage(variant);
  if (!rawUrl) return null;
  return getImageUrl(rawUrl);
};
