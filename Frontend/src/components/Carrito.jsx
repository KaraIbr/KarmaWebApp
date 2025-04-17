import React, { useState, useEffect } from 'react';
import { Card, Button, ListGroup, Badge, Row, Col, Form, Spinner, Alert, Modal } from 'react-bootstrap';
import ItemCarrito from './ItemCarrito';

const API_URL = 'http://127.0.0.1:5000';

const Carrito = ({ usuario, onCheckout, onRefreshCart }) => {
  const [productosCarrito, setProductosCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [procesandoCodigo, setProcesandoCodigo] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    cargarCarrito();
  }, []);

  // Calculate total whenever cart items change
  useEffect(() => {
    const nuevoTotal = productosCarrito.reduce((suma, item) => {
      return suma + (item.productos?.precio || 0) * item.cantidad;
    }, 0);
    setTotal(nuevoTotal);
  }, [productosCarrito]);

  const cargarCarrito = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/carrito`);
      
      if (!response.ok) {
        throw new Error('Error al cargar el carrito');
      }
      
      const data = await response.json();
      setProductosCarrito(data || []);
      setLoading(false);
      if (onRefreshCart) onRefreshCart(); // Notificar al componente padre sobre la actualización
    } catch (err) {
      console.error('Error al obtener el carrito:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const manejarActualizarCantidad = async (itemId, nuevaCantidad) => {
    try {
      if (nuevaCantidad <= 0) {
        return await manejarEliminarProducto(itemId);
      }
      
      // Find the item for optimistic update
      const itemIndex = productosCarrito.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return;
      
      // Create a copy for optimistic update
      const updatedCart = [...productosCarrito];
      updatedCart[itemIndex] = {
        ...updatedCart[itemIndex],
        cantidad: nuevaCantidad
      };
      
      // Update UI immediately (optimistic)
      setProductosCarrito(updatedCart);
      
      // Make API call
      const response = await fetch(`${API_URL}/carrito/${itemId}/cantidad`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cantidad: nuevaCantidad }),
      });
      
      if (!response.ok) {
        // If failed, revert to previous state
        cargarCarrito();
        throw new Error('Error al actualizar cantidad');
      }
      
    } catch (err) {
      console.error('Error al actualizar cantidad:', err);
      setError(err.message);
    }
  };

  const manejarEliminarProducto = async (itemId) => {
    try {
      // Optimistic UI update
      setProductosCarrito(prev => prev.filter(item => item.id !== itemId));
      
      // Make API call
      const response = await fetch(`${API_URL}/carrito/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // If failed, reload cart to get actual state
        cargarCarrito();
        throw new Error('Error al eliminar el producto');
      }
      
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      setError(err.message);
    }
  };

  const manejarVaciarCarrito = async () => {
    try {
      if (!window.confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
        return;
      }
      
      // Optimistic UI update
      setProductosCarrito([]);
      
      // Make API call
      const response = await fetch(`${API_URL}/carrito/vaciar`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // If failed, reload cart
        cargarCarrito();
        throw new Error('Error al vaciar el carrito');
      }
      
    } catch (err) {
      console.error('Error al vaciar el carrito:', err);
      setError(err.message);
    }
  };

  const manejarProcederPago = () => {
    if (productosCarrito.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    // Mostrar modal de confirmación antes de proceder al pago
    setShowConfirmModal(true);
  };

  const confirmarPago = () => {
    setShowConfirmModal(false);
    if (onCheckout) {
      onCheckout(); // Notificar al componente padre para proceder con el checkout
    } else {
      // Código alternativo si no hay prop onCheckout
      window.location.href = '/checkout';
    }
  };

  const toggleScanner = () => {
    setShowScanner(!showScanner);
  };

  const procesarCodigoProducto = async (e) => {
    e.preventDefault();
    if (!codigoManual || codigoManual.trim() === '') {
      setError('Por favor ingresa un código válido');
      return;
    }

    try {
      setProcesandoCodigo(true);
      setError(null);

      // Buscar el producto por su código
      const responseProducto = await fetch(`${API_URL}/productos/codigo/${codigoManual}`);
      if (!responseProducto.ok) {
        throw new Error('No se encontró ningún producto con ese código');
      }

      const producto = await responseProducto.json();

      // Añadir el producto al carrito
      const responseCarrito = await fetch(`${API_URL}/carrito/agregar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          producto_id: producto.id, 
          cantidad: cantidad 
        }),
      });

      if (!responseCarrito.ok) {
        throw new Error('Error al añadir el producto al carrito');
      }

      // Recargar carrito después de añadir el producto
      await cargarCarrito();
      
      // Limpiar el formulario
      setCodigoManual('');
      setCantidad(1);
      
      // Mostrar confirmación
      setError(`"${producto.nombre}" agregado al carrito`);

    } catch (err) {
      console.error('Error al procesar código:', err);
      setError(err.message);
    } finally {
      setProcesandoCodigo(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5 py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando carrito...</p>
      </div>
    );
  }

  return (
    <div className="container py-3">
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <i className="fas fa-shopping-cart me-2" style={{ color: '#8c5cf2' }}></i>
            Mi Carrito
          </h4>
          
          <div>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="me-2"
              onClick={toggleScanner}
            >
              <i className="fas fa-qrcode me-1"></i>
              <span className="d-none d-md-inline">Añadir producto</span>
            </Button>
            
            {productosCarrito.length > 0 && (
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={manejarVaciarCarrito}
              >
                <i className="fas fa-trash-alt me-1"></i>
                <span className="d-none d-md-inline">Vaciar</span>
              </Button>
            )}
          </div>
        </Card.Header>
        
        <Card.Body className="p-0">
          {error && (
            <Alert variant={error.includes("agregado") ? "success" : "danger"} className="m-3" dismissible onClose={() => setError(null)}>
              <i className={`fas ${error.includes("agregado") ? "fa-check-circle" : "fa-exclamation-circle"} me-2`}></i>
              {error}
            </Alert>
          )}
          
          {showScanner && (
            <div className="p-3 border-bottom">
              <h5 className="mb-3">Añadir producto al carrito</h5>
              
              <Form onSubmit={procesarCodigoProducto}>
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Código del producto</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={codigoManual}
                        onChange={(e) => setCodigoManual(e.target.value)}
                        placeholder="Ingresa el código de barras o SKU" 
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Cantidad</Form.Label>
                      <Form.Control 
                        type="number" 
                        min="1"
                        value={cantidad}
                        onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="w-100"
                      style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                      disabled={procesandoCodigo}
                    >
                      {procesandoCodigo ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus me-2"></i>
                          Añadir
                        </>
                      )}
                    </Button>
                  </Col>
                </Row>
              </Form>

              <div className="text-end mb-2">
                <Button 
                  variant="outline-secondary"
                  size="sm" 
                  onClick={toggleScanner}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
          
          {productosCarrito.length > 0 ? (
            <ListGroup variant="flush">
              {productosCarrito.map(item => (
                <ItemCarrito 
                  key={item.id}
                  item={item}
                  onUpdateQuantity={manejarActualizarCantidad}
                  onRemove={manejarEliminarProducto}
                />
              ))}
            </ListGroup>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-shopping-cart fa-3x mb-3 text-muted"></i>
              <h5 className="text-muted">Tu carrito está vacío</h5>
              <p className="text-muted">Agrega productos para continuar</p>
              <Button
                variant="primary"
                onClick={toggleScanner}
                style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
              >
                <i className="fas fa-plus me-2"></i>
                Añadir productos
              </Button>
            </div>
          )}
        </Card.Body>
        
        {productosCarrito.length > 0 && (
          <Card.Footer className="bg-white py-3">
            <Row className="align-items-center">
              <Col xs={6}>
                <div className="d-flex flex-column">
                  <span className="text-muted">Total</span>
                  <h3 className="mb-0" style={{ color: '#6a3eac' }}>${total.toFixed(2)}</h3>
                </div>
              </Col>
              
              <Col xs={6} className="text-end">
                <Button 
                  onClick={manejarProcederPago}
                  size="lg"
                  style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                >
                  <i className="fas fa-credit-card me-2"></i>
                  Finalizar compra
                </Button>
              </Col>
            </Row>
          </Card.Footer>
        )}
      </Card>

      {/* Modal de confirmación */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar compra</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <i className="fas fa-shopping-bag fa-3x mb-3" style={{ color: '#8c5cf2' }}></i>
          </div>
          <h5 className="text-center mb-3">¿Estás seguro de que deseas finalizar esta compra?</h5>
          
          <div className="border rounded p-3 mb-3">
            <p className="mb-2"><strong>Resumen de la compra:</strong></p>
            <p className="mb-1"><i className="fas fa-shopping-basket me-2"></i> {productosCarrito.length} {productosCarrito.length === 1 ? 'producto' : 'productos'}</p>
            <p className="mb-0"><i className="fas fa-money-bill-wave me-2"></i> Total: <strong>${total.toFixed(2)}</strong></p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowConfirmModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={confirmarPago}
            style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
          >
            <i className="fas fa-check me-2"></i>
            Confirmar compra
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Carrito;
