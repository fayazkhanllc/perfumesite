import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { Ambient } from './components/Ambient';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ScrollManager } from './components/ScrollManager';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductPage } from './pages/ProductPage';
import { Story } from './pages/Story';
import { Info } from './pages/Info';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <ScrollManager />
      <Ambient />
      <Header />
      <CartDrawer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/story" element={<Story />} />
        <Route path="/info/:slug" element={<Info />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}
