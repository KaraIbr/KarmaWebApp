import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import SelectorMetodoPago from './SelectorMetodoPago';
import { API_URL, API_PREFIX, STANDARD_HEADERS } from '../servicios/api.jsx';

const Pagos = ({ usuario, onCompletePurchase, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [discount, setDiscount] = useState(null);

  // Estado para seguimiento de pasos
  const [currentStep, setCurrentStep] = useState(1);

  // Cart summary values
  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [total, setTotal] = useState(0);

  // Modal para completar información del cliente en caso de venta a crédito
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    direccion: ''
  });

  // Estado para recibo de venta
  const [receipt, setReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);

  useEffect(() => {
    loadCartItems();
  }, []);

  // Calculate totals whenever cart or discount changes
  useEffect(() => {
    const cartSubtotal = cart.reduce((sum, item) => {
      return sum + (item.productos?.precio || 0) * item.cantidad;
    }, 0);

    setSubtotal(cartSubtotal);

    // Calculate discount amount
    let discountValue = 0;
    if (discount) {
      if (discount.tipo === 'porcentaje') {
        discountValue = cartSubtotal * (discount.valor / 100);
      } else if (discount.tipo === 'monto') {
        discountValue = discount.valor;
      }
    }

    setDiscountAmount(discountValue);
    setTotal(cartSubtotal - discountValue);
  }, [cart, discount]);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}${API_PREFIX}carrito`);

      if (!response.ok) {
        throw new Error('Error al cargar el carrito');
      }

      const data = await response.json();
      setCart(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener el carrito:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGoToNextStep = () => {
    setCurrentStep(2);
  };

  const handleSelectPaymentMethod = (method) => {
    setPaymentMethod(method);
  };

  const validatePaymentDetails = () => {
    if (!paymentMethod) return false;

    const details = paymentMethod.details;

    // Validar según tipo de pago
    if (paymentMethod.id === 'efectivo') {
      return parseFloat(details.amount) >= total;
    } 
    else if (paymentMethod.id === 'tarjeta') {
      return details.cardDigits && details.cardDigits.length === 4 && details.reference;
    }
    else if (paymentMethod.id === 'transferencia') {
      return details.reference && details.reference.trim() !== '';
    }
    else if (paymentMethod.id === 'credito') {
      return details.clientName && details.clientName.trim() !== '';
    }
    else if (paymentMethod.id === 'mixto') {
      if (!details.mixedPayments || details.mixedPayments.length === 0) return false;
      
      // Verificar que los montos cubran el total
      const totalPaid = details.mixedPayments.reduce((sum, payment) => {
        return sum + (parseFloat(payment.amount) || 0);
      }, 0);
      
      return totalPaid >= total;
    }
    
    return true;
  };

  const handleSubmitPayment = () => {
    if (!validatePaymentDetails()) {
      setError('Por favor completa correctamente los detalles del pago');
      return;
    }
    
    processPayment();
  };

  // Función unificada para procesar el pago y registrar la venta
  const processPayment = async () => {
    try {
      setProcessingPayment(true);
      setError(null);

      // Preparar datos de la venta con el formato correcto que espera el backend
      const ventaData = {
        // Campo 'items' requerido por el backend
        items: cart.map(item => ({
          producto_id: item.productos?.id,
          cantidad: item.cantidad,
          precio: item.productos?.precio,
          nombre: item.productos?.nombre
        })),
        metodoPago: paymentMethod.id,
        detallesPago: paymentMethod.details,
        total: total,
        subtotal: subtotal,
        descuento: discountAmount,
        usuario_id: usuario?.id || null,
        cliente_id: clientInfo?.id || null,
        // Indicar al backend que actualice el inventario
        actualizar_inventario: true,
        // Vaciar el carrito después de la venta
        vaciar_carrito: true
      };

      console.log('Enviando datos de venta:', ventaData);

      // Llamada única a la API para crear la venta (el backend se encarga de registrar el pago)
      const response = await fetch(`${API_URL}${API_PREFIX}ventas`, {
        method: 'POST',
        headers: STANDARD_HEADERS,
        body: JSON.stringify(ventaData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al procesar la venta (${response.status})`);
      }
      
      const ventaResponse = await response.json();
      
      if (!ventaResponse || !ventaResponse.venta) {
        throw new Error('Error al procesar la venta: Respuesta inválida del servidor');
      }
      
      // La venta contiene la información básica
      let ventaCompleta = ventaResponse.venta;
      
      // Añadimos los datos adicionales para el comprobante
      ventaCompleta.productos = ventaResponse.productos || [];
      ventaCompleta.metodoPago = paymentMethod.id;
      ventaCompleta.detallesPago = paymentMethod.details;
      
      setReceipt(ventaCompleta);
      setShowReceiptModal(true);
      setProcessingPayment(false);
      setPaymentProcessed(true);
    } catch (err) {
      console.error('Error al procesar el pago:', err);
      setError(err.message || 'Error al conectar con el servidor');
      setProcessingPayment(false);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    onCompletePurchase(receipt);
  };

  // Si está cargando o procesando
  if (loading || processingPayment) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">
          {loading ? 'Cargando información...' : 'Procesando pago...'}
        </span>
      </div>
    );
  }

  return (
    <div className="payment-process">
      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Pasos del proceso */}
      <div className="steps-container mb-4">
        <div className="d-flex justify-content-between">
          <div className="step-item active">
            <div className="step-circle">1</div>
            <div className="step-label">Resumen</div>
          </div>
          <div className={`step-connector ${currentStep >= 2 ? 'active' : ''}`}></div>
          <div className={`step-item ${currentStep >= 2 ? 'active' : ''}`}>
            <div className="step-circle">2</div>
            <div className="step-label">Método de pago</div>
          </div>
          <div className={`step-connector ${currentStep >= 3 ? 'active' : ''}`}></div>
          <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <div className="step-label">Confirmación</div>
          </div>
        </div>
      </div>

      {/* Paso 1: Resumen del carrito */}
      {currentStep === 1 && (
        <div className="step-content">
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-4">Resumen de compra</h5>
              
              {cart.length === 0 ? (
                <Alert variant="info">
                  El carrito está vacío. Agrega productos para continuar.
                </Alert>
              ) : (
                <>
                  <div className="cart-items mb-4">
                    {cart.map((item, index) => (
                      <div key={index} className="cart-item d-flex align-items-center py-2 border-bottom">
                        <div className="item-image me-3">
                          {item.productos?.imagen ? (
                            <img 
                              src={item.productos.imagen} 
                              alt={item.productos?.nombre} 
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div 
                              className="bg-light d-flex align-items-center justify-content-center" 
                              style={{ width: '50px', height: '50px' }}
                            >
                              <i className="fas fa-box text-muted"></i>
                            </div>
                          )}
                        </div>
                        <div className="item-details flex-grow-1">
                          <div className="item-name fw-bold">{item.productos?.nombre || 'Producto'}</div>
                          <div className="item-meta text-muted small">
                            Cantidad: {item.cantidad} x ${typeof item.productos?.precio === 'number' ? item.productos.precio.toFixed(2) : '0.00'}
                          </div>
                        </div>
                        <div className="item-price text-end">
                          ${((item.productos?.precio || 0) * item.cantidad).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="cart-summary">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    
                    {discount && (
                      <div className="d-flex justify-content-between mb-2 text-success">
                        <span>
                          Descuento {discount.tipo === 'porcentaje' ? `(${discount.valor}%)` : ''}:
                        </span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between fw-bold fs-5 mt-3">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </Card.Body>
            <Card.Footer className="bg-white d-flex justify-content-between border-top">
              <Button 
                variant="outline-secondary" 
                onClick={onCancel}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Volver
              </Button>
              
              <Button 
                variant="primary" 
                onClick={handleGoToNextStep}
                disabled={cart.length === 0}
              >
                Continuar
                <i className="fas fa-arrow-right ms-2"></i>
              </Button>
            </Card.Footer>
          </Card>
        </div>
      )}

      {/* Paso 2: Selección de método de pago */}
      {currentStep === 2 && (
        <div className="step-content">
          <SelectorMetodoPago 
            onSelectMethod={handleSelectPaymentMethod}
            selectedMethod={paymentMethod}
            total={total}
          />
          
          <div className="d-flex justify-content-between mt-4">
            <Button 
              variant="outline-secondary" 
              onClick={() => setCurrentStep(1)}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Volver
            </Button>
            
            <Button 
              variant="primary" 
              onClick={handleSubmitPayment}
              disabled={!paymentMethod || !validatePaymentDetails()}
            >
              Confirmar pago
              <i className="fas fa-check ms-2"></i>
            </Button>
          </div>
        </div>
      )}

      {/* Modal de recibo de venta */}
      <Modal 
        show={showReceiptModal} 
        onHide={handleCloseReceipt}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-receipt me-2"></i>
            Venta Completada
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {receipt && (
            <div className="receipt">
              {/* Aquí va el componente de recibo */}
              <h5 className="text-center mb-4">Comprobante de Venta</h5>
              
              <div className="receipt-details mb-4">
                <div className="row">
                  <div className="col-6">
                    <p><strong>Folio:</strong> {receipt.id}</p>
                    <p><strong>Fecha:</strong> {new Date(receipt.fecha).toLocaleString()}</p>
                  </div>
                  <div className="col-6 text-end">
                    <p><strong>Vendedor:</strong> {receipt.usuarioNombre || 'N/A'}</p>
                    <p><strong>Método de pago:</strong> {receipt.metodoPago}</p>
                  </div>
                </div>
              </div>
              
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Cantidad</th>
                    <th className="text-end">Precio</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.productos.map((producto, index) => (
                    <tr key={index}>
                      <td>{producto.nombre || `Producto #${producto.id}`}</td>
                      <td className="text-center">{producto.cantidad}</td>
                      <td className="text-end">${typeof producto.precio === 'number' ? producto.precio.toFixed(2) : '0.00'}</td>
                      <td className="text-end">${typeof producto.precio === 'number' && typeof producto.cantidad === 'number' ? 
                        (producto.precio * producto.cantidad).toFixed(2) : '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Subtotal:</strong></td>
                    <td className="text-end">${typeof receipt.subtotal === 'number' ? receipt.subtotal.toFixed(2) : '0.00'}</td>
                  </tr>
                  {receipt.descuento > 0 && (
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Descuento:</strong></td>
                      <td className="text-end">-${typeof receipt.descuento === 'number' ? receipt.descuento.toFixed(2) : '0.00'}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                    <td className="text-end fw-bold">${typeof receipt.total === 'number' ? receipt.total.toFixed(2) : '0.00'}</td>
                  </tr>
                </tfoot>
              </table>
              
              <div className="payment-details mt-4 p-3 bg-light rounded">
                <h6>Detalles del pago:</h6>
                {receipt.metodoPago === 'efectivo' && receipt.detallesPago && (
                  <div>
                    <p><strong>Monto recibido:</strong> ${receipt.detallesPago.amount || '0.00'}</p>
                    <p><strong>Cambio:</strong> ${typeof receipt.detallesPago.change === 'number' ? 
                      receipt.detallesPago.change.toFixed(2) : '0.00'}</p>
                  </div>
                )}
                
                {receipt.metodoPago === 'tarjeta' && receipt.detallesPago && (
                  <div>
                    <p><strong>Referencia:</strong> {receipt.detallesPago.reference || 'No disponible'}</p>
                    <p><strong>Tarjeta:</strong> XXXX-XXXX-XXXX-{receipt.detallesPago.cardDigits || '****'}</p>
                  </div>
                )}
                
                {receipt.metodoPago === 'transferencia' && receipt.detallesPago && (
                  <div>
                    <p><strong>Referencia:</strong> {receipt.detallesPago.reference || 'No disponible'}</p>
                  </div>
                )}
                
                {receipt.metodoPago === 'credito' && receipt.detallesPago && (
                  <div>
                    <p><strong>Cliente:</strong> {receipt.detallesPago.clientName || 'No especificado'}</p>
                    <p><strong>ID/Documento:</strong> {receipt.detallesPago.clientId || 'No especificado'}</p>
                    <p><strong>Monto pendiente:</strong> ${typeof receipt.detallesPago.dueAmount === 'number' ? 
                      receipt.detallesPago.dueAmount.toFixed(2) : receipt.total.toFixed(2)}</p>
                    {receipt.detallesPago.note && (
                      <p><strong>Nota:</strong> {receipt.detallesPago.note}</p>
                    )}
                  </div>
                )}
                
                {receipt.metodoPago === 'mixto' && receipt.detallesPago && receipt.detallesPago.mixedPayments && (
                  <div>
                    <p><strong>Métodos combinados:</strong></p>
                    <ul>
                      {receipt.detallesPago.mixedPayments.map((payment, idx) => (
                        <li key={idx}>
                          {payment.methodId || 'Método desconocido'}: ${typeof payment.amount === 'number' ? 
                            payment.amount.toFixed(2) : parseFloat(payment.amount || 0).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                    {receipt.detallesPago.note && (
                      <p><strong>Nota:</strong> {receipt.detallesPago.note}</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-center">
                <p className="mb-0">¡Gracias por su compra!</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseReceipt}>
            Cerrar
          </Button>
          <Button variant="primary">
            <i className="fas fa-print me-2"></i>
            Imprimir
          </Button>
        </Modal.Footer>
      </Modal>

      {/* CSS Personalizado */}
      <style jsx>{`
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 1;
        }
        
        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          font-weight: bold;
          transition: background-color 0.3s;
        }
        
        .step-item.active .step-circle {
          background-color: #8c5cf2;
          color: white;
        }
        
        .step-label {
          font-size: 14px;
          color: #6c757d;
          transition: color 0.3s;
        }
        
        .step-item.active .step-label {
          color: #343a40;
          font-weight: 500;
        }
        
        .step-connector {
          flex-grow: 1;
          height: 3px;
          background-color: #e9ecef;
          margin: 0 8px;
          margin-top: 20px;
          transition: background-color 0.3s;
        }
        
        .step-connector.active {
          background-color: #8c5cf2;
        }
      `}</style>
    </div>
  );
};

export default Pagos;