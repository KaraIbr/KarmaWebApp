import React, { useState, useEffect } from 'react';
import { Card, Form, Button, InputGroup, Spinner, Alert, Badge } from 'react-bootstrap';

const API_URL = 'http://127.0.0.1:5000';

const Descuentos = ({ onApplyDiscount, currentDiscount }) => {
  const [discountCode, setDiscountCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);

  // Load available discounts on component mount
  useEffect(() => {
    fetchAvailableDiscounts();
  }, []);

  const fetchAvailableDiscounts = async () => {
    try {
      setLoadingDiscounts(true);
      // This would typically be an API call to get available discounts
      // For demo purposes, we'll use mock data
      
      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockDiscounts = [
        { 
          id: 1, 
          codigo: 'BIENVENIDA', 
          tipo: 'porcentaje', 
          valor: 10,
          descripcion: '10% de descuento para nuevos clientes' 
        },
        { 
          id: 2, 
          codigo: 'VERANO2025', 
          tipo: 'porcentaje', 
          valor: 15,
          descripcion: '15% de descuento en la temporada de verano' 
        },
        { 
          id: 3, 
          codigo: 'FIJO5000', 
          tipo: 'monto', 
          valor: 5000,
          descripcion: '$5000 de descuento en tu compra' 
        }
      ];
      
      setAvailableDiscounts(mockDiscounts);
      setLoadingDiscounts(false);
    } catch (err) {
      console.error('Error al cargar descuentos:', err);
      setLoadingDiscounts(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!discountCode.trim()) {
      setError('Ingresa un código de descuento');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API validation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if code exists in available discounts
      const discount = availableDiscounts.find(
        d => d.codigo.toLowerCase() === discountCode.trim().toLowerCase()
      );
      
      if (discount) {
        onApplyDiscount(discount);
        setDiscountCode('');
      } else {
        setError('Código de descuento inválido o expirado');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error al aplicar descuento:', err);
      setError(err.message || 'Error al aplicar descuento');
      setLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    onApplyDiscount(null);
  };

  const handleSelectPresetDiscount = (discount) => {
    onApplyDiscount(discount);
  };

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body>
        {currentDiscount ? (
          <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: '#f0f9f0' }}>
            <div>
              <Badge bg="success" className="me-2">
                {currentDiscount.codigo}
              </Badge>
              <span className="fw-bold text-success">
                {currentDiscount.tipo === 'porcentaje' 
                  ? `${currentDiscount.valor}% de descuento` 
                  : `$${currentDiscount.valor} de descuento`}
              </span>
            </div>
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={handleRemoveDiscount}
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="danger" className="py-2 mb-3">
                <i className="fas fa-exclamation-circle me-2"></i>
                {error}
              </Alert>
            )}
            
            <Form onSubmit={handleSubmit}>
              <InputGroup className="mb-3">
                <Form.Control
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Código de descuento"
                  disabled={loading}
                />
                <Button 
                  type="submit" 
                  disabled={loading || !discountCode.trim()}
                  style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                >
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <i className="fas fa-check"></i>
                  )}
                </Button>
              </InputGroup>
            </Form>
            
            {loadingDiscounts ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" />
                <span className="ms-2">Cargando descuentos disponibles...</span>
              </div>
            ) : availableDiscounts.length > 0 ? (
              <div className="mt-3">
                <h6 className="mb-2">Descuentos disponibles:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {availableDiscounts.map(discount => (
                    <Button
                      key={discount.id}
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => handleSelectPresetDiscount(discount)}
                      className="d-flex align-items-center"
                    >
                      <i className="fas fa-tag me-1" style={{ color: '#8c5cf2' }}></i>
                      <span>{discount.codigo}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default Descuentos;