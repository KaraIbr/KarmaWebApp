import React, { useEffect, useState } from 'react';
import { Card, Button, Badge, Form, Row, Col, Modal, InputGroup, Spinner, Alert, Container } from 'react-bootstrap';
import { COLORS, THEME, getContrastColor } from '../servicios/theme';

// Use environment variables for API URLs
const API_BASE_URL =  'https://karmaapi-z51n.onrender.com';
const API_URL = `${API_BASE_URL}/api/productos`;
const API_USER_URL = `${API_BASE_URL}/api/usuarios`;
const API_CART_URL = `${API_BASE_URL}/api/carrito`;

// Lista de nombres de productos permitidos según la restricción de la base de datos
const nombresPermitidos = ['Pulsera', 'Collar', 'Aretes', 'Tobillera'];

// Colores para la interfaz en estilo minimalista
const uiColors = {
    primary: '#000000',           // Negro para elementos principales
    secondary: '#666666',         // Gris medio para elementos secundarios
    accent: '#111111',            // Acento sutilmente más claro que el primario
    background: '#ffffff',        // Fondo blanco
    border: '#eaeaea',            // Bordes muy sutiles
    hover: '#fafafa',             // Color hover
    success: '#10b981',           // Verde para éxito
    danger: '#ef4444',            // Rojo para errores y alertas
    warning: '#f59e0b'            // Naranja/ámbar para advertencias
};

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
        color: 'default', // Valor predeterminado para color
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('todas');
    const [filtroStock, setFiltroStock] = useState('todos');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [productoToDelete, setProductoToDelete] = useState(null);
    const [alertMessage, setAlertMessage] = useState(null);
    const [viewMode, setViewMode] = useState('table'); // 'grid' or 'table'
    const [ordenamiento, setOrdenamiento] = useState('reciente'); // Opciones de ordenamiento

    // Array de colores disponibles para productos
    const [colores] = useState([
        'default', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Negro',
        'Blanco', 'Gris', 'Morado', 'Rosa', 'Naranja', 'Multicolor'
    ]);



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

    // Aplicar ordenamiento a los resultados filtrados
    useEffect(() => {
        if (filteredProductos.length > 0) {
            let sortedProducts = [...filteredProductos];
            
            // Ordenar según el criterio seleccionado
            if (ordenamiento === 'reciente') {
                // Suponiendo que el ID mayor es el más reciente
                sortedProducts.sort((a, b) => b.id - a.id);
            } else if (ordenamiento === 'antiguo') {
                // Suponiendo que el ID menor es el más antiguo
                sortedProducts.sort((a, b) => a.id - b.id);
            } else if (ordenamiento === 'precio-asc') {
                sortedProducts.sort((a, b) => parseFloat(a.precio) - parseFloat(b.precio));
            } else if (ordenamiento === 'precio-desc') {
                sortedProducts.sort((a, b) => parseFloat(b.precio) - parseFloat(a.precio));
            }
            
            setFilteredProductos(sortedProducts);
        }
    }, [ordenamiento]);

    // Manejo de errores y depuración
    useEffect(() => {
        if (error) {
            console.error('Error en la aplicación:', error);
        }
    }, [error]);
    
    // Muestra mensajes de depuración cuando cambia el formData
    useEffect(() => {
        if (formData.nombre === 'Prueba') {
            console.log('Estado actual del formulario para "Prueba":', formData);
        }
    }, [formData]);

    // Actualización de la función applyFilters para manejar solo agotados y disponibles
    const applyFilters = () => {
        let results = [...productos];
        
        // Filtrar por término de búsqueda
        if (searchTerm) {
            results = results.filter(producto => 
                producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (producto.id && producto.id.toString().includes(searchTerm))
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
            color: 'default', // Valor predeterminado para color
        });
        setModalVisible(true);
    };

    const handleEdit = (producto) => {
        setEditingProducto(producto);
        setFormData({
            ...producto,
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
            
            // Validar que se ha seleccionado un tipo de joya válido
            if (!formData.nombre || !nombresPermitidos.includes(formData.nombre)) {
                throw new Error('Debe seleccionar un tipo de joya válido: Pulsera, Collar, Aretes o Tobillera');
            }

            // Validar que se ha seleccionado una categoría
            if (!formData.categoria) {
                throw new Error('Debe seleccionar una categoría para el producto');
            }
            
            // Preparar los datos correctamente para enviar al servidor
            const productoData = {
                nombre: formData.nombre, // Debe ser uno de los valores permitidos
                stock: parseInt(formData.stock, 10) || 0,
                precio: parseFloat(formData.precio) || 0,
                categoria: formData.categoria,
                color: formData.color || 'default',
            };
            
            console.log('Enviando datos al servidor:', productoData);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            try {
                const response = await fetch(url, {
                    method,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(productoData),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                console.log('Status code:', response.status);
                console.log('Status text:', response.statusText);
                
                if (!response.ok) {
                    let errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
                    
                    try {
                        const errorData = await response.json();
                        console.error('Error data:', errorData);
                        
                        if (errorData && errorData.error) {
                            if (errorData.error.includes('productos_nombre_check')) {
                                errorMessage = 'El nombre del producto debe ser uno de los siguientes: Pulsera, Collar, Aretes o Tobillera. Otros valores no están permitidos por la base de datos.';
                            } else {
                                errorMessage = `Error: ${errorData.error}`;
                            }
                        }
                    } catch (e) {
                        console.error('No se pudo parsear la respuesta de error como JSON:', e);
                    }
                    
                    throw new Error(errorMessage);
                }
                
                obtener_prod();
                setModalVisible(false);
                
                const action = editingProducto ? 'actualizado' : 'creado';
                showAlert('success', `Producto ${action} correctamente.`);
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    throw new Error('La solicitud ha tardado demasiado tiempo. Por favor, inténtelo de nuevo.');
                }
                throw fetchError;
            }
        } catch (error) {
            console.error('Error al guardar producto:', error);
            showAlert('danger', `No se pudo guardar el producto: ${error.message}`);
        }
    };

    const agregarAlCarrito = async (productoId) => {
        const data = {
            producto_id: productoId,
            cantidad: 1,
        };

        try {
            const response = await fetch(API_CART_URL, {
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
        // Usar colores del tema de la interfaz en lugar de categoryColors que no existe
        return (
            <Badge 
                pill 
                style={{ 
                    backgroundColor: uiColors.hover, 
                    color: uiColors.secondary,
                    fontSize: '0.8rem', 
                    padding: '0.35em 0.65em' 
                }}
            >
                {categoria || 'Sin categoría'}
            </Badge>
        );
    };
    
    const getColorBackground = (colorName) => {
        const colorMap = {
            'default': '#ced4da',
            'Rojo': '#dc3545',
            'Azul': '#0d6efd',
            'Verde': '#198754',
            'Amarillo': '#ffc107',
            'Negro': '#212529',
            'Blanco': '#f8f9fa',
            'Gris': '#6c757d',
            'Morado': '#6f42c1',
            'Rosa': '#e83e8c',
            'Naranja': '#fd7e14',
            'Multicolor': 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)'
        };
        return colorMap[colorName] || colorMap.default;
    };

    const getColorBadge = (color) => {
        const backgroundColor = getColorBackground(color || 'default');
        const textColor = color === 'Blanco' || color === 'Amarillo' ? '#212529' : '#ffffff';
        
        return (
            <Badge 
                style={{ 
                    backgroundColor: backgroundColor, 
                    color: textColor,
                    fontSize: '0.75rem',
                    padding: '0.35em 0.65em',
                    marginLeft: '0.5rem',
                    border: color === 'Blanco' ? '1px solid #ced4da' : 'none'
                }}
            >
                {color === 'default' ? 'Color básico' : color}
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
                    <Card className="h-100" style={{ 
                        border: `1px solid ${uiColors.border}`,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 20px -10px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                    }}>
                        <Card.Body className="d-flex flex-column p-4">
                            <div className="mb-3 d-flex justify-content-between align-items-center">
                                <span style={{ 
                                    fontSize: '0.75rem', 
                                    fontFamily: 'monospace', 
                                    backgroundColor: uiColors.hover, 
                                    color: uiColors.secondary,
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px'
                                }}>
                                    SKU: {producto.id}
                                </span>
                                {producto.stock <= 0 ? (
                                    <span style={{ 
                                        backgroundColor: uiColors.danger + '20',
                                        color: uiColors.danger,
                                        fontSize: '0.75rem',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontWeight: '500'
                                    }}>
                                        Agotado
                                    </span>
                                ) : (
                                    <span style={{ 
                                        backgroundColor: uiColors.success + '20',
                                        color: uiColors.success,
                                        fontSize: '0.75rem',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontWeight: '500'
                                    }}>
                                        Stock: {producto.stock}
                                    </span>
                                )}
                            </div>

                            <h5 style={{ 
                                fontSize: '1rem', 
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                color: uiColors.primary
                            }}>
                                {producto.nombre}
                            </h5>

                            <div className="d-flex align-items-center mb-3">
                                <span style={{
                                    backgroundColor: uiColors.hover,
                                    color: uiColors.secondary,
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px',
                                    marginRight: '8px'
                                }}>
                                    {producto.categoria || 'Sin categoría'}
                                </span>

                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <div style={{ 
                                        width: '14px', 
                                        height: '14px', 
                                        borderRadius: '50%', 
                                        backgroundColor: getColorBackground(producto.color || 'default'),
                                        border: producto.color === 'Blanco' ? '1px solid #ddd' : 'none'
                                    }}></div>
                                    <span style={{ fontSize: '0.75rem', color: uiColors.secondary }}>
                                        {producto.color === 'default' ? '-' : producto.color}
                                    </span>
                                </div>
                            </div>

                            <div style={{ 
                                fontSize: '1.25rem', 
                                fontWeight: 'bold', 
                                marginBottom: '1rem',
                                marginTop: 'auto',
                                color: uiColors.primary
                            }}>
                                ${parseFloat(producto.precio).toFixed(2)}
                            </div>
                            
                            <div className="d-flex gap-2 mt-2">
                                <button
                                    onClick={() => handleEdit(producto)}
                                    title="Editar"
                                    style={{
                                        flex: '1',
                                        background: uiColors.hover,
                                        border: `1px solid ${uiColors.border}`,
                                        cursor: 'pointer',
                                        color: uiColors.secondary,
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        fontSize: '0.875rem',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = uiColors.border;
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = uiColors.hover;
                                    }}
                                >
                                    <i className="fas fa-edit me-1"></i> Editar
                                </button>
                                <button
                                    onClick={() => confirmDelete(producto)}
                                    title="Eliminar"
                                    style={{
                                        background: uiColors.danger + '10',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: uiColors.danger,
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        fontSize: '0.875rem',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = uiColors.danger + '20';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = uiColors.danger + '10';
                                    }}
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                            <button
                                onClick={() => agregarAlCarrito(producto.id)}
                                disabled={producto.stock <= 0}
                                style={{
                                    width: '100%',
                                    marginTop: '0.5rem',
                                    padding: '0.5rem',
                                    background: producto.stock <= 0 ? uiColors.hover : uiColors.primary,
                                    color: producto.stock <= 0 ? uiColors.secondary : '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: producto.stock <= 0 ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseOver={(e) => {
                                    if (producto.stock > 0) {
                                        e.currentTarget.style.backgroundColor = uiColors.accent;
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (producto.stock > 0) {
                                        e.currentTarget.style.backgroundColor = uiColors.primary;
                                    }
                                }}
                            >
                                <i className="fas fa-cart-plus me-1"></i> 
                                {producto.stock <= 0 ? 'Agotado' : 'Agregar al carrito'}
                            </button>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );

    const ProductosTable = () => (
        <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: `1px solid ${uiColors.border}` }}>
                        <th className="sticky-col" style={{ fontWeight: '500', color: uiColors.secondary, fontSize: '0.875rem', minWidth: '80px' }}>SKU</th>
                        <th style={{ fontWeight: '500', color: uiColors.secondary, fontSize: '0.875rem' }}>Tipo</th>
                        <th style={{ fontWeight: '500', color: uiColors.secondary, fontSize: '0.875rem' }}>Color</th>
                        <th style={{ fontWeight: '500', color: uiColors.secondary, fontSize: '0.875rem' }}>Stock</th>
                        <th style={{ fontWeight: '500', color: uiColors.secondary, fontSize: '0.875rem' }}>Precio</th>
                        <th style={{ fontWeight: '500', color: uiColors.secondary, fontSize: '0.875rem' }}>Categoría</th>
                        <th style={{ fontWeight: '500', color: uiColors.secondary, fontSize: '0.875rem' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProductos.map((producto, idx) => (
                        <tr key={producto.id} style={{ 
                            borderBottom: `1px solid ${uiColors.border}`,
                            backgroundColor: idx % 2 === 0 ? 'transparent' : uiColors.hover
                        }}>
                            <td className="sticky-col" style={{ fontSize: '0.875rem', padding: '12px 16px', verticalAlign: 'middle' }}>
                                <span style={{ 
                                    fontSize: '0.75rem', 
                                    color: uiColors.secondary,
                                    fontWeight: '500'
                                }}>
                                    {producto.id}
                                </span>
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '12px 16px', verticalAlign: 'middle', fontWeight: '500' }}>
                                {producto.nombre}
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '12px 16px', verticalAlign: 'middle' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <div style={{ 
                                        width: '16px', 
                                        height: '16px', 
                                        borderRadius: '50%', 
                                        backgroundColor: getColorBackground(producto.color || 'default'),
                                        border: producto.color === 'Blanco' ? '1px solid #ddd' : 'none'
                                    }}></div>
                                    <span style={{ fontSize: '0.8rem', color: uiColors.secondary }}>
                                        {producto.color === 'default' ? '-' : producto.color}
                                    </span>
                                </div>
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '12px 16px', verticalAlign: 'middle' }}>
                                {producto.stock <= 0 ? (
                                    <span style={{ 
                                        backgroundColor: uiColors.danger + '20',
                                        color: uiColors.danger,
                                        fontSize: '0.75rem',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontWeight: '500'
                                    }}>
                                        Agotado
                                    </span>
                                ) : (
                                    <span style={{ 
                                        backgroundColor: uiColors.success + '20',
                                        color: uiColors.success,
                                        fontSize: '0.75rem',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontWeight: '500'
                                    }}>
                                        {producto.stock}
                                    </span>
                                )}
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '12px 16px', verticalAlign: 'middle', fontWeight: '600' }}>
                                ${parseFloat(producto.precio).toFixed(2)}
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '12px 16px', verticalAlign: 'middle' }}>
                                <span style={{
                                    backgroundColor: uiColors.hover,
                                    color: uiColors.secondary,
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px'
                                }}>
                                    {producto.categoria || 'Sin categoría'}
                                </span>
                            </td>
                            <td style={{ fontSize: '0.875rem', padding: '12px 16px', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleEdit(producto)}
                                        title="Editar"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: uiColors.secondary,
                                            padding: '4px',
                                            borderRadius: '4px',
                                            transition: 'background-color 0.15s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = uiColors.hover}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(producto)}
                                        title="Eliminar"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: uiColors.danger,
                                            padding: '4px',
                                            borderRadius: '4px',
                                            transition: 'background-color 0.15s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = uiColors.danger + '10'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                    <button
                                        onClick={() => agregarAlCarrito(producto.id)}
                                        title="Agregar al Carrito"
                                        disabled={producto.stock <= 0}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: producto.stock <= 0 ? 'not-allowed' : 'pointer',
                                            color: producto.stock <= 0 ? '#ccc' : uiColors.success,
                                            padding: '4px',
                                            borderRadius: '4px',
                                            transition: 'background-color 0.15s'
                                        }}
                                        onMouseOver={(e) => {
                                            if (producto.stock > 0) {
                                                e.currentTarget.style.backgroundColor = uiColors.success + '10'
                                            }
                                        }}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <i className="fas fa-cart-plus"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <Container fluid className="py-4 px-lg-5" style={{ }}>
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
                            borderColor: uiColors.border, 
                            color: uiColors.secondary,
                            backgroundColor: 'transparent',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}
                    >
                        <i className={`fas fa-${viewMode === 'grid' ? 'table' : 'th-large'} me-1`}></i>
                         {viewMode === 'grid' ? 'tabla' : 'cuadrícula'}
                    </Button>
                    <Button
                        variant="primary"
                        style={{ 
                            backgroundColor: uiColors.primary, 
                            borderColor: uiColors.primary,
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}
                        onClick={handleAdd}
                    >
                        <i className="fas fa-plus me-1"></i>
                    Nuevo
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
            <Card className="mb-4 shadow-sm" style={{ 
                backgroundColor: uiColors.background, 
                borderColor: uiColors.border,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}>
                <Card.Body>
                    <Row>
                        <Col md={3}>
                            <Form.Group className="mb-md-0 mb-3">
                                <Form.Label style={{ color: uiColors.secondary, fontWeight: '500', fontSize: '0.875rem' }}>
                                    <i className="fas fa-search me-1"></i> Buscar
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Buscar productos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ 
                                        borderColor: uiColors.border,
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-md-0 mb-3">
                                <Form.Label style={{ color: uiColors.secondary, fontWeight: '500', fontSize: '0.875rem' }}>
                                    <i className="fas fa-tag me-1"></i> Categoría
                                </Form.Label>
                                <Form.Select
                                    value={filtroCategoria}
                                    onChange={(e) => setFiltroCategoria(e.target.value)}
                                    style={{ 
                                        borderColor: uiColors.border,
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    <option value="todas">Todas las categorías</option>
                                    {categorias.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-md-0 mb-3">
                                <Form.Label style={{ color: uiColors.secondary, fontWeight: '500', fontSize: '0.875rem' }}>
                                    <i className="fas fa-cubes me-1"></i> Stock
                                </Form.Label>
                                <Form.Select
                                    value={filtroStock}
                                    onChange={(e) => setFiltroStock(e.target.value)}
                                    style={{ 
                                        borderColor: uiColors.border,
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    <option value="todos">Todos los productos</option>
                                    <option value="disponible">En stock</option>
                                    <option value="agotado">Agotados</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-md-0 mb-3">
                                <Form.Label style={{ color: uiColors.secondary, fontWeight: '500', fontSize: '0.875rem' }}>
                                    <i className="fas fa-sort me-1"></i> Ordenar por
                                </Form.Label>
                                <Form.Select
                                    value={ordenamiento}
                                    onChange={(e) => setOrdenamiento(e.target.value)}
                                    style={{ 
                                        borderColor: uiColors.border,
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    <option value="reciente">Más recientes primero</option>
                                    <option value="antiguo">Más antiguos primero</option>
                                    <option value="precio-asc">Precio: menor a mayor</option>
                                    <option value="precio-desc">Precio: mayor a menor</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                            <Button 
                                variant="outline-secondary" 
                                className="w-100"
                                onClick={handleClearFilters}
                                style={{ 
                                    borderColor: uiColors.border, 
                                    color: uiColors.secondary,
                                    backgroundColor: 'transparent',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
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
                                    <Form.Label>
                                        <i className="fas fa-tag me-1"></i> Tipo de Joya
                                    </Form.Label>
                                    <Form.Select
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        required
                                        className="shadow-sm"
                                    >
                                        <option value="">Seleccionar tipo de joya</option>
                                        {nombresPermitidos.map(nombre => (
                                            <option key={nombre} value={nombre}>{nombre}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Text className="text-muted mt-1">
                                        La base de datos solo permite estos tipos específicos de productos
                                    </Form.Text>
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
                                    <Form.Label><i className="fas fa-palette me-1"></i> Color</Form.Label>
                                    <InputGroup>
                                        <div 
                                            className="color-preview me-2 d-flex align-items-center justify-content-center" 
                                            style={{
                                                width: '38px',
                                                height: '38px',
                                                borderRadius: '5px',
                                                background: getColorBackground(formData.color || 'default'),
                                                border: formData.color === 'Blanco' ? '1px solid #ced4da' : 'none'
                                            }}
                                        >
                                            {formData.color === 'Multicolor' && <i className="fas fa-palette text-white"></i>}
                                        </div>
                                        <Form.Select
                                            value={formData.color || 'default'}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="shadow-sm"
                                        >
                                            {colores.map(color => (
                                                <option key={color} value={color}>
                                                    {color === 'default' ? 'Color por defecto' : color}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Si no se especifica, se usará "default" como color
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
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

