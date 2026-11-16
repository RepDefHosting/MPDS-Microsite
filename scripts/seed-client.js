#!/usr/bin/env node
/**
 * Seed a client microsite from one Markdown brief.
 *
 * Writes client details into the content files the CMS and the public site
 * both read, so the first deploy can be reviewed with real copy instead of
 * template placeholders.
 *
 * Usage:
 *   node scripts/seed-client.js --input client.md
 *   node scripts/seed-client.js --input client.md --root /path/to/client-repo
 *   node scripts/seed-client.js --input client.md --dry-run
 *
 * The brief is YAML front matter. Body text after the closing --- is ignored.
 * Unknown keys are ignored. See scripts/client.example.md.
 */

const fs = require('fs')
const path = require('path')

const CONTENT_FILES = {
  site: 'src/pages/sitedata.md',
  home: 'src/pages/index.md',
  profile: 'src/pages/profile.md',
  blog: 'src/pages/blog/index.md',
  gallery: 'src/pages/gallery/index.md',
}

const SOCIAL_KEYS = ['twitter', 'facebook', 'linkedin', 'pinterest', 'instagram']

function usage() {
  return [
    'Usage: node scripts/seed-client.js --input <client.md> [--root <repo>] [--dry-run]',
    '',
    'Required brief fields: name, jobTitle, location, siteUrl, shortBio, longBio',
    'Optional: siteName, email, headshot, sameAs, socialLinks, showPress, showGallery, showCTA',
  ].join('\n')
}

function parseArgs(argv) {
  const args = { dryRun: false, root: process.cwd() }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dry-run') {
      args.dryRun = true
    } else if (arg === '--input') {
      args.input = argv[i + 1]
      i += 1
    } else if (arg === '--root') {
      args.root = argv[i + 1]
      i += 1
    } else if (arg === '--help' || arg === '-h') {
      args.help = true
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return args
}

function parseFrontMatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n([\s\S]*))?$/)
  if (!match) {
    throw new Error('Client brief must start with YAML front matter (--- ... ---)')
  }
  const data = parseYaml(match[1])
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Client brief front matter must be a YAML object')
  }
  return { data, body: (match[2] || '').replace(/^\s+/, '') }
}

function parseYaml(source) {
  const lines = source.replace(/\t/g, '  ').split(/\r?\n/)
  let index = 0

  function peek() {
    while (index < lines.length && lines[index].trim() === '') index += 1
    return index < lines.length ? lines[index] : null
  }

  function indentOf(line) {
    return line.match(/^ */)[0].length
  }

  function parseBlock(minIndent) {
    const result = {}
    while (index < lines.length) {
      const line = peek()
      if (line === null || indentOf(line) < minIndent || line.trim().startsWith('- ')) break
      if (indentOf(line) > minIndent) {
        throw new Error(`Unexpected indent at: ${line.trim()}`)
      }
      index += 1
      const keyMatch = line.trim().match(/^([A-Za-z0-9_]+):\s*(.*)$/)
      if (!keyMatch) throw new Error(`Invalid YAML line: ${line}`)
      result[keyMatch[1]] = parseValue(keyMatch[2], indentOf(line))
    }
    return result
  }

  function parseValue(raw, indent) {
    if (raw === '|' || raw === '|-' || raw === '>' || raw === '>-') {
      return parseBlockScalar(indent + 2, raw.startsWith('|'))
    }
    if (raw === '') {
      const upcoming = peek()
      if (!upcoming || indentOf(upcoming) <= indent) return ''
      if (upcoming.trim().startsWith('- ')) return parseList(indent + 2)
      return parseBlock(indentOf(upcoming))
    }
    return parseScalar(raw)
  }

  function parseList(minIndent) {
    const items = []
    while (index < lines.length) {
      const line = peek()
      if (line === null || indentOf(line) < minIndent || !line.trim().startsWith('- ')) break
      const indent = indentOf(line)
      const rest = line.trim().slice(2)
      index += 1
      if (rest.includes(':')) {
        const keyMatch = rest.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
        if (!keyMatch) throw new Error(`Invalid YAML list item: ${line}`)
        const item = {}
        item[keyMatch[1]] = parseScalar(keyMatch[2])
        while (index < lines.length) {
          const child = peek()
          if (child === null || indentOf(child) <= indent || child.trim().startsWith('- ')) break
          index += 1
          const childMatch = child.trim().match(/^([A-Za-z0-9_]+):\s*(.*)$/)
          if (!childMatch) throw new Error(`Invalid YAML line: ${child}`)
          item[childMatch[1]] = parseValue(childMatch[2], indentOf(child))
        }
        items.push(item)
      } else {
        items.push(parseScalar(rest))
      }
    }
    return items
  }

  function parseBlockScalar(minIndent, literal) {
    const chunks = []
    while (index < lines.length) {
      const line = lines[index]
      if (line.trim() !== '' && indentOf(line) < minIndent) break
      index += 1
      chunks.push(line.length >= minIndent ? line.slice(minIndent) : '')
    }
    const text = chunks.join('\n').replace(/\s+$/, '')
    if (literal) return text
    return text
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/\n/g, ' ').replace(/ +/g, ' ').trim())
      .filter(Boolean)
      .join('\n\n')
  }

  function parseScalar(raw) {
    const value = raw.trim()
    if (value === 'null' || value === '~' || value === '') return null
    if (value === 'true') return true
    if (value === 'false') return false
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1)
    }
    return value
  }

  return parseBlock(0)
}

