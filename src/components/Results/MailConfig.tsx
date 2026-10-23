
import { Card } from 'components/Form/Card';
import Row from 'components/Form/Row';
import Heading from 'components/Form/Heading';
import colors from 'styles/colors';
import { useTranslation } from 'react-i18next';

const cardStyles = ``;

const MailConfigCard = (props: {data: any, title: string, actionButtons: any }): JSX.Element => {
  const { t } = useTranslation();
  const mailServer = props.data;
  const mailServices = mailServer.mailServices || [];
  const txtRecords = (mailServer.txtRecords || []).join('').toLowerCase() || '';
  return (
    <Card heading={props.title} actionButtons={props.actionButtons} styles={cardStyles}>
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
