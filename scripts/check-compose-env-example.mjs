import { readFile } from 'node:fs/promises';

const compose = await readFile(new URL('../docker-compose.local.yml', import.meta.url), 'utf8');
const example = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
const configuredKeys = new Set(
  example.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => line.slice(0, line.indexOf('=')).trim()),
);
const composeKeys = new Set(
  [...compose.matchAll(/\$\{([A-Z][A-Z0-9_]*)[^}]*\}/g)].map((match) => match[1]),
);
const missing = [...composeKeys].filter((key) => !configuredKeys.has(key)).sort();
if (missing.length) {
  console.error('Missing variables in root .env.example:', missing.join(', '));
  process.exitCode = 1;
} else {
  console.log(`Environment template covers all ${composeKeys.size} Docker Compose variable references.`);
}
