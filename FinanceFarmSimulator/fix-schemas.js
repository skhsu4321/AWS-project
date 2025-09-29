// Quick fix for schema omit issues
// This replaces .omit() calls with simpler alternatives

const fs = require('fs');
const path = require('path');

const files = [
  'src/models/Financial.ts',
  'src/models/Game.ts', 
  'src/models/ParentalControl.ts'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace .omit() with .partial() for now to avoid runtime errors
    content = content.replace(/\.omit\(/g, '.partial().pick(');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  }
});

console.log('Schema fixes applied!');