const fs = require('fs');

function fixUseClient(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Clean out any existing "use client"; and Karakter3DPreview imports
  content = content.split('\n').filter(line => !line.includes('"use client"') && !line.includes('import Karakter3DPreview')).join('\n');
  // Prepend "use client"; and the import
  content = '"use client";\nimport Karakter3DPreview from "@/components/Karakter3DPreview";\n' + content;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed "use client" in:', filePath);
}

fixUseClient('src/components/KartuProfil.tsx');
fixUseClient('src/components/TambahKarakter.tsx');