function requireString(data, key) {
  const value = data[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Client brief is missing required field: ${key}`)
  }
  return value.trim()
}

function httpsUrl(value, label) {
  if (!value) return ''
  const url = String(value).trim()
  if (!/^https:\/\/.+/i.test(url)) {
    throw new Error(`${label} must start with https://`)
  }
  return url.replace(/\/$/, '')
}

function clampMeta(text) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= 155) return clean
  return `${clean.slice(0, 152).replace(/\s+\S*$/, '')}...`
}

function yamlQuote(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function yamlBlock(value) {
  const text = String(value).replace(/\r\n/g, '\n').replace(/\s+$/, '')
  const lines = text.split('\n')
  return ['>-', ...lines.map((line) => (line.trim() === '' ? '' : `  ${line}`))].join('\n')
}

function socialBlock(links) {
  return SOCIAL_KEYS.map((key) => {
    const item = (links && links[key]) || {}
    const url = item.url ? httpsUrl(item.url, `socialLinks.${key}.url`) : ''
    const label = item.label || 'Visit'
    const show = Boolean(url) && item.show !== false
    return [
      `  ${key}:`,
      `    url: ${url ? yamlQuote(url) : '""'}`,
      `    label: ${yamlQuote(label)}`,
      `    show: ${show}`,
    ].join('\n')
  }).join('\n')
}

function sameAsBlock(items) {
  const list = Array.isArray(items) ? items.filter((item) => item && item.url) : []
  if (list.length === 0) return 'sameAs: []'
  return [
    'sameAs:',
    ...list.map((item) => {
      const label = item.label || 'Profile'
      return `  - label: ${yamlQuote(label)}\n    url: ${yamlQuote(httpsUrl(item.url, `sameAs ${label}`))}`
    }),
  ].join('\n')
}

function replaceFrontMatter(source, replacements) {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${replacements.trim()}\n---`)
}

function buildSiteData(client) {
  const headshot = client.headshot || '/img/client-headshot.jpg'
  return `templateKey: site-data
published: true
name: ${yamlQuote(client.name)}
jobTitle: ${yamlQuote(client.jobTitle)}
location: ${yamlQuote(client.location)}
profileImage:
  src: ${headshot}
  alt: ${yamlQuote(client.name)}
siteUrl: ${client.siteUrl}
siteAnalytics: null
shortBio: ${yamlQuote(client.shortBio)}
longBio: ${yamlBlock(client.longBio)}
socialLinks:
${socialBlock(client.socialLinks)}
siteName: ${yamlQuote(client.siteName)}
favicon: /img/favicon.png
themeOptions:
  colorScheme: londn
  fontScheme: muli
  showThemeSwitcher: false
${sameAsBlock(client.sameAs)}
fallbackImage: /img/pic-executive-main-banner-01.webp`
}

function buildHome(client) {
  const email = client.email || ''
  const ctaLink = email ? `mailto:${email}` : ''
  return `templateKey: index-page
pageSlug: /
pageTitle: Home
metaDescription: ${yamlQuote(clampMeta(client.homeDescription))}
published: true
schemaType: WebPage
featuredImage:
  src: /img/businessbuildings.jpg
  alt: ${yamlQuote(`${client.name} homepage`)}
profileButton:
  link: /profile
  label: View Profile
blogButton:
  link: /blog
  label: Read Blog
showBio: true
showSameAs: ${client.sameAs.length > 0}
showPosts: true
showPress: ${Boolean(client.showPress)}
showGallery: ${Boolean(client.showGallery)}
showCTA: ${Boolean(ctaLink)}
bioLabel: About
linksLabel: Find Me On
postsLabel: Latest Writing
pressLabel: As Seen In
galleryLabel: Gallery
ctaLabel: Get In Touch
ctaHeadline: Let's Connect
ctaBody: ${yamlQuote(`Interested in working with ${client.name}? Reach out directly.`)}
ctaButton:
  label: Send a Message
  link: ${yamlQuote(ctaLink || 'mailto:hello@example.com')}`
}

function buildProfile(client) {
  return `templateKey: profile-page
pageSlug: /profile
pageTitle: Profile
metaDescription: ${yamlQuote(clampMeta(client.profileDescription))}
published: true
schemaType: ProfilePage
header: ${yamlQuote(client.name)}
subheader: null
featuredImage:
  src: /img/businessbuildings.jpg
  alt: ${yamlQuote(client.name)}
  caption: null
connectWithMe: Connect with Me
discoverConnectExplore: ${yamlQuote(`Find ${client.name} on the following platforms.`)}
longBiography_MD: |
  ${client.longBio.replace(/\n/g, '\n  ')}
blogButton:
  label: Blog
  link: /blog`
}

function profileBody(client) {
  return `# ${client.name}\n\n${client.longBio.trim()}\n`
}

function homeBody(client) {
  return `${client.shortBio.trim()}\n`
}

function seed(client, files) {
  return {
    [CONTENT_FILES.site]: `---\n${buildSiteData(client)}\n---\n`,
    [CONTENT_FILES.home]: `---\n${buildHome(client)}\n---\n${homeBody(client)}`,
    [CONTENT_FILES.profile]: `---\n${buildProfile(client)}\n---\n${profileBody(client)}`,
    [CONTENT_FILES.blog]: replaceFrontMatter(
      files.blog,
      files.blog.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1].replace(
        /metaDescription:[\s\S]*?(?=\npublished:)/,
        `metaDescription: ${yamlQuote(clampMeta(`${client.name} — articles, insights, and professional updates.`))}`,
      ),
    ),
    [CONTENT_FILES.gallery]: replaceFrontMatter(
      files.gallery,
      files.gallery.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1].replace(
        /metaDescription:.*/,
        `metaDescription: ${yamlQuote(clampMeta(`Photos and gallery of ${client.name}.`))}`,
      ),
    ),
  }
}

