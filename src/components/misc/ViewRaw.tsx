import { useState } from 'react';
import styled from 'styled-components';
import { Card } from 'components/Form/Card';
import { buildExport } from 'utils/export';

import { useTranslation } from 'react-i18next';

const CardStyles = `
margin: 0 auto 1rem auto;
width: 100%;
position: relative;
display: flex;
flex-direction: column;
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0.5rem 0;
}
small {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--ink-soft);
}
`;

const RawJson = styled.pre`
  background: var(--vt-green);
  border-radius: 0.5rem;
  padding: 1rem;
  max-height: 60vh;
  overflow: auto;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
`;

// Antes "Ver resultados" subía todo el análisis a jsonhero.io; ahora se muestra aquí mismo
const ViewRaw = (props: { everything: { id: string, result: any}[], address?: string, skipped?: string[] }) => {
  const { t } = useTranslation();
  const [showRaw, setShowRaw] = useState(false);

  const makeResults = () => JSON.stringify(buildExport(props.everything, props.address, props.skipped || []), null, 2);

  const fileName = () => {
    let host = 'resultados';
    try { host = new URL(props.address || '').hostname || host; } catch { /* nombre por defecto */ }
    return `veni-osint-${host}-${new Date().toISOString().slice(0, 10)}.json`;
  };

  const handleDownload = () => {
    const blob = new Blob([makeResults()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName();
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card heading={t('viewRaw.heading')} styles={CardStyles}>
      <div className="controls">
        <button type="button" className="btn btn-brand rounded-pill px-4" onClick={handleDownload}>
          <i className="bi bi-download me-2" aria-hidden="true"></i>{t('viewRaw.download')}
        </button>
        <button type="button" className="btn btn-outline-brand rounded-pill px-4" aria-expanded={showRaw} onClick={() => setShowRaw(!showRaw)}>
          {showRaw ? t('viewRaw.hide') : t('viewRaw.view')}
        </button>
      </div>
      { showRaw && <RawJson tabIndex={0}>{makeResults()}</RawJson> }
      <small>{t('viewRaw.info')}</small>
    </Card>
  );
};

export default ViewRaw;
