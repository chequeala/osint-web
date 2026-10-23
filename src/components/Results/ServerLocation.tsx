
import styled from 'styled-components';
import { tl } from 'i18n';
import { ServerLocation } from 'utils/result-processor';
import { Card } from 'components/Form/Card';
import LocationMap from 'components/misc/LocationMap';
import Flag from 'components/misc/Flag';
import Row, { StyledRow } from 'components/Form/Row';
import { useTranslation } from 'react-i18next'; 

const cardStyles = '';

const SmallText = styled.span`
opacity: 0.5;
text-align: right;
display: block;
`;

const MapRow = styled(StyledRow)`
padding-top: 1rem;
flex-direction: column;
`;

const CountryValue = styled.span`
display: flex;
gap: 0.5rem;
`;

const ServerLocationCard = (props: { data: ServerLocation, title: string, actionButtons: any }): JSX.Element => {
const { t } = useTranslation(); 
const location = props.data;
const {
city, region, country,
postCode, countryCode, coords,
isp, timezone, languages, currency, currencyCode,
} = location;

return (
<Card heading={props.title} actionButtons={props.actionButtons} styles={cardStyles}>
    <Row lbl={t('serverLocation.city')} val={[postCode, city, region].filter(Boolean).join(', ')} />
    <Row lbl="" val="">
        <b>{t('serverLocation.country')}</b>
        <CountryValue>
            {country}
            { countryCode && <Flag countryCode={countryCode} width={28} /> }
        </CountryValue>
    </Row>
    { timezone && <Row lbl={t('serverLocation.timezone')} val={timezone} /> }
    {/* ipwho.is no entrega idiomas ni moneda en el plan gratuito */}
    { languages && <Row lbl={t('serverLocation.languages')} val={languages} /> }
    { currency && <Row lbl={t('serverLocation.currency')} val={`${currency} (${currencyCode})`} /> }
    <MapRow>
        <LocationMap lat={coords.latitude} lon={coords.longitude} label={`${tl('Server')} (${isp})`} />
        <SmallText>{t('serverLocation.latitude_longitude', { latitude: coords.latitude, longitude: coords.longitude })}</SmallText>
    </MapRow>
</Card>
);
}

export default ServerLocationCard;