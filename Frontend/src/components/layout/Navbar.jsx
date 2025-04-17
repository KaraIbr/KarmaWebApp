import React from 'react';
import './Navbar.css';
import { COLORS, createLavenderGradient } from '../../servicios/theme';

const Navbar = ({ isOpen, toggleSidebar, isOffline, user, onLogout, onNavigate, currentPage, cartItemCount = 0 }) => {
  
  // Define menu items (accesibles para todos los usuarios)
  const getMenuItems = () => {
    return [
      { id: 'inicio', label: 'Inicio', icon: 'home' },
      { id: 'inventario', label: 'Inventario', icon: 'boxes' },
      { id: 'carrito', label: 'Carrito', icon: 'shopping-cart', badge: cartItemCount },
      { id: 'ventas', label: 'Ventas', icon: 'receipt' },
    ];
  };

  const handleNavigation = (itemId) => {
    onNavigate(itemId);
    // On mobile, close sidebar after selecting an item
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  // Estilos del gradiente para elementos destacados
  const lavenderGradient = createLavenderGradient('to right');

  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
      
      {/* Toggle button for mobile */}
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
      >
        <i className={`fas fa-${isOpen ? 'times' : 'bars'}`}></i>
      </button>
      
      {/* Sidebar navigation */}
      <nav 
        className={`sidebar text-white ${isOpen ? 'open' : ''}`}
        style={{ backgroundColor: COLORS.shuttleGray }}
      >
        <div className="p-3 border-bottom" style={{ borderColor: COLORS.gullGray }}>
          <h1 
            className="text-center mb-2" 
            style={{ 
              background: lavenderGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}
          >
            Karma
          </h1>
          
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
            onClick={onLogout}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = COLORS.cornflowerBlue;
              e.currentTarget.style.color = COLORS.cornflowerBlue;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = COLORS.gullGray;
              e.currentTarget.style.color = COLORS.snowWhite;
            }}
          >
            <i className="fas fa-sign-out-alt me-2"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;