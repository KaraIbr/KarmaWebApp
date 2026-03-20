import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Spinner, Alert, Modal, Table, ButtonGroup } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { API_URL, API_PREFIX } from '../../servicios/api';

const GeneradorEtiquetas = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [formatoImpresion, setFormatoImpresion] = useState('2x2');
  const [busqueda, setBusqueda] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [modalVistaPrevia, setModalVistaPrevia] = useState(false);
  const [vistaProductos, setVistaProductos] = useState('tabla'); // 'tarjetas' o 'tabla'
  const [mobileConfigOpen, setMobileConfigOpen] = useState(false); // Estado para configuración móvil

  // Configuraciones
  const [tamanioEtiqueta, setTamanioEtiqueta] = useState('mediano');
  const [mostrarPrecio, setMostrarPrecio] = useState(true);
  const [mostrarCodigo, setMostrarCodigo] = useState(true);
  const [mostrarDescripcion, setMostrarDescripcion] = useState(false);
  const [borde, setBorde] = useState(true);

  const etiquetasRef = useRef();

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (busqueda.trim() === '') {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (producto.codigo && producto.codigo.toLowerCase().includes(busqueda.toLowerCase()))
      );
      setProductosFiltrados(filtrados);
    }
  }, [busqueda, productos]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Cargando productos desde:', `${API_URL}${API_PREFIX}productos`);

      const response = await fetch(`${API_URL}${API_PREFIX}productos`);

      if (!response.ok) {
        throw new Error(`Error al cargar los productos: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Datos recibidos:', data);

      let productosArray = [];
      if (data.productos) {
        productosArray = data.productos;
      } else if (Array.isArray(data)) {
        productosArray = data;
      } else if (typeof data === 'object' && data !== null) {
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) {
            productosArray = data[key];
          }
        });
      }

      console.log('Productos procesados:', productosArray);
      setProductos(productosArray);
      setProductosFiltrados(productosArray);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar los productos. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionProducto = (producto) => {
    const index = productosSeleccionados.findIndex(p => p.id === producto.id);

    if (index >= 0) {
      // Si ya existe, actualizar cantidad
      const productos = [...productosSeleccionados];
      productos[index] = {
        ...productos[index],
        cantidad: productos[index].cantidad + 1
      };
      setProductosSeleccionados(productos);
    } else {
      // Si no existe, agregar con cantidad 1
      setProductosSeleccionados([...productosSeleccionados, { ...producto, cantidad: 1 }]);
    }
  };

  const handleCambiarCantidad = (id, cantidad) => {
    const cantidadNum = parseInt(cantidad);
    if (isNaN(cantidadNum) || cantidadNum < 1) return;

    const productosActualizados = productosSeleccionados.map(producto =>
      producto.id === id ? { ...producto, cantidad: cantidadNum } : producto
    );

    setProductosSeleccionados(productosActualizados);
  };

  const handleEliminarProducto = (id) => {
    setProductosSeleccionados(productosSeleccionados.filter(producto => producto.id !== id));
  };

  // Selección múltiple desde la vista de tabla
  const handleSeleccionMultiple = (producto, isChecked) => {
    if (isChecked) {
      // Verifica si ya existe
      const existente = productosSeleccionados.find(p => p.id === producto.id);
      if (existente) {
        // Incrementa cantidad si ya existe
        handleCambiarCantidad(producto.id, existente.cantidad + 1);
      } else {
        // Agrega nuevo con cantidad 1
        setProductosSeleccionados([...productosSeleccionados, { ...producto, cantidad: 1 }]);
      }
    } else {
      // Elimina el producto
      handleEliminarProducto(producto.id);
    }
  };

  // Seleccionar/deseleccionar todos
  const handleSeleccionarTodos = (seleccionar) => {
    if (seleccionar) {
      // Agregar todos los productos filtrados que no estén ya seleccionados
      const nuevosProductos = productosFiltrados
        .filter(p => !productosSeleccionados.some(ps => ps.id === p.id))
        .map(p => ({ ...p, cantidad: 1 }));

      setProductosSeleccionados([...productosSeleccionados, ...nuevosProductos]);
    } else {
      // Eliminar todos los productos
      setProductosSeleccionados([]);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const element = etiquetasRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Mayor escala para mejor calidad
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');

      // Determinar orientación según formato
      const orientation = formatoImpresion === '1x1' ? 'portrait' : 'landscape';

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      // Calcular dimensiones para mantener la proporción
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('Etiquetas_Karma.pdf');

      console.log("PDF generado correctamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      setError("Hubo un error al generar el PDF. Por favor intente de nuevo.");
    }
  };

  // Obtener el estilo de tamaño para las etiquetas
  const getTamanioEstilo = () => {
    switch (tamanioEtiqueta) {
      case 'pequeno':
        return { fontSize: '0.85rem', padding: '0.8rem 0.5rem' };
      case 'grande':
        return { fontSize: '1.2rem', padding: '1.5rem 1rem' };
      default: // mediano
        return { fontSize: '1rem', padding: '1.2rem 0.8rem' };
    }
  };

  // Total de etiquetas seleccionadas
  const totalEtiquetas = productosSeleccionados.reduce((sum, p) => sum + p.cantidad, 0);

  // Vista de productos optimizada para móvil con tarjetas
  const MobileProductosList = () => (
    <div className="d-md-none">
      {productosFiltrados.map(producto => {
        const seleccionado = productosSeleccionados.find(p => p.id === producto.id);
        return (
          <div key={producto.id} className="mobile-card bg-white mb-3">
            <div className="d-flex justify-content-between mb-2">
              <div className="mobile-title">{producto.nombre}</div>
              <div className="mobile-price">${producto.precio?.toFixed(2) || '0.00'}</div>
            </div>

            {producto.codigo && (
              <div className="small text-muted mb-2">SKU: {producto.codigo}</div>
            )}

            {seleccionado ? (
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="badge bg-primary rounded-pill me-2" style={{ backgroundColor: '#8c5cf2!important' }}>
                    Seleccionado
                  </span>
                  <small className="text-muted">Cantidad: {seleccionado.cantidad}</small>
                </div>
                <div className="d-flex align-items-center">
                  <button
                    className="btn btn-sm btn-light me-2"
                    onClick={() => handleCambiarCantidad(producto.id, Math.max(1, seleccionado.cantidad - 1))}
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-light me-2"
                    onClick={() => handleCambiarCantidad(producto.id, seleccionado.cantidad + 1)}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleEliminarProducto(producto.id)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => handleSeleccionMultiple(producto, true)}
                style={{ borderColor: '#8c5cf2', color: '#8c5cf2' }}
              >
                <i className="fas fa-plus me-1"></i>
                Seleccionar
              </button>
            )}
          </div>
        );
      })}

      {productosFiltrados.length === 0 && (
        <div className="text-center py-4">
          <i className="fas fa-search fa-2x mb-3 text-muted"></i>
          <p className="text-muted mb-0">No se encontraron productos</p>
        </div>
      )}
    </div>
  );

  // Componente de Vista Previa móvil con acciones fijas en la parte inferior
  const MobilePreviewBar = () => (
    <div className="mobile-action-bar d-md-none">
      <div>
        <span className="fw-bold">
          {totalEtiquetas} etiqueta{totalEtiquetas !== 1 ? 's' : ''}
        </span>
      </div>
      <div>
        <Button
          variant="primary"
          onClick={() => setModalVistaPrevia(true)}
          style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
          className="d-flex align-items-center"
        >
          <i className="fas fa-eye me-2"></i>
          Vista Previa
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-4">
      <Row className="mb-4">
        <Col md={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <i className="fas fa-boxes me-2" style={{ color: '#8c5cf2' }}></i>
                  Productos
                </h5>
              </div>
              <div className="d-flex align-items-center">
                <ButtonGroup className="me-2 d-none d-md-flex">
                  <Button
                    variant={vistaProductos === 'tabla' ? 'primary' : 'outline-primary'}
                    onClick={() => setVistaProductos('tabla')}
                    style={vistaProductos === 'tabla' ? { backgroundColor: '#8c5cf2', borderColor: '#7647eb' } : {}}
                  >
                    <i className="fas fa-table"></i>
                  </Button>
                  <Button
                    variant={vistaProductos === 'tarjetas' ? 'primary' : 'outline-primary'}
                    onClick={() => setVistaProductos('tarjetas')}
                    style={vistaProductos === 'tarjetas' ? { backgroundColor: '#8c5cf2', borderColor: '#7647eb' } : {}}
                  >
                    <i className="fas fa-th-large"></i>
                  </Button>
                </ButtonGroup>
                {productosSeleccionados.length > 0 && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setProductosSeleccionados([])}
                  >
                    <i className="fas fa-trash-alt me-1"></i>
                    <span className="d-none d-md-inline">Limpiar</span>
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {error && (
                <Alert variant="danger" className="m-3" dismissible onClose={() => setError(null)}>
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                </Alert>
              )}

              <div className="p-3 border-bottom">
                <Form.Control
                  type="text"
                  placeholder="Buscar productos por nombre o código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="border-0 bg-light py-2"
                />
              </div>

              <div className="position-relative">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" style={{ color: '#8c5cf2' }} />
                    <p className="mt-3">Cargando productos...</p>
                  </div>
                ) : (
                  <div className="p-3">
                    {/* Vista de escritorio */}
                    <div className="d-none d-md-block">
                      {vistaProductos === 'tabla' ? (
                        <Table hover responsive className="align-middle mb-0 border">
                          <thead className="bg-light">
                            <tr>
                              <th width="40" className="sticky-col">
                                <Form.Check
                                  type="checkbox"
                                  onChange={(e) => handleSeleccionarTodos(e.target.checked)}
                                  checked={productosFiltrados.length > 0 &&
                                    productosFiltrados.every(p =>
                                      productosSeleccionados.some(ps => ps.id === p.id))}
                                />
                              </th>
                              <th className="sticky-col">Producto</th>
                              <th width="120">Código</th>
                              <th width="100" className="text-end">Precio</th>
                              <th width="150" className="text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productosFiltrados.map(producto => {
                              const seleccionado = productosSeleccionados.find(p => p.id === producto.id);
                              return (
                                <tr key={producto.id}>
                                  <td className="sticky-col">
                                    <Form.Check
                                      type="checkbox"
                                      checked={!!seleccionado}
                                      onChange={(e) => handleSeleccionMultiple(producto, e.target.checked)}
                                    />
                                  </td>
                                  <td className="sticky-col">
                                    <div className="fw-bold">{producto.nombre}</div>
                                    {producto.descripcion && (
                                      <small className="text-muted d-block">{producto.descripcion}</small>
                                    )}
                                  </td>
                                  <td><small className="text-muted">{producto.codigo || '-'}</small></td>
                                  <td className="text-end fw-bold">${producto.precio?.toFixed(2) || '0.00'}</td>
                                  <td>
                                    {seleccionado ? (
                                      <div className="d-flex align-items-center justify-content-center">
                                        <Button
                                          variant="outline-secondary"
                                          size="sm"
                                          onClick={() => handleCambiarCantidad(producto.id, Math.max(1, seleccionado.cantidad - 1))}
                                        >
                                          <i className="fas fa-minus"></i>
                                        </Button>
                                        <div className="mx-2 text-center" style={{ width: '30px' }}>
                                          {seleccionado.cantidad}
                                        </div>
                                        <Button
                                          variant="outline-secondary"
                                          size="sm"
                                          onClick={() => handleCambiarCantidad(producto.id, seleccionado.cantidad + 1)}
                                        >
                                          <i className="fas fa-plus"></i>
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="w-100"
                                        onClick={() => handleSeleccionProducto(producto)}
                                        style={{ borderColor: '#8c5cf2', color: '#8c5cf2' }}
                                      >
                                        <i className="fas fa-plus me-1"></i>
                                        Agregar
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {productosFiltrados.length === 0 && (
                              <tr>
                                <td colSpan="5" className="text-center py-4">
                                  <i className="fas fa-search fa-2x mb-3 text-muted"></i>
                                  <p className="text-muted mb-0">No se encontraron productos</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      ) : (
                        <div className="row row-cols-1 row-cols-md-3 g-3">
                          {productosFiltrados.map(producto => {
                            const seleccionado = productosSeleccionados.find(p => p.id === producto.id);
                            return (
                              <div key={producto.id} className="col">
                                <div className={`card h-100 ${seleccionado ? 'border-primary' : ''}`}>
                                  <div className="card-body">
                                    <h6 className="card-title mb-1">{producto.nombre}</h6>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <span className="badge bg-light text-dark">{producto.codigo || 'Sin código'}</span>
                                      <span className="fw-bold text-primary">${producto.precio?.toFixed(2) || '0.00'}</span>
                                    </div>

                                    {seleccionado ? (
                                      <div className="d-flex justify-content-between align-items-center">
                                        <div className="btn-group" style={{ width: '120px' }}>
                                          <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => handleCambiarCantidad(producto.id, Math.max(1, seleccionado.cantidad - 1))}
                                          >
                                            <i className="fas fa-minus"></i>
                                          </Button>
                                          <div className="btn btn-outline-secondary disabled">
                                            {seleccionado.cantidad}
                                          </div>
                                          <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => handleCambiarCantidad(producto.id, seleccionado.cantidad + 1)}
                                          >
                                            <i className="fas fa-plus"></i>
                                          </Button>
                                        </div>
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() => handleEliminarProducto(producto.id)}
                                        >
                                          <i className="fas fa-trash-alt"></i>
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="w-100"
                                        onClick={() => handleSeleccionProducto(producto)}
                                        style={{ borderColor: '#8c5cf2', color: '#8c5cf2' }}
                                      >
                                        <i className="fas fa-plus me-1"></i>
                                        Agregar
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {productosFiltrados.length === 0 && (
                            <div className="col-12 text-center py-5">
                              <i className="fas fa-search fa-2x mb-3 text-muted"></i>
                              <h5 className="text-muted">No se encontraron productos</h5>
                              <p className="text-muted">Intenta con otra búsqueda</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Vista móvil optimizada */}
                    <MobileProductosList />
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Row className="g-3">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white py-3">
                  <h5 className="mb-0">
                    <i className="fas fa-tags me-2" style={{ color: '#8c5cf2' }}></i>
                    Etiquetas Seleccionadas
                    {productosSeleccionados.length > 0 && (
                      <span className="badge rounded-pill bg-primary ms-2" style={{ backgroundColor: '#8c5cf2!important' }}>
                        {totalEtiquetas}
                      </span>
                    )}
                  </h5>
                </Card.Header>
                <Card.Body>
                  {productosSeleccionados.length > 0 ? (
                    <div className="table-responsive">
                      <Table className="table-sm mb-0">
                        <thead>
                          <tr>
                            <th className="sticky-col">Producto</th>
                            <th width="60" className="text-center">Cant.</th>
                            <th width="40"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {productosSeleccionados.map(producto => (
                            <tr key={producto.id}>
                              <td className="align-middle sticky-col">
                                <div className="text-truncate" style={{ maxWidth: '180px' }}>{producto.nombre}</div>
                                <small className="text-muted">${producto.precio?.toFixed(2)}</small>
                              </td>
                              <td className="text-center align-middle">
                                <Form.Control
                                  type="number"
                                  min="1"
                                  value={producto.cantidad}
                                  onChange={(e) => handleCambiarCantidad(producto.id, e.target.value)}
                                  size="sm"
                                />
                              </td>
                              <td className="align-middle">
                                <Button
                                  variant="link"
                                  className="text-danger p-0"
                                  onClick={() => handleEliminarProducto(producto.id)}
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="fas fa-tags fa-2x mb-3 text-muted"></i>
                      <p className="text-muted mb-0">No hay etiquetas seleccionadas</p>
                      <small className="text-muted">Selecciona productos para generar etiquetas</small>
                    </div>
                  )}

                  {productosSeleccionados.length > 0 && (
                    <div className="mt-3 d-grid d-md-block">
                      <Button
                        variant="primary"
                        style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                        onClick={() => setModalVistaPrevia(true)}
                        className="d-flex align-items-center justify-content-center d-md-inline-flex"
                      >
                        <i className="fas fa-eye me-2"></i>
                        Vista Previa ({totalEtiquetas})
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={12} className="d-none d-md-block">
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white py-3">
                  <h5 className="mb-0">
                    <i className="fas fa-cog me-2" style={{ color: '#8c5cf2' }}></i>
                    Configuración
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Formato de impresión</Form.Label>
                    <div className="d-flex flex-wrap">
                      {['1x1', '2x2', '3x3', '4x4'].map(formato => (
                        <div key={formato} className="me-2 mb-2">
                          <input
                            type="radio"
                            className="btn-check"
                            name="formato"
                            id={`formato-${formato}`}
                            value={formato}
                            checked={formatoImpresion === formato}
                            onChange={(e) => setFormatoImpresion(e.target.value)}
                          />
                          <label
                            className="btn btn-sm btn-outline-primary"
                            htmlFor={`formato-${formato}`}
                            style={{ minWidth: '60px' }}
                          >
                            {formato}
                          </label>
                        </div>
                      ))}
                    </div>
                    <Form.Text className="text-muted">
                      Etiquetas por fila y columna
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Tamaño de etiquetas</Form.Label>
                    <div className="d-flex">
                      {[
                        { id: 'pequeno', label: 'Pequeño' },
                        { id: 'mediano', label: 'Mediano' },
                        { id: 'grande', label: 'Grande' }
                      ].map(tam => (
                        <div key={tam.id} className="me-2">
                          <input
                            type="radio"
                            className="btn-check"
                            name="tamanio"
                            id={`tamanio-${tam.id}`}
                            checked={tamanioEtiqueta === tam.id}
                            onChange={() => setTamanioEtiqueta(tam.id)}
                          />
                          <label
                            className="btn btn-sm btn-outline-primary"
                            htmlFor={`tamanio-${tam.id}`}
                          >
                            {tam.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Información a mostrar</Form.Label>
                    <div className="d-flex flex-wrap">
                      <Form.Check
                        type="checkbox"
                        id="mostrar-precio"
                        label="Precio"
                        checked={mostrarPrecio}
                        onChange={(e) => setMostrarPrecio(e.target.checked)}
                        className="me-3 mb-2"
                      />

                      <Form.Check
                        type="checkbox"
                        id="mostrar-codigo"
                        label="Código"
                        checked={mostrarCodigo}
                        onChange={(e) => setMostrarCodigo(e.target.checked)}
                        className="me-3 mb-2"
                      />

                      <Form.Check
                        type="checkbox"
                        id="mostrar-descripcion"
                        label="Descripción"
                        checked={mostrarDescripcion}
                        onChange={(e) => setMostrarDescripcion(e.target.checked)}
                        className="mb-2"
                      />
                    </div>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Estilo</Form.Label>
                    <div>
                      <Form.Check
                        type="checkbox"
                        id="mostrar-borde"
                        label="Mostrar borde"
                        checked={borde}
                        onChange={(e) => setBorde(e.target.checked)}
                      />
                    </div>
                  </Form.Group>

                  <div className="mt-4">
                    <div className="card border">
                      <div className="card-header bg-light py-2">
                        <small className="fw-bold">Vista previa de estilo</small>
                      </div>
                      <div className="card-body p-0">
                        <div className={`card m-2 ${borde ? 'border' : 'border-0 shadow-sm'}`}>
                          <div
                            className="card-body p-2 text-center"
                            style={getTamanioEstilo()}
                          >
                            <h5 className="card-title mb-1" style={{ fontSize: getTamanioEstilo().fontSize }}>
                              Ejemplo
                            </h5>

                            {mostrarDescripcion && (
                              <p className="card-text mb-1">
                                <small>Descripción corta</small>
                              </p>
                            )}

                            {mostrarPrecio && (
                              <p className="card-text mb-1">
                                <strong className="fs-4">$99.99</strong>
                              </p>
                            )}

                            {mostrarCodigo && (
                              <p className="card-text mb-0">
                                <small className="text-muted">PROD12345</small>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Panel de configuración móvil colapsable */}
            <Col xs={12} className="d-md-none">
              <div className="mobile-card bg-white">
                <div
                  className="d-flex justify-content-between align-items-center py-2"
                  onClick={() => setMobileConfigOpen(!mobileConfigOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  <h5 className="mb-0">
                    <i className="fas fa-cog me-2" style={{ color: '#8c5cf2' }}></i>
                    Configuración
                  </h5>
                  <i className={`fas fa-chevron-${mobileConfigOpen ? 'up' : 'down'}`}></i>
                </div>

                {mobileConfigOpen && (
                  <div className="pt-3">
                    <Form.Group className="mb-3">
                      <Form.Label>Formato de impresión</Form.Label>
                      <div className="d-flex flex-wrap">
                        {['1x1', '2x2', '3x3', '4x4'].map(formato => (
                          <div key={formato} className="me-2 mb-2">
                            <input
                              type="radio"
                              className="btn-check"
                              name="formato"
                              id={`formato-${formato}-mobile`}
                              value={formato}
                              checked={formatoImpresion === formato}
                              onChange={(e) => setFormatoImpresion(e.target.value)}
                            />
                            <label
                              className="btn btn-sm btn-outline-primary"
                              htmlFor={`formato-${formato}-mobile`}
                              style={{ minWidth: '50px' }}
                            >
                              {formato}
                            </label>
                          </div>
                        ))}
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Tamaño</Form.Label>
                      <div className="d-flex">
                        {[
                          { id: 'pequeno', label: 'S' },
                          { id: 'mediano', label: 'M' },
                          { id: 'grande', label: 'L' }
                        ].map(tam => (
                          <div key={tam.id} className="me-2">
                            <input
                              type="radio"
                              className="btn-check"
                              name="tamanio-mobile"
                              id={`tamanio-${tam.id}-mobile`}
                              checked={tamanioEtiqueta === tam.id}
                              onChange={() => setTamanioEtiqueta(tam.id)}
                            />
                            <label
                              className="btn btn-sm btn-outline-primary"
                              htmlFor={`tamanio-${tam.id}-mobile`}
                            >
                              {tam.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </Form.Group>

                    <div className="d-flex flex-wrap mb-3">
                      <Form.Check
                        type="checkbox"
                        id="mostrar-precio-mobile"
                        label="Precio"
                        checked={mostrarPrecio}
                        onChange={(e) => setMostrarPrecio(e.target.checked)}
                        className="me-3 mb-2"
                      />

                      <Form.Check
                        type="checkbox"
                        id="mostrar-codigo-mobile"
                        label="Código"
                        checked={mostrarCodigo}
                        onChange={(e) => setMostrarCodigo(e.target.checked)}
                        className="me-3 mb-2"
                      />

                      <Form.Check
                        type="checkbox"
                        id="mostrar-descripcion-mobile"
                        label="Descripción"
                        checked={mostrarDescripcion}
                        onChange={(e) => setMostrarDescripcion(e.target.checked)}
                        className="me-3 mb-2"
                      />

                      <Form.Check
                        type="checkbox"
                        id="mostrar-borde-mobile"
                        label="Borde"
                        checked={borde}
                        onChange={(e) => setBorde(e.target.checked)}
                        className="mb-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Barra de acciones flotante para móvil */}
      {productosSeleccionados.length > 0 && <MobilePreviewBar />}

      {/* Modal de vista previa */}
      <Modal
        show={modalVistaPrevia}
        onHide={() => setModalVistaPrevia(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-tags me-2" style={{ color: '#8c5cf2' }}></i>
            Vista Previa de Etiquetas
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="bg-light p-2 text-center border-bottom">
            <small>
              <span className="fw-bold">{totalEtiquetas}</span> etiqueta{totalEtiquetas !== 1 ? 's' : ''} •
              Formato <span className="fw-bold">{formatoImpresion}</span> •
              Tamaño <span className="fw-bold">{
                tamanioEtiqueta === 'pequeno' ? 'pequeño' :
                  tamanioEtiqueta === 'mediano' ? 'mediano' : 'grande'
              }</span>
            </small>
          </div>
          <div ref={etiquetasRef} className="p-3">
            <div className={`row row-cols-${formatoImpresion} g-3`}>
              {productosSeleccionados.flatMap(producto =>
                Array(producto.cantidad).fill().map((_, index) => (
                  <div key={`${producto.id}-${index}`} className="col">
                    <div
                      className={`card ${borde ? 'border border-2' : 'border-0 shadow-sm'}`}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        className="card-body p-2 text-center"
                        style={getTamanioEstilo()}
                      >
                        <h5 className="card-title mb-1" style={{ fontSize: getTamanioEstilo().fontSize }}>{producto.nombre}</h5>

                        {mostrarDescripcion && producto.descripcion && (
                          <p className="card-text mb-1">
                            <small>{producto.descripcion}</small>
                          </p>
                        )}

                        {mostrarPrecio && (
                          <p className="card-text mb-1">
                            <strong className="fs-4">${producto.precio?.toFixed(2) || '0.00'}</strong>
                          </p>
                        )}

                        {mostrarCodigo && (
                          <p className="card-text mb-0">
                            <small className="text-muted">{producto.codigo || 'Sin código'}</small>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalVistaPrevia(false)}>
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={handleDownloadPDF}
          >
            <i className="fas fa-download me-2"></i>
            Descargar PDF
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx="true">{`
        /* Estilos específicos para móvil */
        @media (max-width: 767px) {
          .container-fluid {
            padding-bottom: 70px;
          }

          .mobile-card {
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 15px;
          }

          .mobile-title {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 4px;
          }

          .mobile-price {
            font-weight: 700;
            color: #8c5cf2;
            font-size: 18px;
          }

          .mobile-action-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            padding: 15px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
          }
        }
      `}</style>
    </div>
  );
};

export default GeneradorEtiquetas;