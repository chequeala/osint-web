import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Collapse } from 'bootstrap';
import styled from 'styled-components';

import { CONTACT_EMAIL, SITE_URL } from 'config';

// Mismo menú que chequea.la (chequeala_web/src/components/NavBar.vue)
const StyledNav = styled.nav`
  background-color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
  .navbar-brand {
    color: var(--vt-blue-deep);
    transition-duration: 0.3s;
  }
  .navbar-brand i {
    color: var(--vt-purple);
    transition: transform 0.3s ease-in-out;
  }
  .navbar-brand:hover {
    color: var(--vt-purple);
  }
  .navbar-brand:hover .rotate {
    transform: rotate(-10deg);
  }
  .nav-link {
    font-weight: 500;
    color: var(--ink);
  }
  .nav-link:hover,
  .nav-link.active {
    color: var(--vt-purple-deep);
  }
  .lang-switch .btn {
    min-width: 2.75rem;
  }
`;

const languages: Record<string, string> = {
  es: 'ES',
  pt: 'PT',
};

const NavBar = (): JSX.Element => {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const collapseRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    try { localStorage.setItem('language', code); } catch { /* sin acceso a localStorage */ }
  };

  useEffect(() => {
    document.documentElement.lang = i18n.language === 'pt' ? 'pt-BR' : 'es';
  }, [i18n.language]);

  // Cierra el menú móvil al navegar
  useEffect(() => {
    if (collapseRef.current) Collapse.getInstance(collapseRef.current)?.hide();
  }, [location]);

  return (
    <StyledNav className="navbar navbar-expand-lg sticky-top">
      <div className="container">
        <a className="navbar-brand fw-bold fs-3 me-0" href={SITE_URL}>
          <i className="bi bi-search-heart pe-2 d-inline-block rotate"></i>{t('navbar.brand')}
        </a>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label={t('navbar.menu')}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav" ref={collapseRef}>
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2 py-3 py-lg-0">
            <li className="nav-item">
              <a className="nav-link" href={`${SITE_URL}/checklist`}>{t('navbar.checkList')}</a>
            </li>
            <li className="nav-item">
              <Link className="nav-link active" aria-current="page" to="/">{t('navbar.osintWeb')}</Link>
            </li>
            <li className="nav-item">
              <a className="nav-link" href={`${SITE_URL}/principios`}>{t('navbar.principles')}</a>
            </li>
            <li className="nav-item my-2 my-lg-0 ms-lg-2">
              <div className="btn-group btn-group-sm lang-switch" role="group" aria-label={t('navbar.language')}>
                {Object.entries(languages).map(([code, name]) => (
                  <button
                    key={code}
                    type="button"
                    className={`btn ${i18n.language === code ? 'btn-brand' : 'btn-outline-brand'}`}
                    aria-pressed={i18n.language === code}
                    title={t(`navbar.languages.${code}`)}
                    onClick={() => changeLanguage(code)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </li>
            <li className="nav-item ms-lg-2">
              <a className="btn btn-brand rounded-pill px-3" href={`mailto:${CONTACT_EMAIL}`}>
                <i className="bi bi-envelope me-1"></i>{t('navbar.contact')}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </StyledNav>
  );
};

export default NavBar;
