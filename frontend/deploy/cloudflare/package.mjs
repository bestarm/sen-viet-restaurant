import { copyFile, cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = fileURLToPath(new URL('../../', import.meta.url));
const build = join(frontend, 'dist');
const output = join(build, 'pages');
const html = await readFile(join(build, 'index.html'), 'utf8');
const entryAssets = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[\w.-]+)"/g)].map((match) => match[1]))];
if (!entryAssets.some((path) => path.endsWith('.js'))) {
  throw new Error(`Missing an entry script in ${build}/index.html`);
}

await mkdir(join(output, 'management'), { recursive: true });
await mkdir(join(output, 'restaurant'), { recursive: true });
await writeFile(join(output, 'index.html'), html);
await writeFile(join(output, 'management/index.html'), html);

// Vite emits the lazy-loaded management app separately from the public entry script.
await cp(join(build, 'assets'), join(output, 'assets'), { recursive: true });

const imageFiles = await readdir(join(build, 'restaurant'), { withFileTypes: true });
const imagePaths = [];
for (const entry of imageFiles) {
  if (!entry.isFile() || !/^[\w-]+\.(webp|avif|png|jpe?g)$/.test(entry.name)) continue;
  const path = join('restaurant', entry.name);
  await copyFile(join(build, path), join(output, path));
  imagePaths.push('/' + path);
}

const publicPaths = ['/', '/index.html', ...entryAssets, ...imagePaths];
const worker = await readFile(new URL('./worker.mjs', import.meta.url), 'utf8');
await writeFile(join(output, '_worker.js'), `const publicPaths = new Set(${JSON.stringify(publicPaths)});\n${worker}`);
