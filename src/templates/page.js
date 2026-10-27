import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { graphql, Link } from 'gatsby'
import { featuredImagePropTypes } from '../proptypes'
import { useRecentPosts, useSiteData } from '../hooks'
import { addTrailingSlash, seoProps, splitHeading } from '../utils'
import { v4 as uuidv4 } from 'uuid'
import Layout from '../components/Layout'
import Banner from '../components/Banner'
import {
  HTMLContent,
  HomeHero,
  SameAsRow,
  PressStrip,
  GalleryPreview,
  ContactCTA,
  PostFeed,
} from '../components'

export const PageTemplate = ({
  name,
  jobTitle,
  location,
  profileImage,
  header,
  subheader,
  slug,
  cssSlug,
  templateKey,
  missionStatement,
  shortBiography,
  connectWithMe,
  discoverConnectExplore,
  longBiography_MD,
  featuredImage,
  extraContent,
  pageContent,
  isPreview,
  recentPosts,
  pressPosts,
  galleryPosts,
  sameAsItems,
  learnMoreButton,
  profileButton,
  blogButton,
  inlineImages,
  socialLinks,
  formText,
  // section toggles
  showBio,
  showSameAs,
  showPosts,
  showPress,
  showGallery,
  showCTA,
  // section labels
  bioLabel,
  linksLabel,
  postsLabel,
  pressLabel,
  galleryLabel,
  ctaLabel,
  // CTA fields
  ctaHeadline,
  ctaBody,
  ctaButton,
}) => {
  const isHomepage = templateKey === 'index-page'

  // Profile-page hero image src
  const profileHeroSrc = isPreview
    ? featuredImage && featuredImage.src
    : !!featuredImage && !!featuredImage.l && !!featuredImage.l.childImageSharp && !!featuredImage.l.childImageSharp.fluid && !!featuredImage.l.childImageSharp.fluid.src
    ? featuredImage.l.childImageSharp.fluid.src
    : null

  return (
    <Fragment>
      {/* ── HOMEPAGE ─────────────────────────────────── */}
      {isHomepage && (
        <Fragment>
          {/* Hero */}
          <HomeHero
            name={name}
            jobTitle={jobTitle}
            location={location}
            profileImage={profileImage}
            profileButton={profileButton}
            blogButton={blogButton}
            isPreview={isPreview}
          />

          {/* Bio Summary */}
          {showBio && !!shortBiography && (
            <section className="sec-bio-summary">
              <div className="bio-inner">
                <span className="label-eyebrow">{bioLabel || 'About'}</span>
                <p className="bio-text">{shortBiography}</p>
                {profileButton && profileButton.link && (
                  <Link
                    to={isPreview ? profileButton.link : addTrailingSlash(profileButton.link)}
                    className="bio-link"
                  >
                    {profileButton.label || 'Read full profile'}
                  </Link>
                )}
              </div>
            </section>
          )}

          {/* External Properties / sameAs Row */}
          {showSameAs && (
            <SameAsRow
              items={sameAsItems}
              label={linksLabel || 'Find Me On'}
            />
          )}

          {/* Featured Blog Posts */}
          {showPosts && recentPosts && recentPosts.length > 0 && (
            <section className="sec-article-list">
              <div className="pg-width">
                <span className="label-eyebrow">{postsLabel || 'Latest Writing'}</span>
                <div className="all-articles">
                  <PostFeed posts={recentPosts.slice(0, 3)} />
                </div>
              </div>
            </section>
          )}

          {/* Press Mentions */}
          {showPress && (
            <PressStrip
              items={pressPosts}
              label={pressLabel || 'As Seen In'}
            />
          )}

          {/* Gallery Preview */}
          {showGallery && (
            <GalleryPreview
              items={galleryPosts}
              label={galleryLabel || 'Gallery'}
              isPreview={isPreview}
            />
          )}

          {/* Contact CTA */}
          {showCTA && (
            <ContactCTA
              label={ctaLabel || 'Get In Touch'}
              headline={ctaHeadline}
              body={ctaBody}
              button={ctaButton}
            />
          )}
        </Fragment>
      )}

      {/* ── PROFILE PAGE ─────────────────────────────── */}
      {!isHomepage && (
        <Fragment>
          {!!featuredImage && (
            <section className="sec-hero-sml">
              <Banner
                header={header}
                subheader={subheader || ''}
                imageSrc={profileHeroSrc}
                imageAlt={featuredImage && featuredImage.alt ? featuredImage.alt : header}
                profileImage={profileImage || null}
              />
            </section>
          )}

          <section className="sec-text-full">
            <div className="pg-width">
              <div className="content">
                {templateKey === 'profile-page' && (
                  <Fragment>
                    <h2>
                      {splitHeading(name).lead}
                      {!!splitHeading(name).last && ' '}
                      {!!splitHeading(name).last && <span>{splitHeading(name).last}</span>}
                    </h2>
                    <p className="title">{jobTitle}</p>
                    <p className="location">{location}</p>
                  </Fragment>
                )}

                <div>
                  <HTMLContent content={pageContent} inlineImages={inlineImages} />
                </div>

                <div className="btn-row">
                  {!!profileButton && (
                    <Link
                      className="btn-primary"
                      to={addTrailingSlash(profileButton.link)}
                    >
                      {profileButton.label}
                    </Link>
                  )}
                  {!!blogButton && (
                    <Link
                      className="btn-primary"
                      to={addTrailingSlash(blogButton.link)}
                    >
                      {blogButton.label}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>

          {templateKey === 'profile-page' && (
            <section className="sec-three-box">
              <div className="pg-width">
                <div className="heading-row">
                  <h3>{connectWithMe}</h3>
                  <p>{discoverConnectExplore}</p>
                </div>
                <div className="all-boxes">
                  {!!socialLinks &&
                    !!socialLinks.length &&
                    socialLinks.map((social) => (
                      <div className="ech-box" key={uuidv4()}>
                        <a
                          href={Object.values(social)[0].url}
                          target="_blank"
                          rel="noopener"
                          className="sm-icon"
                        >
                          <img
                            src={`/img/${Object.keys(social)[0].toLowerCase()}-color.svg`}
                            alt={Object.keys(social)[0]}
                            width="60"
                            height="60"
                          />
                        </a>
                        <p>{Object.keys(social)[0]}</p>
                        <div className="btn-row">
                          <a
                            href={Object.values(social)[0].url}
                            target="_blank"
                            rel="noopener"
                            className="btn-primary"
                          >
                            {Object.values(social)[0].label}
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          )}
        </Fragment>
      )}
    </Fragment>
  )
}

PageTemplate.propTypes = {
  name: PropTypes.string,
  jobTitle: PropTypes.string,
  location: PropTypes.string,
  profileImage: PropTypes.object,
  header: PropTypes.string,
  subheader: PropTypes.string,
  slug: PropTypes.string,
  cssSlug: PropTypes.string,
  templateKey: PropTypes.string.isRequired,
  missionStatement: PropTypes.string,
  shortBiography: PropTypes.string,
  connectWithMe: PropTypes.string,
  discoverConnectExplore: PropTypes.string,
  longBiography_MD: PropTypes.string,
  featuredImage: featuredImagePropTypes,
  extraContent: PropTypes.string,
  pageContent: PropTypes.string,
  isPreview: PropTypes.bool,
  recentPosts: PropTypes.array,
  pressPosts: PropTypes.array,
  galleryPosts: PropTypes.array,
  sameAsItems: PropTypes.array,
  learnMoreButton: PropTypes.shape({ link: PropTypes.string, label: PropTypes.string }),
  profileButton: PropTypes.shape({ link: PropTypes.string, label: PropTypes.string }),
  blogButton: PropTypes.shape({ link: PropTypes.string, label: PropTypes.string }),
  inlineImages: PropTypes.array,
  socialLinks: PropTypes.any,
  formText: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    message: PropTypes.string,
    submit: PropTypes.string,
  }),
  showBio: PropTypes.bool,
  showSameAs: PropTypes.bool,
  showPosts: PropTypes.bool,
  showPress: PropTypes.bool,
  showGallery: PropTypes.bool,
  showCTA: PropTypes.bool,
  bioLabel: PropTypes.string,
  linksLabel: PropTypes.string,
  postsLabel: PropTypes.string,
  pressLabel: PropTypes.string,
  galleryLabel: PropTypes.string,
  ctaLabel: PropTypes.string,
  ctaHeadline: PropTypes.string,
  ctaBody: PropTypes.string,
  ctaButton: PropTypes.shape({ label: PropTypes.string, link: PropTypes.string }),
}

const Page = ({ data }) => {
  const {
    frontmatter: {
      header,
      subheader,
      templateKey,
      missionStatement,
      shortBiography,
      connectWithMe,
      discoverConnectExplore,
      longBiography_MD,
      extraContent,
      featuredImage,
      showRecentPosts,
      learnMoreButton,
      profileButton,
      blogButton,
      formText,
      showBio,
      showSameAs,
      showPosts,
      showPress,
      showGallery,
      showCTA,
      bioLabel,
      linksLabel,
      postsLabel,
      pressLabel,
      galleryLabel,
      ctaLabel,
      ctaHeadline,
      ctaBody,
      ctaButton,
    },
    fields: { inlineImages, slug },
  } = data.markdownRemark

  const recentPosts = useRecentPosts()
  const {
    name,
    jobTitle,
    location,
    profileImage,
    shortBio,
    sameAs: sameAsItems,
    socialLinks: { twitter, facebook, linkedin, pinterest, instagram },
  } = useSiteData()

  const socialLinks = [
    { Twitter: twitter },
    { Facebook: facebook },
    { LinkedIn: linkedin },
    { Pinterest: pinterest },
    { Instagram: instagram },
  ].filter(
    (item) =>
      !!Object.values(item)[0] &&
      !!Object.values(item)[0].url &&
      !!Object.values(item)[0].show,
  )

  // Press posts from GraphQL query
  const pressPosts =
    data.pressPosts && data.pressPosts.edges
      ? data.pressPosts.edges.map((e) => e.node)
      : []

  // Gallery posts from GraphQL query
  const galleryPosts =
    data.galleryPosts && data.galleryPosts.edges
      ? data.galleryPosts.edges.map((e) => e.node)
      : []

  const pageProps = {
    name,
    jobTitle,
    location,
    profileImage,
    header: header || '',
    subheader,
    templateKey,
    slug,
    cssSlug: slug === '/' ? 'home' : slug.split('/').join('-'),
    missionStatement,
    shortBiography: shortBiography || shortBio,
    connectWithMe,
    discoverConnectExplore,
    longBiography_MD,
    pageContent: data.markdownRemark.html,
    featuredImage: !!featuredImage && !!featuredImage.src ? featuredImage : null,
    extraContent,
    recentPosts: showRecentPosts || showPosts ? recentPosts : [],
    pressPosts,
    galleryPosts,
    sameAsItems: sameAsItems || [],
    inlineImages,
    learnMoreButton,
    profileButton,
    blogButton,
    socialLinks,
    formText,
    showBio: showBio !== false,
    showSameAs: showSameAs !== false,
    showPosts: showPosts !== false,
    showPress: !!showPress,
    showGallery: showGallery !== false,
    showCTA: showCTA !== false,
    bioLabel,
    linksLabel,
    postsLabel,
    pressLabel,
    galleryLabel,
    ctaLabel,
    ctaHeadline,
    ctaBody,
    ctaButton,
  }

  return (
    <Layout seoProps={seoProps(data)}>
      <PageTemplate {...pageProps} />
    </Layout>
  )
}

export default Page

export const pageQuery = graphql`
  query PageTemplate($id: String!) {
    markdownRemark(id: { eq: $id }) {
      fields {
        slug
        gitAuthorTime
        gitCreatedTime
        inlineImages {
          childImageSharp {
            fluid(maxWidth: 1440, quality: 100, cropFocus: CENTER) {
              ...GatsbyImageSharpFluid_withWebp
              originalName
              presentationWidth
              presentationHeight
            }
          }
        }
      }
      html
      frontmatter {
        templateKey
        pageTitle
        metaDescription
        schemaType
        header
        subheader
        shortBiography
        connectWithMe
        discoverConnectExplore
        longBiography_MD
        extraContent
        missionStatement
        showRecentPosts
        showBio
        showSameAs
        showPosts
        showPress
        showGallery
        showCTA
        bioLabel
        linksLabel
        postsLabel
        pressLabel
        galleryLabel
        ctaLabel
        ctaHeadline
        ctaBody
        ctaButton {
          label
          link
        }
        learnMoreButton {
          link
          label
        }
        profileButton {
          link
          label
        }
        blogButton {
          link
          label
        }
        featuredImage {
          src {
            childImageSharp {
              fluid {
                originalName
              }
              original {
                height
                width
              }
            }
          }
          d: src {
            childImageSharp {
              fluid(maxWidth: 1440, maxHeight: 807, quality: 100, cropFocus: CENTER) {
                ...GatsbyImageSharpFluid_withWebp
              }
            }
          }
          l: src {
            childImageSharp {
              fluid(maxWidth: 1440, maxHeight: 270, quality: 100, cropFocus: CENTER) {
                ...GatsbyImageSharpFluid_withWebp
              }
            }
          }
          m: src {
            childImageSharp {
              fluid(maxWidth: 1440, maxHeight: 270, quality: 100, cropFocus: CENTER) {
                ...GatsbyImageSharpFluid_withWebp
              }
            }
          }
          square: src {
            childImageSharp {
              fluid(maxWidth: 270, maxHeight: 270, quality: 100, cropFocus: CENTER) {
                ...GatsbyImageSharpFluid_withWebp
                originalName
              }
              original {
                height
                width
              }
            }
          }
          alt
          caption
        }
        formText {
          name
          email
          message
          submit
        }
      }
    }
    pressPosts: allMarkdownRemark(
      filter: {
        frontmatter: {
          templateKey: { eq: "press-post" }
          published: { ne: false }
        }
      }
      sort: { fields: [frontmatter___date], order: DESC }
    ) {
      edges {
        node {
          frontmatter {
            publication
            headline
            url
            date
            featured
            published
            logo {
              src {
                publicURL
              }
              alt
            }
          }
        }
      }
    }
    galleryPosts: allMarkdownRemark(
      filter: {
        frontmatter: {
          templateKey: { eq: "gallery-post" }
          published: { eq: true }
        }
      }
      sort: { fields: [frontmatter___date], order: DESC }
      limit: 6
    ) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            pageTitle
            featuredImage {
              src {
                childImageSharp {
                  fluid(maxWidth: 600, maxHeight: 600, quality: 85, cropFocus: CENTER) {
                    ...GatsbyImageSharpFluid_withWebp
                    src
                  }
                }
              }
              alt
            }
          }
        }
      }
    }
  }
`
