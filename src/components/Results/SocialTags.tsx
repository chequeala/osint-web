import styled from 'styled-components';

import { Card } from 'components/Form/Card';
import { tl } from 'i18n';
import Row from 'components/Form/Row';
import colors from 'styles/colors';

const ImagePreview = styled.div`
  padding: 0.5rem 0.25rem;
  .lbl { display: block; font-weight: 600; margin-bottom: 0.4rem; }
  img {
    display: block;
    max-width: 100%;
    max-height: 14rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    margin-bottom: 0.4rem;
  }
  a { font-size: 0.85rem; word-break: break-all; }
`;

const cardStyles = `
 .banner-image img {
   width: 100%;
   border-radius: 4px;
   margin: 0.5rem 0;
 }
 .color-field {
   border-radius: 4px;
   &:hover {
      color: ${colors.primary};
   }
 }
`;

const SocialTagsCard = (props: {data: any, title: string, actionButtons: any }): JSX.Element => {
const tags = props.data;
return (
<Card heading={props.title} actionButtons={props.actionButtons} styles={cardStyles}>
{ tags.title && <Row lbl="Title" val={tags.title} /> }
{ tags.description && <Row lbl="Description" val={tags.description} /> }
{ tags.keywords && <Row lbl="Keywords" val={tags.keywords} /> }
{ tags.canonicalUrl && <Row lbl="Canonical URL" val={tags.canonicalUrl} /> }
{ tags.themeColor && <Row lbl="" val="">
<span className="lbl">{tl('Theme Color')}</span>
<span className="val color-field" style={{background: tags.themeColor}}>{tags.themeColor}</span>
</Row> }
{ tags.twitterSite && <Row lbl="" val="">
<span className="lbl">{tl('Twitter Site')}</span>
<span className="val"><a href={`https://x.com/${tags.twitterSite}`}>{tags.twitterSite}</a></span>
</Row> }
{ tags.author && <Row lbl="Author" val={tags.author} />}
{ tags.publisher && <Row lbl="Publisher" val={tags.publisher} />}
{ tags.generator && <Row lbl="Generator" val={tags.generator} />}
{/* La imagen la descarga el servidor de veni (ogImageData): cargarla desde el sitio
    analizado le revelaría la IP de quien usa veni */}
{ (tags.ogImage || tags.twitterImage) && <ImagePreview>
  <span className="lbl">{tl('Image')}</span>
  { tags.ogImageData && <img src={tags.ogImageData} alt="" /> }
  <a href={tags.ogImage || tags.twitterImage} target="_blank" rel="noopener noreferrer nofollow">{tags.ogImage || tags.twitterImage}</a>
</ImagePreview> }
</Card>
);
}

export default SocialTagsCard;