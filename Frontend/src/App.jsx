import React, { useState, useEffect } from "react";
import { Container } from 'react-bootstrap';
import { BrowserRouter as Router } from "react-router-dom";
import Login from "./components/Login";
import Productos from "./components/Productos";
import Carrito from "./components/Carrito";
import Pagos from "./components/Pagos";
import Ventas from "./components/Ventas";
import Dashboard from "./components/dashboard/Dashboard"; // Importar el nuevo componente Dashboard
import GeneradorEtiquetas from "./components/etiquetas/GeneradorEtiquetas";
import 'bootstrap/dist/css/bootstrap.min.css';

// Import our components
import ErrorBoundary from "./components/seguridad/ErrorBoundary";
import PermissionGuard from "./components/seguridad/PermissionGuard";
import Layout from "./components/layout/Layout";
import { logoutUsuario } from "./servicios/api";

// Use environment variable for API URL
const API_URL = 'https://karmaapi-z51n.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('inicio');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  
  // Verificar si hay un usuario guardado en localStorage al iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem('karmaUser');
    
    // Escuchar eventos de conexión
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Verificar que el usuario tenga todos los campos necesarios
        if (parsedUser && (parsedUser.rol || parsedUser.role) && parsedUser.nombre && parsedUser.token) {
          // Asegurar que el campo rol existe (podría venir como 'role' desde la API)
          if (!parsedUser.rol && parsedUser.role) {
            parsedUser.rol = parsedUser.role;
          }
          setUser(parsedUser);
        } else {
          // Si no tiene todos los campos necesarios, forzar inicio de sesión
          localStorage.removeItem('karmaUser');
          setUser(null);
        }
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem('karmaUser');
        setUser(null);
      }
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // When user changes, fetch cart and store user in localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('karmaUser', JSON.stringify(user));
      // Solo intentar obtener el carrito si estamos online
      if (navigator.onLine) {
        fetchCarrito();
      }
    } else {
      localStorage.removeItem('karmaUser');
    }
  }, [user]);

  const fetchCarrito = async () => {
    if (!user || offlineMode) return;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos timeout
      
      const response = await fetch(`${API_URL}/api/carrito/usuario/${user.id}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token || 'no-token'}`
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`Error en respuesta del carrito: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      setCarrito(data?.items || []);
    } catch (error) {
      console.error("Error fetching cart data:", error);
    }
  };

  const handleLogin = (userData) => {
    // Verificar que los datos del usuario sean correctos
    if (!userData || !userData.token) {
      console.error("Datos de usuario incorrectos en login");
      return;
    }
    
    // Asegurar que el campo rol existe (podría venir como 'role' desde la API)
    if (!userData.rol && userData.role) {
      userData.rol = userData.role;
    }
    
    // Actualizar estado y localStorage
    setUser(userData);
    localStorage.setItem('karmaUser', JSON.stringify(userData));
    setCurrentPage('inicio');
  };

  const handleLogout = async () => {
    // Limpieza completa de la sesión
    try {
      // Intentar cerrar sesión en la API (si está disponible)
      if (navigator.onLine && user && user.token) {
        await logoutUsuario(user.token);
      }

      // Limpiar completamente el estado de la aplicación
      setCarrito([]);
      setCurrentPage('inicio');
      
      // Eliminar sesión del localStorage
      localStorage.removeItem('karmaUser');
      
      // Limpiar el estado del usuario
      setUser(null);
      
      console.log('Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      // Forzar el cierre incluso si hay errores
      localStorage.removeItem('karmaUser');
      setUser(null);
    }
  };

  const handleProceedToCheckout = () => {
    setIsCheckingOut(true);
  };
  
  const handleCompleteCheckout = (orderData) => {
    setIsCheckingOut(false);
    setCurrentPage('inicio');
    // Clear cart after checkout
    setCarrito([]);
    alert(`¡Compra completada! Número de orden: ${orderData.id}`);
  };
  
  const handleCancelCheckout = () => {
    setIsCheckingOut(false);
    setCurrentPage('carrito');
  };

  // Si no hay usuario, mostrar login
  if (!user) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  // Define the content for the current page
  const renderContent = () => {
    // If checkout is in progress, show the Pagos component
    if (isCheckingOut) {
      return (
        <PermissionGuard currentUser={user} requiredRoles={['admin', 'user']}>
          <Pagos 
            usuario={user} 
            onCompletePurchase={handleCompleteCheckout}
            onCancel={handleCancelCheckout}
          />
        </PermissionGuard>
      );
    }

    // Otherwise, show the requested page
    switch (currentPage) {
      case 'inicio':
        return (
          <PermissionGuard currentUser={user} requiredRoles={['admin', 'user']}>
            <Dashboard />
          </PermissionGuard>
        );
      case 'inventario':
        return (
          <PermissionGuard currentUser={user} requiredRoles={['admin', 'user']}>
            <Productos usuario={user} onRefreshCart={fetchCarrito} />
          </PermissionGuard>
        );
      case 'carrito':
        return (
          <PermissionGuard currentUser={user} requiredRoles={['admin', 'user']}>
            <Carrito 
              usuario={user} 
              onCheckout={handleProceedToCheckout}
              onRefreshCart={fetchCarrito}
            />
          </PermissionGuard>
        );
      case 'ventas':
        return (
          <PermissionGuard currentUser={user} requiredRoles={['admin', 'user']}>
            <Ventas usuario={user} />
          </PermissionGuard>
        );
      case 'etiquetas':
        return (
          <PermissionGuard currentUser={user} requiredRoles={['admin', 'user']}>
            <GeneradorEtiquetas />
          </PermissionGuard>
        );
      default:
        return <div>Página no encontrada</div>;
    }
  };

  // Wrapped with Layout and ErrorBoundary
  return (
    <Router>
      <ErrorBoundary>
        <Layout 
          user={user} 
          onLogout={handleLogout}
          onNavigate={setCurrentPage}
          currentPage={currentPage}
          cartItemCount={carrito.length}
        >
          <Container fluid className="p-0">
            {renderContent()}
          </Container>
        </Layout>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
