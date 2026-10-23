
import colors from 'styles/colors';
import { tl } from 'i18n';
import { Card } from 'components/Form/Card';
import Row from 'components/Form/Row';

const cardStyles = `
span.val {
  &.up { color: ${colors.success}; }
  &.down { color: ${colors.danger}; }
}
`;

const ServerStatusCard = (props: { data: any, title: string, actionButtons: any }): JSX.Element => {
  const serverStatus = props.data;
  return (
    <Card heading={props.title} actionButtons={props.actionButtons} styles={cardStyles}>
      <Row lbl="" val="">
        <span className="lbl">{tl('Is Up?')}</span>
        { serverStatus.isUp ? <span className="val up">✅ {tl('Online')}</span> : <span className="val down">❌ {tl('Offline')}</span>}
      </Row>
      <Row lbl="Status Code" val={serverStatus.responseCode} />
      { serverStatus.responseTime && <Row lbl="Response Time" val={`${Math.round(serverStatus.responseTime)}ms`} /> }
    </Card>
  );
}

export default ServerStatusCard;
