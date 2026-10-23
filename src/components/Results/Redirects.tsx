import colors from 'styles/colors';
import { tl } from 'i18n';
import { Card } from 'components/Form/Card';
import Row from 'components/Form/Row';

const cardStyles = `
 div {
   justify-content: flex-start;
   align-items: baseline; 
 }
 .arrow-thing {
    color: ${colors.primary};
   font-size: 1.8rem;
   font-weight: bold;
   margin-right: 0.5rem;
 }
 .redirect-count {
   color: ${colors.textColorSecondary};
   margin: 0;
 }
`;

const RedirectsCard = (props: { data: any, title: string, actionButtons: any }): JSX.Element => {
const redirects = props.data;
return (
<Card heading={props.title} actionButtons={props.actionButtons} styles={cardStyles}>
{ !redirects?.redirects.length && <Row lbl="" val="No redirects" />}
<p className="redirect-count">
{tl(redirects.redirects.length === 1 ? 'Followed 1 redirect' : 'Followed {{count}} redirects').replace('{{count}}', String(redirects.redirects.length))}
</p>
{redirects.redirects.map((redirect: any, index: number) => {
return (
<Row lbl="" val="" key={index}>
<span className="arrow-thing">↳</span> {redirect}
</Row>
);
})}
</Card>
);
}

export default RedirectsCard;