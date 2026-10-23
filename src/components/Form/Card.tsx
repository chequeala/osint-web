import styled from 'styled-components';

import ErrorBoundary from 'components/misc/ErrorBoundary';
import Heading from 'components/Form/Heading';
import { ReactNode } from 'react';

export const StyledCard = styled.section<{ styles?: string}>`
  border-radius: var(--radius);
  position: relative;
  margin: 0.5rem;
  max-height: 64rem;
  overflow: auto;
  ${props => props.styles}
`;

interface CardProps {
  children: React.ReactNode;
  heading?: string,
  styles?: string;
  actionButtons?: ReactNode | undefined;
};

export const Card = (props: CardProps): JSX.Element => {
  const { children, heading, styles, actionButtons } = props;
  return (
    <ErrorBoundary title={heading}>
      <StyledCard styles={styles}>
      <div className='card result-card px-3 py-3'>
        { actionButtons && actionButtons }
        { heading && <Heading className="inner-heading" as="h3" align="left" color="var(--vt-purple-deep)">{heading}</Heading> }
        {children}
      </div>
      </StyledCard>
    </ErrorBoundary>
  );
}

export default StyledCard;
