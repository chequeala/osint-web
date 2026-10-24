import { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import {
  caaForIssuer, caaRecords, detectMailProviders, detectServer, headersSnippet, MAIL_PROVIDERS,
  mailRecords, mtaStsFiles, securityHeaders, securityTxt, ServerType, wordpressHardening, DmarcPolicy,
} from 'utils/generators';

// Qué generador corresponde a cada hallazgo del resumen
export const GENERATOR_FOR: Record<string, GeneratorKind> = {
  noSecurityTxt: 'securityTxt',
  noSpf: 'mail', noDmarc: 'mail', dmarcNone: 'mail',
  headers: 'headers', noHsts: 'headers',
  noCaa: 'caa',
  noMtaSts: 'mtaSts',
  wpUsers: 'wordpress', wpXmlrpc: 'wordpress', wpVersion: 'wordpress',
};

export type GeneratorKind = 'securityTxt' | 'mail' | 'headers' | 'caa' | 'mtaSts' | 'wordpress';

export interface GeneratorContext {
  domain: string;
  mxHosts: string[];
  headers?: Record<string, any>;
  sslIssuer?: string;
  httpsValid: boolean;
  dmarcPolicy: DmarcPolicy | null;
  currentSpf: string | null;
}

const Panel = styled.div`
  margin-top: 0.75rem;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--vt-purple-soft);
  border-radius: 0.75rem;
  label { font-size: 0.9rem; }
  .form-control, .form-select { font-size: 0.9rem; }
  .options { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; }
  .output-title { font-weight: 600; font-size: 0.9rem; margin: 0.75rem 0 0.25rem; }
  pre {
    background: var(--vt-green);
    border-radius: 0.5rem;
    padding: 0.6rem 0.8rem;
    margin: 0;
    font-size: 0.8rem;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .where { font-size: 0.85rem; color: var(--ink-soft); margin: 0.35rem 0 0; }
`;

const download = (content: string, filename: string, type = 'text/plain') => {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Bloque de salida: título, texto, copiar / descargar y dónde ponerlo
const Output = ({ title, content, where, filename }: { title: string, content: string, where: string, filename?: string }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = () => navigator.clipboard?.writeText(content).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }).catch(() => {});
  return (
    <div>
      <p className="output-title">{title}</p>
      <pre tabIndex={0}>{content}</pre>
      <div className="d-flex flex-wrap gap-2 mt-2">
        <button type="button" className="btn btn-sm btn-outline-brand rounded-pill px-3" onClick={copy}>
          <i className={`bi ${copied ? 'bi-check2' : 'bi-copy'} me-1`} aria-hidden="true"></i>{copied ? t('generators.copied') : t('generators.copy')}
        </button>
        {filename && <button type="button" className="btn btn-sm btn-outline-brand rounded-pill px-3" onClick={() => download(content, filename)}>
          <i className="bi bi-download me-1" aria-hidden="true"></i>{t('generators.download', { filename })}
        </button>}
      </div>
      <p className="where">{where}</p>
    </div>
  );
};

const SecurityTxtGenerator = ({ ctx }: { ctx: GeneratorContext }) => {
  const { t, i18n } = useTranslation();
  const [contact, setContact] = useState('');
  const [languages, setLanguages] = useState<string[]>([i18n.language === 'pt' ? 'pt' : 'es']);
  const [encryption, setEncryption] = useState('');
  const toggle = (lang: string) => setLanguages(l => (l.includes(lang) ? l.filter(x => x !== lang) : [...l, lang]));
  return <>
    <label htmlFor="gen-contact" className="form-label">{t('generators.securityTxt.contact')}</label>
    <input id="gen-contact" className="form-control mb-2" value={contact} placeholder={`seguridad@${ctx.domain}`} onChange={e => setContact(e.target.value)} />
    <span className="form-label d-block">{t('generators.securityTxt.languages')}</span>
    <div className="options mb-2">
      {['es', 'pt', 'en'].map(lang => (
        <label key={lang}><input type="checkbox" className="form-check-input me-1" checked={languages.includes(lang)} onChange={() => toggle(lang)} />{lang}</label>
      ))}
    </div>
    <label htmlFor="gen-pgp" className="form-label">{t('generators.securityTxt.pgp')}</label>
    <input id="gen-pgp" className="form-control" value={encryption} placeholder={`https://${ctx.domain}/pgp.asc`} onChange={e => setEncryption(e.target.value)} />
    <Output
      title="security.txt"
      content={securityTxt({ domain: ctx.domain, contact: contact || `seguridad@${ctx.domain}`, languages, encryption })}
      filename="security.txt"
      where={t('generators.securityTxt.where', { domain: ctx.domain })}
    />
  </>;
};

