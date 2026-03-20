import React, { useEffect, useState } from 'react';
import { Card, Button, Badge, Row, Col, Form, InputGroup, Pagination, Spinner } from 'react-bootstrap';
import { API_URL } from '../../servicios/api.jsx';

const API_PREFIX = '/api/';
const itemsPerPage = 10;

const ListaProductos = ({ onProductSelect, onAddToCart }) => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        obtenerProductos();
    }, []);

    const obtenerProductos = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}${API_PREFIX}productos`);
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

    // Obtener los productos para la página actual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredProducts.slice(startIndex, endIndex);

    // CONTROLES DE PAGINACIÓN ESPECÍFICOS PARA MÓVIL
    const MobilePagination = () => {
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        
        if (totalPages <= 1) return null;
        
        return (
            <div className="d-md-none mt-4 mb-5">
                <div className="d-flex justify-content-between align-items-center">
                    <button 
                        className="btn btn-light d-flex align-items-center justify-content-center"
                        style={{height: '44px', width: '44px', borderRadius: '22px'}}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    
                    <div className="text-center">
                        <span className="fw-medium">Página {currentPage} de {totalPages}</span>
                        <div className="small text-muted">
                            Mostrando {currentItems.length} de {filteredProducts.length} productos
                        </div>
                    </div>
                    
                    <button 
                        className="btn btn-light d-flex align-items-center justify-content-center"
                        style={{height: '44px', width: '44px', borderRadius: '22px'}}
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        );
    };

    // Vista optimizada para móvil con paginación
    const MobileProductList = () => (
        <div className="d-md-none">
            {currentItems.map(producto => (
                <div key={producto.id} className="mobile-card bg-white mb-3">
                    <div className="d-flex justify-content-between mb-2">
                        <div className="mobile-title">{producto.nombre}</div>
                        <div className="mobile-price">${Number(producto.precio).toFixed(2)}</div>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge rounded-pill bg-light text-secondary">
                            {producto.categoria || 'General'}
                        </span>
                        {producto.stock > 0 ? (
                            <span className="badge rounded-pill" style={{backgroundColor: '#e8f5e9', color: '#388e3c'}}>
                                En stock
                            </span>
                        ) : (
                            <span className="badge rounded-pill bg-light text-secondary">
                                Agotado
                            </span>
                        )}
                    </div>
                    
                    <div className="d-flex gap-2 mt-3">
                        <button 
                            className="btn btn-outline-primary flex-grow-1"
                            onClick={() => onProductSelect(producto)}
                            style={{borderColor: '#8c5cf2', color: '#8c5cf2'}}
                        >
                            <i className="fas fa-info-circle me-1"></i> Detalles
                        </button>
                        <button 
                            className="btn btn-primary flex-grow-1"
                            onClick={() => onAddToCart(producto)}
                            disabled={producto.stock <= 0}
                            style={{backgroundColor: producto.stock <= 0 ? '#f5f5f7' : '#8c5cf2', borderColor: producto.stock <= 0 ? '#f5f5f7' : '#7647eb'}}
                        >
                            <i className="fas fa-cart-plus me-1"></i> Agregar
                        </button>
                    </div>
                </div>
            ))}
            
            {filteredProducts.length === 0 && (
                <div className="text-center py-5 bg-light rounded">
                    <i className="fas fa-box-open fa-3x mb-3 text-muted"></i>
                    <h5>No hay productos disponibles</h5>
                    <p className="text-muted">No se encontraron productos que coincidan con tus criterios de búsqueda.</p>
                </div>
            )}
            
            {/* Componente de paginación móvil */}
            <MobilePagination />
        </div>
    );

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
            ) : (
                <>
                    {/* Vista optimizada para móvil con paginación */}
                    <MobileProductList />
                    
                    {/* Vista de escritorio */}
                    <div className="d-none d-md-block">
                        <Row xs={1} sm={2} md={3} lg={4} className="g-3">
                            {currentItems.map(producto => (
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
                        
                        {/* Paginación versión escritorio */}
                        {filteredProducts.length > itemsPerPage && (
                            <div className="d-flex justify-content-center mt-4">
                                <Pagination>
                                    <Pagination.First 
                                        onClick={() => setCurrentPage(1)} 
                                        disabled={currentPage === 1}
                                    />
                                    <Pagination.Prev 
                                        onClick={() => setCurrentPage(currentPage - 1)} 
                                        disabled={currentPage === 1}
                                    />
                                    
                                    {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }).map((_, index) => {
                                        const pageNumber = index + 1;
                                        return (
                                            <Pagination.Item 
                                                key={pageNumber} 
                                                active={pageNumber === currentPage}
                                                onClick={() => setCurrentPage(pageNumber)}
                                            >
                                                {pageNumber}
                                            </Pagination.Item>
                                        );
                                    })}
                                    
                                    <Pagination.Next 
                                        onClick={() => setCurrentPage(currentPage + 1)} 
                                        disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                                    />
                                    <Pagination.Last 
                                        onClick={() => setCurrentPage(Math.ceil(filteredProducts.length / itemsPerPage))} 
                                        disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                                    />
                                </Pagination>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ListaProductos;