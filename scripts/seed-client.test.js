const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')
const { parseFrontMatter, normalize, seed } = require('./seed-client')

const ROOT = path.resolve(__dirname, '..')
const SCRIPT = path.join(__dirname, 'seed-client.js')

function copyTemplate() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpds-seed-'))
  ;[
    'src/pages/sitedata.md',
    'src/pages/index.md',
    'src/pages/profile.md',
    'src/pages/blog/index.md',
    'src/pages/gallery/index.md',
  ].forEach((relative) => {
    const source = path.join(ROOT, relative)
    const dest = path.join(dir, relative)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(source, dest)
  })
  return dir
}

describe('seed-client', () => {
  test('parses a folded brief and fills every placeholder file', () => {
    const brief = fs.readFileSync(path.join(__dirname, 'client.example.md'), 'utf8')
    const client = normalize(parseFrontMatter(brief).data)
    const root = copyTemplate()
    const current = {
      blog: fs.readFileSync(path.join(root, 'src/pages/blog/index.md'), 'utf8'),
      gallery: fs.readFileSync(path.join(root, 'src/pages/gallery/index.md'), 'utf8'),
    }
    const next = seed(client, current)

    expect(next['src/pages/sitedata.md']).toContain('name: "Jane Smith"')
    expect(next['src/pages/sitedata.md']).toContain('https://www.janesmith.com')
    expect(next['src/pages/index.md']).toContain('Jane Smith is a technology executive')
    expect(next['src/pages/profile.md']).toContain('# Jane Smith')
    expect(next['src/pages/profile.md']).toContain('University of California, Berkeley')
    expect(next['src/pages/blog/index.md']).not.toContain('[Client Full Name]')
    expect(next['src/pages/gallery/index.md']).toContain('Photos and gallery of Jane Smith')
    Object.values(next).forEach((contents) => {
      expect(contents).not.toContain('[Client')
    })
  })

  test('CLI writes files and rejects a brief with no name', () => {
    const root = copyTemplate()
    execFileSync(process.execPath, [SCRIPT, '--input', path.join(__dirname, 'client.example.md'), '--root', root], {
      cwd: ROOT,
    })
    const site = fs.readFileSync(path.join(root, 'src/pages/sitedata.md'), 'utf8')
    expect(site).toContain('jobTitle: "Chief Executive Officer"')
    expect(site).not.toContain('[Client Full Name]')

    const bad = path.join(root, 'bad.md')
    fs.writeFileSync(bad, '---\njobTitle: CEO\n---\n')
    expect(() => execFileSync(process.execPath, [SCRIPT, '--input', bad, '--root', root], { cwd: ROOT })).toThrow()
  })
})
