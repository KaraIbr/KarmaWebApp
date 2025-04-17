import React, { useEffect, useState } from 'react';
import { Card, Button, Badge, Form, Row, Col, Modal, InputGroup, Spinner, Alert, Container } from 'react-bootstrap';
import { COLORS, THEME, getContrastColor } from '../servicios/theme';

const API_URL = 'http://127.0.0.1:5000/productos';
const API_USER_URL = 'http://127.0.0.1:5000/usuarios'; // API para obtener usuario
const API_CART_URL = 'http://127.0.0.1:5000/carrito'; // URL base para carrito

const CrudProductos = () => {
    const [productos, setProductos] = useState([]);
    const [filteredProductos, setFilteredProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [usuario, setUsuario] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProducto, setEditingProducto] = useState(null);
    const [formData, setFormData] = useState({ 
        nombre: '', 
        stock: '', 
        precio: '', 
        categoria: '', 
        descripcion: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('todas');
    const [filtroStock, setFiltroStock] = useState('todos');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [productoToDelete, setProductoToDelete] = useState(null);
    const [alertMessage, setAlertMessage] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

    // Colores para las categorías
    const categoryColors = {
        'Electrónica': COLORS.pastelVioleta,
        'Ropa': COLORS.naranjaSuave,
        'Alimentos': COLORS.verdeCalmado,
        'Hogar': COLORS.violetaOscuro,
        'Belleza': COLORS.naranjaIntenso,
        'Deportes': '#fd7e14',
        'Juguetes': '#17a2b8',
        'Libros': '#20c997',
        'default': COLORS.violetaOscuro
    };

    useEffect(() => {
        obtener_prod();
        obtener_usuario();
    }, []);

    useEffect(() => {
        if (productos.length > 0) {
            // Extraer categorías únicas
            const uniqueCategories = [...new Set(productos.map(p => p.categoria))].filter(Boolean);
            setCategorias(uniqueCategories);
            
            // Aplicar filtros
            applyFilters();
        }
    }, [productos, searchTerm, filtroCategoria, filtroStock]);

    // Actualización de la función applyFilters para manejar solo agotados y disponibles
    const applyFilters = () => {
        let results = [...productos];
        
        // Filtrar por término de búsqueda
        if (searchTerm) {
            results = results.filter(producto => 
                producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (producto.id && producto.id.toString().includes(searchTerm)) || // Filtrar por SKU/ID
                (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        // Filtrar por categoría
        if (filtroCategoria !== 'todas') {
            results = results.filter(producto => producto.categoria === filtroCategoria);
        }
        
        // Filtrar por stock
        if (filtroStock !== 'todos') {
            if (filtroStock === 'disponible') {
                results = results.filter(producto => producto.stock > 0);
            } else if (filtroStock === 'agotado') {
                results = results.filter(producto => producto.stock <= 0);
            }
            // Se elimina la condición para stock bajo
        }
        
        setFilteredProductos(results);
    };

    const obtener_prod = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Error al obtener productos');
            }
            const data = await response.json();
            data.sort((a, b) => a.id - b.id);
            setProductos(data);
            setFilteredProductos(data);
            setLoading(false);
        } catch (error) {
            console.error('Error al obtener productos', error);
            setError('No se pudieron cargar los productos. Por favor, intente nuevamente.');
            setLoading(false);
        }
    };

    const obtener_usuario = async () => {
        try {
            const response = await fetch(API_USER_URL);
            const data = await response.json();
            if (data && data.length > 0) {
                setUsuario({ id: data[0].id });
            } else {
                console.error('No se encontró el usuario');
            }
        } catch (error) {
            console.error('Error al obtener usuario', error);
        }
    };

    const handleAdd = () => {
        setEditingProducto(null);
        setFormData({ 
            nombre: '', 
            stock: '', 
            precio: '', 
            categoria: '', 
            descripcion: '',
        });
        setModalVisible(true);
    };

    const handleEdit = (producto) => {
        setEditingProducto(producto);
        setFormData({
            ...producto,
            descripcion: producto.descripcion || '',
        });
        setModalVisible(true);
    };

    const confirmDelete = (producto) => {
        setProductoToDelete(producto);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        if (!productoToDelete) return;
        
        try {
            const response = await fetch(`${API_URL}/${productoToDelete.id}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('Error al eliminar el producto');
            }
            
            setShowDeleteConfirm(false);
            setProductoToDelete(null);
            
            showAlert('success', `El producto "${productoToDelete.nombre}" ha sido eliminado correctamente.`);
            obtener_prod();
        } catch (error) {
            console.error('Error al eliminar producto', error);
            showAlert('danger', 'No se pudo eliminar el producto. Por favor, intente nuevamente.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editingProducto ? 'PUT' : 'POST';
            const url = editingProducto ? `${API_URL}/${editingProducto.id}` : API_URL;
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error('Error al guardar el producto');
            }
            
            obtener_prod();
            setModalVisible(false);
            
            const action = editingProducto ? 'actualizado' : 'creado';
            showAlert('success', `Producto ${action} correctamente.`);
        } catch (error) {
            console.error('Error al guardar producto', error);
            showAlert('danger', 'No se pudo guardar el producto. Por favor, intente nuevamente.');
        }
    };

    const agregarAlCarrito = async (productoId) => {
        const data = {
            producto_id: productoId,
            cantidad: 1,
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/carrito', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                throw new Error('Error al agregar al carrito');
            }
            
            const result = await response.json();
            console.log('Producto agregado al carrito:', result);
            showAlert('success', 'Producto agregado al carrito correctamente.');
        } catch (error) {
            console.error('Error al agregar al carrito:', error);
            showAlert('danger', 'No se pudo agregar el producto al carrito.');
        }
    };

    const showAlert = (type, message) => {
        setAlertMessage({ type, message });
        setTimeout(() => setAlertMessage(null), 5000); // Auto-dismiss after 5 seconds
    };

    const getStockBadge = (stock) => {
        if (stock <= 0) {
            return <Badge bg="danger" style={{ backgroundColor: COLORS.naranjaIntenso }}>Agotado</Badge>;
        } else {
            return <Badge bg="success" style={{ backgroundColor: COLORS.cornflowerBlue }}>En stock ({stock})</Badge>;
        }
    };

    const getCategoryBadge = (categoria) => {
        const color = categoryColors[categoria] || categoryColors.default;
        return (
            <Badge 
                pill 
                style={{ backgroundColor: color, fontSize: '0.8rem', padding: '0.35em 0.65em' }}
            >
                {categoria || 'Sin categoría'}
            </Badge>
        );
    };
    
    const handleClearFilters = () => {
        setSearchTerm('');
        setFiltroCategoria('todas');
        setFiltroStock('todos');
    };

    const ProductosGrid = () => (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {filteredProductos.map((producto) => (
                <Col key={producto.id}>
                    <Card className="h-100 shadow-sm hover-card">
                        <Card.Body className="d-flex flex-column">
                            <div className="mb-2 d-flex justify-content-between align-items-center">
                                {getCategoryBadge(producto.categoria)}
                                {getStockBadge(producto.stock)}
                            </div>
                            <Card.Title className="font-weight-bold">
                                {producto.nombre}
                                <span className="d-block text-muted small mt-1">SKU: {producto.id}</span>
                            </Card.Title>
                            <Card.Text className="text-muted small">
                                {producto.descripcion || 'Sin descripción'}
                            </Card.Text>
                            <Card.Text className="product-price mt-auto mb-2">
                                ${parseFloat(producto.precio).toFixed(2)}
                            </Card.Text>
                            <div className="d-flex justify-content-between mt-auto">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="mr-2"
                                    onClick={() => handleEdit(producto)}
                                >
                                    <i className="fas fa-edit me-1"></i> Editar
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => confirmDelete(producto)}
                                >
                                    <i className="fas fa-trash me-1"></i> Eliminar
                                </Button>
                            </div>
                            <Button
                                variant="primary"
                                className="w-100 mt-2"
                                onClick={() => agregarAlCarrito(producto.id)}
                                disabled={producto.stock <= 0}
                            >
                                <i className="fas fa-cart-plus me-1"></i> Agregar al carrito
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );

    const ProductosTable = () => (
        <div className="table-responsive shadow rounded">
            <table className="table table-hover table-striped mb-0">
                <thead className="bg-light">
                    <tr>
                        <th>SKU</th>
                        <th>Nombre</th>
                        <th>Stock</th>
                        <th>Precio</th>
                        <th>Categoría</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProductos.map((producto) => (
                        <tr key={producto.id}>
                            <td><span className="badge bg-light text-dark">{producto.id}</span></td>
                            <td>
                                <span className="fw-medium">{producto.nombre}</span>
                                {producto.descripcion && (
                                    <div className="small text-muted text-truncate" style={{maxWidth: "200px"}}>
                                        {producto.descripcion}
                                    </div>
                                )}
                            </td>
                            <td>
                                {producto.stock <= 0 ? (
                                    <Badge bg="danger" style={{ backgroundColor: COLORS.naranjaIntenso }}>Agotado</Badge>
                                ) : (
                                    <Badge bg="success" style={{ backgroundColor: COLORS.cornflowerBlue }}>
                                        {producto.stock}
                                    </Badge>
                                )}
                            </td>
                            <td className="fw-bold">${parseFloat(producto.precio).toFixed(2)}</td>
                            <td>{getCategoryBadge(producto.categoria)}</td>
                            <td>
                                <div className="btn-group btn-group-sm">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleEdit(producto)}
                                        title="Editar"
                                        className="me-1"
                                    >
                                        <i className="fas fa-edit"></i>
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => confirmDelete(producto)}
                                        title="Eliminar"
                                        className="me-1"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </Button>
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={() => agregarAlCarrito(producto.id)}
                                        title="Agregar al Carrito"
                                        disabled={producto.stock <= 0}
                                    >
                                        <i className="fas fa-cart-plus"></i>
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <Container fluid className="py-4 px-lg-5" style={{ backgroundColor: COLORS.beigeClaro }}>
            {/* Header con título y botones principales */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1" style={{ color: COLORS.violetaOscuro }}>
                        <i className="fas fa-boxes-stacked me-2" style={{ color: COLORS.violetaOscuro }}></i>
                        Inventario de Productos
                    </h2>
                    <p className="text-muted mb-0">
                        {filteredProductos.length} producto{filteredProductos.length !== 1 ? 's' : ''} 
                        {filteredProductos.length !== productos.length && ` (de ${productos.length} total)`}
                    </p>
                </div>
                <div>
                    <Button
                        variant="outline-secondary"
                        className="me-2"
                        onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                        style={{ 
                            borderColor: COLORS.violetaOscuro, 
                            color: COLORS.violetaOscuro 
                        }}
                    >
                        <i className={`fas fa-${viewMode === 'grid' ? 'table' : 'th-large'} me-1`}></i>
                        Vista {viewMode === 'grid' ? 'tabla' : 'cuadrícula'}
                    </Button>
                    <Button
                        variant="primary"
                        style={{ 
                            backgroundColor: COLORS.naranjaIntenso, 
                            borderColor: COLORS.naranjaIntenso,
                            boxShadow: '0 2px 4px rgba(241, 100, 46, 0.3)'
                        }}
                        onClick={handleAdd}
                    >
                        <i className="fas fa-plus me-1"></i>
                        Añadir Producto
                    </Button>
                </div>
            </div>

            {/* Alertas */}
            {alertMessage && (
                <Alert variant={alertMessage.type} dismissible onClose={() => setAlertMessage(null)} className="mb-4 animate__animated animate__fadeIn">
                    <i className={`fas fa-${alertMessage.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
                    {alertMessage.message}
                </Alert>
            )}

            {/* Filtros */}
            <Card className="mb-4 shadow-sm" style={{ backgroundColor: '#DADFEA', borderColor: '#9DA6B8' }}>
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-md-0 mb-3">
                                <Form.Label style={{ color: '#5A6170' }}><i className="fas fa-search me-1"></i> Buscar</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Buscar productos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ borderColor: '#9DA6B8' }}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-md-0 mb-3">
                                <Form.Label style={{ color: '#5A6170' }}><i className="fas fa-tag me-1"></i> Categoría</Form.Label>
                                <Form.Select
                                    value={filtroCategoria}
                                    onChange={(e) => setFiltroCategoria(e.target.value)}
                                    style={{ borderColor: '#9DA6B8' }}
                                >
                                    <option value="todas">Todas las categorías</option>
                                    {categorias.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-md-0 mb-3">
                                <Form.Label style={{ color: '#5A6170' }}><i className="fas fa-cubes me-1"></i> Stock</Form.Label>
                                <Form.Select
                                    value={filtroStock}
                                    onChange={(e) => setFiltroStock(e.target.value)}
                                    style={{ borderColor: '#9DA6B8' }}
                                >
                                    <option value="todos">Todos los productos</option>
                                    <option value="disponible">En stock</option>
                                    <option value="agotado">Agotados</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                            <Button 
                                variant="outline-secondary" 
                                className="w-100"
                                onClick={handleClearFilters}
                                style={{ 
                                    borderColor: '#5A6170', 
                                    color: '#5A6170',
                                    backgroundColor: 'transparent'
                                }}
                            >
                                <i className="fas fa-filter-circle-xmark me-1"></i> Limpiar
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Loading spinner */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" style={{ color: '#8c5cf2' }} />
                    <p className="mt-3 text-muted">Cargando productos...</p>
                </div>
            ) : filteredProductos.length === 0 ? (
                <div className="text-center py-5 bg-light rounded">
                    <i className="fas fa-box-open fa-3x mb-3 text-muted"></i>
                    <h5>No se encontraron productos</h5>
                    <p className="text-muted">Intenta con otros filtros o agrega un nuevo producto.</p>
                    <Button 
                        variant="primary"
                        style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                        onClick={handleAdd}
                    >
                        <i className="fas fa-plus me-1"></i> Añadir producto
                    </Button>
                </div>
            ) : (
                <>
                    {/* Lista de productos */}
                    {viewMode === 'grid' ? <ProductosGrid /> : <ProductosTable />}

                    {/* Información adicional debajo de los productos */}
                    {filteredProductos.length > 0 && (
                        <div className="d-flex justify-content-between align-items-center mt-4">
                            <small className="text-muted">
                                Mostrando {filteredProductos.length} de {productos.length} productos
                            </small>
                            <Button 
                                variant="link" 
                                size="sm" 
                                className="text-decoration-none"
                                onClick={obtener_prod}
                            >
                                <i className="fas fa-sync-alt me-1"></i> Actualizar
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Modal de añadir/editar producto */}
            <Modal 
                show={modalVisible} 
                onHide={() => setModalVisible(false)} 
                size="lg"
                centered
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="fas fa-box me-2" style={{ color: '#8c5cf2' }}></i>
                        {editingProducto ? 'Editar Producto' : 'Añadir Producto'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre del producto</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Nombre del producto"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Precio</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>$</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={formData.precio}
                                            onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Stock</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Cantidad en existencia"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Categoría</Form.Label>
                                    <Form.Select
                                        value={formData.categoria}
                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccionar categoría</option>
                                        {categorias.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                        <option value="Nueva">+ Nueva categoría</option>
                                    </Form.Select>
                                </Form.Group>

                                {formData.categoria === 'Nueva' && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Nueva categoría</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Nombre de nueva categoría"
                                            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                )}
                            </Col>
                            
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Descripción</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={5}
                                        placeholder="Descripción del producto"
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr />
                        
                        <div className="product-preview p-3">
                            <h6 className="mb-3">Vista previa</h6>
                            <div className="d-flex">
                                <div>
                                    <h5 className="mb-1">{formData.nombre || 'Nombre del producto'}</h5>
                                    <div className="mb-2">
                                        {formData.categoria && (
                                            <Badge 
                                                pill 
                                                style={{ 
                                                    backgroundColor: categoryColors[formData.categoria] || categoryColors.default, 
                                                    fontSize: '0.8rem', 
                                                    marginRight: '8px',
                                                    padding: '0.35em 0.65em'
                                                }}
                                            >
                                                {formData.categoria}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mb-1 small text-muted">
                                        {formData.descripcion || 'Sin descripción'}
                                    </p>
                                    <div className="d-flex align-items-center">
                                        <h5 className="mb-0 me-3" style={{ color: '#8c5cf2' }}>
                                            ${parseFloat(formData.precio || 0).toFixed(2)}
                                        </h5>
                                        {getStockBadge(formData.stock || 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setModalVisible(false)}>
                            Cancelar
                        </Button>
                        <Button 
                            variant="primary" 
                            type="submit"
                            style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                        >
                            <i className="fas fa-save me-1"></i>
                            {editingProducto ? 'Actualizar' : 'Guardar'} Producto
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal de confirmación de eliminación */}
            <Modal 
                show={showDeleteConfirm} 
                onHide={() => setShowDeleteConfirm(false)}
                centered
                size="sm"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title>
                        <i className="fas fa-exclamation-triangle text-danger me-2"></i>
                        Eliminar Producto
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    {productoToDelete && (
                        <>
                            <p className="mb-3">
                                ¿Estás seguro de que deseas eliminar el producto <strong>"{productoToDelete.nombre}"</strong>?
                            </p>
                            <p className="text-muted small">
                                Esta acción no se puede deshacer.
                            </p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowDeleteConfirm(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        <i className="fas fa-trash me-1"></i> Eliminar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Estilos adicionales */}
            <style jsx="true">{`
                .hover-card {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .hover-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
                }
                .product-price {
                    font-size: 1.25rem;
                    font-weight: bold;
                    color: #8c5cf2;
                }
                .product-preview {
                    background-color: #f8f9fa;
                    border-radius: 8px;
                }
            `}</style>
        </Container>
    );
};

export default CrudProductos;

