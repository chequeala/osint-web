import styled from 'styled-components';
import { Card } from 'components/Form/Card';
import Row from 'components/Form/Row';
import colors from 'styles/colors';

const LearnMoreInfo = styled.p`
font-size: 0.8rem;
margin-top: 0.5rem;
opacity: 0.75;
a { color: ${colors.primary}; }
`;

const CarbonCard = (props: { data: any, title: string, actionButtons: any }): JSX.Element => {
const carbons = props.data.statistics;

return (
<Card heading={props.title} actionButtons={props.actionButtons}>
{ !carbons?.adjustedBytes && <p>Unable to calculate carbon footprint for host</p>}
{ carbons?.adjustedBytes > 0 && <>
<Row lbl="HTML Initial Size" val={`${carbons.adjustedBytes} bytes`} />
<Row lbl="CO2 for Initial Load" val={`${(carbons.co2.grid.grams * 1000).toPrecision(4)} grams`} />
<Row lbl="Energy Usage for Load" val={`${(carbons.energy * 1000).toPrecision(4)} KWg`} />
</>}
<br />
<LearnMoreInfo>Learn more at <a href="https://www.websitecarbon.com/">websitecarbon.com</a></LearnMoreInfo>
</Card>
);
}

export default CarbonCard;