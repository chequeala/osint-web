import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { CONTACT_EMAIL, REPO_URL, SITE_URL, UPSTREAM_REPO_URL } from 'config';

// Mismo pie que chequea.la (chequeala_web/src/components/MyFooter.vue)
const StyledFooter = styled.footer`
  background: var(--ink);
  color: rgba(255, 255, 255, 0.75);
  a {
    color: #fff;
  }
  a:hover {
    color: var(--vt-purple-soft);
  }
  .footer-brand i,
  .highlight {
    color: var(--vt-purple-soft);
    font-weight: 700;
  }
  .footer-title {
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
    margin-bottom: 0.75rem;
  }
  li + li {
    margin-top: 0.35rem;
  }
  hr {
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const Footer = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <StyledFooter>
      <div className="container py-5">
        <div className="row g-4">
          <div className="col-md-5">
            <a className="footer-brand fw-bold fs-4" href={SITE_URL}>
              <i className="bi bi-search-heart pe-2"></i>{t('navbar.brand')}
            </a>
            <p className="mt-2 mb-0">{t('navbar.description')}</p>
          </div>

          <div className="col-6 col-md-3">
            <h2 className="footer-title">{t('footer.explore')}</h2>
            <ul className="list-unstyled mb-0">
              <li><a href={`${SITE_URL}/checklist`}>{t('navbar.checkList')}</a></li>
              <li><a href="/">{t('navbar.osintWeb')}</a></li>
              <li><a href="/about">{t('footer.aboutTool')}</a></li>
              <li><a href={`${SITE_URL}/principios`}>{t('navbar.principles')}</a></li>
            </ul>
          </div>

          <div className="col-6 col-md-4">
            <h2 className="footer-title">{t('footer.contactTitle')}</h2>
            <p className="mb-3">
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-break">
                <i className="bi bi-envelope me-1"></i>{CONTACT_EMAIL}
              </a>
            </p>
            <p className="small mb-1">
              {t('footer.basedOn')} <a href={UPSTREAM_REPO_URL} target="_blank" rel="noopener noreferrer">Web Check</a>,
              {' '}{t('footer.byAuthor')} <a href="https://aliciasykes.com" target="_blank" rel="noopener noreferrer">Alicia Sykes</a>.
            </p>
            <a href={REPO_URL} className="small" target="_blank" rel="noopener noreferrer">
              <i className="bi bi-github me-1"></i>{t('footer.sourceCode')}
            </a>
          </div>
        </div>

        <hr className="my-4" />

        <p className="text-center small mb-0">
          {t('footer.part1')} <span className="highlight">{t('footer.highlight')}</span>{' '}
          {t('footer.part2')} <span className="highlight">{t('footer.highlight')}</span>.
        </p>
      </div>
    </StyledFooter>
  );
};

export default Footer;
