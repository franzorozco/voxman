const fs = require('fs');
const path = 'Frontend/src/pages/dashboard/pages/Products/ProductForm.jsx';
let content = fs.readFileSync(path, 'utf8');

// The handleGenerateVariants replacements
content = content.replace(
  /size_id: combo\.size_id \|\| null,/g,
  `size_id: combo.size_id || undefined,`
);

content = content.replace(
  /fit_id: combo\.fit_id \|\| "",/g,
  `fit_id: combo.fit_id || undefined,`
);

// The useEffect API load replacements
content = content.replace(
  /size_id: v\.size_id \|\| "",/g,
  `size_id: v.size_id || undefined,`
);

content = content.replace(
  /fit_id: v\.fit_id \|\| "",/g,
  `fit_id: v.fit_id || undefined,`
);

fs.writeFileSync(path, content);
console.log("Fixed API mapping to undefined.");
