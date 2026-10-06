// Assembles npm packages from built Rust binaries:
//   packages/server              — @gildforge/server umbrella (launcher)
//   packages/server-<os>-<cpu>   — @gildforge/server-<os>-<cpu> with bin/gild-server
// Expects binaries at dist/<os>-<cpu>/gild-server (from CI artifacts or local
// cargo build copied there).
import { mkdirSync, writeFileSync, copyFileSync, chmodSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Version source of truth is Cargo.toml; package.json is private plumbing.
const ROOT = new URL('..', import.meta.url).pathname
const version = readFileSync(join(ROOT, 'Cargo.toml'), 'utf8').match(/^version = "([^"]+)"/m)[1]
const pkg = { version }
const TARGETS = ['darwin-arm64', 'darwin-x64', 'linux-x64']

rmSync(join(ROOT, 'packages'), { recursive: true, force: true })

for (const t of TARGETS) {
  const bin = join(ROOT, 'dist', t, 'gild-server')
  if (!existsSync(bin)) { console.error(`missing dist/${t}/gild-server`); process.exit(1) }
  const dir = join(ROOT, 'packages', `server-${t}`)
  mkdirSync(join(dir, 'bin'), { recursive: true })
  copyFileSync(bin, join(dir, 'bin', 'gild-server'))
  chmodSync(join(dir, 'bin', 'gild-server'), 0o755)
  const [os, cpu] = t.split('-')
  writeFileSync(join(dir, 'package.json'), JSON.stringify({
    name: `@gildforge/server-${t}`,
    version: pkg.version,
    description: `gild server binary (${os} ${cpu})`,
    os: [os],
    cpu: [cpu],
    files: ['bin'],
    license: 'MIT',
    publishConfig: { access: 'public' },
  }, null, 2) + '\n')
  console.log(`assembled @gildforge/server-${t}`)
}

const launcher = `#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
const require = createRequire(import.meta.url)
const pkg = \`@gildforge/server-\${process.platform}-\${process.arch}\`
let bin
try { bin = join(dirname(require.resolve(pkg + '/package.json')), 'bin', 'gild-server') }
catch { console.error(\`gild-server: no binary for \${process.platform}-\${process.arch} (tried \${pkg})\`); process.exit(1) }
const { status } = spawnSync(bin, process.argv.slice(2), { stdio: 'inherit' })
process.exit(status ?? 1)
`

const main = join(ROOT, 'packages', 'server')
mkdirSync(join(main, 'bin'), { recursive: true })
writeFileSync(join(main, 'bin', 'gild-server.js'), launcher)
chmodSync(join(main, 'bin', 'gild-server.js'), 0o755)
writeFileSync(join(main, 'package.json'), JSON.stringify({
  name: '@gildforge/server',
  version: pkg.version,
  description: 'gild server — the self-hosted forge backend',
  type: 'module',
  bin: { 'gild-server': 'bin/gild-server.js' },
  files: ['bin'],
  license: 'MIT',
  publishConfig: { access: 'public' },
  optionalDependencies: Object.fromEntries(TARGETS.map((t) => [`@gildforge/server-${t}`, pkg.version])),
}, null, 2) + '\n')
console.log('assembled @gildforge/server')
