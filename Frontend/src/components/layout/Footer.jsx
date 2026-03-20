import React from 'react';
import './Layout.css'; // Asegurarse de importar los estilos

/**
 * Footer component displays business information and version
 * Automatically hidden on mobile devices
 */
const Footer = () => {
  const version = "v1.0.0"; // This could come from an environment variable or config
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark text-white py-3 border-top mt-auto w-100 footer-component">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="col-12 col-md-4 mb-2 mb-md-0">
            <span className="fw-bold karma-brand">Karma</span>
            <span className="ms-2 text-muted small">{version}</span>
          </div>
          
          <div className="col-12 col-md-4 text-center mb-2 mb-md-0">
            <p className="mb-0 small">
              © {currentYear} Karma Accesorios Buena Vibra 
            </p>
          </div>
          
          <div className="col-12 col-md-4 text-md-end">
            <div className="contact-info small">
              <p className="mb-0">
                <i className="fas fa-envelope me-1"></i> SharimAssam 
              </p>
              <p className="mb-0">
                <i className="fas fa-phone me-1"></i> +52 4493877628
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Estilos inline para ocultar en dispositivos móviles */}
      <style jsx="true">{`
        @media (max-width: 768px) {
          .footer-component {
            display: none !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;