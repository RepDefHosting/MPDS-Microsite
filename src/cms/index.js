import CMS from 'netlify-cms-app'
import uploadcare from 'netlify-cms-media-library-uploadcare'
import cloudinary from 'netlify-cms-media-library-cloudinary'
import blog from './collections/blog'
import gallery from './collections/gallery'
import press from './collections/press'
import page from './collections/page'
import meta from './collections/meta'
import BlogPostPreview from './preview-templates/BlogPostPreview'
import GalleryPostPreview from './preview-templates/GalleryPostPreview'
import PagePreview from './preview-templates/PagePreview'
import PressPostPreview from './preview-templates/PressPostPreview'

import '../style/all.sass'

const pages = [
  {
    label: 'Home Page',
    file: 'src/pages/index.md',
    templateKey: 'index-page',
    pageSlug: '/',
    additionalFields: [
      'pageContent',
      'profileButton',
      'blogButton',
      'showBio',
      'showSameAs',
      'showPosts',
      'showPress',
      'showGallery',
      'showCTA',
      'bioLabel',
      'linksLabel',
      'postsLabel',
      'pressLabel',
      'galleryLabel',
      'ctaLabel',
      'ctaHeadline',
      'ctaBody',
      'ctaButton',
      // 'missionStatement',
      // 'shortBiography',
      // 'learnMoreButton',
      // 'extraContent',
      // 'showRecentPosts',
    ],
  },
  {
    label: 'Profile Page',
    file: 'src/pages/profile.md',
    templateKey: 'profile-page',
    pageSlug: '/profile/',
    additionalFields: [
      'pageContent',
      'blogButton',
      'connectWithMe',
      'discoverConnectExplore',
      // 'longBiography_MD',
      // 'extraContent',
    ],
  },
  // {
  //   label: 'About Page',
  //   file: 'src/pages/about.md',
  //   templateKey: 'about-page',
  //   pageSlug: '/about/',
  //   additionalFields: [
  //     'longBiography_MD',
  //     'extraContent',
  //   ],
  // },
  {
    label: 'Blog Archive Page',
    file: 'src/pages/blog/index.md',
    templateKey: 'blog-archive',
    pageSlug: '/blog/',
    additionalFields: [
      'profileButton',
    ],
  },
  {
    label: 'Gallery Archive Page',
    file: 'src/pages/gallery/index.md',
    templateKey: 'gallery-archive',
    pageSlug: '/gallery/',
    additionalFields: [
      'profileButton',
      'blogButton',
    ],
  },
  // {
  //   label: 'Contact Page',
  //   file: 'src/pages/contact.md',
  //   templateKey: 'contact-page',
  //   pageSlug: '/contact/',
  //   additionalFields: [
  //     'formText',
  //   ],
  // },
]

// Deploy target controls the CMS auth backend:
// - Netlify deploys use git-gateway (Netlify Identity handles auth)
// - Vercel deploys use github (a small OAuth proxy in api/auth.js + api/callback.js
//   handles auth) — set GATSBY_CMS_BACKEND=github in the Vercel project's env vars
const backend =
  process.env.GATSBY_CMS_BACKEND === 'github'
    ? {
        name: 'github',
        repo: process.env.GATSBY_GITHUB_REPO,
        branch: 'master',
        base_url: process.env.GATSBY_OAUTH_BASE_URL,
        auth_endpoint: 'api/auth',
      }
    : {
        name: 'git-gateway',
        branch: 'master',
      }

CMS.init({
  config: {
    backend,
    // publish_mode: 'editorial_workflow',
    media_folder: 'static/img',
    public_folder: '/img',
    slug: {
      encoding: 'ascii',
      clean_accents: true,
      sanitize_replacement: '-',
    },
    collections: [
      meta,
      {
        name: 'pages',
        label: 'Pages',
        files: pages.map((data) => page(data)),
      },
      blog,
      gallery,
      press,
    ],
  },
})

CMS.registerMediaLibrary(uploadcare)
CMS.registerMediaLibrary(cloudinary)
CMS.registerPreviewTemplate('blog', BlogPostPreview)
CMS.registerPreviewTemplate('gallery', GalleryPostPreview)
CMS.registerPreviewTemplate('press', PressPostPreview)
pages.forEach(({ templateKey }) => {
  CMS.registerPreviewTemplate(templateKey, PagePreview)
})
