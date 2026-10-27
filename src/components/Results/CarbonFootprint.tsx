import styled from 'styled-components';
import { tl } from 'i18n';
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
const carbon = props.data;
const green = carbon?.greenHosting;

return (
<Card heading={props.title} actionButtons={props.actionButtons}>
{ !carbon?.bytes && <p>{tl('Unable to calculate carbon footprint for host')}</p>}
{ carbon?.bytes > 0 && <>
<Row lbl="HTML Initial Size" val={`${carbon.bytes} bytes`} />
<Row lbl="CO2 for Initial Load" val={`${carbon.co2Grams} ${tl('grams')}`} />
{ green !== null && green !== undefined && (
<Row lbl="Green hosting" val={green ? `✅ ${tl('Yes')}${carbon.hostedBy ? ` (${carbon.hostedBy})` : ''}` : `❌ ${tl('No')}`} />
)}
</>}
<br />
<LearnMoreInfo>{tl('Learn more at')} <a href="https://www.thegreenwebfoundation.org/" target="_blank" rel="noreferrer">The Green Web Foundation</a></LearnMoreInfo>
</Card>
);
}

export default CarbonCard;