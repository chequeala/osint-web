import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

import NavBar from 'components/misc/NavBar';
import Home from 'pages/Home';
import NotFound from 'pages/NotFound';
import Footer from 'components/misc/Footer';

// Resultados (mapa, gráficos y 30 tarjetas) y "Acerca de" se descargan solo al
// visitarlas, para que la portada cargue rápido en celulares y conexiones lentas
const Results = lazy(() => import('pages/Results'));
const About = lazy(() => import('pages/About'));

// Título de la pestaña según la página y el idioma, como en chequea.la
const usePageTitle = () => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  useEffect(() => {
    const page = pathname === '/' ? 'home'
      : pathname.startsWith('/results') ? 'results'
      : pathname.startsWith('/about') ? 'about'
      : 'notFound';
    document.title = `${t(`titles.${page}`)} · chequea.la`;
  }, [pathname, t, i18n.language]);
};

const PageLoading = () => (
  <div className="container-fluid green-section">
    <div className="container py-5 text-center text-soft" role="status">
      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
      {/* sin t(): se muestra un instante, antes de que cargue la página */}
      …
    </div>
  </div>
);

function App() {
  usePageTitle();
  return (
    <>
      <NavBar />
      <main className="container-fluid">
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="*" element={<NotFound />} />
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/results/:address" element={<Results />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

export default App;
