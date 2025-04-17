import React, { useState } from 'react';
import { ListGroup, Row, Col, Button, Form, InputGroup } from 'react-bootstrap';

const ItemCarrito = ({ item, onUpdateQuantity, onRemove }) => {
  const [cantidad, setCantidad] = useState(item.cantidad);
  const [isEditing, setIsEditing] = useState(false);
  
  const producto = item.productos || {};
  const subtotal = (producto.precio || 0) * cantidad;
  
  const handleQuantityChange = (value) => {
    setCantidad(value);
  };
  
  const handleBlur = () => {
    if (cantidad !== item.cantidad) {
      // Only update if quantity changed
      onUpdateQuantity(item.id, cantidad);
    }
    setIsEditing(false);
  };

  const handleIncrement = () => {
    const newQuantity = cantidad + 1;
    setCantidad(newQuantity);
    onUpdateQuantity(item.id, newQuantity);
  };

  const handleDecrement = () => {
    if (cantidad > 1) {
      const newQuantity = cantidad - 1;
      setCantidad(newQuantity);
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <ListGroup.Item className="py-3 px-3">
      <Row className="align-items-center">
        <Col xs={12} md={6} className="mb-2 mb-md-0">
          <div className="d-flex align-items-start">
            {/* Product info */}
            <div>
              <h6 className="mb-0 text-truncate">{producto.nombre || 'Producto'}</h6>
              <div className="text-muted small mb-1">ID: {producto.id}</div>
              <div className="text-muted small">
                Precio: <span className="fw-semibold">${producto.precio || 0}</span>
              </div>
            </div>
          </div>
        </Col>
        
        <Col xs={7} md={4} className="d-flex align-items-center">
          {/* Quantity controls - mobile friendly */}
          <div className="d-flex align-items-center">
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={handleDecrement}
              disabled={cantidad <= 1}
              className="px-2 py-0"
            >
              <i className="fas fa-minus"></i>
            </Button>
            
            <InputGroup size="sm" className="mx-1 mx-sm-2" style={{ width: '70px' }}>
              <Form.Control
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                onFocus={() => setIsEditing(true)}
                onBlur={handleBlur}
                className="text-center"
                size="sm"
              />
            </InputGroup>
            
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={handleIncrement}
              className="px-2 py-0"
            >
              <i className="fas fa-plus"></i>
            </Button>
          </div>
        </Col>
        
        <Col xs={5} md={2} className="text-end d-flex justify-content-between align-items-center">
          {/* Subtotal and remove button */}
          <div className="d-block d-md-none">
            <Button 
              variant="link" 
              className="text-danger p-0" 
              onClick={() => onRemove(item.id)}
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
          
          <div className="ms-auto">
            <div className="fw-bold" style={{ color: '#6a3eac' }}>${subtotal.toFixed(2)}</div>
            <Button 
              variant="link" 
              className="text-danger p-0 d-none d-md-inline-block" 
              onClick={() => onRemove(item.id)}
            >
              <i className="fas fa-trash-alt me-1"></i>
              <span className="small">Eliminar</span>
            </Button>
          </div>
        </Col>
      </Row>
    </ListGroup.Item>
  );
};

export default ItemCarrito;