import styled from 'styled-components';
import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, NavigateOptions } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import { determineAddressType } from 'utils/address-type-checker';
import { CONTACT_EMAIL } from 'config';

const HomeStyles = styled.div`
  .hero {
    padding-top: 4rem;
    padding-bottom: 4rem;
  }
  .hero-title {
    font-size: clamp(2.2rem, 1.5rem + 3vw, 3.5rem);
    font-weight: 800;
    line-height: 1.1;
  }
  .scan-card {
    border-radius: var(--radius);
    box-shadow: var(--shadow);
  }
  .scan-card .form-control {
    border-radius: 0.75rem;
  }
  .scan-error {
    color: var(--danger);
  }

  .check-card {
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .check-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    font-size: 1.5rem;
    color: var(--vt-purple-deep);
    background: var(--vt-purple-tint);
  }
  .why {
    max-width: 48rem;
  }
  .help-box {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 2rem;
  }
`;

const checks = [
  { icon: 'bi-hdd-network', key: 'server' },
  { icon: 'bi-shield-lock', key: 'security' },
  { icon: 'bi-envelope-at', key: 'mail' },
  { icon: 'bi-eye', key: 'exposure' },
];

const Home = (): JSX.Element => {
  const { t } = useTranslation();

  const [userInput, setUserInput] = useState('');
  const [errorMsg, setErrMsg] = useState('');
  const navigate = useNavigate();

  // Precarga la página de resultados cuando la portada ya terminó de cargar,
  // mientras la persona escribe su dominio
  useEffect(() => {
    const timer = setTimeout(() => { import('pages/Results'); }, 2500);
    return () => clearTimeout(timer);
  }, []);

  /* Check is valid address, either show err or redirect to results page */
  const submit = () => {
    let address = userInput.trim().replace(/\/+$/, '');
    const addressType = determineAddressType(address);

    if (addressType === 'empt') {
      setErrMsg(t('home.errorEmptyField'));
    } else if (addressType === 'err') {
      setErrMsg(t('home.errorInvalidUrl'));
    } else {
      // if the addressType is 'url' and address doesn't start with 'http://' or 'https://', prepend 'https://'
      if (addressType === 'url' && !/^https?:\/\//i.test(address)) {
        address = 'https://' + address;
      }
      const resultRouteParams: NavigateOptions = { state: { address, addressType } };
      navigate(`/results/${encodeURIComponent(address)}`, resultRouteParams);
    }
  };

  /* Update user input state, and hide error message if field is valid */
  const inputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
    const isError = ['err', 'empt'].includes(determineAddressType(event.target.value.trim()));
    if (!isError) setErrMsg('');
  };

  const formSubmitEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return (
    <HomeStyles>
      <div className="container-fluid green-section">
        <header className="container hero">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-6">
              <span className="eyebrow mb-3">{t('home.eyebrow')}</span>
              <h1 className="hero-title">
                <i className="bi bi-diagram-3 me-2" aria-hidden="true"></i>{t('home.title')}
              </h1>
              <p className="lead fw-semibold mt-3">{t('home.lead')}</p>
              <p className="text-soft mb-0">{t('home.subLead')}</p>
            </div>
            <div className="col-lg-6">
              <div className="card scan-card border-0">
                <div className="card-body p-4 p-md-5">
                  <form onSubmit={formSubmitEvent} noValidate>
                    <label htmlFor="user-input" className="form-label fw-semibold">{t('home.inputLabel')}</label>
                    <input
                      id="user-input"
                      className="form-control form-control-lg"
                      type="text"
                      inputMode="url"
                      autoComplete="url"
                      autoCapitalize="off"
                      spellCheck={false}
                      placeholder={t('home.defaultPlaceholder')}
                      aria-invalid={!!errorMsg}
                      aria-describedby={errorMsg ? 'user-input-error' : 'user-input-hint'}
                      onChange={inputChange}
                      value={userInput}
                    />
                    {errorMsg
                      ? <p id="user-input-error" className="scan-error small mt-2 mb-0" role="alert">{errorMsg}</p>
                      : <p id="user-input-hint" className="small text-soft mt-2 mb-0">{t('home.inputHint')}</p>}
                    <div className="d-grid mt-4">
                      <button type="submit" className="btn btn-brand btn-lg rounded-pill">
                        {t('home.submitButton')}<i className="bi bi-search ms-2" aria-hidden="true"></i>
                      </button>
                    </div>
                  </form>
                  <p className="small text-soft mt-3 mb-0">
                    <i className="bi bi-shield-check me-1" aria-hidden="true"></i>{t('home.responsibleUse')}{' '}
                    <Link to="/about#uso-responsable">{t('home.responsibleLink')}</Link>
                  </p>
                  <p className="small text-soft mt-2 mb-0">
                    <i className="bi bi-info-circle me-1" aria-hidden="true"></i>{t('home.privacyHint')}{' '}
                    <Link to="/about#privacidad">{t('home.privacyLink')}</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      <section className="container section" aria-labelledby="revisa-titulo">
        <h2 id="revisa-titulo" className="section-title text-center mb-4">{t('home.checksTitle')}</h2>
        <div className="row g-4">
          {checks.map(c => (
            <div key={c.key} className="col-md-6 col-xl-3">
              <div className="card check-card h-100">
                <div className="card-body p-4">
                  <span className="check-icon"><i className={`bi ${c.icon} me-0`} aria-hidden="true"></i></span>
                  <h3 className="h5 mt-3 mb-2">{t(`home.checks.${c.key}.title`)}</h3>
                  <p className="text-soft mb-0">{t(`home.checks.${c.key}.desc`)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-fluid green-section" aria-labelledby="por-que-titulo">
        <div className="container section">
          <div className="why mx-auto">
            <h2 id="por-que-titulo" className="section-title text-center mb-4">{t('home.infotitle')}</h2>
            <p>{t('home.paragraph1')}</p>
            <p>{t('home.paragraph2')}</p>
            <p>{t('home.paragraph3')}</p>
            <div className="help-box text-center mt-5">
              <h3 className="h5">{t('home.helpTitle')}</h3>
              <p className="text-soft">{t('home.helpDesc')}</p>
              <a className="btn btn-brand rounded-pill px-4" href={`mailto:${CONTACT_EMAIL}`}>
                {t('navbar.contact')}<i className="bi bi-envelope ms-2" aria-hidden="true"></i>
              </a>
            </div>
            <p className="small text-soft text-center mt-4 mb-0">
              {t('home.credit')} <a href="https://aliciasykes.com" rel="noopener noreferrer" target="_blank">Alicia Sykes</a>.{' '}
              <Link to="/about">{t('home.moreAbout')}</Link>
            </p>
          </div>
        </div>
      </section>
    </HomeStyles>
  );
};

export default Home;
