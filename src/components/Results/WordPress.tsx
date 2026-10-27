import { useTranslation } from 'react-i18next';
import { Card } from 'components/Form/Card';
import Row, { ListRow } from 'components/Form/Row';
import Heading from 'components/Form/Heading';
import colors from 'styles/colors';

const WordPressCard = (props: { data: any, title: string, actionButtons: any }): JSX.Element => {
  const { t } = useTranslation();
  const wp = props.data;
  const users: string[] = wp.users || [];
  const plugins: { slug: string, name: string | null, version: string | null, latest: string | null, status: string }[] = wp.plugins || [];
  const pluginState = (p: typeof plugins[number]) => {
    if (p.status === 'closed') return `❌ ${t('wordpress.pluginClosed')}`;
    if (p.status === 'outdated') return `⚠️ ${p.version} (${t('wordpress.pluginLatest', { latest: p.latest })})`;
    if (p.status === 'current') return `✅ ${p.version}`;
    if (p.status === 'notListed') return `${p.version || t('wordpress.pluginNoVersion')} · ${t('wordpress.pluginNotListed')}`;
    return p.version || t('wordpress.pluginNoVersion');
  };
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      {/* Con val, Row interpreta "7.1.3" como una fecha (1 de julio de 2003) */}
      <Row lbl="" val="">
        <span className="lbl">{t('wordpress.version')}</span>
        <span className="val">{wp.version || t('wordpress.hidden')}</span>
      </Row>
      { wp.latestVersion && (
        <Row lbl="" val="">
          <span className="lbl">{t('wordpress.latest')}</span>
          <span className="val">{wp.latestVersion}</span>
        </Row>
      )}
      <Row lbl={t('wordpress.usersExposed')} val={wp.usersExposed ? `❌ ${t('wordpress.yes')}` : `✅ ${t('wordpress.no')}`} />
      <Row lbl={t('wordpress.xmlrpc')} val={wp.xmlrpcEnabled ? `❌ ${t('wordpress.yes')}` : `✅ ${t('wordpress.no')}`} />
      { users.length > 0 && <ListRow title={t('wordpress.usersTitle')} list={users} /> }
      {/* Filas sin val: Row interpretaría "5.4.8.1" como fecha */}
      { plugins.length > 0 && <>
        <Heading as="h4" size="small" align="left" color={colors.primary}>{t('wordpress.pluginsTitle')}</Heading>
        { plugins.map(p => (
          <Row key={p.slug} lbl="" val="">
            <span className="lbl" title={p.slug}>{p.name || p.slug}</span>
            <span className="val">{pluginState(p)}</span>
          </Row>
        ))}
      </> }
    </Card>
  );
};

export default WordPressCard;
