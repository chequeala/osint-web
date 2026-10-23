import { useState, useEffect, useCallback, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { ToastContainer } from 'react-toastify';
import Masonry from 'react-masonry-css'

import Heading from 'components/Form/Heading';
import Modal from 'components/Form/Modal';
import Nav from 'components/Form/Nav';
import { RowProps }  from 'components/Form/Row';

import Loader from 'components/misc/Loader';
import ErrorBoundary from 'components/misc/ErrorBoundary';
import SelfScanMsg from 'components/misc/SelfScanMsg';
import DocContent from 'components/misc/DocContent';
import ProgressBar, { LoadingJob, LoadingState, initialJobs } from 'components/misc/ProgressBar';
import ActionButtons from 'components/misc/ActionButtons';
import AdditionalResources from 'components/misc/AdditionalResources';
import ViewRaw from 'components/misc/ViewRaw';

import ServerLocationCard from 'components/Results/ServerLocation';
import ServerInfoCard from 'components/Results/ServerInfo';
import HostNamesCard from 'components/Results/HostNames';
import WhoIsCard from 'components/Results/WhoIs';
import LighthouseCard from 'components/Results/Lighthouse';
import ScreenshotCard from 'components/Results/Screenshot';
import SslCertCard from 'components/Results/SslCert';
import HeadersCard from 'components/Results/Headers';
import CookiesCard from 'components/Results/Cookies';
import RobotsTxtCard from 'components/Results/RobotsTxt';
import DnsRecordsCard from 'components/Results/DnsRecords';
import RedirectsCard from 'components/Results/Redirects';
import TxtRecordCard from 'components/Results/TxtRecords';
import ServerStatusCard from 'components/Results/ServerStatus';
import OpenPortsCard from 'components/Results/OpenPorts';
import TraceRouteCard from 'components/Results/TraceRoute';
import CarbonFootprintCard from 'components/Results/CarbonFootprint';
import SiteFeaturesCard from 'components/Results/SiteFeatures';
import DnsSecCard from 'components/Results/DnsSec';
import HstsCard from 'components/Results/Hsts';
import SitemapCard from 'components/Results/Sitemap';
import DomainLookup from 'components/Results/DomainLookup';
import DnsServerCard from 'components/Results/DnsServer';
import TechStackCard from 'components/Results/TechStack';
import SecurityTxtCard from 'components/Results/SecurityTxt';
import ContentLinksCard from 'components/Results/ContentLinks';
import SocialTagsCard from 'components/Results/SocialTags';
import MailConfigCard from 'components/Results/MailConfig';
import HttpSecurityCard from 'components/Results/HttpSecurity';
import FirewallCard from 'components/Results/Firewall';
import ArchivesCard from 'components/Results/Archives';
import RankCard from 'components/Results/Rank';
import BlockListsCard from 'components/Results/BlockLists';
import ThreatsCard from 'components/Results/Threats';
import WordPressCard from 'components/Results/WordPress';
import Summary from 'components/misc/Summary';
import { useTranslation } from 'react-i18next';

import keys from 'utils/get-keys';
import { determineAddressType, AddressType } from 'utils/address-type-checker';
import useMotherHook from 'hooks/motherOfAllHooks';
import {
  getLocation, ServerLocation,
  Cookie,
  applyWhoIsResults, Whois,
  parseShodanResults, ShodanResults
} from 'utils/result-processor';

const ResultsOuter = styled.div`
  display: flex;
  flex-direction: column;
  .masonry-grid {
    display: flex;
    width: auto;
  }
  padding-bottom: 3rem;
  .masonry-grid-col section { margin: 1rem 0.5rem; }
  .tophead { font-size: clamp(1.4rem, 1rem + 1.5vw, 2rem); font-weight: 700; }
  .tophead a { color: var(--ink); }
  .tophead i { color: var(--vt-purple); }
`;

const ResultsContent = styled.section`
  width: 95vw;
  display: grid;
  grid-auto-flow: dense;
  grid-template-columns: repeat(auto-fit, minmax(min(400px, 100%), 1fr));
  gap: 1rem;
  margin: auto;
  width: 100%;
  padding-bottom: 1rem;
`;

const FilterButtons = styled.div`
  width: 100%;
  margin: auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  .one-half {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }
  .group-label {
    font-weight: 600;
  }
  button, .toggle-filters {
    background: var(--surface);
    color: var(--vt-purple-deep);
    border: 1px solid var(--vt-purple-soft);
    border-radius: 50rem;
    padding: 0.25rem 0.9rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    &:hover {
      background: var(--vt-purple-tint);
      border-color: var(--vt-purple);
    }
    &.selected {
      background: var(--vt-purple);
      border-color: var(--vt-purple);
      color: #fff;
    }
  }
  input {
    border: 1px solid var(--border);
    border-radius: 50rem;
    padding: 0.25rem 0.9rem;
    &:focus {
      border-color: var(--vt-purple-soft);
      outline: none;
      box-shadow: 0 0 0 0.25rem rgba(128, 79, 220, 0.2);
    }
  }
  .clear {
    background: none;
    border: none;
    color: var(--vt-purple-deep);
    text-decoration: underline;
    font-size: 0.85rem;
    padding: 0;
  }
  .control-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }
`;

const Results = (): JSX.Element => {
  const { t } = useTranslation();
  const startTime = new Date().getTime();

  const [ addressType, setAddressType ] = useState<AddressType>('empt');
  const { address } = useParams();

  const [loadingJobs, setLoadingJobs] = useState<LoadingJob[]>(initialJobs);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode>(<></>);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);

  const clearFilters = () => {
    setTags([]);
    setSearchTerm('');
  };
  const updateTags = (tag: string) => {
    // Remove current tag if it exists, otherwise add it
    // setTags(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]);
    setTags(tags.includes(tag) ? tags.filter(t => t !== tag) : [tag]);
  };

  const updateLoadingJobs = useCallback((jobs: string | string[], newState: LoadingState, error?: string, retry?: () => void, data?: any) => {
    (typeof jobs === 'string' ? [jobs] : jobs).forEach((job: string) => {
    const now = new Date();
    const timeTaken = now.getTime() - startTime;
    setLoadingJobs((prevJobs) => {
      const newJobs = prevJobs.map((loadingJob: LoadingJob) => {
        if (job === loadingJob.name) {
          return { ...loadingJob, error, state: newState, timeTaken, retry };
        }
        return loadingJob;
      });

      const timeString = `[${now.getHours().toString().padStart(2, '0')}:`
        +`${now.getMinutes().toString().padStart(2, '0')}:`
        + `${now.getSeconds().toString().padStart(2, '0')}]`;


      if (newState === 'success') {
        console.log(
          `%cFetch Success - ${job}%c\n\n${timeString}%c The ${job} job succeeded in ${timeTaken}ms`
          + `\n%cRun %cwindow.webCheck['${job}']%c to inspect the raw the results`,
          `background:"green";color:"blue";padding: 4px 8px;font-size:16px;`,
          `font-weight: bold; color: "green;`,
          `color: "green;`,
          `color: #1d8242;`,`color: #1d8242;text-decoration:underline;`,`color: #1d8242;`,
        );
        if (!(window as any).webCheck) (window as any).webCheck = {};
        if (data) (window as any).webCheck[job] = data;
      }
  
      if (newState === 'error') {
        console.log(
          `%cFetch Error - ${job}%c\n\n${timeString}%c The ${job} job failed `
          +`after ${timeTaken}ms, with the following error:%c\n${error}`,
          `background: red; padding: 4px 8px; font-size: 16px;`,
          `font-weight: bold; color: red;`,
          `color: red;`,
          `color: yellow;`,
        );
      }
      return newJobs;
    });
  });
  }, [startTime]);

  const parseJson = (response: Response): Promise<any> => {
    if (response.status === 429) return Promise.resolve({ error: t('results.rateLimited') });
    return new Promise((resolve) => {
        response.json()
          .then(data => resolve(data))
          .catch(error => resolve(
            { error: `Failed to get a valid response 😢\n`
            + `This is likely due the target not exposing the required data, `
            + `or limitations in how Netlify executes lambda functions, such as the 10-sec timeout.\n\n`
            + `Error info:\n${error}`}
          ));
    });
  };

  const urlTypeOnly = ['url'] as AddressType[]; // Many jobs only run with these address types

  const api = process.env.REACT_APP_API_ENDPOINT || '/api'; // Where is the API hosted?

  // Fetch and parse IP address for given URL
  const [ipAddress, setIpAddress] = useMotherHook({
    jobId: 'get-ip',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/get-ip?url=${address}`)
    .then(res => parseJson(res))
    .then(res => res.ip),
  });

  useEffect(() => {
    if (!addressType || addressType === 'empt') {
      setAddressType(determineAddressType(address || ''));
    }
    if (addressType === 'ipV4' && address) {
      setIpAddress(address);
    }
  }, [address, addressType, setIpAddress]);  

  // Get IP address location info
  const [locationResults, updateLocationResults] = useMotherHook<ServerLocation>({
    jobId: 'location',
    updateLoadingJobs,
    addressInfo: { address: ipAddress, addressType: 'ipV4', expectedAddressTypes: ['ipV4', 'ipV6'] },
    fetchRequest: () => fetch(`${api}/location?url=${ipAddress}`)
      .then(res => parseJson(res))
      .then(res => getLocation(res)),
  });

  // Fetch and parse SSL certificate info
  const [sslResults, updateSslResults] = useMotherHook({
    jobId: 'ssl',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/ssl?url=${address}`).then((res) => parseJson(res)),
  });

  // Run a manual whois lookup on the domain
  const [domainLookupResults, updateDomainLookupResults] = useMotherHook({
    jobId: 'domain',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/whois?url=${address}`).then(res => parseJson(res)),
  });

  // Fetch and parse Lighthouse performance data
  const [lighthouseResults, updateLighthouseResults] = useMotherHook({
    jobId: 'quality',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/quality?url=${address}`)
      .then(res => parseJson(res))
      .then(res => res?.skipped ? res : (res?.lighthouseResult || { error: 'No Data'})),
  });

  // Get the technologies used to build site, using Wappalyzer
  const [techStackResults, updateTechStackResults] = useMotherHook({
    jobId: 'tech-stack',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/tech-stack?url=${address}`).then(res => parseJson(res)),
  });

  // Get hostnames and associated domains from Shodan
  const [shoadnResults, updateShodanResults] = useMotherHook<ShodanResults | { skipped: string }>({
    jobId: ['hosts', 'server-info'],
    updateLoadingJobs,
    addressInfo: { address: ipAddress, addressType: 'ipV4', expectedAddressTypes: ['ipV4', 'ipV6'] },
    // Sin clave no se consulta: evita enviar la IP a Shodan para recibir un 401
    fetchRequest: () => !keys.shodan ? Promise.resolve({ skipped: 'Sin clave de Shodan configurada.' }) : fetch(`https://api.shodan.io/shodan/host/${ipAddress}?key=${keys.shodan}`)
      .then(res => parseJson(res))
      .then(res => parseShodanResults(res)),
  });

  // Fetch and parse cookies info
  const [cookieResults, updateCookieResults] = useMotherHook<{cookies: Cookie[]}>({
    jobId: 'cookies',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/cookies?url=${address}`)
      .then(res => parseJson(res)),
  });

  // Fetch and parse headers
  const [headersResults, updateHeadersResults] = useMotherHook({
    jobId: 'headers',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/headers?url=${address}`).then(res => parseJson(res)),
  });

  // Fetch and parse DNS records
  const [dnsResults, updateDnsResults] = useMotherHook({
    jobId: 'dns',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/dns?url=${address}`).then(res => parseJson(res)),
  });

  // Get HTTP security
  const [httpSecurityResults, updateHttpSecurityResults] = useMotherHook({
    jobId: 'http-security',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/http-security?url=${address}`).then(res => parseJson(res)),
  });

  // Get social media previews, from a sites social meta tags
  const [socialTagResults, updateSocialTagResults] = useMotherHook({
    jobId: 'social-tags',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/social-tags?url=${address}`).then(res => parseJson(res)),
  });

  // Get trace route for a given hostname
  const [traceRouteResults, updateTraceRouteResults] = useMotherHook({
    jobId: 'trace-route',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/trace-route?url=${address}`).then(res => parseJson(res)),
  });

  // Get a websites listed pages, from sitemap
  const [securityTxtResults, updateSecurityTxtResults] = useMotherHook({
    jobId: 'security-txt',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/security-txt?url=${address}`).then(res => parseJson(res)),
  });

  // Get the DNS server(s) for a domain, and test DoH/DoT support
  const [dnsServerResults, updateDnsServerResults] = useMotherHook({
    jobId: 'dns-server',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/dns-server?url=${address}`).then(res => parseJson(res)),
  });

  // Get the WAF and Firewall info for a site
  const [firewallResults, updateFirewallResults] = useMotherHook({
    jobId: 'firewall',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/firewall?url=${address}`).then(res => parseJson(res)),
  });

  // Get DNSSEC info
  const [dnsSecResults, updateDnsSecResults] = useMotherHook({
    jobId: 'dnssec',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/dnssec?url=${address}`).then(res => parseJson(res)),
  });

  // Check if a site is on the HSTS preload list
  const [hstsResults, updateHstsResults] = useMotherHook({
    jobId: 'hsts',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/hsts?url=${address}`).then(res => parseJson(res)),
  });

  // Check if a host is present on the URLHaus malware list
  const [threatResults, updateThreatResults] = useMotherHook({
    jobId: 'threats',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/threats?url=${address}`).then(res => parseJson(res)),
  });

  // Get mail config for server, based on DNS records
  const [mailConfigResults, updateMailConfigResults] = useMotherHook({
    jobId: 'mail-config',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/mail-config?url=${address}`).then(res => parseJson(res)),
  });

  // Get list of archives from the Wayback Machine
  const [archivesResults, updateArchivesResults] = useMotherHook({
    jobId: 'archives',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/archives?url=${address}`).then(res => parseJson(res)),
  });

  // Get website's global ranking, from Tranco
  const [rankResults, updateRankResults] = useMotherHook({
    jobId: 'rank',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/rank?url=${address}`).then(res => parseJson(res)),
  });

  // Take a screenshot of the website
  const [screenshotResult, updateScreenshotResult] = useMotherHook({
    jobId: 'screenshot',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/screenshot?url=${address}`).then(res => parseJson(res)),
  });

  // Usuarios expuestos, xmlrpc.php y versión en sitios WordPress
  const [wordpressResults, updateWordpressResults] = useMotherHook({
    jobId: 'wordpress',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/wordpress?url=${address}`).then(res => parseJson(res)),
  });

  // Fetches URL redirects
  const [redirectResults, updateRedirectResults] = useMotherHook({
    jobId: 'redirects',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/redirects?url=${address}`).then(res => parseJson(res)),
  });

  // Get list of links included in the page content
  const [linkedPagesResults, updateLinkedPagesResults] = useMotherHook({
    jobId: 'linked-pages',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/linked-pages?url=${address}`).then(res => parseJson(res)),
  });

  // Fetch and parse crawl rules from robots.txt
  const [robotsTxtResults, updateRobotsTxtResults] = useMotherHook<{robots: RowProps[]}>({
    jobId: 'robots-txt',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/robots-txt?url=${address}`)
      .then(res => parseJson(res)),
  });

  // Get current status and response time of server
  const [serverStatusResults, updateServerStatusResults] = useMotherHook({
    jobId: 'status',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/status?url=${address}`).then(res => parseJson(res)),
  });

  // Check for open ports
  const [portsResults, updatePortsResults] = useMotherHook({
    jobId: 'ports',
    updateLoadingJobs,
    addressInfo: { address: ipAddress, addressType: 'ipV4', expectedAddressTypes: ['ipV4', 'ipV6'] },
    fetchRequest: () => fetch(`${api}/ports?url=${ipAddress}`)
      .then(res => parseJson(res)),
  });

  // Fetch and parse domain whois results
  const [whoIsResults, updateWhoIsResults] = useMotherHook<Whois | { error: string } | { skipped: string }>({
    jobId: 'whois',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => !keys.whoApi ? Promise.resolve({ skipped: 'Sin clave de WhoAPI configurada.' }) : fetch(`https://api.whoapi.com/?domain=${address}&r=whois&apikey=${keys.whoApi}`)
      .then(res => parseJson(res))
      .then(res => applyWhoIsResults(res)),
  });

  // Fetches DNS TXT records
  const [txtRecordResults, updateTxtRecordResults] = useMotherHook({
    jobId: 'txt-records',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/txt-records?url=${address}`).then(res => parseJson(res)),
  });

  // Check site against DNS blocklists
  const [blockListsResults, updateBlockListsResults] = useMotherHook({
    jobId: 'block-lists',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/block-lists?url=${address}`).then(res => parseJson(res)),
  });

  // Get a websites listed pages, from sitemap
  const [sitemapResults, updateSitemapResults] = useMotherHook({
    jobId: 'sitemap',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/sitemap?url=${address}`).then(res => parseJson(res)),
  });

  // Fetch carbon footprint data for a given site
  const [carbonResults, updateCarbonResults] = useMotherHook({
    jobId: 'carbon',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/carbon?url=${address}`).then(res => parseJson(res)),
  });

  // Get site features from BuiltWith
  const [siteFeaturesResults, updateSiteFeaturesResults] = useMotherHook({
    jobId: 'features',
    updateLoadingJobs,
    addressInfo: { address, addressType, expectedAddressTypes: urlTypeOnly },
    fetchRequest: () => fetch(`${api}/features?url=${address}`)
    .then(res => parseJson(res))
    .then(res => {
      if (res.Errors && res.Errors.length > 0) {
        return { error: `No data returned, because ${res.Errors[0].Message || 'API lookup failed'}` };
      }
      return res;
    }),
  });

  /* Cancel remaining jobs after  10 second timeout */
  useEffect(() => {
    const checkJobs = () => {
      loadingJobs.forEach(job => {
        if (job.state === 'loading') {
          updateLoadingJobs(job.name, 'timed-out');
        }
      });
    };
    const timeoutId = setTimeout(checkJobs, 10000);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [loadingJobs, updateLoadingJobs]);

  const makeSiteName = (address: string): string => {
    try {
      return new URL(address).hostname.replace('www.', '');
    } catch (error) {
      return address;
    }
  }

  // A list of state sata, corresponding component and title for each card
  const resultCardData = [
    {
      id: 'location',
      title: 'Server Location',
      result: locationResults,
      Component: ServerLocationCard,
      refresh: updateLocationResults,
      tags: ['server'],
    }, {
      id: 'ssl',
      title: 'SSL Certificate',
      result: sslResults,
      Component: SslCertCard,
      refresh: updateSslResults,
      tags: ['server', 'security'],
    }, {
      id: 'domain',
      title: 'Domain Whois',
      result: domainLookupResults,
      Component: DomainLookup,
      refresh: updateDomainLookupResults,
      tags: ['server'],
    }, {
      id: 'quality',
      title: 'Quality Summary',
      result: lighthouseResults,
      Component: LighthouseCard,
      refresh: updateLighthouseResults,
      tags: ['client'],
    }, {
      id: 'tech-stack',
      title: 'Tech Stack',
      result: techStackResults,
      Component: TechStackCard,
      refresh: updateTechStackResults,
      tags: ['client', 'meta'],
    }, {
      id: 'server-info',
      title: 'Server Info',
      result: shoadnResults?.serverInfo,
      Component: ServerInfoCard,
      refresh: updateShodanResults,
      tags: ['server'],
    }, {
      id: 'cookies',
      title: 'Cookies',
      result: cookieResults,
      Component: CookiesCard,
      refresh: updateCookieResults,
      tags: ['client', 'security'],
    }, {
      id: 'headers',
      title: 'Headers',
      result: headersResults,
      Component: HeadersCard,
      refresh: updateHeadersResults,
      tags: ['client', 'security'],
    }, {
      id: 'dns',
      title: 'DNS Records',
      result: dnsResults,
      Component: DnsRecordsCard,
      refresh: updateDnsResults,
      tags: ['server'],
    }, {
      id: 'hosts',
      title: 'Host Names',
      result: shoadnResults?.hostnames,
      Component: HostNamesCard,
      refresh: updateShodanResults,
      tags: ['server'],
    }, {
      id: 'http-security',
      title: 'HTTP Security',
      result: httpSecurityResults,
      Component: HttpSecurityCard,
      refresh: updateHttpSecurityResults,
      tags: ['security'],
    }, {
      id: 'social-tags',
      title: 'Social Tags',
      result: socialTagResults,
      Component: SocialTagsCard,
      refresh: updateSocialTagResults,
      tags: ['client', 'meta'],
    }, {
      id: 'trace-route',
      title: 'Trace Route',
      result: traceRouteResults,
      Component: TraceRouteCard,
      refresh: updateTraceRouteResults,
      tags: ['server'],
    }, {
      id: 'security-txt',
      title: 'Security.Txt',
      result: securityTxtResults,
      Component: SecurityTxtCard,
      refresh: updateSecurityTxtResults,
      tags: ['security'],
    }, {
      id: 'dns-server',
      title: 'DNS Server',
      result: dnsServerResults,
      Component: DnsServerCard,
      refresh: updateDnsServerResults,
      tags: ['server'],
    }, {
      id: 'firewall',
      title: 'Firewall',
      result: firewallResults,
      Component: FirewallCard,
      refresh: updateFirewallResults,
      tags: ['server', 'security'],
    }, {
      id: 'dnssec',
      title: 'DNSSEC',
      result: dnsSecResults,
      Component: DnsSecCard,
      refresh: updateDnsSecResults,
      tags: ['security'],
    }, {
      id: 'hsts',
      title: 'HSTS Check',
      result: hstsResults,
      Component: HstsCard,
      refresh: updateHstsResults,
      tags: ['security'],
    }, {
      id: 'threats',
      title: 'Threats',
      result: threatResults,
      Component: ThreatsCard,
      refresh: updateThreatResults,
      tags: ['security'],
    }, {
      id: 'mail-config',
      title: 'Email Configuration',
      result: mailConfigResults,
      Component: MailConfigCard,
      refresh: updateMailConfigResults,
      tags: ['server'],
    }, {
      id: 'archives',
      title: 'Archive History',
      result: archivesResults,
      Component: ArchivesCard,
      refresh: updateArchivesResults,
      tags: ['meta'],
    }, {
      id: 'rank',
      title: 'Global Ranking',
      result: rankResults,
      Component: RankCard,
      refresh: updateRankResults,
      tags: ['meta'],
    }, {
      id: 'screenshot',
      title: 'Screenshot',
      result: screenshotResult || lighthouseResults?.fullPageScreenshot?.screenshot,
      Component: ScreenshotCard,
      refresh: updateScreenshotResult,
      tags: ['client', 'meta'],
    }, {
      id: 'wordpress',
      title: 'WordPress',
      result: wordpressResults,
      Component: WordPressCard,
      refresh: updateWordpressResults,
      tags: ['security'],
    }, {
      id: 'redirects',
      title: 'Redirects',
      result: redirectResults,
      Component: RedirectsCard,
      refresh: updateRedirectResults,
      tags: ['meta'],
    }, {
      id: 'linked-pages',
      title: 'Linked Pages',
      result: linkedPagesResults,
      Component: ContentLinksCard,
      refresh: updateLinkedPagesResults,
      tags: ['client', 'meta'],
    }, {
      id: 'robots-txt',
      title: 'Crawl Rules',
      result: robotsTxtResults,
      Component: RobotsTxtCard,
      refresh: updateRobotsTxtResults,
      tags: ['meta'],
    }, {
      id: 'status',
      title: 'Server Status',
      result: serverStatusResults,
      Component: ServerStatusCard,
      refresh: updateServerStatusResults,
      tags: ['server'],
    }, {
      id: 'ports',
      title: 'Open Ports',
      result: portsResults,
      Component: OpenPortsCard,
      refresh: updatePortsResults,
      tags: ['server'],
    }, {
      id: 'whois',
      title: 'Domain Info',
      result: whoIsResults,
      Component: WhoIsCard,
      refresh: updateWhoIsResults,
      tags: ['server'],
    }, {
      id: 'txt-records',
      title: 'TXT Records',
      result: txtRecordResults,
      Component: TxtRecordCard,
      refresh: updateTxtRecordResults,
      tags: ['server'],
    }, {
      id: 'block-lists',
      title: 'Block Lists',
      result: blockListsResults,
      Component: BlockListsCard,
      refresh: updateBlockListsResults,
      tags: ['security', 'meta'],
    }, {
      id: 'features',
      title: 'Site Features',
      result: siteFeaturesResults,
      Component: SiteFeaturesCard,
      refresh: updateSiteFeaturesResults,
      tags: ['meta'],
    }, {
      id: 'sitemap',
      title: 'Pages',
      result: sitemapResults,
      Component: SitemapCard,
      refresh: updateSitemapResults,
      tags: ['meta'],
    }, {
      id: 'carbon',
      title: 'Carbon Footprint',
      result: carbonResults,
      Component: CarbonFootprintCard,
      refresh: updateCarbonResults,
      tags: ['meta'],
    },
  ];

  const makeActionButtons = (title: string, refresh: () => void, showInfo: (id: string) => void): ReactNode => {
    const actions = [
      { label: t('results.actions.info', { title }), onClick: showInfo, icon: 'ⓘ'},
      { label: t('results.actions.refetch', { title }), onClick: refresh, icon: '↻'},
    ];
    return (
      <ActionButtons actions={actions} />
    );
  };

  const showInfo = (id: string) => {
    setModalContent(DocContent(id));
    setModalOpen(true);
  };

  const showErrorModal = (content: ReactNode) => {
    setModalContent(content);
    setModalOpen(true);
  };






  
  return (
    <ResultsOuter className='container-fluid green-section'>
      <div className="container">
        <Nav>
        { address &&
          <Heading className='display-6 tophead'>
            <i className="bi bi-globe2" aria-hidden="true"></i>
            { addressType === 'url'
              ? <a href={address} target="_blank" rel="noopener noreferrer nofollow">{makeSiteName(address)}</a>
              : makeSiteName(address) }
          </Heading>
          }
        </Nav>
        <div className='card mb-4 px-4 pt-4'>
          <ProgressBar loadStatus={loadingJobs} showModal={showErrorModal} showJobDocs={showInfo} />
          { address?.includes(window?.location?.hostname || 'web-check.xyz') && <SelfScanMsg />}
        </div>
        { address && <Summary
          address={address}
          isDone={loadingJobs.every((job: LoadingJob) => job.state !== 'loading')}
          ssl={sslResults}
          domain={domainLookupResults}
          mail={mailConfigResults}
          mailSkipped={loadingJobs.some((job: LoadingJob) => job.name === 'mail-config' && job.state === 'skipped')}
          hsts={hstsResults}
          httpSecurity={httpSecurityResults}
          dnssec={dnsSecResults}
          securityTxt={securityTxtResults}
          blockLists={blockListsResults}
          threats={threatResults}
          ports={portsResults}
          wordpress={wordpressResults}
        /> }
          <Loader show={loadingJobs.filter((job: LoadingJob) => job.state !== 'loading').length < 5} />
        <FilterButtons>{ showFilters ? <>
          <div className="one-half">
          <span className="group-label">{t('results.filters.label.filterBy')}</span>
          {['server', 'client', 'meta'].map((tag: string) => (
            <button
              key={tag}
              className={tags.includes(tag) ? 'selected' : ''}
              onClick={() => updateTags(tag)}>
                {t(`results.filters.tags.${tag}`)}
            </button>
          ))}
          {(tags.length > 0 || searchTerm.length > 0) && <button type="button" onClick={clearFilters} className="clear">{t('results.filters.clear')}</button> }
          </div>
          <div className="one-half">
          <span className="group-label">{t('results.filters.label.search')}</span>
          <input
            type="text"
            placeholder={t('results.filters.placeholder.filterResults')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="button" className="toggle-filters" onClick={() => setShowFilters(false)}>{t('results.filters.hide')}</button>
          </div>
          </> : (
            <div className="control-options">
              <button type="button" className="toggle-filters" onClick={() => setShowFilters(true)}>{t('results.filters.show')}</button>
            <a href="#view-download-raw-data" className="toggle-filters">{t('results.filters.export')}</a>
            <Link to="/about" className="toggle-filters">{t('results.filters.learnAboutResults')}</Link>
            {/* <a href="/about#additional-resources"><span className="toggle-filters">{t('results.filters.moreTools')}</span></a> */}
            {/* <a href="https://github.com/lissy93/web-check"><span className="toggle-filters">{t('results.filters.viewGitHub')}</span></a> */}
            </div>
        ) }







        </FilterButtons>
        <ResultsContent>
          <Masonry
            breakpointCols={{ 10000: 12, 4000: 9, 3600: 8, 3200: 7, 2800: 6, 2400: 5, 2000: 4, 1600: 3, 1200: 2, 800: 1 }}
            className="masonry-grid"
            columnClassName="masonry-grid-col">
            {
              resultCardData
              .map(({ id, title, result, tags: cardTags, refresh, Component }, index: number) => {
                const label = t(`cards.${id}`, { defaultValue: title });
                const show = (tags.length === 0 || cardTags.some(tag => tags.includes(tag)))
                && label.toLowerCase().includes(searchTerm.toLowerCase())
                && (result && typeof result === 'object' && !result.error);
                return show ? (
                  <ErrorBoundary title={label} key={`${id}-${index}`}>
                    <Component
                      data={{...result}}
                      title={label}
                      actionButtons={refresh ? makeActionButtons(label, refresh, () => showInfo(id)) : undefined}
                    />
                  </ErrorBoundary>
              ) : null})
            }
            </Masonry>
        </ResultsContent>
        <ViewRaw everything={resultCardData} address={address} />
        <AdditionalResources url={address} />
        <Modal isOpen={modalOpen} closeModal={()=> setModalOpen(false)}>{modalContent}</Modal>
        <ToastContainer limit={3} draggablePercent={60} autoClose={2500} theme="light" position="bottom-right" />
      </div>
    </ResultsOuter>
  );
}

export default Results;
