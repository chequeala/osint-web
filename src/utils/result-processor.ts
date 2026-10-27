import { RowProps }  from 'components/Form/Row';

export interface ServerLocation {
  city: string,
  region: string,
  country: string,
  postCode: string,
  regionCode: string,
  countryCode: string,
  coords: {
    latitude: number,
    longitude: number,
  },
  isp: string,
  timezone: string,
  languages: string,
  currency: string,
  currencyCode: string,
  countryDomain: string,
  countryAreaSize: number,
  countryPopulation: number,
};

export interface Whois {
  created: string,
  expires: string,
  updated: string,
  nameservers: string[],
}

export const getLocation = (response: any): ServerLocation => {
  return {
    city: response.city,
    region: response.region,
    country: response.country_name,
    postCode: response.postal,
    regionCode: response.region_code,
    countryCode: response.country_code,
    coords: {
      latitude: response.latitude,
      longitude: response.longitude,
    },
    isp: response.org,
    timezone: response.timezone,
    languages: response.languages,
    currencyCode: response.currency,
    currency: response.currency_name,
    countryDomain: response.country_tld,
    countryAreaSize: response.country_area,
    countryPopulation: response.country_population,
  };
};


export interface ServerInfo {
  ip?: string,
  ports?: string,
  software?: string,
  vulns?: string,
  type?: string,
};

export interface HostNames {
  domains: string[],
  hostnames: string[],
};

export interface ShodanResults {
  hostnames: HostNames | null,
  serverInfo: ServerInfo,
}

// "cpe:/a:f5:nginx:1.27.5" → "nginx 1.27.5"; sin repetir el producto si ya está con versión.
// Nombres genéricos como "http_server" llevan el fabricante: "apache http server".
export const cpeToSoftware = (cpes: string[]): string[] => {
  const parsed = cpes.map(cpe => cpe.split(':')).filter(parts => parts.length >= 4)
    .map(([, , vendor, product, version]) => {
      const name = product.replace(/_/g, ' ');
      return { product: /^(http )?server$/.test(name) ? `${vendor} ${name}` : name, version };
    });
  return parsed
    .filter(p => p.version || !parsed.some(o => o.product === p.product && o.version))
    .map(p => (p.version ? `${p.product} ${p.version}` : p.product));
};

// Respuesta de api/internetdb (InternetDB de Shodan)
export const parseInternetDbResults = (response: any): ShodanResults => {
  const hostnames: string[] = response.hostnames || [];
  return {
    hostnames: hostnames.length ? { domains: [], hostnames } : null,
    serverInfo: {
      ip: response.ip,
      ports: (response.ports || []).join(', '),
      software: cpeToSoftware(response.cpes || []).join(', '),
      vulns: (response.vulns || []).join(', '),
      type: (response.tags || []).join(', '),
    },
  };
};

export interface Technology {
  Categories?: string[];
  Parent?: string;
  Name: string;
  Description: string;
  Link: string;
  Tag: string;
  FirstDetected: number;
  LastDetected: number;
  IsPremium: string;
}

export interface TechnologyGroup {
  tag: string;
  technologies: Technology[];
}

export const makeTechnologies = (response: any): TechnologyGroup[] => {
  let flatArray = response.Results[0].Result.Paths
    .reduce((accumulator: any, obj: any) => accumulator.concat(obj.Technologies), []);
  let technologies = flatArray.reduce((groups: any, item: any) => {
    let tag = item.Tag;
    if (!groups[tag]) groups[tag] = [];
    groups[tag].push(item);
    return groups;
  }, {});
  return technologies;
};

export type Cookie = {
  name: string;
  value: string;
  attributes: Record<string, string>;
};

export const parseRobotsTxt = (content: string): { robots: RowProps[] } => {
  const lines = content.split('\n');
  const rules: RowProps[] = [];

  lines.forEach(line => {
    line = line.trim();  // This removes trailing and leading whitespaces

    let match = line.match(/^(Allow|Disallow):\s*(\S*)$/i);
    if (match) {
      const rule: RowProps = {
        lbl: match[1],
        val: match[2],
      };
      
      rules.push(rule);
    } else {
      match = line.match(/^(User-agent):\s*(\S*)$/i);
      if (match) {
        const rule: RowProps = {
          lbl: match[1],
          val: match[2],
        };
        
        rules.push(rule);
      }
    }
  });

  return { robots: rules };
}

export const applyWhoIsResults = (response: any) => {
  if (response.status !== '0') {
    return {
      error: response.status_desc,
    }
  }
  const whoIsResults: Whois = {
    created: response.date_created,
    expires: response.date_expires,
    updated: response.date_updated,
    nameservers: response.nameservers,
  };
  return whoIsResults;
}

