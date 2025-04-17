import React, { useState, useEffect } from "react";
import { Container } from 'react-bootstrap';
import { BrowserRouter as Router } from "react-router-dom";
import Login from "./components/Login";
import Productos from "./components/Productos";
import Carrito from "./components/Carrito";
import Pagos from "./components/Pagos";
import Ventas from "./components/Ventas";
import 'bootstrap/dist/css/bootstrap.min.css';

// Import our components
import ErrorBoundary from "./components/seguridad/ErrorBoundary";
import PermissionGuard from "./components/seguridad/PermissionGuard";
import Layout from "./components/layout/Layout";

const API_URL = "http://127.0.0.1:5000";

function App() {
  // Usuario por defecto para deshabilitar temporalmente el login
  const defaultUser = {
    id: 1,
    nombre: "Usuario Temporal",
    correo: "usuario@temp.com",
    rol: "admin" // asignar rol admin para acceder a todas las funciones
  };

  const [user, setUser] = useState(defaultUser); // Inicializar con el usuario por defecto
  const [currentPage, setCurrentPage] = useState('inicio'); // Cambiado a 'inicio' como página por defecto
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [carrito, setCarrito] = useState([]);
  
  // Comentamos esta verificación inicial para deshabilitar el login
  /*
  useEffect(() => {
    const storedUser = localStorage.getItem('karmaUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem('karmaUser');
      }
    }
  }, []);
  */

  // When user changes, fetch cart and store user in localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('karmaUser', JSON.stringify(user));
      fetchCarrito();
    } else {
      localStorage.removeItem('karmaUser');
    }
  }, [user]);

  const fetchCarrito = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/carrito`);
      if (!response.ok) {
        throw new Error('Error fetching cart');
      }
      const data = await response.json();
      setCarrito(data || []);
    } catch (error) {
      console.error("Error fetching cart data:", error);
    }
  };

  const handleLogout = () => {
    // En lugar de cerrar sesión, mantenemos el usuario por defecto
    setUser(defaultUser);
    setCurrentPage('inicio');
  };

  const handleProceedToCheckout = () => {
    setIsCheckingOut(true);
  };
  
  const handleCompleteCheckout = (orderData) => {
    setIsCheckingOut(false);
    setCurrentPage('inicio');
    // Maybe show some success message or redirect to order details
    alert(`¡Compra completada! Número de orden: ${orderData.id}`);
  };
  
  const handleCancelCheckout = () => {
    setIsCheckingOut(false);
  };

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
            <div className="home-container p-4">
              <h1 className="display-4 mb-4">Bienvenido a Karma</h1>
              <div className="row">
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border-primary">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title"><i className="fas fa-boxes me-2"></i>Inventario</h5>
                      <p className="card-text">Administra tu inventario de productos, añade nuevos productos o actualiza los existentes.</p>
                      <button 
                        className="btn btn-primary mt-auto"
                        onClick={() => setCurrentPage('inventario')}
                      >
                        Ir a Inventario
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border-success">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title"><i className="fas fa-shopping-cart me-2"></i>Carrito</h5>
                      <p className="card-text">Escanea productos o ingresa códigos manualmente para agregarlos al carrito.</p>
                      <button 
                        className="btn btn-success mt-auto"
                        onClick={() => setCurrentPage('carrito')}
                      >
                        Ir al Carrito
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border-info">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title"><i className="fas fa-receipt me-2"></i>Ventas</h5>
                      <p className="card-text">Consulta el historial de ventas realizadas y genera reportes.</p>
                      <button 
                        className="btn btn-info mt-auto text-white"
                        onClick={() => setCurrentPage('ventas')}
                      >
                        Ver Ventas
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