const MailGenerator = ({ ctx }: { ctx: GeneratorContext }) => {
  const { t } = useTranslation();
  const detected = detectMailProviders(ctx.mxHosts);
  const [sendsMail, setSendsMail] = useState(ctx.mxHosts.length > 0);
  const [providers, setProviders] = useState<string[]>(detected.length ? detected : ['hosting']);
  const [reportEmail, setReportEmail] = useState('');
  // Siguiente paso según lo que hay hoy: sin DMARC → none (observar); con p=none → quarantine
  const [policy, setPolicy] = useState<DmarcPolicy>(ctx.dmarcPolicy === 'none' ? 'quarantine' : ctx.dmarcPolicy === 'quarantine' ? 'reject' : 'none');
  const toggle = (p: string) => setProviders(l => (l.includes(p) ? l.filter(x => x !== p) : [...l, p]));
  const records = mailRecords({ sendsMail, providers, reportEmail, policy, existingSpf: ctx.currentSpf });
  return <>
    <span className="form-label d-block">{t('generators.mail.sendsMail')}</span>
    <div className="options mb-2">
      <label><input type="radio" className="form-check-input me-1" checked={sendsMail} onChange={() => setSendsMail(true)} />{t('wordpress.yes')}</label>
      <label><input type="radio" className="form-check-input me-1" checked={!sendsMail} onChange={() => setSendsMail(false)} />{t('wordpress.no')}</label>
    </div>
    {sendsMail && <>
      <span className="form-label d-block">{t('generators.mail.providers')}</span>
      <div className="options mb-2">
        {Object.keys(MAIL_PROVIDERS).map(p => (
          <label key={p}><input type="checkbox" className="form-check-input me-1" checked={providers.includes(p)} onChange={() => toggle(p)} />{t(`generators.mail.provider.${p}`)}</label>
        ))}
      </div>
      <label htmlFor="gen-policy" className="form-label">{t('generators.mail.policy')}</label>
      <select id="gen-policy" className="form-select mb-2" value={policy} onChange={e => setPolicy(e.target.value as DmarcPolicy)}>
        {(['none', 'quarantine', 'reject'] as DmarcPolicy[]).map(p => <option key={p} value={p}>{t(`generators.mail.policies.${p}`)}</option>)}
      </select>
      <label htmlFor="gen-rua" className="form-label">{t('generators.mail.reportEmail')}</label>
      <input id="gen-rua" className="form-control" value={reportEmail} placeholder={`dmarc@${ctx.domain}`} onChange={e => setReportEmail(e.target.value)} />
    </>}
    {ctx.currentSpf && <p className="where mt-2">{t('generators.mail.currentSpf')} <code>{ctx.currentSpf}</code></p>}
    <Output title={t('generators.mail.spfTitle', { domain: ctx.domain })} content={records.spf} where={t('generators.mail.spfWhere', { domain: ctx.domain })} />
    <Output title={t('generators.mail.dmarcTitle')} content={records.dmarc} where={t(sendsMail ? 'generators.mail.dmarcWhere' : 'generators.mail.dmarcWhereNoMail', { domain: ctx.domain })} />
  </>;
};

const HeadersGenerator = ({ ctx }: { ctx: GeneratorContext }) => {
  const { t } = useTranslation();
  const [server, setServer] = useState<ServerType>(detectServer(ctx.headers));
  const [hsts, setHsts] = useState(ctx.httpsValid && !ctx.headers?.['strict-transport-security']);
  // Nunca ".htaccess" o "_headers" a secas: subirlo tal cual reemplazaría el archivo real
  const filename = server === 'apache' ? 'cabeceras-para-htaccess.txt' : server === 'netlify' ? 'cabeceras-para-_headers.txt' : undefined;
  return <>
    <label htmlFor="gen-server" className="form-label">{t('generators.headers.server')}</label>
    <select id="gen-server" className="form-select mb-2" value={server} onChange={e => setServer(e.target.value as ServerType)}>
      {(['apache', 'nginx', 'netlify', 'cloudflare'] as ServerType[]).map(s => <option key={s} value={s}>{t(`generators.headers.servers.${s}`)}</option>)}
    </select>
    <label className="d-block"><input type="checkbox" className="form-check-input me-1" checked={hsts} disabled={!ctx.httpsValid} onChange={e => setHsts(e.target.checked)} />{t('generators.headers.includeHsts')}</label>
    <Output
      title={t('generators.headers.title')}
      content={headersSnippet(server, securityHeaders(hsts))}
      filename={filename}
      where={t(`generators.headers.where.${server}`)}
    />
  </>;
};

