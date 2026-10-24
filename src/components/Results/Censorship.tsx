import { useTranslation } from 'react-i18next';
import { Card } from 'components/Form/Card';
import Row from 'components/Form/Row';
import { countryName } from 'utils/countries';

const STATUS_ICON: Record<string, string> = { confirmed: '❌', likely: '⚠️', ok: '✅' };
const MAX_ROWS = 12;

const CensorshipCard = (props: { data: any, title: string, actionButtons: any, onion?: string | null }): JSX.Element => {
  const { t } = useTranslation();
  const countries: { country: string, measurements: number, anomalies: number, ratio: number, status: string }[] = props.data.countries || [];
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      {countries.slice(0, MAX_ROWS).map(c => (
        <Row key={c.country} lbl="" val="">
          <span className="lbl">{countryName(c.country)}</span>
          <span className="val" title={t('censorship.detail', { anomalies: c.anomalies, measurements: c.measurements })}>
            {STATUS_ICON[c.status]} {t(`censorship.status.${c.status}`)} · {Math.round(c.ratio * 100)}%
          </span>
        </Row>
      ))}
      <Row lbl="" val="">
        <span className="lbl">{t('censorship.tor')}</span>
        <span className="val" title={props.onion || undefined}>{props.onion ? `🧅 ${t('censorship.torYes')}` : t('censorship.torNo')}</span>
      </Row>
      <p className="small text-soft mt-2 mb-0">
        {t('censorship.note', { days: props.data.days })}{' '}
        <a href={`https://explorer.ooni.org/search?domain=${encodeURIComponent(props.data.domain)}`} target="_blank" rel="noopener noreferrer">OONI Explorer</a>
      </p>
    </Card>
  );
};

export default CensorshipCard;
