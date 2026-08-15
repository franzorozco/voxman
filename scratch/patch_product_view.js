const fs = require('fs');
const path = 'Frontend/src/pages/dashboard/pages/Products/ProductViewModal.jsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `
                        const variantAttrIds = variant.variant_attribute_values?.map(v => String(v.attribute_value_id)) || [];
                        let displayImageUrl = variant.variant_images?.[0]?.url;
                        if (!displayImageUrl && product.attribute_value_images) {
                          const colorImg = product.attribute_value_images.find(img => variantAttrIds.includes(String(img.attribute_value_id)) && img.is_main) 
                                        || product.attribute_value_images.find(img => variantAttrIds.includes(String(img.attribute_value_id)));
                          if (colorImg) displayImageUrl = colorImg.url;
                        }
                        if (!displayImageUrl) displayImageUrl = primaryImage;

                        const totalStock = variant.inventories?.reduce((acc, inv) => acc + (inv.stock || inv.quantity || 0), 0) || 0;
                        return (
                          <tr key={variant.id || vIndex}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {displayImageUrl ? (
                                  <img 
                                    src={getImageUrl(displayImageUrl)} 
                                    style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                                  />
`;

content = content.replace(
  /const totalStock = variant\.inventories\?\.reduce\(\(acc, inv\) => acc \+ \(inv\.stock \|\| inv\.quantity \|\| 0\), 0\) \|\| 0;\s*return \(\s*<tr key=\{variant\.id \|\| vIndex\}>\s*<td>\s*<div style=\{\{ display: 'flex', alignItems: 'center', gap: '12px' \}\}>\s*\{variant\.variant_images\?\.\[0\] \? \(\s*<img\s*src=\{getImageUrl\(variant\.variant_images\[0\]\.url\)\}\s*style=\{\{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var\(--border-color\)' \}\}\s*\/>/s,
  replacement
);

fs.writeFileSync(path, content);
console.log("Patched ProductViewModal.jsx");