const CaaGenerator = ({ ctx }: { ctx: GeneratorContext }) => {
  const { t } = useTranslation();
  const detected = caaForIssuer(ctx.sslIssuer);
  const choices = [...new Set([detected, 'letsencrypt.org', 'sectigo.com', 'digicert.com', 'pki.goog'].filter(Boolean) as string[])];
  const [issuers, setIssuers] = useState<string[]>(detected ? [detected] : ['letsencrypt.org']);
  const [email, setEmail] = useState('');
  const toggle = (i: string) => setIssuers(l => (l.includes(i) ? l.filter(x => x !== i) : [...l, i]));
  return <>
    <span className="form-label d-block">{t('generators.caa.issuers')}</span>
    <div className="options mb-2">
      {choices.map(i => (
        <label key={i}><input type="checkbox" className="form-check-input me-1" checked={issuers.includes(i)} onChange={() => toggle(i)} />{i}{i === detected && ` (${t('generators.caa.current')})`}</label>
      ))}
    </div>
    <label htmlFor="gen-iodef" className="form-label">{t('generators.caa.email')}</label>
    <input id="gen-iodef" className="form-control" value={email} placeholder={`seguridad@${ctx.domain}`} onChange={e => setEmail(e.target.value)} />
    <Output title={t('generators.caa.title', { domain: ctx.domain })} content={caaRecords(issuers, email).join('\n')} where={t('generators.caa.where', { domain: ctx.domain })} />
  </>;
};

const MtaStsGenerator = ({ ctx }: { ctx: GeneratorContext }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const files = mtaStsFiles({ mxHosts: ctx.mxHosts, reportEmail: email || `tls@${ctx.domain}` });
  return <>
    <label htmlFor="gen-tlsrpt" className="form-label">{t('generators.mtaSts.email')}</label>
    <input id="gen-tlsrpt" className="form-control" value={email} placeholder={`tls@${ctx.domain}`} onChange={e => setEmail(e.target.value)} />
    <Output title={t('generators.mtaSts.recordTitle')} content={files.stsRecord} where={t('generators.mtaSts.recordWhere', { domain: ctx.domain })} />
    <Output title={t('generators.mtaSts.policyTitle')} content={files.policy} filename="mta-sts.txt" where={t('generators.mtaSts.policyWhere', { domain: ctx.domain })} />
    <Output title={t('generators.mtaSts.tlsRptTitle')} content={files.tlsRptRecord} where={t('generators.mtaSts.tlsRptWhere', { domain: ctx.domain })} />
  </>;
};

const WordPressGenerator = () => {
  const { t } = useTranslation();
  return <>
    <p className="mb-0 small">{t('generators.wordpress.intro')}</p>
    <Output title={t('generators.wordpress.title')} content={wordpressHardening()} filename="chequeala-endurecimiento.php" where={t('generators.wordpress.where')} />
  </>;
};

const GeneratorPanel = ({ kind, ctx }: { kind: GeneratorKind, ctx: GeneratorContext }): JSX.Element => {
  const { t } = useTranslation();
  return (
    <Panel>
      <p className="small text-soft mb-2"><i className="bi bi-shield-check me-1" aria-hidden="true"></i>{t('generators.local')}</p>
      {kind === 'securityTxt' && <SecurityTxtGenerator ctx={ctx} />}
      {kind === 'mail' && <MailGenerator ctx={ctx} />}
      {kind === 'headers' && <HeadersGenerator ctx={ctx} />}
      {kind === 'caa' && <CaaGenerator ctx={ctx} />}
      {kind === 'mtaSts' && <MtaStsGenerator ctx={ctx} />}
      {kind === 'wordpress' && <WordPressGenerator />}
    </Panel>
  );
};

export default GeneratorPanel;
