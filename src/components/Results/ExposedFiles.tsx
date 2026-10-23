import { useTranslation } from 'react-i18next';
import { Card } from 'components/Form/Card';
import Row from 'components/Form/Row';

const ExposedFilesCard = (props: { data: any, title: string, actionButtons: any }): JSX.Element => {
  const { t } = useTranslation();
  const found: { path: string, type: string }[] = props.data.found || [];
  return (
    <Card heading={props.title} actionButtons={props.actionButtons}>
      { found.length === 0
        ? <p className="mb-0">✅ {t('exposedFiles.none', { count: props.data.checked })}</p>
        : found.map(f => (
          <Row key={f.path} lbl="" val="">
            <span className="lbl">❌ {t(`exposedFiles.types.${f.type}`)}</span>
            <span className="val"><code>{f.path}</code></span>
          </Row>
        ))}
      { found.length > 0 && <p className="small text-soft mt-2 mb-0">{t('exposedFiles.note')}</p> }
    </Card>
  );
};

export default ExposedFilesCard;
