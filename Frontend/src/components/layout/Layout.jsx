import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import './Layout.css';

const Layout = ({ children, user, onLogout, currentPage, onNavigate, cartItemCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 1024);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Escuchar cambios en la conexión
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ajustar sidemenu en cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="layout-container">
      {user && (
        <Navbar 
          isOpen={isOpen}
          toggleSidebar={toggleSidebar}
          isOffline={isOffline}
          user={user} 
          onLogout={onLogout} 
          onNavigate={onNavigate}
          currentPage={currentPage}
          cartItemCount={cartItemCount}
        />
      )}
      <main className={`main-content ${isOpen && window.innerWidth < 1024 ? 'sidebar-open' : ''}`}>
        {isOffline && (
          <div className="offline-indicator">
            <i className="fas fa-wifi-slash me-2"></i>
            Trabajando sin conexión. Algunas funciones pueden no estar disponibles.
          </div>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;