import React, { useState, useEffect } from 'react';
import { Card, Button, ListGroup, Badge, Row, Col, Form, Spinner, Alert, InputGroup, Container, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ItemCarrito from './ItemCarrito';

// Use environment variable for API URL
const API_BASE_URL = 'https://karmaapi-z51n.onrender.com';
const API_URL = `${API_BASE_URL}/api`;

const Carrito = ({ usuario, onCheckout, onRefreshCart }) => {
  const [productosCarrito, setProductosCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [total, setTotal] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [codigoDescuento, setCodigoDescuento] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    cargarCarrito();
  }, []);

  useEffect(() => {
    const nuevoSubtotal = productosCarrito.reduce((suma, item) => {
      return suma + (item.productos?.precio || 0) * item.cantidad;
    }, 0);
    setSubtotal(nuevoSubtotal);
    const nuevoTotal = nuevoSubtotal - descuento;
    setTotal(nuevoTotal);
  }, [productosCarrito, descuento]);

  const cargarCarrito = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_URL}/carrito`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al cargar el carrito: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const carritoData = Array.isArray(data) ? data : [];

      setProductosCarrito(carritoData);
      setLoading(false);
      if (onRefreshCart) onRefreshCart();
    } catch (err) {
      setError('No se pudo cargar el carrito. Por favor, intenta de nuevo más tarde.');
      setProductosCarrito([]);
      setLoading(false);
    }
  };

  const manejarActualizarCantidad = async (itemId, nuevaCantidad) => {
    try {
      if (nuevaCantidad <= 0) {
        return await manejarEliminarProducto(itemId);
      }

      const itemIndex = productosCarrito.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return;

      const updatedCart = [...productosCarrito];
      updatedCart[itemIndex] = {
        ...updatedCart[itemIndex],
        cantidad: nuevaCantidad,
      };

      setProductosCarrito(updatedCart);

      const response = await fetch(`${API_URL}/carrito/${itemId}/cantidad`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cantidad: nuevaCantidad }),
      });

      if (!response.ok) {
        cargarCarrito();
        throw new Error('Error al actualizar cantidad');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const manejarEliminarProducto = async (itemId) => {
    try {
      setProductosCarrito(prev => prev.filter(item => item.id !== itemId));

      const response = await fetch(`${API_URL}/carrito/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        cargarCarrito();
        throw new Error('Error al eliminar el producto');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const manejarVaciarCarrito = async () => {
    try {
      setProductosCarrito([]);

      const response = await fetch(`${API_URL}/carrito/vaciar`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        cargarCarrito();
        throw new Error('Error al vaciar el carrito');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const manejarProcederPago = () => {
    if (productosCarrito.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    if (onCheckout) {
      onCheckout();
    } else {
      window.location.href = '/checkout';
    }
  };

  const handleAplicarDescuento = () => {
    if (codigoDescuento === 'PROMO10') {
      setDescuento(10);
      setSuccess('Descuento aplicado correctamente.');
    } else {
      setError('Código promocional inválido.');
    }
  };

  const handleEliminarDescuento = () => {
    setDescuento(0);
    setCodigoDescuento('');
    setSuccess(null);
  };

  const limpiarCarrito = async () => {
    await manejarVaciarCarrito();
    setShowConfirmClear(false);
  };

  // Componente especial para productos en móvil
  const MobileItemsList = () => (
    <div className="d-md-none">
      {productosCarrito.map(item => (
        <div key={item.id} className="mobile-card bg-white mb-3">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="mobile-title">{item.nombre}</div>
            <div className="mobile-price">${parseFloat(item.precio * item.cantidad).toFixed(2)}</div>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-light btn-sm me-2"
                onClick={() => manejarActualizarCantidad(item.id, Math.max(1, item.cantidad - 1))}
              >
                <i className="fas fa-minus"></i>
              </button>
              <div className="border px-3 py-1 rounded">{item.cantidad}</div>
              <button
                className="btn btn-light btn-sm ms-2"
                onClick={() => manejarActualizarCantidad(item.id, item.cantidad + 1)}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>

            <button
              className="btn btn-link text-danger p-0 border-0"
              onClick={() => manejarEliminarProducto(item.id)}
              aria-label="Eliminar producto"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>

          <div className="text-muted mt-2 small">
            Precio unitario: ${parseFloat(item.precio).toFixed(2)}
          </div>
        </div>
      ))}

      {productosCarrito.length === 0 && (
        <div className="text-center py-4">
          <i className="fas fa-shopping-cart fa-3x mb-3 text-muted"></i>
          <p>Tu carrito está vacío</p>
          <Link
            to="/productos"
            className="btn btn-primary mt-2"
            style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
          >
            Ver productos
          </Link>
        </div>
      )}
    </div>
  );

  // Barra de acción flotante para móvil con resumen del carrito
  const MobileActionBar = () => (
    <div className="mobile-action-bar d-md-none">
      <div>
        <div className="fw-bold fs-5">${total.toFixed(2)}</div>
        <small className="text-muted">{productosCarrito.length} producto(s)</small>
      </div>
      <Button
        variant="primary"
        onClick={manejarProcederPago}
        style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
        className="px-4 py-2"
        disabled={productosCarrito.length === 0}
      >
        <i className="fas fa-check me-2"></i>
        Proceder al pago
      </Button>
    </div>
  );

  // Componente para mostrar promociones y descuentos en móvil
  const MobilePromotions = () => (
    <div className="d-md-none mb-3">
      <div className="mobile-card bg-white mb-3">
        <h5 className="mb-3">Código promocional</h5>
        <div className="input-group mb-2">
          <Form.Control
            type="text"
            placeholder="Ingresa tu código"
            value={codigoDescuento}
            onChange={(e) => setCodigoDescuento(e.target.value)}
          />
          <Button
            variant={descuento > 0 ? 'danger' : 'primary'}
            onClick={descuento > 0 ? handleEliminarDescuento : handleAplicarDescuento}
            disabled={descuento > 0 ? false : !codigoDescuento}
            style={{
              backgroundColor: descuento > 0 ? '#dc3545' : '#8c5cf2',
              borderColor: descuento > 0 ? '#dc3545' : '#7647eb',
            }}
          >
            {descuento > 0 ? 'Eliminar' : 'Aplicar'}
          </Button>
        </div>
        {descuento > 0 && (
          <div className="alert alert-success py-2 mb-0">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <i className="fas fa-check-circle me-2"></i>
                Descuento aplicado:
              </div>
              <div className="fw-bold text-success">-${descuento.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Container className="py-4">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h2 className="rubik-medium mb-0">
          <i className="fas fa-shopping-cart me-2" style={{ color: '#8c5cf2' }}></i>
          Carrito de Compra
        </h2>
        <div>
          {productosCarrito.length > 0 && (
            <Button
              variant="outline-danger"
              className="d-none d-md-inline-block"
              onClick={() => setShowConfirmClear(true)}
              size="sm"
            >
              <i className="fas fa-trash-alt me-2"></i>
              Limpiar carrito
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          <i className="fas fa-check-circle me-2"></i>
          {success}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" style={{ color: '#8c5cf2' }}>
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
          <p className="mt-3 text-muted">Cargando el carrito...</p>
        </div>
      ) : (
        <Row>
          <Col lg={8}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white py-3 border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="fas fa-box me-2" style={{ color: '#8c5cf2' }}></i>
                    Productos
                    <span
                      className="badge rounded-pill ms-2"
                      style={{ backgroundColor: '#f5f5f7', color: '#555' }}
                    >
                      {productosCarrito.length}
                    </span>
                  </h5>
                  {productosCarrito.length > 0 && (
                    <Button
                      variant="outline-danger"
                      className="d-md-none"
                      onClick={() => setShowConfirmClear(true)}
                      size="sm"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </Button>
                  )}
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {/* Lista de productos versión escritorio */}
                <div className="d-none d-md-block">
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
                </div>

                {/* Vista especial para móvil */}
                <MobileItemsList />

                {productosCarrito.length === 0 && (
                  <div className="text-center py-5 d-none d-md-block">
                    <i className="fas fa-shopping-cart fa-4x mb-3 text-muted"></i>
                    <h5>Tu carrito está vacío</h5>
                    <p className="text-muted">Agrega productos para continuar</p>
                    <Link
                      to="/productos"
                      className="btn btn-primary mt-2"
                      style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                    >
                      Ver productos
                    </Link>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Promociones versión móvil */}
            <MobilePromotions />
          </Col>
          <Col lg={4}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Header className="bg-white py-3 border-0">
                <h5 className="mb-0">
                  <i className="fas fa-receipt me-2" style={{ color: '#8c5cf2' }}></i>
                  Resumen del pedido
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {descuento > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-danger">
                    <span>Descuento</span>
                    <span>-${descuento.toFixed(2)}</span>
                  </div>
                )}

                <hr />

                <div className="d-flex justify-content-between mb-3">
                  <span className="fw-bold">Total</span>
                  <span className="fw-bold fs-5">${total.toFixed(2)}</span>
                </div>

                <Button
                  variant="primary"
                  className="w-100 mb-3"
                  disabled={productosCarrito.length === 0}
                  onClick={manejarProcederPago}
                  style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                >
                  <i className="fas fa-check me-2"></i>
                  Proceder al pago
                </Button>

                <Link to="/productos" className="btn btn-outline-secondary w-100">
                  <i className="fas fa-arrow-left me-2"></i>
                  Seguir comprando
                </Link>
              </Card.Body>
            </Card>

            {/* Bloque de promociones y descuentos (escritorio) */}
            <Card className="border-0 shadow-sm d-none d-md-block">
              <Card.Header className="bg-white py-3 border-0">
                <h5 className="mb-0">
                  <i className="fas fa-tags me-2" style={{ color: '#8c5cf2' }}></i>
                  Código promocional
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="input-group mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Ingresa tu código"
                    value={codigoDescuento}
                    onChange={(e) => setCodigoDescuento(e.target.value)}
                  />
                  <Button
                    variant={descuento > 0 ? 'danger' : 'primary'}
                    onClick={descuento > 0 ? handleEliminarDescuento : handleAplicarDescuento}
                    disabled={descuento > 0 ? false : !codigoDescuento}
                    style={{
                      backgroundColor: descuento > 0 ? '#dc3545' : '#8c5cf2',
                      borderColor: descuento > 0 ? '#dc3545' : '#7647eb',
                    }}
                  >
                    {descuento > 0 ? 'Eliminar' : 'Aplicar'}
                  </Button>
                </div>

                {descuento > 0 && (
                  <Alert variant="success" className="mb-0 d-flex justify-content-between align-items-center">
                    <div>
                      <i className="fas fa-check-circle me-2"></i>
                      Descuento aplicado
                    </div>
                    <strong>-${descuento.toFixed(2)}</strong>
                  </Alert>
                )}

                <div className="mt-3">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Los códigos promocionales se aplican al subtotal
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Barra de acción móvil */}
      {!loading && productosCarrito.length > 0 && <MobileActionBar />}

      {/* Modal de confirmación para limpiar carrito */}
      <Modal show={showConfirmClear} onHide={() => setShowConfirmClear(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar acción</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro de que deseas eliminar todos los productos del carrito?</p>
          <p className="mb-0 text-muted">Esta acción no se puede deshacer.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowConfirmClear(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={limpiarCarrito}>
            Eliminar todo
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Carrito;
