import fs from 'fs-extra';
import path from 'path';

const sourceDir = path.join(process.cwd(), 'locales');
const targetDir = path.join(process.cwd(), 'build-resources', 'locales');

async function copyLocales() {
  try {
    // Ensure target directory exists
    await fs.ensureDir(targetDir);
    
    // Copy locales folder
    await fs.copy(sourceDir, targetDir);
    
    console.log('Locales copied successfully');
  } catch (error) {
    console.error('Error copying locales:', error);
    process.exit(1);
  }
}

copyLocales();
