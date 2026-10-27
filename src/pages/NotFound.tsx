import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import errorWeb from 'assets/error-web.svg';

// Igual que la 404 de chequea.la (chequeala_web/src/views/NoEncontrada.vue)
const NotFound = (): JSX.Element => {
  const { t } = useTranslation();
  return (
    <div className="container-fluid green-section">
      <div className="container text-center py-5">
        <img src={errorWeb} alt="" className="img-fluid my-4" width="420" />
        <h1 className="h2">{t('notFound.title')}</h1>
        <p className="text-soft">{t('notFound.description')}</p>
        <Link to="/" className="btn btn-brand rounded-pill px-4 mt-2">
          <i className="bi bi-arrow-left me-2" aria-hidden="true"></i>{t('notFound.back')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
