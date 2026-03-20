import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * PermissionGuard component controls access based on user roles
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to render if permission is granted
 * @param {Array} props.requiredRoles - Roles required to access the content
 * @param {Object} props.currentUser - Current user object containing role information
 * @param {string} props.redirectPath - Path to redirect if permission is denied
 */
const PermissionGuard = ({ 
  children, 
  requiredRoles = [], 
  currentUser = null, 
  redirectPath = '/login' 
}) => {
  const navigate = useNavigate();
  
  // Check if user is logged in
  if (!currentUser) {
    // Redirect to login page after a small delay
    setTimeout(() => navigate(redirectPath), 100);
    
    return (
      <div className="permission-denied">
        <div className="permission-message">
          <i className="fas fa-lock me-2"></i>
          Debes iniciar sesión para acceder a esta página
        </div>
      </div>
    );
  }
  
  // Verificar si el usuario tiene token (importante para autenticación con API)
  if (!currentUser.token) {
    console.warn("Usuario sin token válido detectado");
    // Redireccionar a login para renovar sesión
    setTimeout(() => {
      localStorage.removeItem('karmaUser'); // Limpiar sesión inválida
      navigate(redirectPath);
    }, 100);
    
    return (
      <div className="permission-denied">
        <div className="permission-message">
          <i className="fas fa-exclamation-circle me-2"></i>
          Sesión inválida o expirada. Por favor inicia sesión nuevamente.
        </div>
      </div>
    );
  }
  
  // Manejar tanto "rol" como "role" del usuario (compatibilidad con API)
  const userRole = currentUser.rol || currentUser.role;
  
  // Check if user has required roles
  const hasPermission = requiredRoles.length === 0 || 
    requiredRoles.includes(userRole);
  
  if (!hasPermission) {
    return (
      <div className="permission-denied">
        <div className="permission-message">
          <i className="fas fa-exclamation-triangle me-2"></i>
          No tienes permisos para acceder a esta sección
        </div>
        <button 
          className="btn btn-outline-secondary mt-3"
          onClick={() => navigate('/')}
        >
          Volver al inicio
        </button>
      </div>
    );
  }
  
  // If all checks pass, render children
  return children;
};

export default PermissionGuard;