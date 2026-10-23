import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import NavBar from 'components/misc/NavBar';
import Home from 'pages/Home';
import Results from 'pages/Results';
import About from 'pages/About';
import NotFound from 'pages/NotFound';
import Footer from 'components/misc/Footer';

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

function App() {
  usePageTitle();
  return (
    <>
      <NavBar />
      <main className="container-fluid">
        <Routes>
          <Route path="*" element={<NotFound />} />
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/results/:address" element={<Results />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
