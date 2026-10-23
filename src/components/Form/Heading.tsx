import styled from 'styled-components';
import { tl } from 'i18n';

interface HeadingProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
  align?: 'left' | 'center' | 'right';
  color?: string;
  size?: 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge';
  inline?: boolean;
  children: React.ReactNode;
  id?: string;
  className?: string;
};

const StyledHeading = styled.h1<HeadingProps>`
  margin: 0.5rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  img { // Some titles have an icon
    width: 2.5rem;
    border-radius: 4px;
  }
  a { // If a title is a link, keep title styles
    color: inherit;
    text-decoration: none;
    display: flex;
  }
  ${props => {
    switch (props.size) {
      case 'xSmall': return `font-size: 1em`;
      case 'small': return `font-size: 1em`;
      case 'medium': return `font-size: 1em`;
      case 'large': return `font-size: 1em;`;
      case 'xLarge': return `font-size: 1em`;
    }
  }};
  ${props => {
    switch (props.align) {
      case 'left': return 'text-align: left;';
      case 'right': return 'text-align: right;';
      case 'center': return 'text-align: center; justify-content: center;';
    }
  }};
  ${props => props.color ? `color: ${props.color};` : '' }
  ${props => props.inline ? 'display: inline;' : '' }
`;

const makeAnchor = (title: string): string => {
  return title.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, "-");
};

const Heading = (props: HeadingProps): JSX.Element => {
  const { children, as, size, align, color, inline, id, className } = props;
  return (
    <StyledHeading as={as} size={size} align={align} color={color} inline={inline} className={className} id={id || makeAnchor((children || '')?.toString())}>
      {typeof children === 'string' ? tl(children) : children}
    </StyledHeading>
  );
}

export default Heading;
