import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Alert, Row, Col } from 'react-bootstrap';
import AnimatedBackground from './AnimatedBackground';
import { loginUsuario } from '../servicios/api';

const Login = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    correo: '',
    contraseña: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);

  // Detectar estado de red
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validación básica
      if (!credentials.correo || !credentials.contraseña) {
        setError('Por favor completa todos los campos');
        setLoading(false);
        return;
      }

      // Verificar si hay conexión a internet
      if (!navigator.onLine) {
        setError('No hay conexión a internet. Por favor verifica tu conexión e intenta nuevamente.');
        setLoading(false);
        return;
      }
      
      // Autenticación usando la API
      const response = await loginUsuario(credentials.correo, credentials.contraseña);
      
      if (response && response.usuario) {
        // Asegúrate de que el usuario tenga el rol como propiedad
        if (!response.usuario.rol && response.usuario.role) {
          // Si viene como 'role' en lugar de 'rol', ajustarlo
          response.usuario.rol = response.usuario.role;
        }
        
        console.log("Inicio de sesión exitoso", response.usuario);
        
        // Guardar en localStorage y notificar al componente padre
        localStorage.setItem('karmaUser', JSON.stringify(response.usuario));
        onLoginSuccess(response.usuario);
      } else {
        setError('Respuesta del servidor incorrecta. Contacta al administrador.');
      }
    } catch (error) {
      console.error('Error en login:', error);
      
      if (error.message && error.message.includes('Credenciales inválidas')) {
        setError('Correo o contraseña incorrectos. Intenta nuevamente.');
      } else if (error.message && error.message.includes('Failed to fetch')) {
        setError('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      } else {
        setError(error.message || 'Error al iniciar sesión. Intenta más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="login-container p-0 m-0" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Fondo animado con colores temáticos y tamaños aumentados */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 0
      }}>
        <AnimatedBackground 
          primaryColor="#ff85e4"    // Rosa Karma (principal)
          secondaryColor="#c878b8"  // Rosa complementario
          accentColor="#a8d0b9"     // Verde complementario suave
          speed={0.3}
          orbSize={1.5}            // Orbes 50% más grandes
          particleSize={1.8}       // Partículas 80% más grandes
        />
      </div>
      
      <Row className="justify-content-center align-items-center min-vh-100" style={{ position: 'relative', zIndex: 1 }}>
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="shadow-lg border-0 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <div className="logo-container mb-3">
                  <h1 style={{ color: '#ff85e4', fontWeight: 'bold' }}>KARMA</h1>
                </div>
                <h3 className="text-muted mb-2">Punto de Venta</h3>
                <p className="lead">¡Bienvenido/a!</p>
              </div>

              {offline && (
                <Alert variant="warning" className="mb-4 text-center">
                  <i className="fas fa-wifi-slash me-2"></i>
                  Sin conexión a internet. Es necesario tener conexión para iniciar sesión.
                </Alert>
              )}

              {error && (
                <Alert variant="danger" className="mb-4 text-center">
                  {error}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label>Correo electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="usuario@gmail.com"
                    value={credentials.correo}
                    onChange={(e) => setCredentials({...credentials, correo: e.target.value})}
                    required
                    className="py-2"
                    autoComplete="email"
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={credentials.contraseña}
                    onChange={(e) => setCredentials({...credentials, contraseña: e.target.value})}
                    required
                    className="py-2"
                    autoComplete="current-password"
                  />
                </Form.Group>
                
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <Form.Check 
                    type="checkbox"
                    label="Recordarme"
                    id="remember-me"
                  />
                  
                </div>
                
                <Button 
                  type="submit" 
                  className="w-100 py-3" 
                  disabled={loading || offline}
                  style={{
                    backgroundColor: '#ff85e4',
                    color: 'white', 
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxShadow: '0 4px 6px rgba(255, 133, 228, 0.25)',
                    transition: 'all 0.3s ease'
                  }} 
                  onMouseOver={(e) => {
                    if (!loading && !offline) {
                      e.target.style.backgroundColor = '#ff69b4';
                      e.target.style.boxShadow = '0 6px 10px rgba(255, 133, 228, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#ff85e4';
                    e.target.style.boxShadow = '0 4px 6px rgba(255, 133, 228, 0.25)';
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Iniciando sesión...
                    </>
                  ) : 'Iniciar Sesión'}
                </Button>
              </Form>
              
              <div className="text-center mt-4">
                <p className="text-muted">
                  ¿No tienes una cuenta? <span style={{ color: '#ff85e4', cursor: 'pointer' }}>Contacta a tu administrador</span>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
    
export default Login;
