// Script pour corriger automatiquement les routes avec l'ancien format de paramètres
// Usage: node fix-route-params.js

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const routeFiles = glob.sync('app/api/**/[*]/route.ts', { cwd: __dirname });

let fixedCount = 0;

routeFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Pattern 1: type RouteParams = { params: { id: string }; };
  if (content.includes('params: { id: string }') && !content.includes('params: Promise<{ id: string }>')) {
    content = content.replace(
      /type RouteParams = \{\s*params: \{ id: string \};\s*\};/g,
      'type RouteParams = {\n  params: Promise<{ id: string }>;\n};'
    );
    modified = true;
  }

  // Pattern 2: const missionId = parseInt(params.id);
  if (content.includes('parseInt(params.id)') && !content.includes('resolvedParams')) {
    // Chercher la fonction qui utilise params
    const functionMatch = content.match(/(export async function \w+\([^)]*\{ params \}: RouteParams\))/);
    if (functionMatch) {
      // Ajouter resolvedParams après l'ouverture de la fonction
      content = content.replace(
        /(export async function \w+\([^)]*\{ params \}: RouteParams\)\s*\{[^}]*?try\s*\{)/,
        (match) => {
          if (!match.includes('resolvedParams')) {
            return match.replace('try {', 'try {\n    const resolvedParams = await params;');
          }
          return match;
        }
      );
      
      // Remplacer params.id par resolvedParams.id
      content = content.replace(/parseInt\(params\.id\)/g, 'parseInt(resolvedParams.id)');
      content = content.replace(/params\.id/g, 'resolvedParams.id');
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    fixedCount++;
  }
});

console.log(`\n✨ Fixed ${fixedCount} files`);

