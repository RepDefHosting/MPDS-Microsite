import moment from 'moment'

export function isValidRGBA(input) {
  const regex = new RegExp(
    /rgba\(\s*[0-9]{1,3},\s*[0-9]{1,3},\s*[0-9]{1,3},\s*[0-1]{1}(\.[0-9]+)?\s*\)/g,
  )
  if (!input || typeof input !== 'string') return false
  const result = input.match(regex)
  return result !== null && Array.isArray(result) && !!result.length
}

export function seoProps(data) {
  const {
    fields: { slug, gitAuthorTime, gitCreatedTime },
    frontmatter: {
      templateKey,
      featuredImage,
      schemaType,
      metaDescription,
      pageTitle,
      date: userDate,
    },
  } = data.markdownRemark

  const { date, dateModified } = getValidDates(
    userDate,
    gitAuthorTime,
    gitCreatedTime,
  )

  return {
    pageTitle,
    metaDescription,
    featuredImage: !!featuredImage && !!featuredImage.src ? featuredImage : null,
    slug,
    date,
    dateModified,
    templateKey,
    schemaType,
  }
}

export function getValidDates(date, gitAuthorTime, gitCreatedTime) {
  const mDate = !!date && typeof date === 'string' && date.replace(/\D/g, '').length ? moment(date, 'MMM D, YYYY') : null
  const mCreate = moment(gitCreatedTime)
  const mModified = !!gitAuthorTime && gitAuthorTime !== 'Invalid Date' ? moment(gitAuthorTime) : null

  const output = {
    date: !!mDate && mDate.isValid() ? mDate : mCreate,
  }
  output.dateModified = mModified && mModified.isValid() ? mModified : output.date
  return output
}

export function addTrailingSlash(path) {
  if (path === '/') {
    return path
  }
  return `/${path.split('/').filter((x) => x).join('/')}/`
}

export function getInitials(name) {
  if (!name) return '*'

  const words = name.split(' ').filter(word => word)
  const initials = words.map(word => word[0].toUpperCase()).join('')
  return initials || '*'
}

// Splits a full name or header into everything before the last word and the last word,
// so titles like "Dr. Jane Q. Smith" render in full with no word limit.
export function splitHeading(text) {
  const words = (text || '').split(' ').filter(word => word)
  if (words.length < 2) return { lead: words.join(' '), last: '' }
  return { lead: words.slice(0, -1).join(' '), last: words[words.length - 1] }
}
