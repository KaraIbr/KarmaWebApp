import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, InputGroup, Alert } from 'react-bootstrap';

const API_URL = 'http://127.0.0.1:5000/productos';

const FormularioProducto = ({ producto, onSubmitSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    stock: '',
    categoria: '',
  });
  
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categorias, setCategorias] = useState([]);
  
  const isEditing = !!producto?.id;

  // Load product data if editing
  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        precio: producto.precio || '',
        stock: producto.stock || '',
        categoria: producto.categoria || '',
      });
    }
    
    // Fetch categories from existing products for dropdown
    fetchCategorias();
  }, [producto]);
  
  const fetchCategorias = async () => {
    try {
      const response = await fetch(API_URL);
      const productos = await response.json();
      const uniqueCategorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
      setCategorias(uniqueCategorias);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_URL}/${producto.id}` : API_URL;
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar el producto');
      }
      
      const result = await response.json();
      setLoading(false);
      onSubmitSuccess(result);
    } catch (err) {
      console.error('Error guardando producto:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header 
        className="bg-white py-3" 
        style={{ borderBottomColor: '#e0d3f5' }}
      >
        <h5 className="mb-0">
          <i className={`fas fa-${isEditing ? 'edit' : 'plus'} me-2`} style={{ color: '#8c5cf2' }}></i>
          {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        </h5>
      </Card.Header>
      
      <Card.Body>
        {error && (
          <Alert variant="danger" className="mb-4">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </Alert>
        )}
        
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Form.Group as={Col} xs={12}>
              <Form.Label>Nombre del producto *</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ingrese nombre del producto"
                required
              />
              <Form.Control.Feedback type="invalid">
                Ingrese un nombre para el producto
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          
          <Row className="mb-3">
            <Form.Group as={Col} xs={6}>
              <Form.Label>Precio *</Form.Label>
              <InputGroup>
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Ingrese un precio válido
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
            
            <Form.Group as={Col} xs={6}>
              <Form.Label>Stock *</Form.Label>
              <Form.Control
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                placeholder="0"
                required
              />
              <Form.Control.Feedback type="invalid">
                Ingrese una cantidad de stock
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          
          <Row className="mb-3">
            <Form.Group as={Col} xs={12}>
              <Form.Label>Categoría</Form.Label>
              <InputGroup>
                <Form.Select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="nueva">+ Nueva categoría</option>
                </Form.Select>
                
                {formData.categoria === 'nueva' && (
                  <Form.Control
                    type="text"
                    placeholder="Nueva categoría"
                    className="mt-2"
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    value=""
                  />
                )}
              </InputGroup>
            </Form.Group>
          </Row>
          
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button 
              variant="outline-secondary" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button 
              type="submit" 
              disabled={loading}
              style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Guardar producto
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FormularioProducto;