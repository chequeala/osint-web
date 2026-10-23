import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import 'i18n';
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
