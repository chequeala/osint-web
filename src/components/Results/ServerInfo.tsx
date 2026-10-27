import { ServerInfo } from 'utils/result-processor';
import styled from 'styled-components';
import { tl } from 'i18n';
import { Card } from 'components/Form/Card';
import Row from 'components/Form/Row';
import colors from 'styles/colors';

const Source = styled.p`
  font-size: 0.8rem;
  margin-top: 0.5rem;
  opacity: 0.75;
  a { color: ${colors.primary}; }
`;

const RawRow = ({ lbl, val }: { lbl: string, val: string }) => (
  <Row lbl="" val="">
    <span className="lbl">{tl(lbl)}</span>
    <span className="val">{val}</span>
  </Row>
);

const ServerInfoCard = (props: { data: ServerInfo, title: string, actionButtons: any }): JSX.Element => {
  const info = props.data;
  const { ports, ip, software, vulns, type } = info;
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      { ip && <Row lbl="IP" val={ip} /> }
      {/* Con val, Row interpreta "nginx 1.27.5" o el puerto "2020" como fechas */}
      { ports && <RawRow lbl="Ports" val={ports} /> }
      { software && <RawRow lbl="Software" val={software} /> }
      <Row lbl="Known vulnerabilities" val={vulns || tl('None found')} />
      { type && <RawRow lbl="Shodan tags" val={type.split(', ').map(tag => tl(tag)).join(', ')} /> }
      <Source>{tl('Source')}: <a href="https://internetdb.shodan.io/" target="_blank" rel="noreferrer">InternetDB (Shodan)</a></Source>
    </Card>
  );
}

export default ServerInfoCard;
