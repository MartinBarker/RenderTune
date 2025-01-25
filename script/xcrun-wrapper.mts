// eslint-disable-line unicorn/filename-case
/* eslint-disable no-console */
import { execa } from 'execa';
import { readFile } from 'node:fs/promises';

// Get arguments from the command line
const [filePath, apiKeyId, apiIssuer, bundleId] = process.argv.slice(2);


console.log('filePath:', filePath);
console.log('apiKeyId:', apiKeyId);
console.log('apiIssuer:', apiIssuer);
console.log('bundleId:', bundleId);

if (!filePath || !apiKeyId || !apiIssuer || !bundleId) {
  console.error('Usage: npx tsx xcrun-wrapper.mts <filePath> <apiKeyId> <apiIssuer> <bundleId>');
  process.exit(1);
}

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url)) as unknown as string
);

console.log('Using version', packageJson.version);
const packageVersion = packageJson.version;

async function runAttempt() {
  // Command arguments for altool
  const xcrunArgs = [
    'altool',
    '--output-format', 'json',
    '--upload-package', filePath,
    '--type', 'macos',
    '--apiKey', "K64CXD596U",
    '--apiIssuer', "4c2a4671-9948-4fd3-be20-5c84c40be346",
  ];

  console.log('Running command: xcrun', xcrunArgs.join(' '));

  try {
    const { stdout } = await execa('xcrun', xcrunArgs);
    console.log('Upload succeeded:', stdout);
    return false; // No retry needed
  } catch (err) {
    if (err instanceof Error) {
      console.error('Upload failed:', err.message);

      if ('stdout' in err && typeof err.stdout === 'string') {
        console.error('Error details:', err.stdout);
      }
    }
    throw err; // Rethrow other errors
  }
}

const maxRetries = 3;

async function run() {
  for (let i = 0; i < maxRetries; i += 1) {
    const wantRetry = await runAttempt();
    if (!wantRetry) return; // Success
    console.log('Retrying in 1 second...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('Gave up after retries.');
  process.exitCode = 1;
}

await run();
