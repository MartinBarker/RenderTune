// eslint-disable-line unicorn/filename-case
import path from 'path';
import sharp from 'sharp';
import icongenRaw from 'icon-gen';
import fs from 'fs';

// Handle __dirname in ES Modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Fix for Windows paths (remove leading slash)
const resolvedDirname = path.resolve(__dirname.replace(/^\/([a-zA-Z]:)/, '$1'));

const icongen = icongenRaw;

const svg2png = (from, to, width, height) => {
  return sharp(from)
    .png()
    .resize(width, height, {
      fit: sharp.fit.contain,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toFile(to);
};

const main = async () => {
  // Base paths
  const baseInputPath = path.join(resolvedDirname, '../build/svg');
  const baseOutputPath = path.join(resolvedDirname, '../icon-build');
  const baseWindowsPath = path.join(resolvedDirname, '../build-resources/appx');

  // Source files
  const srcIcon = path.join(baseInputPath, 'RenderTuneLogoCircle.svg');
  const macIcon = path.join(baseInputPath, 'RenderTuneLogoCircle.svg');

  // Ensure output directories exist
  fs.mkdirSync(baseOutputPath, { recursive: true });
  fs.mkdirSync(baseWindowsPath, { recursive: true });

  // Linux:
  await svg2png(srcIcon, path.join(baseOutputPath, 'app-512.png'), 512, 512);

  // Windows Store
  await svg2png(srcIcon, path.join(baseWindowsPath, 'StoreLogo.png'), 50, 50);
  await svg2png(srcIcon, path.join(baseWindowsPath, 'Square150x150Logo.png'), 300, 300);
  await svg2png(srcIcon, path.join(baseWindowsPath, 'Square44x44Logo.png'), 44, 44);
  await svg2png(srcIcon, path.join(baseWindowsPath, 'Wide310x150Logo.png'), 620, 300);

  // MacOS:
  await icongen(macIcon, baseOutputPath, {
    icns: { sizes: [512, 1024] },
    report: false,
  });

  // Windows ICO:
  await icongen(srcIcon, baseOutputPath, {
    ico: { sizes: [16, 24, 32, 40, 48, 64, 96, 128, 256, 512] },
    report: false,
  });
};

// Run the main function
main().catch((err) => {
  console.error('Error during icon generation:', err);
});
