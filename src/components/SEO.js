import React, { useContext } from 'react'
import moment from 'moment'
import { Helmet } from 'react-helmet'
import PropTypes from 'prop-types'
import { featuredImagePropTypes } from '../proptypes'
import { isMobile } from 'react-device-detect'

import { useStructuredData, useSiteData } from '../hooks'
import { ThemeOptionsContext } from '../context/ThemeOptions'
import { addTrailingSlash } from '../utils'

const buildImage = (img, siteUrl) => {
  const url = `${siteUrl}/img/${img.childImageSharp.fluid.originalName}`
  const { width, height } = img.childImageSharp.original
  return { url, width, height }
}

const Moment = moment().constructor

const SEO = ({
  pageTitle,
  metaDescription,
  featuredImage,
  slug,
  date,
  dateModified,
  templateKey,
  schemaType,
}) => {
  const {
    name,
    siteName,
    jobTitle,
    location,
    siteUrl,
    socialLinks: { twitter, facebook, linkedin, pinterest, instagram },
    sameAs: sameAsList,
    fallbackImage,
  } = useSiteData()

  const image = featuredImage && featuredImage.src ? featuredImage.src : fallbackImage

  // Build sameAs: merge explicit sameAs list URLs with social link URLs, deduped
  const socialSameAs = [twitter, facebook, linkedin, pinterest, instagram]
    .filter((item) => !!item && !!item.url && item.url.length)
    .map((item) => item.url)
  const listSameAs = Array.isArray(sameAsList)
    ? sameAsList.filter((item) => !!item && !!item.url).map((item) => item.url)
    : []
  const mergedSameAs = [...new Set([...listSameAs, ...socialSameAs])]

  // Title pattern: "[Full Name] — [Page Topic] | [siteName]"
  // Guard: if pageTitle already contains the name, don't double-prefix
  const titleContainsName = name && pageTitle && pageTitle.toLowerCase().includes(name.toLowerCase())
  const formattedTitle = titleContainsName
    ? `${pageTitle} | ${siteName || name}`
    : `${name} — ${pageTitle} | ${siteName || name}`

  const schemaData = {
    templateKey,
    headline: pageTitle,
    description: metaDescription,
    url: `${siteUrl}${addTrailingSlash(slug)}`,
    fallbackImage: buildImage(fallbackImage, siteUrl),
    pageType: templateKey && templateKey.indexOf('blog-post') !== -1 ? 'article' : 'webpage',
    datePublished: moment(date).format('YYYY-MM-DD'),
    dateModified: moment(dateModified).format('YYYY-MM-DD'),
    name,
    jobTitle,
    siteName,
    location,
    schemaType,
    sameAs: mergedSameAs,
  }

  schemaData.image = !!image ? buildImage(image, siteUrl) : schemaData.fallbackImage

  const twitterHandle = twitter && twitter.url ? '@' + twitter.url.split('twitter.com/')[1] : null

  const ldjson = useStructuredData(schemaData)

  const { colorScheme, fontScheme } = useContext(ThemeOptionsContext)

  const htmlClasses = [
    colorScheme,
    fontScheme,
    typeof window !== 'undefined' && isMobile ? 'no-mouse' : '',
  ]
    .filter((x) => x)
    .join(' ')

  return (
    <Helmet>
      <html lang="en" className={htmlClasses} />
      <title>{formattedTitle}</title>
      <meta
        name="robots"
        content="max-snippet:-1, max-image-preview:large, max-video-preview:-1"
      />
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={schemaData.url} />
      <meta property="og:type" content={schemaData.pageType} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={schemaData.url} />
      <meta property="og:image" content={schemaData.image.url} />
      {schemaData.pageType === 'article' && (
        <meta property="article:author" content={name} />
      )}
      <meta name="twitter:card" content="summary_large_image" />
      {!!twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={schemaData.image.url} />
      <script type="application/ld+json">{ldjson}</script>
    </Helmet>
  )
}

export const seoPropTypes = {
  pageTitle: PropTypes.string.isRequired,
  metaDescription: PropTypes.string.isRequired,
  featuredImage: featuredImagePropTypes,
  slug: PropTypes.string.isRequired,
  date: PropTypes.instanceOf(Moment).isRequired,
  dateModified: PropTypes.instanceOf(Moment).isRequired,
  templateKey: PropTypes.string.isRequired,
  schemaType: PropTypes.string.isRequired,
}

SEO.propTypes = seoPropTypes

export default SEO
