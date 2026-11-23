import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = fileURLToPath(new URL('../../', import.meta.url));
const landing = join(frontend, 'dist');
const output = join(landing, 'pages');
const management = process.argv[2];
if (!management) throw new Error('Expected the directory containing the management build.');

async function copyBuild(source, page) {
  const html = await readFile(join(source, 'index.html'), 'utf8');
  const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[\w.-]+)"/g)].map((match) => match[1]))];
  if (!assets.some((path) => path.endsWith('.js'))) {
    throw new Error(`Missing an entry script in ${source}/index.html`);
  }

  await mkdir(dirname(join(output, page)), { recursive: true });
  await writeFile(join(output, page), html);
  for (const path of assets) {
    await copyFile(join(source, path), join(output, path));
  }
  return assets;
}

await mkdir(join(output, 'assets'), { recursive: true });
await mkdir(join(output, 'restaurant'), { recursive: true });
const landingAssets = await copyBuild(landing, 'index.html');
await copyBuild(resolve(management), 'management/index.html');

const imageFiles = await readdir(join(landing, 'restaurant'), { withFileTypes: true });
const imagePaths = [];
for (const entry of imageFiles) {
  if (!entry.isFile() || !/^[\w-]+\.(webp|avif|png|jpe?g)$/.test(entry.name)) continue;
  const path = join('restaurant', entry.name);
  await copyFile(join(landing, path), join(output, path));
  imagePaths.push('/' + path);
}

const publicPaths = ['/', '/index.html', ...landingAssets, ...imagePaths];
const worker = await readFile(new URL('./worker.mjs', import.meta.url), 'utf8');
await writeFile(join(output, '_worker.js'), `const publicPaths = new Set(${JSON.stringify(publicPaths)});\n${worker}`);
