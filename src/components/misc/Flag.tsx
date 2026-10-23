interface Props {
  countryCode: string,
  width: number,
};

// Bandera como emoji a partir del código de país: antes se pedía a flagcdn.com,
// que así sabía qué país se estaba consultando
const toEmoji = (code: string): string =>
  code.toUpperCase().replace(/[A-Z]/g, char => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65));

const Flag = ({ countryCode, width }: Props): JSX.Element => {
  if (!/^[a-z]{2}$/i.test(countryCode || '')) return <></>;
  return (
    <span role="img" aria-label={countryCode.toUpperCase()} style={{ fontSize: `${width * 0.75}px`, lineHeight: 1 }}>
      {toEmoji(countryCode)}
    </span>
  );
};

export default Flag;
