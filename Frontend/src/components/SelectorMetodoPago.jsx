import React, { useState, useEffect } from 'react';
import { Card, Form, InputGroup, Button, Row, Col, FloatingLabel, Alert, Accordion, Badge } from 'react-bootstrap';

const SelectorMetodoPago = ({ onSelectMethod, selectedMethod, total }) => {
  const [paymentMethods, setPaymentMethods] = useState([
    { 
      id: 'efectivo', 
      name: 'Efectivo', 
      icon: 'fa-money-bill-wave',
      description: 'Pago en efectivo al momento de la entrega',
      requiresAmount: true,
      showChange: true
    },
    { 
      id: 'tarjeta', 
      name: 'Tarjeta de crédito/débito', 
      icon: 'fa-credit-card',
      description: 'Pago con tarjeta bancaria',
      requiresReference: true,
      requiresCardDigits: true
    },
    { 
      id: 'transferencia', 
      name: 'Transferencia bancaria', 
      icon: 'fa-university',
      description: 'Transferencia a nuestra cuenta bancaria',
      requiresReference: true
    },
    { 
      id: 'movil', 
      name: 'Pago móvil', 
      icon: 'fa-mobile-alt',
      description: 'CoDi, aplicaciones de pago móvil',
      requiresReference: true,
      requiresAppInfo: true
    },
    { 
      id: 'credito', 
      name: 'Crédito / Fiado', 
      icon: 'fa-handshake',
      description: 'Venta a crédito (se requiere nota)',
      requiresNote: true,
      requiresClientInfo: true
    },
    { 
      id: 'mixto', 
      name: 'Pago mixto', 
      icon: 'fa-layer-group',
      description: 'Combinar dos o más métodos de pago',
      isMixed: true
    }
  ]);

  // Estado para los detalles del pago
  const [paymentDetails, setPaymentDetails] = useState({
    amount: total || 0,           // Monto pagado (efectivo recibido)
    cardDigits: '',               // Últimos 4 dígitos de tarjeta
    reference: '',                // Referencia para transferencias/tarjetas
    note: '',                     // Nota para créditos o información adicional
    change: 0,                    // Cambio a devolver
    dueAmount: 0,                 // Monto pendiente en caso de pago parcial
    isPaid: true,                 // Indica si el pago está completo
    clientName: '',               // Nombre del cliente (para créditos)
    clientId: '',                 // ID/documento del cliente
    receiptType: 'ticket',        // Tipo de comprobante: ticket, factura, ninguno
    appUsed: '',                  // Aplicación usada para pago móvil
    mixedPayments: []             // Pagos múltiples para método mixto
  });

  // Estado para pagos mixtos
  const [mixedPayments, setMixedPayments] = useState([]);
  const [remainingAmount, setRemainingAmount] = useState(total || 0);
  
  // Actualizamos los detalles cuando cambia el total
  useEffect(() => {
    setPaymentDetails(prev => ({
      ...prev,
      amount: total || 0
    }));
    setRemainingAmount(total || 0);
  }, [total]);

  // Calcular cambio cuando cambia el monto pagado y el método es efectivo
  useEffect(() => {
    if (selectedMethod?.id === 'efectivo' && paymentDetails.amount > 0) {
      const changeAmount = Math.max(0, paymentDetails.amount - (total || 0));
      setPaymentDetails(prev => ({
        ...prev,
        change: changeAmount,
        isPaid: paymentDetails.amount >= (total || 0)
      }));
    }
    
    // Si es crédito, calcular monto pendiente
    if (selectedMethod?.id === 'credito') {
      setPaymentDetails(prev => ({
        ...prev,
        dueAmount: total || 0,
        isPaid: false
      }));
    }
    
    // Si es mixto, actualizar estado de pago
    if (selectedMethod?.id === 'mixto') {
      const totalPaid = mixedPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
      const remaining = Math.max(0, (total || 0) - totalPaid);
      setRemainingAmount(remaining);
      
      setPaymentDetails(prev => ({
        ...prev,
        isPaid: totalPaid >= (total || 0),
        mixedPayments: mixedPayments
      }));
    }
  }, [paymentDetails.amount, selectedMethod, total, mixedPayments]);

  const handleSelectMethod = (method) => {
    // Si seleccionamos un método mixto, inicializamos los pagos mixtos
    if (method.id === 'mixto' && mixedPayments.length === 0) {
      setMixedPayments([{
        id: 'payment-1',
        methodId: 'efectivo',
        amount: '',
        details: {}
      }]);
    }
  
    onSelectMethod({
      ...method,
      details: method.id === 'mixto' 
        ? { ...paymentDetails, mixedPayments, remainingAmount }
        : paymentDetails
    });

    // Reiniciar valores específicos cuando cambia el método
    setPaymentDetails(prev => ({
      ...prev,
      change: method.id === 'efectivo' ? Math.max(0, prev.amount - (total || 0)) : 0,
      isPaid: method.id !== 'credito',
      dueAmount: method.id === 'credito' ? (total || 0) : 0
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setPaymentDetails(prev => {
      const updatedDetails = {
        ...prev,
        [name]: value
      };
      
      // Si cambia el monto en efectivo, recalcular el cambio
      if (name === 'amount' && selectedMethod?.id === 'efectivo') {
        const numValue = parseFloat(value) || 0;
        updatedDetails.change = Math.max(0, numValue - (total || 0));
        updatedDetails.isPaid = numValue >= (total || 0);
      }
      
      return updatedDetails;
    });
    
    // Actualizar los detalles en el método seleccionado
    if (selectedMethod) {
      onSelectMethod({
        ...selectedMethod,
        details: selectedMethod.id === 'mixto' 
          ? { ...paymentDetails, [name]: value, mixedPayments, remainingAmount }
          : { ...paymentDetails, [name]: value }
      });
    }
  };
  
  // Manejar cambios en pagos mixtos
  const handleMixedPaymentChange = (index, field, value) => {
    const updatedPayments = [...mixedPayments];
    
    if (field === 'methodId') {
      // Resetear detalles cuando cambia el método
      updatedPayments[index] = {
        ...updatedPayments[index],
        methodId: value,
        details: {}
      };
    } else if (field === 'amount') {
      updatedPayments[index] = {
        ...updatedPayments[index],
        amount: value
      };
    } else {
      // Actualizar detalles específicos
      updatedPayments[index] = {
        ...updatedPayments[index],
        details: {
          ...updatedPayments[index].details,
          [field]: value
        }
      };
    }
    
    setMixedPayments(updatedPayments);
    
    // Recalcular monto restante
    const totalPaid = updatedPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
    setRemainingAmount(Math.max(0, (total || 0) - totalPaid));
    
    // Actualizar en el método seleccionado
    if (selectedMethod?.id === 'mixto') {
      onSelectMethod({
        ...selectedMethod,
        details: { 
          ...paymentDetails, 
          mixedPayments: updatedPayments, 
          remainingAmount: Math.max(0, (total || 0) - totalPaid),
          isPaid: totalPaid >= (total || 0)
        }
      });
    }
  };
  
  // Agregar un nuevo pago mixto
  const addMixedPayment = () => {
    if (remainingAmount <= 0) return;
    
    const newPayment = {
      id: `payment-${mixedPayments.length + 1}`,
      methodId: 'efectivo',
      amount: '',
      details: {}
    };
    
    const updatedPayments = [...mixedPayments, newPayment];
    setMixedPayments(updatedPayments);
    
    // Actualizar en el método seleccionado
    if (selectedMethod?.id === 'mixto') {
      onSelectMethod({
        ...selectedMethod,
        details: { 
          ...paymentDetails, 
          mixedPayments: updatedPayments,
          remainingAmount
        }
      });
    }
  };
  
  // Eliminar un pago mixto
  const removeMixedPayment = (index) => {
    if (mixedPayments.length <= 1) return;
    
    const updatedPayments = [...mixedPayments];
    updatedPayments.splice(index, 1);
    setMixedPayments(updatedPayments);
    
    // Recalcular monto restante
    const totalPaid = updatedPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
    setRemainingAmount(Math.max(0, (total || 0) - totalPaid));
    
    // Actualizar en el método seleccionado
    if (selectedMethod?.id === 'mixto') {
      onSelectMethod({
        ...selectedMethod,
        details: { 
          ...paymentDetails, 
          mixedPayments: updatedPayments, 
          remainingAmount: Math.max(0, (total || 0) - totalPaid),
          isPaid: totalPaid >= (total || 0)
        }
      });
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <Form>
          {/* Selector de método de pago */}
          <Row>
            {paymentMethods.map(method => (
              <Col md={6} key={method.id}>
                <div 
                  className={`mb-3 p-3 border rounded ${selectedMethod?.id === method.id ? 'border-primary' : ''}`}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedMethod?.id === method.id ? '#f8f4ff' : 'white',
                    height: '100%'
                  }}
                  onClick={() => handleSelectMethod(method)}
                >
                  <Form.Check
                    type="radio"
                    id={`payment-${method.id}`}
                    checked={selectedMethod?.id === method.id}
                    onChange={() => handleSelectMethod(method)}
                    label={
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <i 
                            className={`fas ${method.icon} fa-lg`} 
                            style={{ 
                              color: selectedMethod?.id === method.id ? '#8c5cf2' : '#6c757d',
                              width: '24px'
                            }}
                          ></i>
                        </div>
                        <div>
                          <div className="fw-bold">{method.name}</div>
                          <div className="text-muted small">{method.description}</div>
                        </div>
                      </div>
                    }
                    className="m-0"
                  />
                </div>
              </Col>
            ))}
          </Row>

          {/* Campos adicionales según método de pago seleccionado */}
          {selectedMethod && !selectedMethod.isMixed && (
            <div className="mt-4 p-3 border rounded bg-light">
              <h6 className="mb-3">Detalles del pago</h6>
              
              <Row className="g-3">
                {/* Campo para monto recibido (Efectivo) */}
                {selectedMethod.requiresAmount && (
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Monto recibido</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>$</InputGroup.Text>
                        <Form.Control
                          type="number"
                          name="amount"
                          min="0"
                          step="0.01"
                          value={paymentDetails.amount}
                          onChange={handleInputChange}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                )}

                {/* Cambio a devolver (Efectivo) */}
                {selectedMethod.showChange && (
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Cambio a devolver</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>$</InputGroup.Text>
                        <Form.Control
                          type="number"
                          value={paymentDetails.change.toFixed(2)}
                          readOnly
                          style={{ backgroundColor: '#e9ecef' }}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                )}

                {/* Últimos 4 dígitos de tarjeta */}
                {selectedMethod.requiresCardDigits && (
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Últimos 4 dígitos</Form.Label>
                      <Form.Control
                        type="text"
                        name="cardDigits"
                        maxLength="4"
                        placeholder="0000"
                        value={paymentDetails.cardDigits}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                )}

                {/* Número de referencia */}
                {selectedMethod.requiresReference && (
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Referencia / Autorización</Form.Label>
                      <Form.Control
                        type="text"
                        name="reference"
                        placeholder="Número de referencia"
                        value={paymentDetails.reference}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                )}
                
                {/* Aplicación de pago móvil */}
                {selectedMethod.requiresAppInfo && (
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Aplicación utilizada</Form.Label>
                      <Form.Select
                        name="appUsed"
                        value={paymentDetails.appUsed}
                        onChange={handleInputChange}
                      >
                        <option value="">Selecciona una aplicación</option>
                        <option value="codi">CoDi</option>
                        <option value="mercadopago">Mercado Pago</option>
                        <option value="clip">Clip</option>
                        <option value="paypal">PayPal</option>
                        <option value="otro">Otra</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                )}
                
                {/* Información del cliente para créditos */}
                {selectedMethod.requiresClientInfo && (
                  <>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Nombre del cliente</Form.Label>
                        <Form.Control
                          type="text"
                          name="clientName"
                          placeholder="Ingresa el nombre"
                          value={paymentDetails.clientName}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>ID/Documento del cliente</Form.Label>
                        <Form.Control
                          type="text"
                          name="clientId"
                          placeholder="Número de identificación"
                          value={paymentDetails.clientId}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>
                  </>
                )}

                {/* Nota para crédito o información adicional */}
                {(selectedMethod.requiresNote || selectedMethod.id === 'credito') && (
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>
                        {selectedMethod.id === 'credito' ? 'Nota de crédito' : 'Nota adicional'}
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="note"
                        placeholder={selectedMethod.id === 'credito' ? 'Detalles del crédito, fecha compromiso, etc.' : 'Información adicional'}
                        value={paymentDetails.note}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                )}
                
                {/* Tipo de comprobante */}
                <Col md={12}>
                  <Form.Group className="mt-3">
                    <Form.Label>Tipo de comprobante</Form.Label>
                    <div className="d-flex">
                      <Form.Check
                        type="radio"
                        id="receipt-ticket"
                        name="receiptType"
                        value="ticket"
                        label="Ticket"
                        checked={paymentDetails.receiptType === 'ticket'}
                        onChange={handleInputChange}
                        className="me-3"
                      />
                      <Form.Check
                        type="radio"
                        id="receipt-factura"
                        name="receiptType"
                        value="factura"
                        label="Factura"
                        checked={paymentDetails.receiptType === 'factura'}
                        onChange={handleInputChange}
                        className="me-3"
                      />
                      <Form.Check
                        type="radio"
                        id="receipt-none"
                        name="receiptType"
                        value="none"
                        label="Sin comprobante"
                        checked={paymentDetails.receiptType === 'none'}
                        onChange={handleInputChange}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              {/* Alerta para pagos a crédito */}
              {selectedMethod.id === 'credito' && (
                <Alert variant="warning" className="mt-3 mb-0">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Esta venta será registrada como <strong>pendiente de pago</strong>.
                  {paymentDetails.note.length < 5 && (
                    <div className="mt-2 small">Se recomienda agregar detalles en la nota.</div>
                  )}
                </Alert>
              )}

              {/* Alerta para efectivo insuficiente */}
              {selectedMethod.id === 'efectivo' && paymentDetails.amount < total && (
                <Alert variant="danger" className="mt-3 mb-0">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  El monto recibido es menor que el total a pagar.
                </Alert>
              )}
            </div>
          )}
          
          {/* Sección para método de pago mixto */}
          {selectedMethod?.isMixed && (
            <div className="mt-4 p-3 border rounded bg-light">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Detalles del pago mixto</h6>
                <div>
                  <Badge bg={remainingAmount > 0 ? 'danger' : 'success'} className="me-2">
                    {remainingAmount > 0 ? `Falta: $${remainingAmount.toFixed(2)}` : 'Completo'}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline-primary" 
                    onClick={addMixedPayment}
                    disabled={remainingAmount <= 0}
                  >
                    <i className="fas fa-plus me-1"></i> Agregar pago
                  </Button>
                </div>
              </div>
              
              {mixedPayments.map((payment, index) => (
                <div key={payment.id} className="mb-3 border rounded p-3 position-relative">
                  <div className="position-absolute top-0 end-0 p-2">
                    {mixedPayments.length > 1 && (
                      <Button 
                        size="sm" 
                        variant="outline-danger" 
                        onClick={() => removeMixedPayment(index)}
                        className="btn-sm"
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    )}
                  </div>
                  
                  <h6>Pago {index + 1}</h6>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Método de pago</Form.Label>
                        <Form.Select
                          value={payment.methodId}
                          onChange={(e) => handleMixedPaymentChange(index, 'methodId', e.target.value)}
                        >
                          {paymentMethods.filter(m => !m.isMixed).map(method => (
                            <option key={method.id} value={method.id}>
                              {method.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Monto</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>$</InputGroup.Text>
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.01"
                            value={payment.amount}
                            onChange={(e) => handleMixedPaymentChange(index, 'amount', e.target.value)}
                            placeholder="0.00"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    
                    {/* Detalles específicos del método seleccionado */}
                    {payment.methodId === 'tarjeta' && (
                      <>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Últimos 4 dígitos</Form.Label>
                            <Form.Control
                              type="text"
                              maxLength="4"
                              placeholder="0000"
                              value={payment.details.cardDigits || ''}
                              onChange={(e) => handleMixedPaymentChange(index, 'cardDigits', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group>
                            <Form.Label>Referencia</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Referencia"
                              value={payment.details.reference || ''}
                              onChange={(e) => handleMixedPaymentChange(index, 'reference', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                      </>
                    )}
                    
                    {(payment.methodId === 'transferencia' || payment.methodId === 'movil') && (
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Referencia</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Referencia"
                            value={payment.details.reference || ''}
                            onChange={(e) => handleMixedPaymentChange(index, 'reference', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    )}
                    
                    {payment.methodId === 'movil' && (
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Aplicación utilizada</Form.Label>
                          <Form.Select
                            value={payment.details.appUsed || ''}
                            onChange={(e) => handleMixedPaymentChange(index, 'appUsed', e.target.value)}
                          >
                            <option value="">Selecciona una aplicación</option>
                            <option value="codi">CoDi</option>
                            <option value="mercadopago">Mercado Pago</option>
                            <option value="clip">Clip</option>
                            <option value="paypal">PayPal</option>
                            <option value="otro">Otra</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    )}
                  </Row>
                </div>
              ))}
              
              {/* Tipo de comprobante para pago mixto */}
              <div className="mt-3">
                <Form.Group>
                  <Form.Label>Tipo de comprobante</Form.Label>
                  <div className="d-flex">
                    <Form.Check
                      type="radio"
                      id="receipt-ticket-mixed"
                      name="receiptType"
                      value="ticket"
                      label="Ticket"
                      checked={paymentDetails.receiptType === 'ticket'}
                      onChange={handleInputChange}
                      className="me-3"
                    />
                    <Form.Check
                      type="radio"
                      id="receipt-factura-mixed"
                      name="receiptType"
                      value="factura"
                      label="Factura"
                      checked={paymentDetails.receiptType === 'factura'}
                      onChange={handleInputChange}
                      className="me-3"
                    />
                    <Form.Check
                      type="radio"
                      id="receipt-none-mixed"
                      name="receiptType"
                      value="none"
                      label="Sin comprobante"
                      checked={paymentDetails.receiptType === 'none'}
                      onChange={handleInputChange}
                    />
                  </div>
                </Form.Group>
              </div>
              
              {/* Notas para el pago mixto */}
              <Form.Group className="mt-3">
                <Form.Label>Nota adicional</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="note"
                  placeholder="Información adicional sobre el pago mixto"
                  value={paymentDetails.note}
                  onChange={handleInputChange}
                />
              </Form.Group>
              
              {/* Alerta para pago mixto incompleto */}
              {remainingAmount > 0 && (
                <Alert variant="danger" className="mt-3 mb-0">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  El pago está incompleto. Faltan <strong>${remainingAmount.toFixed(2)}</strong> para cubrir el total.
                </Alert>
              )}
              
              {/* Alerta para pago mixto excedido */}
              {remainingAmount < 0 && (
                <Alert variant="warning" className="mt-3 mb-0">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  El pago excede el total por <strong>${Math.abs(remainingAmount).toFixed(2)}</strong>.
                </Alert>
              )}
            </div>
          )}
        </Form>
      </Card.Body>
    </Card>
  );
};

export default SelectorMetodoPago;