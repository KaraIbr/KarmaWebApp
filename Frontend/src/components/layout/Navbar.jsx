import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { COLORS, createLavenderGradient } from '../../servicios/theme';
import { isMobileDevice } from '../../servicios/api';

const Navbar = ({ isOpen, toggleSidebar, isOffline, user, onLogout, onNavigate, currentPage, cartItemCount = 0 }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  useEffect(() => {
    // Detectar si es dispositivo móvil al cargar
    setIsMobile(isMobileDevice());
    
    // Detectar cambios en el tamaño de pantalla
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Define menu items (accesibles para todos los usuarios)
  const getMenuItems = () => {
    return [
      { id: 'inicio', label: 'Inicio', icon: 'home' },
      { id: 'inventario', label: 'Inventario', icon: 'boxes' },
      { id: 'carrito', label: 'Carrito', icon: 'shopping-cart', badge: cartItemCount },
      { id: 'ventas', label: 'Ventas', icon: 'receipt' },
      { id: 'etiquetas', label: 'Etiquetas', icon: 'tags' }, // Opción para el generador de etiquetas
    ];
  };

  const handleNavigation = (itemId) => {
    onNavigate(itemId);
    // En móvil, cerrar sidebar después de seleccionar un elemento
    if (isMobile && isOpen) {
      toggleSidebar();
    }
  };

  // Manejar cierre de sesión con prevención de múltiples clics
  const handleLogout = () => {
    if (isLoggingOut) return; // Prevenir múltiples clics
    
    setIsLoggingOut(true);
    
    // Mensaje de feedback para el usuario
    console.log('Cerrando sesión...');
    
    // Llamar a la función de cierre de sesión
    try {
      onLogout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Permitir otro intento después de un error
      setTimeout(() => setIsLoggingOut(false), 2000);
    }
  };

  // Estilos del gradiente para elementos destacados
  const lavenderGradient = createLavenderGradient('to right');

  return (
    <>
      {/* Solo muestra el overlay y botón toggle en desktop o cuando el sidebar está abierto en móvil */}
      {(isOpen && !isMobile) || (isOpen && isMobile) ? (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      ) : null}
      
      {/* Toggle button solo visible cuando se debe mostrar el sidebar en móvil */}
      {!isMobile && (
        <button 
          className="btn rounded-circle position-fixed mobile-toggle" 
          style={{
            top: '15px', 
            left: '15px', 
            zIndex: 1050,
            backgroundColor: COLORS.cornflowerBlue,
            color: COLORS.snowWhite,
            border: 'none'
          }}
          onClick={toggleSidebar}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <i className={`fas fa-${isOpen ? 'times' : 'bars'}`}></i>
        </button>
      )}
      
      {/* Bottom Navigation Bar for Mobile - Siempre visible en móvil */}
      {isMobile && (
        <div className="mobile-bottom-nav">
          {getMenuItems().map(item => (
            <div 
              key={item.id} 
              className={`mobile-nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => handleNavigation(item.id)}
            >
              <div className="item-icon">
                <i className={`fas fa-${item.icon}`}></i>
                {item.badge > 0 && <span className="mobile-badge">{item.badge}</span>}
              </div>
              <span className="item-label">{item.label}</span>
            </div>
          ))}
          <div 
            className="mobile-nav-item"
            onClick={handleLogout}
          >
            <div className="item-icon">
              <i className="fas fa-sign-out-alt"></i>
            </div>
            <span className="item-label">Salir</span>
          </div>
        </div>
      )}
      
      {/* Sidebar navigation - Solo visible en desktop */}
      {!isMobile && (
        <nav 
          className={`sidebar text-white ${isOpen ? 'open' : ''}`}
          style={{ backgroundColor: COLORS.shuttleGray }}
        >
          <div className="p-3 border-bottom" style={{ borderColor: COLORS.gullGray }}>
            <h1 
              className="text-center mb-2 karma-brand" 
              style={{ 
                background: lavenderGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold'
              }}
            >
              Karma
            </h1>
            
            {user && (
              <div className="user-profile my-2 d-flex align-items-center">
                <div className="user-avatar">
                  <i className="fas fa-user-circle"></i>
                </div>
                <div className="user-info ms-2">
                  <div className="user-name">{user.nombre || 'Usuario'}</div>
                  <div className="user-role">{user.rol || 'Cliente'}</div>
                </div>
              </div>
            )}
            
            {isOffline && (
              <div 
                className="badge d-flex align-items-center justify-content-center p-2 w-100"
                style={{ backgroundColor: COLORS.shuttleGray, color: COLORS.snowWhite }}
              >
                <i className="fas fa-wifi-slash me-2"></i>
                <span>Sin conexión</span>
              </div>
            )}
            
            {!isOffline && (
              <div 
                className="badge d-flex align-items-center justify-content-center p-2 w-100"
                style={{ backgroundColor: COLORS.cornflowerBlue, color: COLORS.snowWhite }}
              >
                <i className="fas fa-signal me-2"></i>
                <span>Conectado</span>
              </div>
            )}
          </div>
          
          <ul className="nav flex-column py-2">
            {getMenuItems().map(item => (
              <li key={item.id} className="nav-item">
                <a
                  href={`#${item.id}`}
                  className={`nav-link d-flex align-items-center py-3 ${currentPage === item.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation(item.id);
                  }}
                  style={{
                    color: currentPage === item.id ? COLORS.cornflowerBlue : COLORS.snowWhite,
                    background: currentPage === item.id ? COLORS.alto : 'transparent'
                  }}
                  onMouseOver={(e) => {
                    if (currentPage !== item.id) {
                      e.currentTarget.style.background = 'rgba(157, 166, 184, 0.1)'; // Gull Gray con transparencia
                    }
                  }}
                  onMouseOut={(e) => {
                    if (currentPage !== item.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <i className={`fas fa-${item.icon} me-3`}></i>
                  <span className="nav-label">{item.label}</span>
                  {item.badge > 0 && (
                    <span 
                      className="badge ms-auto"
                      style={{ 
                        background: lavenderGradient,
                        color: COLORS.snowWhite
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
          
          <div className="mt-auto p-3">
            <button 
              className="btn w-100 d-flex align-items-center justify-content-center"
              style={{
                backgroundColor: 'transparent',
                borderColor: COLORS.gullGray,
                color: COLORS.snowWhite
              }}
              onClick={handleLogout}
              disabled={isLoggingOut}
              onMouseOver={(e) => {
                if (!isLoggingOut) {
                  e.currentTarget.style.borderColor = COLORS.cornflowerBlue;
                  e.currentTarget.style.color = COLORS.cornflowerBlue;
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = COLORS.gullGray;
                e.currentTarget.style.color = COLORS.snowWhite;
              }}
            >
              {isLoggingOut ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  <span>Cerrando sesión...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  <span>Cerrar sesión</span>
                </>
              )}
            </button>
          </div>
        </nav>
      )}
    </>
  );
};

export default Navbar;