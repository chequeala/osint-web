import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import i18n, { tl } from 'i18n';
import App from './App';

const renderAt = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

test('la portada muestra el formulario de análisis', () => {
  renderAt('/');
  expect(screen.getByRole('heading', { level: 1, name: /Veni OSINT/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/URL de tu sitio/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Chequea mi web/i })).toBeInTheDocument();
});

test('una ruta inexistente muestra la página 404', () => {
  renderAt('/no-existe');
  expect(screen.getByText(/No encontramos esta página/i)).toBeInTheDocument();
});

describe('en portugués', () => {
  beforeAll(() => i18n.changeLanguage('pt'));
  afterAll(() => i18n.changeLanguage('es'));

  test('la portada y el menú se traducen', () => {
    renderAt('/');
    expect(screen.getByRole('button', { name: /Chequear meu site/i })).toBeInTheDocument();
    expect(screen.getByText(/O que o Veni OSINT verifica/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PT' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('las etiquetas de las tarjetas se traducen y los términos técnicos quedan igual', () => {
    expect(tl('Creation Date')).toBe('Data de criação');
    expect(tl('✅ Not Blocked')).toBe('✅ Não bloqueado');
    expect(tl('HSTS Enabled?')).toBe('HSTS ativo?');
    expect(tl('cloudflare.com')).toBe('cloudflare.com'); // los datos no se tocan
  });
});
