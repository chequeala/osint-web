import styled from 'styled-components';
import { translateServerMessage } from 'utils/server-messages';
import Card from 'components/Form/Card';
import Heading from 'components/Form/Heading';
import { useState, useEffect, ReactNode } from 'react';

import { useTranslation } from 'react-i18next';


const LoadCard = styled(Card)`
  margin: 0 auto 1rem auto;
  width: 100%;
  position: relative;
  transition: all 0.2s ease-in-out;
  &.hidden {
    height: 0;
    overflow: hidden;
    margin: 0;
    padding: 0;
  }
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 0.5rem;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressBarSegment = styled.div<{ color: string, color2: string, width: number }>`
  height: 1rem;
  display: inline-block;
  width: ${props => props.width}%;
  background: ${props => props.color};
  background: ${props => props.color2 ?
      `repeating-linear-gradient( 315deg, ${props.color}, ${props.color} 3px, ${props.color2} 3px, ${props.color2} 6px )`
      : props.color};
  transition: width 0.5s ease-in-out;
`;

const Details = styled.details`
  transition: all 0.2s ease-in-out;
  summary {
    margin: 0.5rem 0;
    font-weight: bold;
    cursor: pointer;
  }
  summary:before {
    content: "►";
    position: absolute;
    margin-left: -1rem;
    color: var(--vt-purple);
    cursor: pointer;
  }
  &[open] summary:before {
    content: "▼";
  }
  ul {
    list-style: none;
    padding: 0.25rem;
    border-radius: 4px;
    width: fit-content;
    li b {
      cursor: pointer;
    }
    i {
      color: var(--ink-soft);
    }
  }
  p.error {
    margin: 0.5rem 0;
    opacity: 0.75;
    color: var(--danger);
  }
`;

const StatusInfoWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  .run-status {
    color: var(--vt-purple);
    margin: 0;
  }
`;

const AboutPageLink = styled.a`
  color: var(--vt-purple);
`;

const SummaryContainer = styled.div`
  margin: 0.5rem 0;
  b {
    margin: 0;
    font-weight: bold;
  }
  p {
    margin: 0;
    opacity: 0.75;
  }
  &.error-info {
    color: var(--danger);
  }
  &.success-info {
    color: var(--success);
  }
  &.loading-info {
    color: var(--vt-purple-deep);
  }
  .skipped {
    margin-left: 0.75rem;
    color: var(--warning);
  }
  .success {
    margin-left: 0.75rem;
    color: var(--success);
  }
  .error {
    margin-left: 0.75rem;
  }
`;

const ReShowContainer = styled.div`
  position: relative;
  &.hidden {
    height: 0;
    overflow: hidden;
    margin: 0;
    padding: 0;
  }
  button { background: none;}
`;

const DismissButton = styled.button`
  width: fit-content;
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  background: #dee2e6;
  color: #6c757d;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    color: #495057;
  }
`;

const FailedJobActionButton = styled.button`
  margin: 0.1rem 0.1rem 0.1rem 0.5rem;
  background: var(--vt-purple);
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  &:hover {
    color: var(--success);
  } 
`;

const ErrorModalContent = styled.div`
p {
  margin: 0;
}
pre {
  color: var(--danger);
  &.info {
    color: orange;
  }
}
`;

export type LoadingState = 'success' | 'loading' | 'skipped' | 'error' | 'timed-out';

export interface LoadingJob {
  name: string,
  state: LoadingState,
  error?: string,
  timeTaken?: number,
  retry?: () => void,
}

const jobNames = [
  'get-ip',
  'location',
  'ssl',
  'domain',
  'quality',
  'tech-stack',
  'server-info',
  'cookies',
  'headers',
  'dns',
  'hosts',
  'http-security',
  'social-tags',
  'security-txt',
  'dns-server',
  'firewall',
  'dnssec',
  'hsts',
  'threats',
  'mail-config',
  'archives',
  'rank',
  'screenshot',
  'wordpress',
  'exposed-files',
  'subdomains',
  'censorship',
  'mixed-content',
  'lookalikes',
  'redirects',
  'linked-pages',
  'robots-txt',
  'status',
  'ports',
  // 'whois',
  'txt-records',
  'block-lists',
  'features',
  'sitemap',
  'carbon',
] as const;

export const initialJobs = jobNames.map((job: string) => {
  return {
    name: job,
    state: 'loading' as LoadingState,
    retry: () => {}
  }
});

