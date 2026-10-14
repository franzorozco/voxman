import { API_BASE_URL, URL_BASE_IMG } from '../config/api';

export const getImageUrl = (url) => {
  if (!url) {
    const theme = localStorage.getItem("dashboardTheme");
    return theme === "dark" 
      ? "/system/not-found/image_not_found_black.jfif"
      : "/system/not-found/image_not_found_white.jfif";
  }
  if (url.startsWith('http')) return url;

  let cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  
  return URL_BASE_IMG + '/' + cleanUrl;
};

/**
 * Obtener la URL relativa de la imagen de una variante de producto.
 * Sigue la jerarquía estándar de Voxman:
 * 1. Imagen unitaria de la variante (variant_images)
 * 2. Imagen por color/atributo (attribute_value_images coincidente con variant_attribute_values)
 * 3. Imagen principal del producto (product_images)
 * 4. Fallback a imágenes de atributo o producto
 */
export const getVariantImage = (variant) => {
  if (!variant) return null;

  // 1. Imagen unitaria de la variante
  if (variant.variant_images && variant.variant_images.length > 0) {
    const v = variant.variant_images[0];
    if (v.url || v.image_path) return v.url || v.image_path;
  }

  // 2. Imagen por color / atributo (coincidiendo attribute_value_id)
  if (variant.variant_attribute_values?.length > 0 && variant.product?.attribute_value_images?.length > 0) {
    for (const vav of variant.variant_attribute_values) {
      const colorImage = variant.product.attribute_value_images.find(
        img => img.attribute_value_id === vav.attribute_value_id
      );
      if (colorImage && (colorImage.url || colorImage.image_path)) {
        return colorImage.url || colorImage.image_path;
      }
    }
  }

  // 3. Fallback a imagen del producto (priorizando is_main)
  if (variant.product?.product_images && variant.product.product_images.length > 0) {
    const mainImg = variant.product.product_images.find(img => img.is_main) || variant.product.product_images[0];
    if (mainImg && (mainImg.url || mainImg.image_path)) {
      return mainImg.url || mainImg.image_path;
    }
  }

  // 4. Fallback a cualquier imagen de atributo del producto
  if (variant.product?.attribute_value_images && variant.product.attribute_value_images.length > 0) {
    const anyAttr = variant.product.attribute_value_images.find(img => img.is_main) || variant.product.attribute_value_images[0];
    if (anyAttr && (anyAttr.url || anyAttr.image_path)) {
      return anyAttr.url || anyAttr.image_path;
    }
  }

  // 5. Fallback a main_image en producto o variant.image
  if (variant.product?.main_image) return variant.product.main_image;
  if (variant.image) return variant.image;

  return null;
};

/**
 * Obtener la URL completa y lista para <img src="..." /> de la variante
 */
export const getVariantImageUrl = (variant) => {
  const rawUrl = getVariantImage(variant);
  return getImageUrl(rawUrl);
};

