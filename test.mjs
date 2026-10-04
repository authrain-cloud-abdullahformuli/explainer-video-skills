import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const UPSTREAM = ['iart-ai', 'iart.ai', 'fuyunfei'];
const TEXT_EXTS = new Set(['.md', '.json', '.html', '.sh', '.yml', '.yaml', '.txt', '.css', '.js', '.mjs']);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules' || entry === 'test.mjs') continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) results.push(...walk(full));
    else if (TEXT_EXTS.has(extname(full))) results.push(full);
  }
  return results;
}

console.log('\n🔍 Explainer Video Skills — Verification Suite\n');

// 1. No upstream references
console.log('📝 Upstream cleanliness');
const files = walk(ROOT);
for (const f of files) {
  const content = readFileSync(f, 'utf8');
  const rel = f.replace(ROOT + '/', '');
  for (const term of UPSTREAM) {
    test(`${rel} has no "${term}"`, () => {
      assert(!content.toLowerCase().includes(term.toLowerCase()),
        `Found "${term}" in ${rel}`);
    });
  }
}

// 2. Required files exist
console.log('\n📦 Required files');
const required = ['LICENSE', 'README.md', 'CITATION.cff', 'MAINTAINERS.md'];
for (const f of required) {
  test(`${f} exists`, () => {
    assert(statSync(join(ROOT, f)).isFile(), `Missing ${f}`);
  });
}

// 3. LICENSE contains Abdullah Formuli
console.log('\n🔐 License check');
const license = readFileSync(join(ROOT, 'LICENSE'), 'utf8');
test('LICENSE mentions Abdullah Formuli', () => {
  assert(license.includes('Abdullah Formuli'), 'Missing Abdullah Formuli in LICENSE');
});

// 4. Skills exist
console.log('\n🎬 Skills check');
const expectedSkills = ['explainer-video', 'wrapped-video', 'diagram-animation', 'whiteboard-animation', 'isometric-animation'];
for (const skill of expectedSkills) {
  test(`skills/${skill}/SKILL.md exists`, () => {
    assert(statSync(join(ROOT, 'skills', skill, 'SKILL.md')).isFile(), `Missing skills/${skill}/SKILL.md`);
  });
}

// 5. Plugin config points to correct repo
console.log('\n🔌 Plugin config');
const plugin = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
test('plugin.json author is Abdullah Formuli', () => {
  assert(plugin.author.name === 'Abdullah Formuli', `Author is ${plugin.author.name}`);
});
test('plugin.json repository points to authrain-cloud-abdullahformuli', () => {
  assert(plugin.repository.includes('authrain-cloud-abdullahformuli'), `Repo is ${plugin.repository}`);
});

// 6. Scripts exist
console.log('\n🛠️  Scripts check');
const expectedScripts = ['contact-sheet.sh', 'probe-mp4.sh', 'seek-shot.sh'];
for (const s of expectedScripts) {
  test(`scripts/${s} exists`, () => {
    assert(statSync(join(ROOT, 'scripts', s)).isFile(), `Missing scripts/${s}`);
  });
}

console.log(`\n${'═'.repeat(50)}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
