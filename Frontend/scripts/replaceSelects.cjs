const fs = require('fs');
const path = require('path');

const dashboardDir = path.join(__dirname, '../src/pages/dashboard');
const customSelectPath = path.join(__dirname, '../src/components/ui/CustomSelect');

function getRelativeImportPath(fromFile) {
  const fromDir = path.dirname(fromFile);
  let rel = path.relative(fromDir, customSelectPath).replace(/\\/g, '/');
  if (!rel.startsWith('.')) {
    rel = './' + rel;
  }
  return rel;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('<select')) return; // nothing to do

  console.log(`Processing: ${filePath}`);

  // 1. Replace opening and closing tags
  content = content.replace(/<select\b/g, '<CustomSelect');
  content = content.replace(/<\/select>/g, '</CustomSelect>');

  // 2. Remove className="form-control" specifically from <CustomSelect tags
  // This regex looks for <CustomSelect ... className="form-control" ... >
  // Because regex on HTML is tricky, we'll do a simpler approach:
  // Replace `className="form-control"` with ` ` anywhere between `<CustomSelect` and `>`
  // But wait, the file might have other inputs using form-control.
  // Let's use a replacer function.
  
  content = content.replace(/<CustomSelect([^>]+)>/g, (match, inner) => {
    // Remove className="form-control" or className='form-control'
    let newInner = inner.replace(/\bclassName\s*=\s*(['"])form-control\1/g, '');
    
    // Also remove cases where it might be in a template literal like className={`form-control ${something}`}
    // We'll leave those alone for safety, mostly it's just className="form-control"
    
    return `<CustomSelect${newInner}>`;
  });

  // 3. Add import if not exists
  if (!content.includes('CustomSelect')) return; // sanity check
  
  const importStatement = `import CustomSelect from '${getRelativeImportPath(filePath)}';`;
  if (!content.includes(importStatement) && !content.includes('import CustomSelect from')) {
    // Find the last import
    const importRegex = /^import\s+.*?;?\s*$/gm;
    let lastImportIndex = 0;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      lastImportIndex = match.index + match[0].length;
    }
    
    if (lastImportIndex > 0) {
      content = content.slice(0, lastImportIndex) + '\n' + importStatement + content.slice(lastImportIndex);
    } else {
      content = importStatement + '\n' + content;
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

console.log("Starting replacement...");
walkDir(dashboardDir);
console.log("Done!");
