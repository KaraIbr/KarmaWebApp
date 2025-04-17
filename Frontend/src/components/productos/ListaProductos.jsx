import React, { useEffect, useState } from 'react';
import { Card, Button, Badge, Row, Col, Form, InputGroup } from 'react-bootstrap';

const API_URL = 'http://127.0.0.1:5000/productos';

const ListaProductos = ({ onProductSelect, onAddToCart }) => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        obtenerProductos();
    }, []);

    const obtenerProductos = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_URL);
            const data = await response.json();
            // Ordenamos los productos de menor a mayor por ID
            data.sort((a, b) => a.id - b.id);
            setProductos(data);
            
            // Extract unique categories for filter
            const uniqueCategories = [...new Set(data.map(item => item.categoria).filter(Boolean))];
            setCategories(uniqueCategories);
            
            setLoading(false);
        } catch (error) {
            console.error('Error al obtener productos', error);
            setLoading(false);
        }
    };

    // Filter products by search term and category
    const filteredProducts = productos.filter(product => {
        const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !filterCategory || product.categoria === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // For card view on mobile instead of table
    return (
        <div className="container py-3">
            {/* Search and filter */}
            <div className="mb-4">
                <Row className="g-2">
                    <Col xs={12} md={6}>
                        <InputGroup>
                            <InputGroup.Text className="bg-light">
                                <i className="fas fa-search"></i>
                            </InputGroup.Text>
                            <Form.Control 
                                placeholder="Buscar productos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </Col>
                    <Col xs={8} md={4}>
                        <Form.Select 
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="h-100"
                        >
                            <option value="">Todas las categorías</option>
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col xs={4} md={2}>
                        <Button 
                            className="w-100"
                            style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                            onClick={() => onProductSelect(null)}
                        >
                            <i className="fas fa-plus me-2"></i>
                            <span className="d-none d-sm-inline">Añadir</span>
                        </Button>
                    </Col>
                </Row>
            </div>

            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            ) : filteredProducts.length > 0 ? (
                <Row xs={1} sm={2} md={3} lg={4} className="g-3">
                    {filteredProducts.map(producto => (
                        <Col key={producto.id}>
                            <Card className="h-100 shadow-sm" style={{ borderRadius: '10px', transition: 'transform 0.3s' }}>
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex justify-content-between">
                                        <Card.Title className="h5 text-truncate mb-1">
                                            {producto.nombre}
                                        </Card.Title>
                                        <Badge 
                                            bg={producto.stock > 10 ? 'success' : producto.stock > 0 ? 'warning' : 'danger'}
                                            className="ms-2"
                                        >
                                            {producto.stock > 0 ? producto.stock : 'Agotado'}
                                        </Badge>
                                    </div>
                                    
                                    <small className="text-muted mb-2">ID: {producto.id}</small>
                                    
                                    {producto.categoria && (
                                        <Badge 
                                            className="mb-2 align-self-start" 
                                            style={{ backgroundColor: '#b19cd9' }}
                                        >
                                            {producto.categoria}
                                        </Badge>
                                    )}
                                    
                                    <Card.Text className="mt-auto mb-0 h5 text-end">
                                        ${producto.precio}
                                    </Card.Text>
                                </Card.Body>
                                
                                <Card.Footer className="bg-white border-top-0 d-flex justify-content-between">
                                    <Button 
                                        variant="outline-primary" 
                                        size="sm"
                                        onClick={() => onProductSelect(producto)}
                                        style={{ color: '#8c5cf2', borderColor: '#8c5cf2' }}
                                    >
                                        <i className="fas fa-edit me-1"></i>
                                        <span className="d-none d-md-inline">Editar</span>
                                    </Button>
                                    
                                    <Button 
                                        variant="primary" 
                                        size="sm"
                                        onClick={() => onAddToCart(producto)}
                                        disabled={producto.stock <= 0}
                                        style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                                    >
                                        <i className="fas fa-cart-plus me-1"></i>
                                        <span className="d-none d-md-inline">Agregar</span>
                                    </Button>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <div className="text-center my-5 py-5">
                    <i className="fas fa-search fa-3x mb-3 text-muted"></i>
                    <h5 className="text-muted">No se encontraron productos</h5>
                    <p className="text-muted">Intenta con otra búsqueda o categoría</p>
                </div>
            )}
        </div>
    );
};

export default ListaProductos;