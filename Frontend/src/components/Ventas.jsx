import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, Dropdown, Form, Row, Col, Modal } from 'react-bootstrap';
import { format } from 'date-fns';
import {es} from 'date-fns/locale';


const API_URL = 'http://127.0.0.1:5000';

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [periodo, setPeriodo] = useState('todo');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  useEffect(() => {
    fetchVentas();
  }, [filtro, periodo]);

  const fetchVentas = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/ventas`;
      
      // Agregar parámetros de filtro si es necesario
      const params = new URLSearchParams();
      
      if (filtro !== 'todas') {
        params.append('estado', filtro);
      }
      
      if (periodo !== 'todo') {
        const today = new Date();
        let startDate;
        
        switch (periodo) {
          case 'hoy':
            startDate = new Date();
            break;
          case 'semana':
            startDate = new Date(today.setDate(today.getDate() - 7));
            break;
          case 'mes':
            startDate = new Date(today.setMonth(today.getMonth() - 1));
            break;
          default:
            break;
        }
        
        if (startDate) {
          params.append('fecha_inicio', startDate.toISOString().split('T')[0]);
        }
      } else if (fechaInicio && fechaFin) {
        params.append('fecha_inicio', fechaInicio);
        params.append('fecha_fin', fechaFin);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al obtener las ventas');
      }
      
      const data = await response.json();
      setVentas(data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleMostrarDetalle = (venta) => {
    setVentaSeleccionada(venta);
    setShowDetalleModal(true);
  };

  const formatearFecha = (fechaStr) => {
    try {
      // Intentar formatear la fecha si está en formato ISO
      const fecha = new Date(fechaStr);
      return format(fecha, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch (e) {
      // Si hay error, devolver la fecha original
      return fechaStr;
    }
  };

  const calcularTotal = (venta) => {
    return venta.productos.reduce((total, producto) => {
      return total + (producto.precio * producto.cantidad);
    }, 0);
  };

  const filtrarVentas = () => {
    if (!busqueda.trim()) return ventas;
    
    return ventas.filter(venta => 
      venta.id.toString().includes(busqueda) ||
      (venta.cliente && venta.cliente.toLowerCase().includes(busqueda.toLowerCase())) ||
      venta.productos.some(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    );
  };

  const ventasFiltradas = filtrarVentas();

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltro('todas');
    setPeriodo('todo');
    setFechaInicio('');
    setFechaFin('');
  };

  return (
    <div className="container-fluid py-4">
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="fas fa-receipt me-2" style={{ color: '#8c5cf2' }}></i>
              Historial de Ventas
            </h4>
            <div>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="me-2"
                onClick={limpiarFiltros}
              >
                <i className="fas fa-filter-circle-xmark me-1"></i>
                Limpiar filtros
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                onClick={() => fetchVentas()}
              >
                <i className="fas fa-sync-alt me-1"></i>
                Actualizar
              </Button>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </Alert>
          )}
          
          <Row className="g-3 mb-4">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Buscar</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <i className="fas fa-search"></i>
                  </span>
                  <Form.Control 
                    type="text" 
                    placeholder="Buscar por ID, cliente o producto" 
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Select 
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                >
                  <option value="todas">Todas las ventas</option>
                  <option value="completada">Completadas</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="cancelada">Canceladas</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group>
                <Form.Label>Periodo</Form.Label>
                <Form.Select 
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                >
                  <option value="todo">Todo el historial</option>
                  <option value="hoy">Hoy</option>
                  <option value="semana">Últimos 7 días</option>
                  <option value="mes">Último mes</option>
                  <option value="personalizado">Personalizado</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            {periodo === 'personalizado' && (
              <Col md={4}>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Desde</Form.Label>
                      <Form.Control 
                        type="date" 
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Hasta</Form.Label>
                      <Form.Control 
                        type="date" 
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
            )}
          </Row>
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Cargando ventas...</p>
            </div>
          ) : ventasFiltradas.length > 0 ? (
            <Table responsive hover className="align-middle">
              <thead className="bg-light">
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.map((venta) => (
                  <tr key={venta.id}>
                    <td><strong>#{venta.id}</strong></td>
                    <td>{formatearFecha(venta.fecha || new Date().toISOString())}</td>
                    <td>{venta.cliente || 'Cliente general'}</td>
                    <td>
                      <Badge bg="secondary">{venta.productos.length} {venta.productos.length === 1 ? 'producto' : 'productos'}</Badge>
                    </td>
                    <td><strong>${calcularTotal(venta).toFixed(2)}</strong></td>
                    <td>
                      <Badge bg={
                        venta.estado === 'completada' ? 'success' : 
                        venta.estado === 'pendiente' ? 'warning' : 
                        'danger'
                      }>
                        {venta.estado || 'Completada'}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleMostrarDetalle(venta)}
                      >
                        <i className="fas fa-eye me-1"></i>
                        Detalles
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-receipt fa-3x mb-3 text-muted"></i>
              <h5 className="text-muted">No se encontraron ventas</h5>
              <p className="text-muted">Intenta con otros filtros de búsqueda</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal de detalle de venta */}
      <Modal 
        show={showDetalleModal} 
        onHide={() => setShowDetalleModal(false)}
        size="lg"
        centered
      >
        {ventaSeleccionada && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>
                <i className="fas fa-receipt me-2" style={{ color: '#8c5cf2' }}></i>
                Detalle de Venta #{ventaSeleccionada.id}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="text-muted mb-2">Información General</h6>
                  <p className="mb-1"><strong>Fecha:</strong> {formatearFecha(ventaSeleccionada.fecha || new Date().toISOString())}</p>
                  <p className="mb-1"><strong>Cliente:</strong> {ventaSeleccionada.cliente || 'Cliente general'}</p>
                  <p className="mb-1">
                    <strong>Estado:</strong>{' '}
                    <Badge bg={
                      ventaSeleccionada.estado === 'completada' ? 'success' : 
                      ventaSeleccionada.estado === 'pendiente' ? 'warning' : 
                      'danger'
                    }>
                      {ventaSeleccionada.estado || 'Completada'}
                    </Badge>
                  </p>
                </Col>
                <Col md={6} className="text-md-end">
                  <h6 className="text-muted mb-2">Resumen</h6>
                  <h3 className="mb-1" style={{ color: '#6a3eac' }}>
                    ${calcularTotal(ventaSeleccionada).toFixed(2)}
                  </h3>
                  <p className="mb-0 text-muted">
                    {ventaSeleccionada.productos.length} {ventaSeleccionada.productos.length === 1 ? 'producto' : 'productos'}
                  </p>
                </Col>
              </Row>

              <h6 className="border-bottom pb-2 mb-3">Productos</h6>
              <Table responsive className="align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Cantidad</th>
                    <th className="text-end">Precio Unit.</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ventaSeleccionada.productos.map((producto, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          {producto.imagen ? (
                            <img 
                              src={producto.imagen} 
                              alt={producto.nombre} 
                              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                              className="me-2 rounded"
                            />
                          ) : (
                            <div 
                              className="bg-light d-flex align-items-center justify-content-center me-2 rounded" 
                              style={{ width: '40px', height: '40px' }}
                            >
                              <i className="fas fa-box text-muted"></i>
                            </div>
                          )}
                          <div>
                            <div className="fw-bold">{producto.nombre}</div>
                            <small className="text-muted">{producto.codigo || 'Sin código'}</small>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">{producto.cantidad}</td>
                      <td className="text-end">${producto.precio?.toFixed(2)}</td>
                      <td className="text-end font-weight-bold">${(producto.precio * producto.cantidad).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-group-divider">
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Total</strong></td>
                    <td className="text-end"><strong>${calcularTotal(ventaSeleccionada).toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </Table>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowDetalleModal(false)}>
                Cerrar
              </Button>
              <Button 
                variant="primary"
                style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
                onClick={() => {
                  // Aquí iría la lógica para imprimir el ticket
                  alert('Funcionalidad de impresión de ticket en desarrollo');
                }}
              >
                <i className="fas fa-print me-2"></i>
                Imprimir Ticket
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Ventas;
