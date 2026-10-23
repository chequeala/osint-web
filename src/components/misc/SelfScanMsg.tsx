import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { StyledCard } from 'components/Form/Card';
import { REPO_URL } from 'config';

const StyledSelfScanMsg = styled(StyledCard)`
  margin: 0 0 1rem;
  padding: 1rem 1.25rem;
  background: var(--vt-purple-tint);
  border-radius: 0.75rem;
  a { color: var(--vt-purple-deep); }
`;

const SelfScanMsg = () => {
  const { t } = useTranslation();
  return (
    <StyledSelfScanMsg>
      <b><i className="bi bi-emoji-smile me-2" aria-hidden="true"></i>{t('selfScan.title')}</b>
      <p className="mb-0 mt-1">
        {t('selfScan.text')} <a href={REPO_URL} target="_blank" rel="noopener noreferrer">{t('selfScan.link')}</a>.
      </p>
    </StyledSelfScanMsg>
  );
};

export default SelfScanMsg;
