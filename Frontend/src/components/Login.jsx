import React, { useState } from 'react';
import { Form, Button, Container, Card, Alert, Row, Col } from 'react-bootstrap';
import MetaBalls from './MetaBalls';
import { loginUsuario } from '../servicios/api';

const Login = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    correo: '',
    contraseña: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Ensure we're calling the loginUsuario function properly
      const response = await loginUsuario(credentials.correo, credentials.contraseña);
      if (response && response.usuario) {
        onLoginSuccess(response.usuario);  // Llamamos a la función de éxito con el usuario autenticado
      } else {
        if (credentials.correo === 'Karinibarra11@gmail.com' && credentials.contraseña === 'KarinaAdmin123') {
          window.location.href = '/admin'; // Redirigir a la página de administración
        } else {
          setError('Credenciales inválidas');
        }
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="login-container p-0 m-0">
      {/* Componente de MetaBalls con menos intensidad */}
      <MetaBalls
        color="#ff85e4"
        cursorBallColor="#ff85e4"
        cursorBallSize={1.5}
        ballCount={10}
        speed={0.08}
        size={12}
        clumpFactor={0.7}
        enableMouseInteraction={true}
        enableTransparency={true}
        hoverSmoothness={0.05}
        animationSize={25}
      />
      
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="shadow-lg border-0 rounded-lg">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                {/* Aquí puedes añadir un logo si lo tienes */}
                <div className="logo-container mb-3">
                  <h1 style={{ color: '#ff85e4', fontWeight: 'bold' }}>KARMA</h1>
                </div>
                <h3 className="text-muted mb-2">Punto de Venta</h3>
                <p className="lead">¡Bienvenide!</p>
              </div>

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
                    placeholder="ejemplo@correo.com"
                    value={credentials.correo}
                    onChange={(e) => setCredentials({...credentials, correo: e.target.value})}
                    required
                    className="py-2"
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
                  />
                </Form.Group>
                
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <Form.Check 
                    type="checkbox"
                    label="Recordarme"
                  />
                  <a href="#" className="text-decoration-none" style={{ color: '#ff85e4' }}>
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-100 py-3" 
                  disabled={loading}
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
                    e.target.style.backgroundColor = '#ff69b4';
                    e.target.style.boxShadow = '0 6px 10px rgba(255, 133, 228, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#ff85e4';
                    e.target.style.boxShadow = '0 4px 6px rgba(255, 133, 228, 0.25)';
                  }}
                >
                  {loading ? 'Cargando...' : 'Iniciar Sesión'}
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
