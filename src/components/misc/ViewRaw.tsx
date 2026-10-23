import React, { useState } from 'react';
import styled from 'styled-components';
import colors from 'styles/colors';
import { Card } from 'components/Form/Card';
import Button from 'components/Form/Button';

import { useTranslation } from 'react-i18next';

const CardStyles = `
margin: 0 auto 1rem auto;
width: 100%;
position: relative;
transition: all 0.2s ease-in-out;
display: flex;
flex-direction: column;
a {
  color: var(--vt-purple-deep);
}
.controls {
  display: flex;
  flex-wrap: wrap;
  button {
    max-width: 300px;
  }
}
small {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  opacity: 0.5;
}
`;

const StyledIframe = styled.iframe`
  width: calc(100% - 2rem);
  outline: none;
  border: none;
  border-radius: 4px;
  min-height: 50vh;
  height: 100%;
  margin: 1rem;
  background: ${colors.background};
`;

const ViewRaw = (props: { everything: { id: string, result: any}[] }) => {
  const { t } = useTranslation(); 
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const makeResults = () => {
    const result: {[key: string]: any} = {};
    props.everything.forEach((item: {id: string, result: any}) => {
      result[item.id] = item.result;
    });
    return result;
  };

  const fetchResultsUrl = async () => {
    const resultContent = makeResults();
    const response = await fetch('https://jsonhero.io/api/create.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'web-check results',
        content: resultContent,
        readOnly: true,
        ttl: 3600,
      })
    });
    if (!response.ok) {
      setError(t('viewRaw.error', { status: response.status }));
    } else {
      setError(null);
    }
    await response.json().then(
      (data) => setResultUrl(data.location)
    )
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(makeResults(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'web-check-results.json';
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Card heading={t('viewRaw.heading')} styles={CardStyles}>
      <div className="controls">
        <Button onClick={handleDownload}>{t('viewRaw.download')}</Button>
        <Button onClick={fetchResultsUrl}>{resultUrl ? t('viewRaw.update') : t('viewRaw.view')}</Button>
        { resultUrl && <Button onClick={() => setResultUrl('')}>{t('viewRaw.hide')}</Button> }
      </div>
      { resultUrl && !error &&
      <>
        <StyledIframe title={t('viewRaw.iframeTitle')} src={resultUrl} />
        <small>{t('viewRaw.available')} <a href={resultUrl}> {t('viewRaw.here')}</a>.</small>
      </>
      }
      { error && <p className="error">{error}</p> }
      <small>{t('viewRaw.info')}</small>
    </Card>
  );
};

export default ViewRaw;
