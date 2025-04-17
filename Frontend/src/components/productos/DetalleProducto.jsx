import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Spinner, Alert } from 'react-bootstrap';

const API_URL = 'http://127.0.0.1:5000/productos';

const DetalleProducto = ({ productId, onBack, onEdit, onAddToCart }) => {
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    } else {
      setLoading(false);
      setError('ID de producto no proporcionado');
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/${productId}`);
      
      if (!response.ok) {
        throw new Error('No se pudo obtener los detalles del producto');
      }
      
      const data = await response.json();
      setProducto(data);
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener detalles del producto:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando detalles del producto...</p>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <Alert variant="danger" className="my-4">
        <Alert.Heading>
          <i className="fas fa-exclamation-triangle me-2"></i>
          Error al cargar el producto
        </Alert.Heading>
        <p>{error || 'No se pudo encontrar el producto'}</p>
        <div className="d-flex justify-content-end">
          <Button 
            variant="outline-danger" 
            onClick={onBack}
          >
            Volver
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="container py-3">
      <Row className="mb-3">
        <Col>
          <Button 
            variant="outline-secondary" 
            onClick={onBack}
            className="mb-3"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Volver a productos
          </Button>
        </Col>
      </Row>

      <Card className="border-0 shadow">
        <Card.Header className="bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">{producto.nombre}</h4>
            <Badge 
              bg={producto.stock > 10 ? 'success' : producto.stock > 0 ? 'warning' : 'danger'}
              className="fs-6 py-2 px-3"
            >
              {producto.stock > 0 ? `Stock: ${producto.stock}` : 'Agotado'}
            </Badge>
          </div>
        </Card.Header>
        
        <Card.Body>
          <Row>
            <Col md={7}>
              <Card.Text as="div">
                <Row className="mb-2">
                  <Col xs={4} className="text-muted">ID:</Col>
                  <Col xs={8}>{producto.id}</Col>
                </Row>
                <Row className="mb-2">
                  <Col xs={4} className="text-muted">Nombre:</Col>
                  <Col xs={8}>{producto.nombre}</Col>
                </Row>
                <Row className="mb-2">
                  <Col xs={4} className="text-muted">Categoría:</Col>
                  <Col xs={8}>
                    {producto.categoria ? (
                      <Badge style={{ backgroundColor: '#8c5cf2' }}>
                        {producto.categoria}
                      </Badge>
                    ) : (
                      <span className="text-muted">No especificada</span>
                    )}
                  </Col>
                </Row>
                {/* Add any additional product details here */}
              </Card.Text>
            </Col>
            
            <Col md={5} className="d-flex flex-column align-items-end justify-content-between">
              <div className="text-end mb-4">
                <p className="text-muted mb-0">Precio unitario</p>
                <h2 className="mb-0" style={{ color: '#6a3eac' }}>${producto.precio}</h2>
              </div>
              
              <div className="d-grid gap-2 w-100">
                <Button 
                  variant="outline-primary"
                  onClick={() => onEdit(producto)}
                  style={{ color: '#8c5cf2', borderColor: '#8c5cf2' }}
                >
                  <i className="fas fa-edit me-2"></i>
                  Editar producto
                </Button>
                
                <Button 
                  variant="primary"
                  disabled={producto.stock <= 0}
                  onClick={() => onAddToCart(producto)}
                  style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                >
                  <i className="fas fa-cart-plus me-2"></i>
                  Agregar al carrito
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
        
        <Card.Footer className="bg-white py-3 text-muted">
          <small>
            <i className="fas fa-info-circle me-2"></i>
            Última actualización: {new Date().toLocaleDateString()}
          </small>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default DetalleProducto;