function normalize(data) {
  const name = requireString(data, 'name')
  const jobTitle = requireString(data, 'jobTitle')
  const location = requireString(data, 'location')
  const siteUrl = httpsUrl(requireString(data, 'siteUrl'), 'siteUrl')
  const shortBio = requireString(data, 'shortBio')
  const longBio = requireString(data, 'longBio')
  const sameAs = Array.isArray(data.sameAs) ? data.sameAs : []
  if (data.linkedin && !sameAs.some((item) => /linkedin/i.test(item.label || '') || /linkedin\.com/i.test(item.url || ''))) {
    sameAs.unshift({ label: 'LinkedIn', url: data.linkedin })
  }
  return {
    name,
    jobTitle,
    location,
    siteUrl,
    siteName: (data.siteName || name).trim(),
    shortBio,
    longBio,
    email: data.email ? String(data.email).trim() : '',
    headshot: data.headshot || '',
    sameAs,
    socialLinks: data.socialLinks || {},
    showPress: data.showPress === true,
    showGallery: data.showGallery === true,
    homeDescription:
      data.homeDescription ||
      `${name} is a ${jobTitle} based in ${location}. This is the official website and professional profile of ${name}.`,
    profileDescription:
      data.profileDescription ||
      `${name} is a ${jobTitle} based in ${location}. Read the full professional profile and career history of ${name}.`,
  }
}

function readContent(root) {
  const files = {}
  Object.entries(CONTENT_FILES).forEach(([key, relative]) => {
    const absolute = path.resolve(root, relative)
    if (!fs.existsSync(absolute)) {
      throw new Error(`Missing content file: ${relative}`)
    }
    files[key] = fs.readFileSync(absolute, 'utf8')
  })
  return files
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.input) {
    console.log(usage())
    process.exit(args.help ? 0 : 1)
  }
  const briefPath = path.resolve(args.input)
  const { data } = parseFrontMatter(fs.readFileSync(briefPath, 'utf8'))
  const client = normalize(data)
  const current = readContent(args.root)
  const next = seed(client, current)
  const written = []
  Object.entries(next).forEach(([relative, contents]) => {
    if (contents.includes('[Client Full Name]') || contents.includes('[Client Job Title]')) {
      throw new Error(`Placeholders remained in ${relative}`)
    }
    if (!args.dryRun) {
      fs.writeFileSync(path.resolve(args.root, relative), contents)
    }
    written.push(relative)
  })
  console.log(`${args.dryRun ? 'Would write' : 'Wrote'} ${written.length} files for ${client.name}:`)
  written.forEach((file) => console.log(`  ${file}`))
  console.log(`Review URL field: ${client.siteUrl}`)
  console.log('Keep the Vercel project protected until this content is approved.')
}

if (require.main === module) {
  try {
    main()
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}

module.exports = {
  parseFrontMatter,
  normalize,
  seed,
  clampMeta,
}
