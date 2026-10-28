
import { Card } from 'components/Form/Card';
import Row from 'components/Form/Row';
import Heading from 'components/Form/Heading';
import colors from 'styles/colors';
import { FormEvent, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const SelectorForm = styled.form`
  margin-top: 0.75rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--border);
  label { display: block; margin-bottom: 0.25rem; color: var(--ink-soft); }
`;

const cardStyles = ``;

const MailConfigCard = (props: {data: any, title: string, actionButtons: any, onSelector?: (selector: string) => Promise<void> }): JSX.Element => {
  const { t } = useTranslation();
  const [selector, setSelector] = useState(props.data.customSelector || '');
  const [checking, setChecking] = useState(false);
  const checkSelector = (event: FormEvent) => {
    event.preventDefault();
    if (!props.onSelector || !/^[a-z0-9][a-z0-9._-]{0,62}$/i.test(selector.trim())) return;
    setChecking(true);
    props.onSelector(selector.trim()).finally(() => setChecking(false));
  };
  const mailServer = props.data;
  const mailServices = mailServer.mailServices || [];
  const txtRecords = (mailServer.txtRecords || []).join('').toLowerCase() || '';
  return (
    <Card heading={props.title} actionButtons={props.actionButtons} styles={cardStyles}>
      {/* Con www.ejemplo.org se revisa el correo de ejemplo.org: se dice cuál, para no confundir */}
      { mailServer.domain && <Row lbl={t('mailConfig.domain')} val={mailServer.domain} /> }
      <Heading as="h3" color={colors.primary} size="small">{t('mailConfig.checklist')}</Heading>
      <Row lbl="SPF" val={txtRecords.includes('spf')} />
      <Row lbl="DKIM" title={t('mailConfig.dkimNote')} val={txtRecords.includes('dkim')} />
      <Row lbl="DMARC" val={txtRecords.includes('dmarc')} />
      <Row lbl="BIMI" val={txtRecords.includes('bimi')} />

      { mailServer.mxRecords && <Heading as="h3" color={colors.primary} size="small">{t('mailConfig.mx')}</Heading>}
      { mailServer.mxRecords && mailServer.mxRecords.map((record: any, index: number) => (
          <Row lbl="" val="" key={index}>
            <span>{record.exchange}</span>
            <span>{record.priority ? `${t('mailConfig.priority')}: ${record.priority}` : ''}</span>
          </Row>
        ))
      }
      { mailServices.length > 0 && <Heading as="h3" color={colors.primary} size="small">{t('mailConfig.services')}</Heading>}
      { mailServices.map((service: any, index: number) => (
        <Row lbl={service.provider} title={service.value} val="" key={index} />
        ))
      }

      { !txtRecords.includes('dkim') && <p className="small text-soft mt-2 mb-0">{t('mailConfig.dkimNote')}</p> }
      { props.onSelector && (
        <SelectorForm onSubmit={checkSelector}>
          <label htmlFor="dkim-selector" className="small">{t('mailConfig.selectorLabel')}</label>
          <div className="d-flex gap-2">
            <input id="dkim-selector" className="form-control form-control-sm" value={selector} placeholder="selector1"
              onChange={e => setSelector(e.target.value)} autoCapitalize="off" spellCheck={false} />
            <button type="submit" className="btn btn-sm btn-outline-brand rounded-pill px-3" disabled={checking || !selector.trim()}>
              {checking ? '…' : t('mailConfig.selectorButton')}
            </button>
          </div>
          { props.data.customSelector && <p className="small mt-1 mb-0">
            {(props.data.dkimSelectors || []).includes(props.data.customSelector)
              ? `✅ ${t('mailConfig.selectorFound', { selector: props.data.customSelector })}`
              : `❌ ${t('mailConfig.selectorNotFound', { selector: props.data.customSelector })}`}
          </p> }
        </SelectorForm>
      )}

      { mailServer.txtRecords && <Heading as="h3" color={colors.primary} size="small">{t('mailConfig.txt')}</Heading>}
      { mailServer.txtRecords && mailServer.txtRecords.map((record: any, index: number) => (
          <Row lbl="" val="" key={index}>
            <span>{record}</span>
          </Row>
        ))
      }
    </Card>
  );
}

export default MailConfigCard;
