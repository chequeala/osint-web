import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

// Aviso arriba de los resultados cuando el certificado no sirve: es lo primero
// que verá quien entre al sitio por https://, así que no puede quedar escondido
const Banner = styled.div`
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
  background: #f8e1e3;
  border: 1px solid var(--danger);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  .icon {
    font-size: 1.75rem;
    line-height: 1;
    color: var(--danger);
  }
  h2 {
    font-size: 1.1rem;
    color: var(--danger);
    margin: 0 0 0.25rem;
  }
  p {
    margin: 0;
  }
  p + p {
    margin-top: 0.35rem;
  }
`;

const SslBanner = (props: { ssl: any, host: string }): JSX.Element | null => {
  const { t } = useTranslation();
  const problems: string[] = props.ssl?.problems || [];
  if (!problems.length) return null;
  const names = (props.ssl.certNames || []).join(', ');
  return (
    <Banner role="alert">
      <i className="bi bi-shield-exclamation icon me-0" aria-hidden="true"></i>
      <div>
        <h2>{t('sslBanner.title', { host: props.host })}</h2>
        {problems.map(p => <p key={p}>{t(`sslCard.problems.${p}`, { names })}</p>)}
        <p className="small text-soft">{t('sslBanner.overHttp')}</p>
      </div>
    </Banner>
  );
};

export default SslBanner;