export const calculateLoadingStatePercentages = (loadingJobs: LoadingJob[]): Record<LoadingState | string, number> => {
  const totalJobs = loadingJobs.length;

  // Initialize count object
  const stateCount: Record<LoadingState, number> = {
    'success': 0,
    'loading': 0,
    'skipped': 0,
    'error': 0,
    'timed-out': 0,
  };

  // Count the number of each state
  loadingJobs.forEach((job) => {
    stateCount[job.state] += 1;
  });

  // Convert counts to percentages
  const statePercentage: Record<LoadingState, number> = {
    'success': (stateCount['success'] / totalJobs) * 100,
    'loading': (stateCount['loading'] / totalJobs) * 100,
    'skipped': (stateCount['skipped'] / totalJobs) * 100,
    'error': (stateCount['error'] / totalJobs) * 100,
    'timed-out': (stateCount['timed-out'] / totalJobs) * 100,
  };

  return statePercentage;
};

const MillisecondCounter = (props: {isDone: boolean}) => {
  const { isDone } = props;
  const [milliseconds, setMilliseconds] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    // Start the timer as soon as the component mounts
    if (!isDone) {
      timer = setInterval(() => {
        setMilliseconds(milliseconds => milliseconds + 100);
      }, 100);
    }
    // Clean up the interval on unmount
    return () => {
      clearInterval(timer);
    };
  }, [isDone]); // If the isDone prop changes, the effect will re-run

  return <span>{milliseconds} ms</span>;
};

const RunningText = (props: { state: LoadingJob[], count: number }): JSX.Element => {
  const { t } = useTranslation(); 
  const loadingTasksCount = jobNames.length - props.state.filter((val: LoadingJob) => val.state === 'loading').length;
  const isDone = loadingTasksCount >= jobNames.length;
  return (
    <p className="run-status">
    {isDone
        ? `${t('progressbar.finishedIn')} `
        : `${t('progressbar.running', { done: loadingTasksCount, total: jobNames.length })} - `}
      <MillisecondCounter isDone={isDone} />
    </p>
  );
};



const SummaryText = (props: { state: LoadingJob[], count: number }): JSX.Element => {
  const { t } = useTranslation();
  const totalJobs = jobNames.length;
  let failedTasksCount = props.state.filter((val: LoadingJob) => val.state === 'error').length;
  let loadingTasksCount = props.state.filter((val: LoadingJob) => val.state === 'loading').length;
  let skippedTasksCount = props.state.filter((val: LoadingJob) => val.state === 'skipped').length;
  let successTasksCount = props.state.filter((val: LoadingJob) => val.state === 'success').length;

  // Frases completas con plural de i18n: antes salía "1 tarea fallidas"
  const skippedInfo = skippedTasksCount > 0 ? (<span className="skipped">{t('progressbar.countSkipped', { count: skippedTasksCount })}</span>) : null;
  const successInfo = successTasksCount > 0 ? (<span className="success">{t('progressbar.countSuccess', { count: successTasksCount })}</span>) : null;
  const failedInfo = failedTasksCount > 0 ? (<span className="error">{t('progressbar.countFailed', { count: failedTasksCount })}</span>) : null;


  if (loadingTasksCount > 0) {
    return (
      <SummaryContainer className="loading-info">
        <b>{t('progressbar.loading', { loaded: totalJobs - loadingTasksCount, total: totalJobs })}</b>
        {skippedInfo}
      </SummaryContainer>
    );
  }

  if (failedTasksCount === 0) {
    return (
      <SummaryContainer className="success-info">
        <b>{t('progressbar.completedSuccessfully', { count: successTasksCount })}</b>
        {skippedInfo}
      </SummaryContainer>
    );
  }

  return (
    <SummaryContainer className="error-info">
      {successInfo}
      {skippedInfo}
      {failedInfo}
    </SummaryContainer>
  );
};










