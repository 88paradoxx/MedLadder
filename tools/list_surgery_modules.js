const fs = require('fs');

const allModules = JSON.parse(fs.readFileSync('tools/all_740_modules.json', 'utf8'));

// Print all Surgery modules (480-530)
console.log('=== SURGERY MODULES (480-530) ===');
allModules.filter(m => m.moduleId >= 480 && m.moduleId <= 530).forEach(m => {
  console.log(`${m.moduleId}: ${m.moduleName}`);
});

process.exit(0);
