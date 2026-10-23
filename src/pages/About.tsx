import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Heading from 'components/Form/Heading';
import AdditionalResources from 'components/misc/AdditionalResources';
import { StyledCard } from 'components/Form/Card';
import docs, { about, featureIntro, fairUse } from 'utils/docs';
import { REPO_URL } from 'config';

const AboutContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding-top: 3rem;
  padding-bottom: 3rem;
  section {
    .inner-heading { display: none; }
  }
  h2 {
    font-size: 1.5rem;
    margin-top: 2.5rem;
  }
`;

const Section = styled(StyledCard)`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem 2rem;
  margin: 1rem 0 0;
  overflow: clip;
  max-height: 100%;
  section {
    clear: both;
  }
  h3 {
    font-size: 1.25rem;
    color: var(--vt-purple-deep);
  }
  h4 {
    font-size: 1rem;
    color: var(--ink-soft);
  }
  hr {
    border: none;
    border-top: 1px solid var(--border);
    opacity: 1;
    margin: 1.5rem auto;
  }
  ul {
    padding: 0 0 0 1rem;
  }
  pre {
    background: var(--vt-green);
    border-radius: 4px;
    padding: 0.5rem;
    width: fit-content;
  }
  small { opacity: 0.7; }
  .contents {
    ul {
      list-style: none;
      columns: 2 16rem;
      li {
        b {
          color: var(--ink-soft);
          display: inline-block;
          width: 1.75rem;
        }
      }
    }
  }
  .example-screenshot {
    float: right;
    display: inline-flex;
    flex-direction: column;
    clear: both;
    max-width: 300px;
    margin-left: 1rem;
    img {
      float: right;
      break-inside: avoid;
      max-width: 100%;
      border-radius: 6px;
      border: 1px solid var(--border);
      clear: both;
    }
    figcaption {
      font-size: 0.8rem;
      text-align: center;
      color: var(--ink-soft);
    }
  }
  @media (max-width: 576px) {
    padding: 1.25rem;
    .example-screenshot { float: none; margin: 0 0 1rem; }
  }
`;

const makeAnchor = (title: string): string => {
  return title.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, "-");
};

const About = (): JSX.Element => {
  const { t } = useTranslation();
  return (
    <div className="container-fluid green-section">
    <AboutContainer className="container">
      <header className="d-flex flex-wrap justify-content-between align-items-end gap-3">
        <div>
          <span className="eyebrow mb-2">{t('home.title')}</span>
          <h1 className="section-title mb-0">{t('about.title')}</h1>
        </div>
        <a className="btn btn-outline-brand rounded-pill px-3" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          <i className="bi bi-github me-1" aria-hidden="true"></i>{t('about.viewOnGitHub')}
        </a>
      </header>

      <Heading as="h2" size="medium">{t('about.intro')}</Heading>
      <Section>
        {/* Textos propios y estáticos de docs.ts que incluyen enlaces y negritas */}
        {about.map((para, index: number) => (
          <p key={index} dangerouslySetInnerHTML={{ __html: para }} />
        ))}
      </Section>

      <Heading as="h2" size="medium">{t('about.features')}</Heading>
      <Section>
        {featureIntro.map((fi: string, i: number) => (<p key={i}>{fi}</p>))}
        <div className="contents">
        <Heading as="h3" size="small" id="feature-contents">{t('about.content')}</Heading>
          <ul>
            {docs.map((section, index: number) => (
              <li key={section.title}>
                <b>{index + 1}</b>
                <a href={`#${makeAnchor(section.title)}`}>{section.title}</a></li>
            ))}
          </ul>
          <hr />
        </div>
        {docs.map((section, sectionIndex: number) => (
          <section key={section.title}>
            { sectionIndex > 0 && <hr /> }
            <Heading as="h3" size="small" id={makeAnchor(section.title)} >{section.title}</Heading>
            {section.screenshot &&
              <figure className="example-screenshot">
                <img className="screenshot" src={section.screenshot} alt={`${t('about.fCap2')} ${section.title}`} loading="lazy" />
                <figcaption>{t('about.fCap1')}.{sectionIndex + 1} - {t('about.fCap2')} {section.title}</figcaption>
              </figure>
            }
            {section.description && <>
              <Heading as="h4" size="small">{t('about.description')}</Heading>
              <p>{section.description}</p>
            </>}
            { section.use && <>
              <Heading as="h4" size="small">{t('about.useCases')}</Heading>
              <p>{section.use}</p>
            </>}
            {section.resources && section.resources.length > 0 && <>
              <Heading as="h4" size="small">{t('about.usefulLinks')}</Heading>
              <ul>
                {section.resources.map((link: string | { title: string, link: string }, linkIndx: number) => (
                  typeof link === 'string' ? (
                    <li key={linkIndx}><a target="_blank" rel="noreferrer" href={link}>{link}</a></li>
                  ) : (
                    <li key={linkIndx}><a target="_blank" rel="noreferrer" href={link.link}>{link.title}</a></li>
                  )
                ))}
              </ul>
            </>}
          </section>
        ))}
      </Section>

      <Heading as="h2" size="medium">{t('about.additionalResources')}</Heading>
      <AdditionalResources />

      <Heading as="h2" size="medium">{t('about.termsAndInfo')}</Heading>
      <Section>
        <Heading as="h3" size="small" id="uso-responsable">{t('about.responsibleUse')}</Heading>
        <ul>
          {fairUse.map((para, index: number) => (<li key={index}>{para}</li>))}
        </ul>
        <hr />
        <Heading as="h3" size="small" id="privacidad">{t('about.privacy')}</Heading>
        <p>{t('about.privacyDescription')}</p>
        <p className="mb-0">{t('about.privacyThirdParties')}</p>
      </Section>
    </AboutContainer>
    </div>
  );
}

export default About;
