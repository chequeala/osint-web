import styled from 'styled-components';
import { type Doc } from 'utils/docs';
import { getDocs } from 'utils/get-docs';
import i18n from 'i18n';
import Heading from 'components/Form/Heading';

const JobDocsContainer = styled.div`
p.doc-desc, p.doc-uses, ul {
  margin: 0.25rem auto 1.5rem auto;
}
ul {
  padding: 0 0.5rem 0 1rem;
}
ul li a {
  color: var(--vt-purple-deep);
}
summary { color: var(--vt-purple-deep);}
h4 {
  border-top: 1px solid var(--vt-purple-deep);
  color: var(--vt-purple-deep);
  opacity: 0.75;
  padding: 0.5rem 0;
}
`;

// Se llama como función (no como componente) desde Results, así que no usa hooks
const DocContent = (id: string) => {
  const { docs } = getDocs();
  const doc = docs.filter((doc: Doc) => doc.id === id)[0] || null;
  return (
    doc ? (<JobDocsContainer>
      <Heading as="h3" size="medium" color="var(--vt-purple-deep)">{doc.title}</Heading>
      <Heading as="h4" size="small">{i18n.t('docContent.about')}</Heading>
      <p className="doc-desc">{doc.description}</p>
      {doc.use && <>
        <Heading as="h4" size="small">{i18n.t('docContent.useCases')}</Heading>
        <p className="doc-uses">{doc.use}</p>
      </>}
      {doc.resources.length > 0 && <>
        <Heading as="h4" size="small">{i18n.t('docContent.links')}</Heading>
        <ul>
          {doc.resources.map((resource: string | { title: string, link: string }, index: number) => (
            typeof resource === 'string' ? (
              <li key={index}><a target="_blank" rel="noreferrer" href={resource}>{resource}</a></li>
            ) : (
              <li key={index}><a target="_blank" rel="noreferrer" href={resource.link}>{resource.title}</a></li>
            )
          ))}
        </ul>
      </>}
    </JobDocsContainer>)
  : (
    <JobDocsContainer>
      <p>{i18n.t('docContent.noDocsProvided')}</p>
    </JobDocsContainer>
    ));
};

export default DocContent;
