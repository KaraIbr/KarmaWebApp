import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import SelectorMetodoPago from './SelectorMetodoPago';
import Descuentos from './Descuentos';

const API_URL = 'http://127.0.0.1:5000';

const Pagos = ({ usuario, onCompletePurchase, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [discount, setDiscount] = useState(null);
  
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
      const response = await fetch(`${API_URL}/carrito`);
      
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

  const handleProcessPayment = async () => {
    // Validate payment method is selected
    if (!paymentMethod) {
      setError('Por favor selecciona un método de pago');
      return;
    }
    
    // Si es crédito y falta información del cliente, mostrar modal para completarla
    if (paymentMethod.id === 'credito' && 
        (!paymentMethod.details.clientName || paymentMethod.details.clientName.trim() === '')) {
      setShowClientModal(true);
      return;
    }
    
    // Validar que el pago esté completo
    if (paymentMethod.id === 'mixto') {
      const totalPaid = paymentMethod.details.mixedPayments.reduce(
        (sum, payment) => sum + (parseFloat(payment.amount) || 0), 0
      );
      
      if (totalPaid < total) {
        setError(`El pago está incompleto. Faltan $${(total - totalPaid).toFixed(2)}`);
        return;
      }
    } else if (paymentMethod.id === 'efectivo' && paymentMethod.details.amount < total) {
      setError('El monto en efectivo es menor al total a pagar');
      return;
    }
    
    try {
      setProcessingPayment(true);
      setError(null);
      
      // Prepare order data
      const orderData = {
        productos: cart.map(item => ({
          producto_id: item.productos.id,
          nombre: item.productos.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.productos.precio,
          subtotal: item.productos.precio * item.cantidad
        })),
        metodo_pago: paymentMethod.id,
        detalle_pago: paymentMethod.id === 'mixto' 
          ? {
            pagos_multiples: paymentMethod.details.mixedPayments.map(p => ({
              metodo: p.methodId,
              monto: parseFloat(p.amount),
              referencia: p.details.reference || '',
              detalles: p.methodId === 'tarjeta' ? 
                { ultimos_digitos: p.details.cardDigits || '' } : 
                p.methodId === 'movil' ? { aplicacion: p.details.appUsed || '' } : {}
            }))
          }
          : {
            monto_recibido: parseFloat(paymentMethod.details.amount) || total,
            cambio: parseFloat(paymentMethod.details.change) || 0,
            referencia: paymentMethod.details.reference || '',
            ultimos_digitos: paymentMethod.details.cardDigits || '',
            aplicacion_movil: paymentMethod.details.appUsed || '',
            nota: paymentMethod.details.note || ''
          },
        cliente: paymentMethod.id === 'credito' ? {
          nombre: paymentMethod.details.clientName || clientInfo.nombre,
          documento: paymentMethod.details.clientId || clientInfo.documento,
          telefono: clientInfo.telefono || '',
          direccion: clientInfo.direccion || ''
        } : null,
        estado_pago: paymentMethod.id === 'credito' ? 'pendiente' : 'pagado',
        fecha_vencimiento: paymentMethod.id === 'credito' ? 
          getFutureDate(30) : null, // 30 días por defecto para créditos
        tipo_comprobante: paymentMethod.details.receiptType || 'ticket',
        descuento: discount ? {
          codigo: discount.codigo,
          tipo: discount.tipo,
          valor: discount.valor
        } : null,
        subtotal: subtotal,
        descuento_aplicado: discountAmount,
        total: total,
        usuario_id: usuario?.id || null
      };
      
      // Call API to create order
      const response = await fetch(`${API_URL}/ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        throw new Error('Error al procesar el pago');
      }
      
      const result = await response.json();
      
      // Set receipt data for modal
      setReceipt({
        ...result,
        productos: cart.map(item => ({
          nombre: item.productos.nombre,
          cantidad: item.cantidad,
          precio: item.productos.precio,
          subtotal: item.productos.precio * item.cantidad
        })),
        metodo_pago: obtenerNombreMetodoPago(paymentMethod.id),
        fecha: new Date().toLocaleString(),
        descuento: discount ? {
          codigo: discount.codigo,
          valor: discountAmount
        } : null
      });
      
      // Clear cart after successful order
      await fetch(`${API_URL}/carrito/vaciar`, {
        method: 'DELETE'
      });
      
      // Show receipt modal
      setShowReceiptModal(true);
      
    } catch (err) {
      console.error('Error al procesar el pago:', err);
      setError(err.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleClientInfoChange = (e) => {
    const { name, value } = e.target;
    setClientInfo({
      ...clientInfo,
      [name]: value
    });
  };
  
  const handleClientInfoSubmit = () => {
    // Actualizar los detalles del método de pago
    setPaymentMethod({
      ...paymentMethod,
      details: {
        ...paymentMethod.details,
        clientName: clientInfo.nombre,
        clientId: clientInfo.documento
      }
    });
    
    setShowClientModal(false);
    // Procesamos el pago después de obtener la información
    setTimeout(handleProcessPayment, 100);
  };
  
  const handleApplyDiscount = (discountData) => {
    setDiscount(discountData);
  };

  const handleSelectPaymentMethod = (method) => {
    setPaymentMethod(method);
  };
  
  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    // Notificar al componente padre que se completó la compra
    onCompletePurchase(receipt);
  };
  
  // Función para obtener fecha futura (para créditos)
  const getFutureDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };
  
  // Función para obtener el nombre del método de pago
  const obtenerNombreMetodoPago = (id) => {
    const metodos = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta de crédito/débito',
      'transferencia': 'Transferencia bancaria',
      'movil': 'Pago móvil',
      'credito': 'Crédito / Fiado',
      'mixto': 'Pago mixto'
    };
    
    return metodos[id] || id;
  };

  if (loading) {
    return (
      <div className="text-center my-5 py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando información de pago...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container py-3">
        <Alert variant="warning">
          <Alert.Heading>Carrito vacío</Alert.Heading>
          <p>No hay productos en el carrito para proceder con el pago.</p>
          <div className="d-flex justify-content-end">
            <Button 
              variant="outline-warning" 
              onClick={onCancel}
            >
              Volver a la tienda
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-3">
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <h4 className="mb-0">
            <i className="fas fa-credit-card me-2" style={{ color: '#8c5cf2' }}></i>
            Proceso de Pago
          </h4>
        </Card.Header>
        
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </Alert>
          )}
          
          <Row>
            <Col lg={7}>
              {/* Order Summary */}
              <h5 className="mb-3">Resumen de la Orden</h5>
              <Card className="mb-4">
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <table className="table table-borderless mb-0">
                      <thead className="text-muted" style={{ backgroundColor: '#f8f4ff' }}>
                        <tr>
                          <th>Producto</th>
                          <th className="text-center">Cantidad</th>
                          <th className="text-end">Precio</th>
                          <th className="text-end">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map(item => (
                          <tr key={item.id}>
                            <td>{item.productos?.nombre || 'Producto'}</td>
                            <td className="text-center">{item.cantidad}</td>
                            <td className="text-end">${item.productos?.precio?.toFixed(2) || '0.00'}</td>
                            <td className="text-end">${((item.productos?.precio || 0) * item.cantidad).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
              
              {/* Discount section */}
              <h5 className="mb-3">Descuentos</h5>
              <Descuentos 
                onApplyDiscount={handleApplyDiscount}
                currentDiscount={discount}
              />
            </Col>
            
            <Col lg={5}>
              {/* Payment Method */}
              <h5 className="mb-3">Método de Pago</h5>
              <SelectorMetodoPago 
                onSelectMethod={handleSelectPaymentMethod}
                selectedMethod={paymentMethod}
                total={total}
              />
              
              {/* Order Total */}
              <Card className="mt-4">
                <Card.Body>
                  <h5 className="mb-3">Resumen</h5>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  {discount && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>
                        Descuento:
                        <Badge 
                          bg="success" 
                          className="ms-2"
                          pill
                        >
                          {discount.codigo}
                        </Badge>
                      </span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <hr />
                  
                  <div className="d-flex justify-content-between mb-2">
                    <h5 className="mb-0">Total:</h5>
                    <h5 className="mb-0" style={{ color: '#6a3eac' }}>${total.toFixed(2)}</h5>
                  </div>
                  
                  {/* Estado de pago */}
                  {paymentMethod && (
                    <div className="mt-2 text-center">
                      <Badge 
                        bg={paymentMethod.id === 'credito' ? 'warning' : 
                             (paymentMethod.id === 'mixto' && 
                              paymentMethod.details?.remainingAmount > 0) ? 'danger' : 'success'}
                        className="py-2 px-3"
                      >
                        {paymentMethod.id === 'credito' ? (
                          <><i className="fas fa-clock me-1"></i> Pago a crédito</>
                        ) : (paymentMethod.id === 'mixto' && 
                           paymentMethod.details?.remainingAmount > 0) ? (
                          <><i className="fas fa-exclamation-triangle me-1"></i> Pago incompleto</>
                        ) : (
                          <><i className="fas fa-check-circle me-1"></i> Pago completo</>
                        )}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="d-grid gap-2 mt-4">
                    <Button 
                      onClick={handleProcessPayment}
                      size="lg"
                      disabled={processingPayment || !paymentMethod}
                      style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                    >
                      {processingPayment ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-lock me-2"></i>
                          Finalizar Compra
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline-secondary" 
                      onClick={onCancel}
                      disabled={processingPayment}
                    >
                      Volver al Carrito
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Modal para información de cliente (Crédito) */}
      <Modal show={showClientModal} onHide={() => setShowClientModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Información del Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <i className="fas fa-info-circle me-2"></i>
            Para ventas a crédito, necesitamos información adicional del cliente.
          </Alert>
          
          <form>
            <div className="mb-3">
              <label className="form-label">Nombre completo</label>
              <input
                type="text"
                className="form-control"
                name="nombre"
                value={clientInfo.nombre}
                onChange={handleClientInfoChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Documento/ID</label>
              <input
                type="text"
                className="form-control"
                name="documento"
                value={clientInfo.documento}
                onChange={handleClientInfoChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-control"
                name="telefono"
                value={clientInfo.telefono}
                onChange={handleClientInfoChange}
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Dirección</label>
              <textarea
                className="form-control"
                name="direccion"
                value={clientInfo.direccion}
                onChange={handleClientInfoChange}
                rows="2"
              />
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClientModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleClientInfoSubmit}
            disabled={!clientInfo.nombre || !clientInfo.documento}
          >
            Continuar
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal para recibo/comprobante */}
      <Modal 
        show={showReceiptModal} 
        onHide={handleCloseReceiptModal}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Comprobante de Venta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {receipt && (
            <div className="p-3">
              <div className="text-center mb-4">
                <h3>KARMA</h3>
                <p className="mb-1">Sistema de Punto de Venta</p>
                <p className="mb-1">Comprobante de Venta</p>
                <p className="mb-0">Folio: <strong>{receipt.id}</strong></p>
                <p>Fecha: {receipt.fecha}</p>
              </div>
              
              <div className="mb-4">
                <h6 className="border-bottom pb-2">Productos</h6>
                <table className="table table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Producto</th>
                      <th className="text-center">Cantidad</th>
                      <th className="text-end">Precio</th>
                      <th className="text-end">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.productos.map((item, index) => (
                      <tr key={index}>
                        <td>{item.nombre}</td>
                        <td className="text-center">{item.cantidad}</td>
                        <td className="text-end">${item.precio.toFixed(2)}</td>
                        <td className="text-end">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="row mb-4">
                <div className="col-md-6">
                  <h6 className="border-bottom pb-2">Detalles de pago</h6>
                  <div className="mb-1">
                    <strong>Método:</strong> {receipt.metodo_pago}
                  </div>
                  
                  {receipt.estado_pago === 'pendiente' && (
                    <div className="mb-1">
                      <strong>Estado:</strong> <span className="text-warning">Pendiente (Crédito)</span>
                    </div>
                  )}
                  
                  {receipt.fecha_vencimiento && (
                    <div className="mb-1">
                      <strong>Fecha vencimiento:</strong> {new Date(receipt.fecha_vencimiento).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                <div className="col-md-6">
                  <h6 className="border-bottom pb-2">Total</h6>
                  <div className="mb-1">
                    <strong>Subtotal:</strong> ${subtotal.toFixed(2)}
                  </div>
                  
                  {receipt.descuento && (
                    <div className="mb-1">
                      <strong>Descuento ({receipt.descuento.codigo}):</strong> -${receipt.descuento.valor.toFixed(2)}
                    </div>
                  )}
                  
                  <div className="mb-1">
                    <strong>Total:</strong> ${total.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="text-center mt-4 pt-4 border-top">
                <p className="mb-1">¡Gracias por su compra!</p>
                <p className="small mb-0">Este documento sirve como comprobante de su compra.</p>
                {receipt.estado_pago === 'pendiente' && (
                  <p className="small text-warning">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Esta venta se registró a crédito, pendiente de pago.
                  </p>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseReceiptModal}>
            Cerrar
          </Button>
          <Button variant="primary">
            <i className="fas fa-print me-2"></i>
            Imprimir
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Pagos;