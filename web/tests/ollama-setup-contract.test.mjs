import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);

test('Ollama bootstrap is opt-in and preserves deterministic fallback messaging', async () => {
  const [unix, windows, readme] = await Promise.all([
    readFile(new URL('scripts/setup-ollama.sh', root), 'utf8'),
    readFile(new URL('scripts/setup-ollama.ps1', root), 'utf8'),
    readFile(new URL('README.md', root), 'utf8'),
  ]);
  assert.match(unix, /Continue with installation\? \[y\/N\]/);
  assert.match(windows, /Install Ollama with winget now\? \[y\/N\]/);
  assert.match(unix, /ollama pull "\$MODEL"/);
  assert.match(windows, /ollama pull \$Model/);
  assert.match(unix, /SATARK deterministic analysis still works without Ollama/);
  assert.match(windows, /deterministic fallback still works/i);
  assert.match(readme, /browser or server hosted on Vercel cannot reach/i);
});

test('bootstrap scripts use the official Ollama distribution and default to a modest model', async () => {
  const [unix, windows] = await Promise.all([
    readFile(new URL('scripts/setup-ollama.sh', root), 'utf8'),
    readFile(new URL('scripts/setup-ollama.ps1', root), 'utf8'),
  ]);
  assert.match(unix, /https:\/\/ollama\.com\/install\.sh/);
  assert.match(unix, /SATARK_OLLAMA_MODEL:-qwen2\.5:3b/);
  assert.match(windows, /Ollama\.Ollama/);
  assert.match(windows, /qwen2\.5:3b/);
});
