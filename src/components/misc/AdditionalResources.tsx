import styled from 'styled-components';
import { Card } from 'components/Form/Card';
import { useTranslation } from 'react-i18next';
import { CONTACT_EMAIL } from 'config';

const ResourceListOuter = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0.5rem 0 0;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  a.resource-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.75rem 1rem;
    background: var(--vt-green);
    border: 1px solid transparent;
    border-radius: 0.75rem;
    color: var(--ink);
    height: 100%;
    transition: all 0.2s ease-in-out;
    &:hover {
      background: var(--vt-purple-tint);
      border-color: var(--vt-purple-soft);
    }
  }
  p {
    margin: 0;
  }
  .resource-title {
    font-weight: 700;
  }
  .resource-host {
    color: var(--vt-purple-deep);
    font-size: 0.85rem;
  }
  .resource-description {
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
`;

const Note = styled.small`
  margin-top: 1rem;
  color: var(--ink-soft);
  display: block;
`;

const CardStyles = `
  margin: 1rem 0;
  position: relative;
`;

// {URL} se reemplaza por el dominio analizado
const resources = [
  { title: 'SSL Labs', link: 'https://www.ssllabs.com/ssltest/', key: 'ssllabs',
    searchLink: 'https://www.ssllabs.com/ssltest/analyze.html?d={URL}' },
  { title: 'VirusTotal', link: 'https://www.virustotal.com/', key: 'virustotal',
    searchLink: 'https://www.virustotal.com/gui/domain/{URL}' },
  { title: 'Shodan', link: 'https://www.shodan.io/', key: 'shodan',
    searchLink: 'https://www.shodan.io/search?query=hostname%3A{URL}' },
  { title: 'Internet Archive', link: 'https://web.archive.org/', key: 'archive',
    searchLink: 'https://web.archive.org/web/*/{URL}' },
  { title: 'URLScan', link: 'https://urlscan.io/', key: 'urlscan',
    searchLink: 'https://urlscan.io/search/#{URL}' },
  { title: 'Sucuri SiteCheck', link: 'https://sitecheck.sucuri.net/', key: 'sucuri',
    searchLink: 'https://sitecheck.sucuri.net/results/{URL}' },
  { title: 'DomainTools', link: 'https://whois.domaintools.com/', key: 'domaintools',
    searchLink: 'https://whois.domaintools.com/{URL}' },
  { title: 'NsLookup.io', link: 'https://www.nslookup.io/', key: 'nslookup',
    searchLink: 'https://www.nslookup.io/domains/{URL}/dns-records/' },
  { title: 'DNS Checker', link: 'https://dnschecker.org/', key: 'dnschecker',
    searchLink: 'https://dnschecker.org/#A/{URL}' },
  { title: 'Censys', link: 'https://search.censys.io/', key: 'censys',
    searchLink: 'https://search.censys.io/search?resource=hosts&q={URL}' },
  { title: 'PageSpeed Insights', link: 'https://pagespeed.web.dev/', key: 'pagespeed',
    searchLink: 'https://pagespeed.web.dev/analysis?url=https%3A%2F%2F{URL}' },
  { title: 'BuiltWith', link: 'https://builtwith.com/', key: 'builtwith',
    searchLink: 'https://builtwith.com/{URL}' },
  { title: 'DNSDumpster', link: 'https://dnsdumpster.com/', key: 'dnsdumpster' },
  { title: 'Internet.nl', link: 'https://internet.nl/', key: 'internetnl',
    searchLink: 'https://internet.nl/site/{URL}/' },
  { title: 'Security Headers', link: 'https://securityheaders.com/', key: 'securityheaders',
    searchLink: 'https://securityheaders.com/?q={URL}&followRedirects=on' },
  { title: 'Cloudflare Radar', link: 'https://radar.cloudflare.com/', key: 'radar',
    searchLink: 'https://radar.cloudflare.com/domains/domain/{URL}' },
];

const toHostname = (scanUrl: string): string => {
  try {
    return new URL(scanUrl.includes('://') ? scanUrl : `https://${scanUrl}`).hostname;
  } catch {
    return scanUrl;
  }
};

const makeLink = (resource: { link: string, searchLink?: string }, scanUrl: string | undefined): string => {
  if (!scanUrl || !resource.searchLink) return resource.link;
  return resource.searchLink.split('{URL}').join(encodeURIComponent(toHostname(scanUrl)));
};

const AdditionalResources = (props: { url?: string }): JSX.Element => {
  const { t } = useTranslation();
  return (<Card heading={t('additionalresources.note.heading')} styles={CardStyles}>
    <ResourceListOuter>
      {resources.map((resource) => (
        <li key={resource.key}>
          <a className="resource-wrap" target="_blank" rel="noopener noreferrer" href={makeLink(resource, props.url)}>
            <p className="resource-title">
              {resource.title}<i className="bi bi-box-arrow-up-right ms-2 small" aria-hidden="true"></i>
            </p>
            <p className="resource-host">{new URL(resource.link).hostname}</p>
            <p className="resource-description">{t(`additionalresources.items.${resource.key}`)}</p>
          </a>
        </li>
      ))}
    </ResourceListOuter>
    <Note>
      {t('additionalresources.note.disclaimer')}
      <br />
      {t('additionalresources.note.availability')}{' '}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
    </Note>
  </Card>);
}

export default AdditionalResources;
