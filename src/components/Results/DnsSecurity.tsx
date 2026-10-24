import { useTranslation } from 'react-i18next';
import { Card } from 'components/Form/Card';
import Row from 'components/Form/Row';

const DnsSecurityCard = (props: { data: any, title: string, actionButtons: any }): JSX.Element => {
  const { t } = useTranslation();
  const { caa = [], receivesMail, mtaSts, tlsRpt } = props.data;
  const issuers = caa.filter((c: any) => c.tag === 'issue' || c.tag === 'issuewild').map((c: any) => c.value);
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      <Row lbl="" val="">
        <span className="lbl">CAA</span>
        <span className="val">{caa.length ? `✅ ${[...new Set(issuers)].join(', ') || t('dnsSecurity.caaPresent')}` : `❌ ${t('wordpress.no')}`}</span>
      </Row>
      {receivesMail ? <>
        <Row lbl="" val="">
          <span className="lbl">MTA-STS</span>
          <span className="val">{mtaSts ? `${mtaSts.mode === 'enforce' ? '✅' : '⚠️'} ${mtaSts.mode || t('dnsSecurity.noPolicy')}` : `❌ ${t('wordpress.no')}`}</span>
        </Row>
        <Row lbl="" val="">
          <span className="lbl">TLS-RPT</span>
          <span className="val">{tlsRpt ? `✅ ${t('wordpress.yes')}` : `❌ ${t('wordpress.no')}`}</span>
        </Row>
      </> : <p className="small text-soft mt-2 mb-0">{t('dnsSecurity.noMail')}</p>}
    </Card>
  );
};

export default DnsSecurityCard;
