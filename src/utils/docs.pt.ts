import { type Doc } from 'utils/docs';

// Versão em português de docs.ts (mesmos ids e mesma ordem).
// Os termos técnicos ficam em inglês.
const docs: Doc[] = [
  {
    id: "get-ip",
    title: "Informações do IP",
    description:
      "Um endereço IP (Internet Protocol) é como o endereço da sua casa, mas para o seu site ou dispositivo conectado à internet. O IP associado ao seu domínio pode ser obtido consultando o Sistema de Nomes de Domínio (DNS), que funciona como uma espécie de lista telefônica da internet, buscando o registro A (endereço) do seu site.",
    use: "Descobrir o IP de um servidor é o primeiro passo para investigações mais profundas. Com ele você pode conhecer melhor a estrutura de rede do seu site, localizar fisicamente o servidor, saber qual serviço de hospedagem você usa e até descobrir outros domínios hospedados no mesmo IP. Tudo isso é fundamental para entender como proteger melhor o seu site e a sua comunidade.",
    resources: [
      { title: 'Entendendo endereços IP', link: 'https://www.digitalocean.com/community/tutorials/understanding-ip-addresses-subnets-and-cidr-notation-for-networking' },
      { title: 'Endereço IP - Wikipédia', link: 'https://pt.wikipedia.org/wiki/Endereço_IP' },
      { title: 'RFC-791 Internet Protocol', link: 'https://tools.ietf.org/html/rfc791' },
      { title: 'whatismyipaddress.com', link: 'https://whatismyipaddress.com/' },
    ],
  },
  {
    id: "ssl",
    title: "Cadeia SSL",
    description:
      "Um certificado SSL é como a carteira de identidade do seu site: garante que você é quem diz ser e permite que as informações entre o seu site e as pessoas que o visitam trafeguem de forma segura e criptografada (via HTTPS). Esses certificados são emitidos por autoridades certificadoras (CAs), que verificam a legitimidade do site para proteger quem o visita.",
    use: "Além de garantir que a transmissão de dados no seu site é segura, os certificados SSL oferecem informações valiosas para entender melhor a segurança da sua plataforma. Você pode ver quem emitiu o certificado, para qual domínio, por quanto tempo é válido e, em alguns casos, dados da organização. Isso ajuda a confirmar que o seu site é seguro ou até a descobrir subdomínios ou serviços relacionados.",
    resources: [
      { title: 'TLS - Wikipédia', link: 'https://pt.wikipedia.org/wiki/Transport_Layer_Security' },
      { title: 'O que é SSL? (Cloudflare Learning)', link: 'https://www.cloudflare.com/pt-br/learning/ssl/what-is-ssl/' },
      { title: 'RFC-8446 - TLS', link: 'https://tools.ietf.org/html/rfc8446' },
      { title: 'Verificador SSL', link: 'https://www.sslshopper.com/ssl-checker.html' },
    ],
  },
  {
    id: "dns",
    title: "Registros DNS",
    description:
      "O DNS é como a lista telefônica da internet. Ele traduz o nome do seu domínio (que as pessoas conseguem lembrar) no endereço IP (que os computadores precisam para encontrar o seu site). Existem diferentes tipos de registros DNS, como A (endereço), MX (e-mail), NS (servidor de nomes), CNAME (nome canônico) e TXT (texto), entre outros.",
    use: "Consultar os registros DNS do seu domínio pode revelar informações importantes sobre como a sua plataforma está estruturada na internet. Por exemplo, os registros A e AAAA mostram os endereços IP ligados ao domínio, o que ajuda a localizar os servidores. Os registros MX dão pistas sobre o seu provedor de e-mail. Os registros TXT às vezes contêm detalhes que, sem querer, expõem informações sensíveis sobre a sua configuração. Conhecer isso ajuda a melhorar a segurança da sua infraestrutura online.",
    resources: [
      { title: 'O que são registros DNS? (Cloudflare Learning)', link: 'https://www.cloudflare.com/pt-br/learning/dns/dns-records/' },
      { title: 'Tipos de registros DNS', link: 'https://en.wikipedia.org/wiki/List_of_DNS_record_types' },
      { title: 'RFC-1035 - DNS', link: 'https://tools.ietf.org/html/rfc1035' },
      { title: 'Consulta DNS (MxToolbox)', link: 'https://mxtoolbox.com/DNSLookup.aspx' },
    ],
  },
  {
    id: "cookies",
    title: "Cookies",
    description:
      "A análise de cookies examina os cookies HTTP que o site define no navegador. Cookies são pequenos fragmentos de dados guardados no computador de quem navega pelo site. Eles contêm informações específicas sobre o site e a pessoa usuária, como preferências, o estado da sessão ou dados de rastreamento.",
    use:
      "Os cookies podem revelar como o site rastreia e interage com quem o usa. Por exemplo, os cookies de sessão mostram como as sessões são gerenciadas, e os cookies de rastreamento podem indicar quais ferramentas de analytics ou rastreamento o site usa. Analisar o uso de cookies também dá uma ideia da segurança do site e do cumprimento das leis de privacidade.",
    resources: [
      { title: 'Cookies HTTP (MDN)', link: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Cookies' },
      { title: 'O que são cookies? (Cloudflare Learning)', link: 'https://www.cloudflare.com/pt-br/learning/privacy/what-are-cookies/' },
      { title: 'Testes de atributos de cookies (OWASP)', link: 'https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/06-Session_Management_Testing/02-Testing_for_Cookies_Attributes' },
      { title: 'RFC-6265 - Cookies', link: 'https://tools.ietf.org/html/rfc6265' },
    ],
  },
  {
    id: "robots-txt",
    title: "Regras de rastreamento",
    description:
      "O arquivo robots.txt fica (normalmente) na raiz do domínio e implementa o Robots Exclusion Protocol (REP). Ele indica quais páginas devem ser ignoradas por certos rastreadores e bots. Embora seja útil para evitar que buscadores sobrecarreguem o site, não deve ser usado para tirar páginas dos resultados de busca (para isso use a meta tag 'noindex' ou o cabeçalho HTTP).",
    use:
      "Revisar o robots.txt numa investigação pode ser útil porque às vezes ele revela diretórios ou páginas que a pessoa dona do site não quer que sejam indexados, o que pode indicar informações sensíveis ou páginas ocultas. Entender as regras de rastreamento também dá pistas sobre a estratégia de SEO do site.",
    resources: [
      { title: 'Google Search Central - robots.txt', link: 'https://developers.google.com/search/docs/advanced/robots/intro?hl=pt-br' },
      { title: 'Aprenda sobre robots.txt (Moz)', link: 'https://moz.com/learn/seo/robotstxt' },
      { title: 'RFC-9309 - Robots Exclusion Protocol', link: 'https://datatracker.ietf.org/doc/rfc9309/' },
      { title: 'robots.txt - Wikipédia', link: 'https://pt.wikipedia.org/wiki/Robots.txt' },
    ],
  },
  {
    id: "headers",
    title: "Cabeçalhos",
    description:
      "Esta análise extrai e interpreta os cabeçalhos HTTP que o site envia no ciclo de requisição e resposta. Cabeçalhos HTTP são pares chave-valor enviados no início de uma resposta HTTP, antes dos dados em si. Eles contêm diretivas importantes sobre como tratar a transferência, como políticas de cache, tipos de conteúdo, codificação, informações do servidor e políticas de segurança.",
    use:
      "Analisar os cabeçalhos HTTP traz informações valiosas numa investigação OSINT. Eles podem revelar configurações do servidor, tecnologias usadas, diretivas de cache e medidas de segurança. Isso ajuda a entender a infraestrutura do site, as proteções implementadas, possíveis vulnerabilidades e práticas operacionais em geral.",
    resources: [
      { title: 'Cabeçalhos HTTP (MDN)', link: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers' },
      { title: 'RFC-7231 Seção 7 - Cabeçalhos', link: 'https://datatracker.ietf.org/doc/html/rfc7231#section-7' },
      { title: 'Lista de campos de cabeçalho HTTP', link: 'https://en.wikipedia.org/wiki/List_of_HTTP_header_fields' },
      { title: 'OWASP Secure Headers Project', link: 'https://owasp.org/www-project-secure-headers/' },
    ],
  },
  {
    id: "quality",
    title: "Métricas de qualidade",
    description:
      "Usando o Lighthouse, esta tarefa mede o desempenho, a acessibilidade, as boas práticas e o SEO do site. Ela retorna uma lista de 100 métricas principais, com uma nota para cada categoria, para avaliar a qualidade geral do site.",
    use:
      "Útil para avaliar a saúde técnica do site, identificar problemas de SEO, detectar vulnerabilidades e garantir o cumprimento de padrões técnicos.",
    resources: [
      { title: 'Documentação do Lighthouse', link: 'https://developer.chrome.com/docs/lighthouse/' },
      { title: 'Ferramentas Google PageSpeed', link: 'https://developers.google.com/speed' },
      { title: 'Ferramentas de acessibilidade do W3C', link: 'https://www.w3.org/WAI/test-evaluate/' },
      { title: 'Google Search Console', link: 'https://search.google.com/search-console' },
      { title: 'Verificador de SEO', link: 'https://www.seobility.net/pt/seocheck/' },
      { title: 'PWA Builder', link: 'https://www.pwabuilder.com/' },
    ],
  },
  {
    id: "location",
    title: "Localização do servidor",
    description:
      "Esta tarefa determina a localização física do servidor que hospeda o site, a partir do endereço IP. Para isso, o IP é consultado numa base de dados de geolocalização, que associa o IP à latitude e longitude de data centers e provedores de internet (ISP) conhecidos. Com isso é possível mostrar informações adicionais, como um marcador no mapa, o endereço, a bandeira e o fuso horário.",
    use: "Saber a localização do servidor é um bom primeiro passo para entender melhor um site. Para quem administra o site, ajuda a otimizar a entrega de conteúdo, cumprir requisitos de residência de dados e detectar problemas de latência em certas regiões. Para quem pesquisa segurança, ajuda a avaliar os riscos de certas regiões ou jurisdições em relação a ameaças e regulações.",
    resources: [
      { title: 'Localizador de IP', link: 'https://geobytes.com/iplocator/' },
      { title: 'Geolocalização na internet - Wikipédia', link: 'https://en.wikipedia.org/wiki/Internet_geolocation' },
    ],
  },
  {
    id: "hosts",
    title: "Hosts associados",
    description:
      "Esta tarefa identifica e lista todos os domínios e subdomínios (nomes de host) associados ao domínio principal do site. O processo costuma envolver enumeração DNS para descobrir domínios e nomes de host vinculados, além de examinar registros DNS conhecidos.",
    use: "Numa investigação, entender todo o alcance da presença web de um alvo é fundamental. Os domínios associados podem levar a projetos relacionados, sites de backup, sites de desenvolvimento ou teste, ou serviços ligados ao site principal, que podem trazer mais informações ou vulnerabilidades. Uma lista completa também dá uma visão geral da estrutura da organização e da sua presença online.",
    resources: [
      { title: 'Enumeração DNS', link: 'https://en.wikipedia.org/wiki/DNS_enumeration' },
      { title: 'OWASP - Enumerar aplicações no servidor web', link: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/04-Enumerate_Applications_on_Webserver' },
      { title: 'Enumeração DNS - DNS Dumpster', link: 'https://dnsdumpster.com/' },
      { title: 'Buscador de subdomínios', link: 'https://subdomainfinder.c99.nl/' },
    ],
  },
  {
    id: "redirects",
    title: "Cadeia de redirecionamentos",
    description:
      "Esta tarefa acompanha a sequência de redirecionamentos HTTP desde a URL original até a URL final. Um redirecionamento HTTP é uma resposta com um código de status que indica ao cliente para ir a outra URL. Eles acontecem por vários motivos, como normalizar a URL (ir para a versão com www), forçar HTTPS, encurtadores de URL ou levar as pessoas a um novo endereço do site.",
    use: "Entender a cadeia de redirecionamentos é útil por vários motivos. Do ponto de vista da segurança, cadeias longas ou complicadas podem indicar riscos, como redirecionamentos sem criptografia no meio do caminho. Os redirecionamentos também afetam o desempenho e o SEO, já que cada um acrescenta tempo de ida e volta (RTT). Para OSINT, a cadeia ajuda a identificar relações entre domínios ou o uso de certas tecnologias ou provedores de hospedagem.",
    resources: [
      { title: 'Redirecionamentos HTTP (MDN)', link: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Redirections' },
      { title: 'Redirecionamento de URL', link: 'https://en.wikipedia.org/wiki/URL_redirection' },
      { title: 'Redirecionamentos 301 explicados', link: 'https://ahrefs.com/blog/301-redirects/' },
    ],
  },
  {
    id: "txt-records",
    title: "Registros TXT",
    description:
      "Os registros TXT são um tipo de registro DNS que fornece informações em texto sobre o seu domínio para serviços externos. São usados para vários fins, como verificar a propriedade do domínio, proteger o e-mail e até evitar alterações não autorizadas no seu site.",
    use: "Os registros TXT costumam revelar quais serviços e tecnologias externas são usados com um domínio. Podem mostrar detalhes da configuração de e-mail, o uso de serviços como Google Workspace ou Microsoft 365, ou medidas de segurança como SPF e DKIM. Isso dá uma visão das tecnologias da organização, das suas práticas de segurança de e-mail e de possíveis vulnerabilidades.",
    resources: [
      { title: 'Registros TXT (Cloudflare Learning)', link: 'https://www.cloudflare.com/pt-br/learning/dns/dns-records/dns-txt-record/' },
      { title: 'Registro TXT - Wikipédia', link: 'https://en.wikipedia.org/wiki/TXT_record' },
      { title: 'RFC-1464 - Registros TXT', link: 'https://datatracker.ietf.org/doc/html/rfc1464' },
      { title: 'Consulta de registros TXT (MxToolbox)', link: 'https://mxtoolbox.com/TXTLookup.aspx' },
    ],
  },
  {
    id: "status",
    title: "Status do servidor",
    description: "Verifica se um servidor está online e respondendo às requisições.",
    use: "",
    resources: [],
  },
  {
    id: "ports",
    title: "Portas abertas",
    description:
      "As portas abertas de um servidor são pontos de comunicação disponíveis para conexões de clientes. Cada porta corresponde a um serviço ou protocolo específico, como HTTP (porta 80), HTTPS (porta 443), FTP (porta 21) etc. Elas podem ser identificadas com técnicas como a varredura de portas (port scanning).",
    use:
      "Saber quais portas estão abertas no seu servidor mostra quais serviços estão rodando, o que é útil para entender possíveis vulnerabilidades do sistema ou a natureza dos serviços oferecidos.",
    resources: [
      { title: 'Lista de portas TCP e UDP', link: 'https://pt.wikipedia.org/wiki/Lista_de_portas_dos_protocolos_TCP_e_UDP' },
      { title: 'NMAP - Fundamentos da varredura de portas', link: 'https://nmap.org/book/man-port-scanning-basics.html' },
    ],
  },
  {
    id: "carbon",
    title: "Pegada de carbono",
    description:
      "Esta tarefa calcula a pegada de carbono estimada de um site, com base na quantidade de dados transferidos e processados e no consumo de energia dos servidores que o hospedam e entregam. Quanto maior o site e mais complexas as suas funcionalidades, maior a pegada de carbono.",
    use:
      "Do ponto de vista OSINT, a pegada de carbono não revela diretamente como o site funciona ou quem está por trás dele. Mas pode ser um dado valioso em análises mais amplas, especialmente quando o impacto ambiental importa, por exemplo para ativistas e pesquisadoras interessadas na sustentabilidade da infraestrutura digital.",
    resources: [
      { title: 'WebsiteCarbon - Calculadora de carbono', link: 'https://www.websitecarbon.com/' },
      { title: 'The Green Web Foundation', link: 'https://www.thegreenwebfoundation.org/' },
      { title: 'Eco-Friendly Web Alliance', link: 'https://ecofriendlyweb.org/' },
      { title: 'Reset.org', link: 'https://en.reset.org/' },
      { title: 'Seu site está matando o planeta (Wired)', link: 'https://www.wired.co.uk/article/internet-carbon-footprint' },
    ],
  },
  {
    id: "server-info",
    title: "Informações do servidor",
    description:
      "Esta tarefa reúne várias informações sobre o servidor que hospeda o site, como o tipo de servidor (por exemplo Apache ou Nginx), o provedor de hospedagem, o Autonomous System Number (ASN) e mais. Os dados vêm de consultas ao endereço IP e da análise dos cabeçalhos de resposta HTTP.",
    use:
      "Num contexto OSINT, as informações do servidor dão pistas sobre a organização por trás de um site. A escolha do provedor de hospedagem pode sugerir a região em que a organização atua, e o tipo de servidor indica as tecnologias usadas. O ASN também pode ser usado para encontrar outros domínios da mesma organização.",
    resources: [
      "https://en.wikipedia.org/wiki/List_of_HTTP_header_fields",
      "https://en.wikipedia.org/wiki/Autonomous_system_(Internet)",
      "https://tools.ietf.org/html/rfc7231#section-7.4.2",
      "https://builtwith.com/",
    ],
  },
  {
    id: "domain",
    title: "Consulta Whois",
    description:
      "Esta tarefa obtém os registros Whois do domínio. Eles são uma fonte rica de informações: nome e contato de quem registrou o domínio, datas de criação e vencimento, servidores de nomes e mais. Os dados vêm de uma consulta ao servidor Whois do registro de cada terminação (.br, .org, .mx...).",
    use:
      "Num contexto OSINT, o Whois dá pistas sobre quem está por trás de um site. Mostra quando o domínio foi registrado e quando vence, o que ajuda a entender a linha do tempo da organização. Os dados de contato, embora muitas vezes ocultos, às vezes abrem novas linhas de investigação. Os servidores de nomes também podem ligar vários domínios da mesma organização.",
    resources: [
      "https://pt.wikipedia.org/wiki/WHOIS",
      "https://www.icann.org/resources/pages/whois-2018-01-17-en",
      "https://registro.br/tecnologia/ferramentas/whois/",
    ],
  },
  {
    id: "whois",
    title: "Informações do domínio",
    description:
      "Esta tarefa obtém os registros Whois do domínio. Eles são uma fonte rica de informações: nome e contato de quem registrou o domínio, datas de criação e vencimento, servidores de nomes e mais.",
    use:
      "Num contexto OSINT, o Whois dá pistas sobre quem está por trás de um site. Mostra quando o domínio foi registrado e quando vence, o que ajuda a entender a linha do tempo da organização. Os servidores de nomes também podem ligar vários domínios da mesma organização.",
    resources: [
      "https://pt.wikipedia.org/wiki/WHOIS",
      "https://www.icann.org/resources/pages/whois-2018-01-17-en",
      "https://whois.domaintools.com/",
    ],
  },
  {
    id: "dnssec",
    title: "Extensões de segurança do DNS (DNSSEC)",
    description:
      "Sem DNSSEC, um atacante pode interceptar ou falsificar os registros DNS do seu domínio e desviar as pessoas para sites de phishing. Isso acontece porque o DNS não tem uma forma própria de verificar se a resposta foi alterada. O DNSSEC protege as consultas assinando os registros do domínio com chaves públicas, o que permite detectar se a resposta foi manipulada. Outras soluções incluem DNS over HTTPS (DoH) e DNS over TLS (DoT).",
    use:
      "Ter DNSSEC no seu domínio mostra um nível maior de segurança digital, especialmente contra falsificação e envenenamento de cache DNS. Se o seu domínio não tem DNSSEC, DoH ou DoT, isso pode ser uma porta de entrada para um atacante.",
    resources: [
      "https://dnssec-analyzer.verisignlabs.com/",
      "https://www.cloudflare.com/pt-br/dns/dnssec/how-dnssec-works/",
      "https://pt.wikipedia.org/wiki/Domain_Name_System_Security_Extensions",
      "https://www.icann.org/resources/pages/dnssec-what-is-it-why-important-2019-03-05-pt",
      "https://www.internetsociety.org/resources/deploy360/2013/dnssec-test-sites/",
    ],
  },
  {
    id: "features",
    title: "Funcionalidades do site",
    description: 'Verifica quais funcionalidades principais estão ativas num site. Se alguma aparece como inativa, significa que não é usada durante o carregamento do site.',
    use: "Ajuda a entender as capacidades do seu site e quais tecnologias estão ativas ou faltando.",
    resources: [],
  },
  {
    id: "hsts",
    title: "HTTP Strict Transport Security (HSTS)",
    description: 'O HTTP Strict Transport Security (HSTS) é um mecanismo de segurança web que protege o seu site de ataques que tentam rebaixar o protocolo e roubar cookies. Um site pode entrar na lista de preload do HSTS se cumprir certos requisitos e for enviado para inclusão.',
    use: `É importante que o seu site tenha HSTS por vários motivos:
    1. Se alguém digitar "http://seu-dominio.com", pode ser vítima de um ataque man-in-the-middle.
      O HSTS redireciona automaticamente qualquer requisição HTTP para HTTPS no seu domínio.
    2. Se o seu site deveria usar só HTTPS mas tem links HTTP por engano, o HSTS os redireciona para HTTPS.
    3. Se um atacante tentar interceptar o tráfego com um certificado inválido, o HSTS impede que as pessoas o aceitem por engano.`,
    resources: [
      'https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Strict-Transport-Security',
      'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html',
      'https://hstspreload.org/'
    ],
  },
  {
    id: 'dns-server',
    title: 'Servidor DNS',
    description: 'Esta análise identifica os servidores DNS para os quais o seu domínio aponta e verifica se eles suportam DNS over HTTPS (DoH).',
    use: 'Saber quais servidores DNS o seu domínio usa ajuda a diagnosticar problemas de segurança e avaliar possíveis vulnerabilidades.',
    resources: [],
  },
  {
    id: 'tech-stack',
    title: 'Tecnologias',
    description: 'Verifica com quais tecnologias o seu site é construído, comparando a estrutura do site com uma lista de "impressões digitais" que identificam diferentes plataformas e tecnologias.',
    use: 'Identificar as tecnologias do seu site ajuda a avaliar possíveis vulnerabilidades e a tomar decisões de desenvolvimento. Use esse conhecimento de forma ética, nunca para roubar dados ou invadir sistemas.',
    resources: [
      { title: 'Impressões digitais do Wappalyzer', link: 'https://github.com/wappalyzer/wappalyzer/tree/master/src/technologies'},
      { title: 'BuiltWith - Veja quais tecnologias um site usa', link: 'https://builtwith.com/'},
    ],
  },
  {
    id: 'sitemap',
    title: 'Páginas listadas',
    description: 'Esta análise encontra e lê o sitemap do seu site, o arquivo que lista as páginas públicas que você quer que os buscadores indexem. Além de servir para SEO, dá uma visão geral do conteúdo público do site.',
    use: 'Permite entender a estrutura do conteúdo público do site e, se você administra o site, confirmar que o sitemap está acessível, é válido e contém tudo o que você quer indexar.',
    resources: [
      { title: 'Sobre sitemaps (Google)', link: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=pt-br'},
      { title: 'Especificação do sitemap XML', link: 'https://www.sitemaps.org/pt_BR/protocol.html'},
      { title: 'Tutorial de sitemap', link: 'https://www.conductor.com/academy/xml-sitemap/'},
    ],
  },
  {
    id: 'security-txt',
    title: 'Security.txt',
    description: "O arquivo security.txt indica a quem pesquisa segurança como relatar de forma responsável os problemas que encontrar no seu site. O padrão foi definido na RFC 9116 e diz que o arquivo deve ter um contato (e-mail) e, opcionalmente, outras informações, como política de divulgação e chave PGP. Ele deve ficar em /.well-known/security.txt (ou, na forma antiga, em /security.txt).",
    use: "Ter um security.txt é importante: sem um contato definido, quem encontrar um problema crítico pode não conseguir avisar, ou acabar usando canais inseguros. Para OSINT, o arquivo também dá informações sobre a postura de segurança do site e a chave PGP pública.",
    resources: [
      { title: 'securitytxt.org', link: 'https://securitytxt.org/'},
      { title: 'RFC-9116', link: 'https://datatracker.ietf.org/doc/html/rfc9116'},
      { title: 'Histórico da RFC-9116', link: 'https://datatracker.ietf.org/doc/rfc9116/'},
      { title: 'security.txt (Wikipédia)', link: 'https://en.wikipedia.org/wiki/Security.txt'},
      { title: 'Exemplo de security.txt (Cloudflare)', link: 'https://www.cloudflare.com/.well-known/security.txt'},
      { title: 'Tutorial para criar o security.txt (Pieter Bakker)', link: 'https://pieterbakker.com/implementing-security-txt/'},
    ],
  },
  {
    id: 'linked-pages',
    title: 'Páginas vinculadas',
    description: 'Mostra todos os links internos e externos encontrados num site, identificados pelos atributos href das tags de âncora (a).',
    use: "Para quem administra o site, ajuda a diagnosticar problemas de SEO, melhorar a estrutura e entender como o conteúdo se conecta. Os links externos mostram associações, dependências e possíveis riscos de reputação. " +
    "Do ponto de vista da segurança, os links de saída ajudam a perceber se você está apontando, sem saber, para sites maliciosos ou comprometidos. Os links internos ajudam a descobrir páginas ocultas ou vulneráveis que não deveriam ser públicas. " +
    "Para quem investiga com OSINT, ajuda a construir uma visão mais ampla do alvo, descobrindo entidades e recursos relacionados.",
    resources: [
      { title: 'W3C Link Checker', link: 'https://validator.w3.org/checklink'},
    ],
  },
  {
    id: 'social-tags',
    title: 'Tags sociais',
    description: 'Os sites podem incluir meta tags que dizem aos buscadores e às redes sociais quais informações mostrar: título, descrição, miniatura, palavras-chave, autoria, contas sociais etc.',
    use: 'Incluir esses dados melhora o SEO e, para quem investiga com OSINT, ajuda a entender como um site se descreve.',
    resources: [
      { title: 'SocialSharePreview.com', link: 'https://socialsharepreview.com/'},
      { title: 'Guia de tags sociais', link: 'https://css-tricks.com/essential-meta-tags-social-media/'},
      { title: 'Metadados (web.dev)', link: 'https://web.dev/learn/html/metadata/'},
      { title: 'Open Graph Protocol', link: 'https://ogp.me/'},
      { title: 'Twitter Cards', link: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards'},
      { title: 'Facebook Open Graph', link: 'https://developers.facebook.com/docs/sharing/webmasters'},
    ],
  },
  {
    id: 'mail-config',
    title: 'Configuração de e-mail',
    description: "DMARC (Domain-based Message Authentication, Reporting and Conformance): protocolo de autenticação de e-mail que funciona junto com SPF e DKIM para evitar falsificação de identidade e phishing. Permite que quem é dono do domínio defina, num registro DNS, o que fazer com e-mails não autenticados, e que os servidores de e-mail enviem relatórios sobre isso. " +
    "BIMI (Brand Indicators for Message Identification): padrão que permite mostrar o logotipo da organização nos e-mails, associado ao registro DMARC do domínio, como sinal visual de confiança. " +
    "DKIM (DomainKeys Identified Mail): padrão que garante que as mensagens não foram alteradas no caminho entre o servidor que envia e o que recebe, usando assinaturas digitais ligadas ao domínio. " +
    "SPF (Sender Policy Framework): método que define, num registro DNS, quais servidores podem enviar e-mails em nome de um domínio, para evitar falsificação.",
    use: "Esta informação ajuda a avaliar a segurança do e-mail de um domínio, descobrir vulnerabilidades e verificar a legitimidade de e-mails para detectar phishing. Também dá pistas sobre a hospedagem, os provedores de serviço e os padrões de configuração da organização.",
    resources: [
      { title: 'Introdução a DMARC, DKIM e SPF (Cloudflare)', link: 'https://www.cloudflare.com/pt-br/learning/email-security/dmarc-dkim-spf/' },
      { title: 'EasyDMARC Domain Scanner', link: 'https://easydmarc.com/tools/domain-scanner' },
      { title: 'MX Toolbox', link: 'https://mxtoolbox.com/' },
      { title: 'RFC-7208 - SPF', link: 'https://datatracker.ietf.org/doc/html/rfc7208' },
      { title: 'RFC-6376 - DKIM', link: 'https://datatracker.ietf.org/doc/html/rfc6376' },
      { title: 'RFC-7489 - DMARC', link: 'https://datatracker.ietf.org/doc/html/rfc7489' },
      { title: 'BIMI Group', link: 'https://bimigroup.org/' },
    ],
  },
  {
    id: 'firewall',
    title: 'Detecção de firewall',
    description: 'Um WAF (web application firewall) protege aplicações web filtrando e monitorando o tráfego HTTP entre a aplicação e a internet. Normalmente protege contra ataques como cross-site request forgery (CSRF), cross-site scripting (XSS), inclusão de arquivos e SQL injection, entre outros.',
    use: 'É útil saber se um site usa um WAF, e qual, porque isso mostra como ele está protegido contra vários vetores de ataque, mas também pode revelar vulnerabilidades do próprio firewall.',
    resources: [
      { title: 'O que é um WAF? (Cloudflare Learning)', link: 'https://www.cloudflare.com/pt-br/learning/ddos/glossary/web-application-firewall-waf/' },
      { title: 'OWASP - Web Application Firewall', link: 'https://owasp.org/www-community/Web_Application_Firewall' },
      { title: 'Boas práticas para WAF', link: 'https://owasp.org/www-pdf-archive/Best_Practices_Guide_WAF_v104.en.pdf' },
      { title: 'WAF - Wikipédia', link: 'https://en.wikipedia.org/wiki/Web_application_firewall' },
    ],
  },
  {
    id: 'http-security',
    title: 'Segurança HTTP',
    description: 'Configurar bem os cabeçalhos de segurança HTTP acrescenta uma camada de proteção contra ataques comuns. Os principais são: '
      + 'HTTP Strict Transport Security (HSTS): obriga o uso de HTTPS, reduzindo ataques man-in-the-middle e de rebaixamento de protocolo. '
      + 'Content Security Policy (CSP): restringe os recursos que a página pode carregar, para evitar cross-site scripting e injeção de dados. '
      + 'X-Content-Type-Options: impede que os navegadores "adivinhem" um tipo de conteúdo diferente do declarado (confusão de tipo MIME). '
      + 'X-Frame-Options: protege contra clickjacking, controlando se a página pode ser exibida dentro de <frame>, <iframe>, <embed> ou <object>.',
    use: 'Revisar os cabeçalhos de segurança mostra a postura defensiva do site e as possíveis vulnerabilidades, permitindo corrigi-las antes e seguir as boas práticas de segurança.',
    resources: [
      { title: 'OWASP Secure Headers Project', link: 'https://owasp.org/www-project-secure-headers/' },
      { title: 'Guia de cabeçalhos HTTP (OWASP)', link: 'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html' },
      { title: 'content-security-policy.com', link: 'https://content-security-policy.com/' },
      { title: 'resourcepolicy.fyi', link: 'https://resourcepolicy.fyi/' },
      { title: 'Security Headers', link: 'https://securityheaders.com/' },
      { title: 'Mozilla Observatory', link: 'https://observatory.mozilla.org/' },
      { title: 'Documentação de CSP (MDN)', link: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CSP' },
      { title: 'Documentação de HSTS (MDN)', link: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Strict-Transport-Security' },
      { title: 'Documentação de X-Content-Type-Options (MDN)', link: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/X-Content-Type-Options' },
      { title: 'Documentação de X-Frame-Options (MDN)', link: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/X-Frame-Options' },
      { title: 'Documentação de X-XSS-Protection (MDN)', link: 'https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/X-XSS-Protection' },
    ],
  },
  {
    id: 'archives',
    title: 'Histórico de arquivo',
    description: 'Obtém o histórico completo do site na Wayback Machine.',
    use: 'Ajuda a entender a história do seu site e como ele mudou com o tempo, encontrar versões antigas ou localizar conteúdo que foi removido.',
    resources: [
      { title: 'Wayback Machine', link: 'https://archive.org/web/' },
    ],
  },
  {
    id: 'rank',
    title: 'Ranking global',
    description: 'Mostra o ranking global do site, que só é preciso para sites entre os 100 milhões mais visitados. Usamos dados do projeto Tranco, que reúne os principais sites segundo Umbrella, Majestic, Quantcast, o Chrome User Experience Report e o Cloudflare Radar.',
    use: 'Conhecer o ranking global ajuda a entender a escala do seu site, compará-lo com outros e perceber tendências de popularidade.',
    resources: [
      { title: 'Lista Tranco', link: 'https://tranco-list.eu/' },
      { title: 'Artigo de pesquisa do Tranco', link: 'https://tranco-list.eu/assets/tranco-ndss19.pdf' },
    ],
  },
  {
    id: 'block-lists',
    title: 'Detecção de bloqueios',
    description: 'Verifica o acesso à URL usando mais de 10 dos servidores DNS de privacidade, malware e controle parental mais populares.',
    use: '',
    resources: [
      { title: 'Listas ThreatJammer', link: 'https://threatjammer.com/osint-lists' },
    ],
  },
  {
    id: 'threats',
    title: 'Detecção de malware e phishing',
    description: 'Verifica se um site aparece em listas comuns de malware e phishing, para avaliar o nível de ameaça.',
    use: 'Saber se o seu site aparece como ameaça em algum desses serviços ajuda a entender a reputação dele e a agir rápido se ele tiver sido comprometido.',
    resources: [
      { title: 'URLHaus', link: 'https://urlhaus-api.abuse.ch/' },
      { title: 'PhishTank', link: 'https://www.phishtank.com/' },
    ],
  },
  {
    id: 'wordpress',
    title: 'WordPress',
    description: 'Se o site é feito com WordPress, verifica três problemas muito comuns: se a API REST mostra a lista de usuários do painel, se o xmlrpc.php está ativo e se a versão do WordPress aparece no código. Só faz consultas normais, como qualquer visitante.',
    use: 'Conhecer os nomes de usuário e ter o xmlrpc.php ativo facilita os ataques que testam milhares de senhas. Ocultar essas informações, usar senhas longas e a verificação em duas etapas reduz muito o risco.',
    resources: [
      { title: 'Hardening do WordPress (documentação oficial)', link: 'https://developer.wordpress.org/advanced-administration/security/hardening/' },
      { title: 'OWASP - Testes de enumeração de usuários', link: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account' },
    ],
  },
  {
    id: 'exposed-files',
    title: 'Arquivos expostos',
    description: 'Procura arquivos que nunca deveriam estar públicos: o repositório .git, arquivos .env, backups do wp-config.php, dumps de banco de dados, backups .zip, phpinfo e listagens de pastas. Cada arquivo é confirmado pelo conteúdo, e o veni nunca mostra o que encontra.',
    use: 'Esses arquivos costumam conter senhas ou uma cópia completa do site. São um erro comum ao migrar ou fazer backup de um site, e um dos primeiros lugares que quem ataca procura.',
    resources: [
      { title: 'OWASP - Arquivos antigos, de backup e sem referência', link: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/04-Review_Old_Backup_and_Unreferenced_Files_for_Sensitive_Information' },
    ],
  },
  {
    id: 'subdomains',
    title: 'Subdomínios',
    description: 'Lista os subdomínios que aparecem nos registros públicos de certificados (Certificate Transparency) e verifica se continuam ativos. Avisa se algum aponta (CNAME) para um serviço que não existe mais.',
    use: 'Subdomínios esquecidos costumam ficar desatualizados. Um CNAME pendente permite que outra pessoa reivindique o serviço e publique conteúdo em seu nome.',
    resources: [
      { title: 'Certificate Transparency (Wikipédia)', link: 'https://en.wikipedia.org/wiki/Certificate_Transparency' },
      { title: 'OWASP - Subdomain takeover', link: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/10-Test_for_Subdomain_Takeover' },
    ],
  },
  {
    id: 'screenshot',
    title: 'Captura de tela',
    description: 'Tira uma captura de tela da página para a qual a URL ou o IP aponta e a mostra.',
    use: 'Útil para ver como um site aparece sem as limitações do seu navegador, IP ou localização.',
    resources: [],
  },
];

export const featureIntro = [
  'Quando você faz uma investigação OSINT de um site ou servidor, há várias áreas importantes para revisar. Cada uma está documentada abaixo, com links para ferramentas e técnicas para reunir as informações.',
  'O Veni OSINT pode automatizar a coleta desses dados, mas interpretar os resultados e tirar conclusões continua sendo responsabilidade sua.',
];

export const about = [
  `O Veni OSINT é uma ferramenta baseada no projeto de código aberto de <a href="https://aliciasykes.com" target="_blank">Alicia Sykes</a>, criada para descobrir e visualizar as informações públicas que o seu site ou servidor expõe. O objetivo é claro: oferecer a ativistas, jornalistas, pessoas defensoras de direitos humanos e movimentos sociais um recurso simples para identificar o que melhorar na segurança das suas plataformas digitais.`,

  `Ao digitar a URL do seu site, o <strong>Veni OSINT</strong> reúne e apresenta uma ampla gama de dados públicos que, pela forma como os sites funcionam, qualquer pessoa pode acessar. Isso inclui metadados, configurações do servidor e outros elementos que ajudam a entender como proteger o seu site, mostrando onde as medidas de segurança podem ser reforçadas.`,

  `Além de apontar o que melhorar na segurança, os resultados ajudam a ajustar as respostas do servidor, configurar redirecionamentos de forma mais segura, gerenciar cookies ou acertar os registros DNS do seu site.`,

  `Seja numa organização de direitos humanos, num meio de comunicação independente ou numa rede de ativismo digital, o <strong>Veni OSINT</strong> oferece o conhecimento necessário para melhorar a segurança do seu ambiente online, tomar decisões informadas e manter as suas plataformas protegidas, cuidando do seu trabalho e da sua comunidade.`,
];

export const fairUse = [
  'Por favor, use esta ferramenta de forma responsável. Não a use para analisar hosts sem permissão, nem como parte de um plano para atacar ou interromper serviços.',
  'Para que o serviço continue disponível para todas as pessoas, há um limite de análises por minuto a partir da mesma conexão. Se você atingir o limite, espere um pouco e tente de novo.',
];

export default docs;
