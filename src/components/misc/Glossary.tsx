import { Fragment, useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { splitTerms } from 'utils/glossary';

const TermButton = styled.button`
  all: unset;
  cursor: help;
  border-bottom: 1px dotted currentColor;
  &:focus-visible {
    outline: 2px solid var(--vt-purple-soft);
    outline-offset: 1px;
    border-radius: 2px;
  }
  @media print {
    border-bottom: none;
  }
`;

const Tip = styled.span`
  position: fixed;
  z-index: 1080;
  max-width: min(18rem, calc(100vw - 1rem));
  background: var(--ink);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 400;
  line-height: 1.4;
  text-transform: none;
  letter-spacing: normal;
  border-radius: 0.5rem;
  padding: 0.5rem 0.7rem;
  box-shadow: var(--shadow);
  strong { color: var(--vt-purple-soft); }
  @media print { display: none; }
`;

const TIP_WIDTH = 288; // 18rem

// Término técnico con su definición (mouse, toque o teclado)
export const Term = ({ term, termKey }: { term: string, termKey: string }): JSX.Element => {
  const { t } = useTranslation();
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ top: number, left: number } | null>(null);
  // Al tocar en un celular llegan seguidos foco (abre) y clic (cerraría): se ignora el clic inmediato
  const openedAt = useRef(0);

  const open = () => {
    openedAt.current = Date.now();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(TIP_WIDTH, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setPosition({ top: rect.bottom + 6, left });
  };
  const close = () => setPosition(null);

  useEffect(() => {
    if (!position) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
    };
  }, [position]);

  return (
    <>
      <TermButton
        ref={ref}
        type="button"
        aria-describedby={position ? id : undefined}
        aria-label={`${term}: ${t(`glossary.${termKey}`)}`}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        onClick={(e) => {
          e.preventDefault();
          if (!position) open();
          else if (Date.now() - openedAt.current > 400) close();
        }}
      >
        {term}
      </TermButton>
      {position && (
        <Tip role="tooltip" id={id} style={{ top: position.top, left: position.left }}>
          <strong>{term}</strong>: {t(`glossary.${termKey}`)}
        </Tip>
      )}
    </>
  );
};

// Texto con los términos del glosario marcados (la primera vez que aparece cada uno;
// con `seen` compartido, la primera vez en un grupo de textos)
export const Glossed = ({ text, seen }: { text: string, seen?: Set<string> }): JSX.Element => (
  <>
    {splitTerms(text, seen).map((piece, i) => (
      typeof piece === 'string'
        ? <Fragment key={i}>{piece}</Fragment>
        : <Term key={i} term={piece.term} termKey={piece.key} />
    ))}
  </>
);