const ProgressLoader = (props: { loadStatus: LoadingJob[], showModal: (err: ReactNode) => void, showJobDocs: (job: string) => void }): JSX.Element => {
  const { t } = useTranslation(); 
  const [ hideLoader, setHideLoader ] = useState<boolean>(false);
  const loadStatus = props.loadStatus;
  const percentages = calculateLoadingStatePercentages(loadStatus);

  const loadingTasksCount = jobNames.length - loadStatus.filter((val: LoadingJob) => val.state === 'loading').length;
  const isDone = loadingTasksCount >= jobNames.length;

  const makeBarColor = (colorCode: string): [string, string] => {
    const amount = 10;
    const darkerColorCode = '#' + colorCode.replace(/^#/, '').replace(
      /../g,
      colorCode => ('0' + Math.min(255, Math.max(0, parseInt(colorCode, 16) - amount)).toString(16)).slice(-2),
    );
    return [colorCode, darkerColorCode];
  };

  const barColors: Record<LoadingState | string, [string, string]> = {
    'success': isDone ? makeBarColor("#1f8a5b") : makeBarColor("#804fdc"),
    'loading': makeBarColor("#d9c7fb"),
    'skipped': makeBarColor("#a86a12"),
    'error': makeBarColor("#c2414b"),
    'timed-out': makeBarColor("#5f33b5"),
  };

  const getStatusEmoji = (state: LoadingState): string => {
    switch (state) {
      case 'success':
        return '✅';
      case 'loading':
        return '🔄';
      case 'skipped':
        return '⏭️';
      case 'error':
        return '❌';
      case 'timed-out':
        return '⏸️';
      default:
        return '❓';
    }
  };










  const showErrorModal = (name: string, state: LoadingState, timeTaken: number | undefined, error: string, isInfo?: boolean) => {
    
    const errorContent = (
      <ErrorModalContent>
      <Heading as="h3">{t('progressbar.error.modal.title', { name })}</Heading>
      <p>
        {t('progressbar.error.modal.description', { name, state, timeTaken })}
        {t('progressbar.error.modal.serverResponse')}
      </p>
      <pre className={isInfo ? 'info' : 'error'}>{translateServerMessage(error)}</pre>
      {translateServerMessage(error) !== error && <small className="text-soft">{error}</small>}
    </ErrorModalContent>
    );
    props.showModal(errorContent);
  };

  return (
  <>
  <ReShowContainer className={!hideLoader ? 'hidden' : ''}>
        <DismissButton onClick={() => setHideLoader(false)}>{t('progressbar.button.showLoadState')}</DismissButton>
      </ReShowContainer>
  <LoadCard className={hideLoader ? 'hidden' : ''}>
        <ProgressBarContainer>
          {Object.keys(percentages).map((state: string | LoadingState) => (
            <ProgressBarSegment 
              color={barColors[state][0]} 
              color2={barColors[state][1]} 
              title={`${t(`progressbar.status.${state}`)} (${Math.round(percentages[state])}%)`} // Traducción del estado
              width={percentages[state]}
              key={`progress-bar-${state}`}
            />
          ))}
        </ProgressBarContainer>
    
    <StatusInfoWrapper>
      <SummaryText state={loadStatus} count={loadStatus.length} />
      <RunningText state={loadStatus} count={loadStatus.length} />
    </StatusInfoWrapper>

    <Details>
    <summary>{t('progressbar.details.show')}</summary>
      <ul>
      {
              loadStatus.map(({ name, state, timeTaken, retry, error }: LoadingJob) => (
                <li key={name}>
                  <b onClick={() => props.showJobDocs(name)}>{getStatusEmoji(state)} {name}</b>
                  <span style={{ color: state === 'loading' ? 'var(--ink-soft)' : barColors[state][0] }}> ({t(`progressbar.status.${state}`)})</span> {/* Traducción del estado */}
                  <i>{(timeTaken && state !== 'loading') ? `${t('progressbar.details.took')} ${timeTaken} ms` : ''}</i>
                  { (retry && state !== 'success' && state !== 'loading') && <FailedJobActionButton onClick={retry}>↻ {t('progressbar.button.retry')}</FailedJobActionButton> }
                  { (error && state === 'error') && <FailedJobActionButton onClick={() => showErrorModal(name, state, timeTaken, error)}>■ {t('progressbar.button.showError')}</FailedJobActionButton> }
                  { (error && state === 'skipped') && <FailedJobActionButton onClick={() => showErrorModal(name, state, timeTaken, error, true)}>■ {t('progressbar.button.showReason')}</FailedJobActionButton> }
                </li>
              ))
            }
      </ul>
      { loadStatus.filter((val: LoadingJob) => val.state === 'error').length > 0 &&
        <p className="error">
        <b>{t('progressbar.error.checkConsole')}</b><br />
        {t('progressbar.error.explanation')}
      </p>}
      <AboutPageLink href="/about" target="_blank" rel="noreferer">{t('progressbar.link.learnMore')}</AboutPageLink>
    </Details>
    <DismissButton onClick={() => setHideLoader(true)}>{t('progressbar.button.dismiss')}</DismissButton>
  </LoadCard>
  </>
  );
}



export default ProgressLoader;
