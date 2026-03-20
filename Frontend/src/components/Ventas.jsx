import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert, Badge, Modal, Form, InputGroup, Row, Col, Pagination, Container } from 'react-bootstrap';
import { API_URL, API_PREFIX } from '../servicios/api.jsx';
import ComprobanteVenta from './ComprobanteVenta';

// Colores y estilos consistentes con Vercel
const THEME = {
  primary: '#8c5cf2', // Color principal morado
  primaryDark: '#7647eb',
  secondary: '#f5f5f7', // Gris claro para fondos secundarios
  text: '#000',
  textSecondary: '#6e6e73',
  border: '#e6e6e6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6'
};

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detalleVenta, setDetalleVenta] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoPago, setMontoPago] = useState('');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [processingPago, setProcessingPago] = useState(false);
  const [ventaActualizada, setVentaActualizada] = useState(null);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    estado: '',
    metodoPago: ''
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    cargarVentas();
  }, [currentPage, filtros]);

  const cargarVentas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir parámetros de consulta
      let queryParams = new URLSearchParams();
      queryParams.append('page', currentPage);
      queryParams.append('limit', itemsPerPage);
      
      if (filtros.fechaInicio) queryParams.append('fecha_inicio', filtros.fechaInicio);
      if (filtros.fechaFin) queryParams.append('fecha_fin', filtros.fechaFin);
      if (filtros.estado) queryParams.append('estado', filtros.estado);
      if (filtros.metodoPago) queryParams.append('metodo_pago', filtros.metodoPago);

      const response = await fetch(`${API_URL}${API_PREFIX}ventas?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Error al cargar las ventas');
      }

      const data = await response.json();
      console.log("Respuesta de la API de ventas:", data);
      
      // Verificar si la respuesta es un array o un objeto con propiedad "ventas"
      let ventasData = [];
      let totalItems = 0;
      
      if (Array.isArray(data)) {
        // Si es un array directo, usarlo como ventas
        ventasData = data;
        totalItems = data.length;
      } else if (data && typeof data === 'object') {
        // Si es un objeto, buscar la propiedad "ventas" o usar el objeto completo
        ventasData = data.ventas || (data.data || []);
        totalItems = data.total || ventasData.length;
      }
      
      console.log("Datos de ventas procesados:", ventasData);
      setVentas(ventasData);
      setTotalPages(Math.ceil(totalItems / itemsPerPage) || 1);
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener las ventas:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const verDetalles = async (ventaId) => {
    try {
      setLoading(true);
      
      // Obtener detalle de la venta
      const ventaResponse = await fetch(`${API_URL}${API_PREFIX}ventas/${ventaId}`);
      
      if (!ventaResponse.ok) {
        throw new Error('Error al cargar el detalle de la venta');
      }
      
      const ventaData = await ventaResponse.json();
      
      // Obtener pagos de la venta
      const pagosResponse = await fetch(`${API_URL}${API_PREFIX}pagos/venta/${ventaId}`);
      
      let pagosData = [];
      if (pagosResponse.ok) {
        const pagosResult = await pagosResponse.json();
        pagosData = pagosResult.pagos || [];
      }
      
      // Combinar datos
      setDetalleVenta({
        ...ventaData,
        pagos: pagosData
      });
      
      setShowDetalleModal(true);
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener el detalle de la venta:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value
    });
    setCurrentPage(1); // Resetear a la primera página al cambiar filtros
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: '',
      estado: '',
      metodoPago: ''
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Función para obtener el nombre del método de pago
  const obtenerNombreMetodoPago = (id) => {
    const metodos = {
      'efectivo': 'Efectivo',
      'tarjeta': 'Tarjeta',
      'transferencia': 'Transferencia',
      'movil': 'Pago móvil',
      'credito': 'Crédito',
      'mixto': 'Pago mixto'
    };

    return metodos[id] || id;
  };

  // Función para formatear una fecha ISO
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible';
    
    try {
      const fecha = new Date(fechaISO);
      // Formato más elegante para la fecha
      return new Intl.DateTimeFormat('es', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(fecha);
    } catch (err) {
      return fechaISO;
    }
  };

  // Función para determinar el color del badge según el estado
  const colorEstado = (estado) => {
    switch (estado) {
      case 'pagado': return THEME.success;
      case 'pendiente': return THEME.warning;
      case 'cancelado': return THEME.danger;
      case 'parcial': return THEME.info;
      default: return THEME.textSecondary;
    }
  };

  // Abre el modal para registrar un nuevo pago a una venta pendiente
  const abrirModalPago = () => {
    // Calcular el saldo pendiente
    const totalPagado = detalleVenta.pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0);
    const saldoPendiente = detalleVenta.total - totalPagado;
    
    // Establecer por defecto el monto pendiente total
    setMontoPago(saldoPendiente.toFixed(2));
    setMetodoPago('efectivo');
    setReferenciaPago('');
    setShowPagoModal(true);
  };

  // Registra un nuevo pago para una venta
  const registrarPago = async () => {
    if (!montoPago || parseFloat(montoPago) <= 0) {
      setError('Por favor ingrese un monto válido');
      return;
    }

    try {
      setProcessingPago(true);
      setError(null);

      // Validar que el monto no exceda el saldo pendiente
      const totalPagado = detalleVenta.pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0);
      const saldoPendiente = detalleVenta.total - totalPagado;
      
      if (parseFloat(montoPago) > saldoPendiente) {
        setError(`El monto excede el saldo pendiente de $${saldoPendiente.toFixed(2)}`);
        setProcessingPago(false);
        return;
      }

      // Preparar datos del pago
      const pagoData = {
        venta_id: detalleVenta.id,
        metodo_pago: metodoPago,
        monto: parseFloat(montoPago),
        fecha: new Date().toISOString(),
        referencia: referenciaPago || `Pago adicional - ${obtenerNombreMetodoPago(metodoPago)}`
      };

      // Registrar el pago
      const response = await fetch(`${API_URL}${API_PREFIX}pagos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pagoData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Error al registrar el pago';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch (e) {
          if (errorText) errorMessage = errorText;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Pago registrado correctamente:", result);

      // Obtener la venta actualizada
      await verDetalles(detalleVenta.id);
      
      // Mostrar mensaje de éxito temporal
      setError(null);
      
      // Cerrar modal de pago
      setShowPagoModal(false);
      
      // Obtener la venta completa para el comprobante
      const ventaActualizadaResponse = await fetch(`${API_URL}${API_PREFIX}ventas/${detalleVenta.id}`);
      if (ventaActualizadaResponse.ok) {
        const ventaData = await ventaActualizadaResponse.json();
        
        // Obtener pagos actualizados
        const pagosActualizadosResponse = await fetch(`${API_URL}${API_PREFIX}pagos/venta/${detalleVenta.id}`);
        let pagosActualizados = [];
        if (pagosActualizadosResponse.ok) {
          const pagosResult = await pagosActualizadosResponse.json();
          pagosActualizados = pagosResult.pagos || [];
        }
        
        // Actualizar la venta con los pagos
        setVentaActualizada({
          ...ventaData,
          pagos: pagosActualizados
        });
        
        // Abrir modal de comprobante
        setShowComprobanteModal(true);
      }
      
      // Actualizar la lista de ventas
      cargarVentas();
      
    } catch (err) {
      console.error('Error al registrar el pago:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setProcessingPago(false);
    }
  };

  // Función para imprimir el comprobante de la venta actual
  const imprimirComprobante = () => {
    setShowComprobanteModal(true);
    setVentaActualizada(detalleVenta);
  };

  // Estilo para los botones de acción
  const actionButtonStyle = {
    borderRadius: '8px',
    padding: '0.5rem',
    minWidth: '40px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    boxShadow: 'none',
    border: 'none'
  };

  // Sistema de paginación optimizado para móvil en Ventas
  const MobilePagination = () => {
    const totalPages = Math.ceil(ventas.length / itemsPerPage);
    
    if (totalPages <= 1) return null;
    
    return (
      <div className="d-md-none mt-4 mb-4">
        <div className="d-flex justify-content-between align-items-center bg-white rounded p-3 shadow-sm">
          <button 
            className="btn btn-light d-flex align-items-center justify-content-center"
            style={{height: '44px', width: '44px', borderRadius: '22px'}}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div className="text-center">
            <div className="fw-medium">Página {currentPage} de {totalPages}</div>
            <div className="small text-muted">
              {Math.min((currentPage - 1) * itemsPerPage + 1, ventas.length)}-{Math.min(currentPage * itemsPerPage, ventas.length)} de {ventas.length} ventas
            </div>
          </div>
          
          <button 
            className="btn btn-light d-flex align-items-center justify-content-center"
            style={{height: '44px', width: '44px', borderRadius: '22px'}}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    );
  };

  // Vista de tarjetas para móvil con paginación
  const MobileVentasList = () => {
    // Mostrar solo las ventas de la página actual
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = currentPage * itemsPerPage;
    const ventasPaginadas = ventas.slice(startIdx, endIdx);
    
    return (
      <div className="d-md-none">
        {ventasPaginadas.map(venta => (
          <div key={venta.id} className="mobile-card bg-white mb-3">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span className="badge rounded-pill me-2" style={{backgroundColor: '#f5f5f7', color: '#666'}}>
                  #{venta.id}
                </span>
                <span className="small text-muted">{formatearFecha(venta.fecha)}</span>
              </div>
              <Badge 
                bg="light"
                className="rounded-pill px-3 py-2"
                style={{ 
                  color: colorEstado(venta.estado || 'pendiente'),
                  borderColor: colorEstado(venta.estado || 'pendiente'),
                  backgroundColor: `${colorEstado(venta.estado || 'pendiente')}15`
                }}
              >
                <span className="text-capitalize">
                  {venta.estado || 'Pendiente'}
                </span>
              </Badge>
            </div>
            
            <div className="mobile-price d-flex align-items-center mb-2">
              <span className="me-2">${venta.total?.toFixed(2) || '0.00'}</span>
              {venta.metodo_pago && (
                <span className="badge bg-light text-secondary rounded-pill small">
                  {obtenerNombreMetodoPago(venta.metodo_pago)}
                </span>
              )}
            </div>
            
            {venta.cliente?.nombre && (
              <div className="small text-secondary mb-3">
                <i className="fas fa-user me-1"></i> {venta.cliente.nombre}
              </div>
            )}
            
            <div className="d-flex justify-content-between">
              <Button 
                variant="light"
                size="sm"
                className="w-100 me-2"
                style={{
                  backgroundColor: THEME.secondary,
                  color: THEME.primary
                }}
                onClick={() => verDetalles(venta.id)}
              >
                <i className="fas fa-eye me-1"></i> Detalles
              </Button>
              <Button 
                variant="light"
                size="sm"
                className="w-100"
                style={{
                  backgroundColor: THEME.secondary,
                  color: THEME.primary
                }}
                onClick={() => {
                  setDetalleVenta(venta);
                  setVentaActualizada(venta);
                  setShowComprobanteModal(true);
                }}
              >
                <i className="fas fa-print me-1"></i> Imprimir
              </Button>
            </div>
          </div>
        ))}
        
        {ventas.length === 0 && (
          <div className="text-center py-4">
            <i className="fas fa-receipt fa-3x mb-3 text-muted"></i>
            <p className="text-muted">No hay ventas que coincidan con los filtros seleccionados</p>
          </div>
        )}
        
        {/* Paginación para móvil */}
        <MobilePagination />
      </div>
    );
  };

  return (
    <div className="container py-4">
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Header className="bg-white py-3 border-0">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h4 className="mb-0 fw-bold" style={{ color: THEME.text }}>
              <i className="fas fa-file-invoice-dollar me-2" style={{ color: THEME.primary }}></i>
              Historial de Ventas
            </h4>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary"
                className="d-flex align-items-center"
                style={{ borderColor: THEME.primary, color: THEME.primary }}
              >
                <i className="fas fa-download me-2"></i>
                <span className="d-none d-md-inline">Exportar</span>
              </Button>
              <Button 
                variant="primary"
                className="d-flex align-items-center"
                style={{ backgroundColor: THEME.primary, borderColor: THEME.primary }}
              >
                <i className="fas fa-plus me-2"></i>
                <span className="d-none d-md-inline">Nueva Venta</span>
              </Button>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body>
          {error && (
            <Alert variant="danger" className="rounded-3 border-0">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </Alert>
          )}
          
          {/* Filtros versión escritorio */}
          <Card className="mb-4 border-0 shadow-sm rounded-3 d-none d-md-block" style={{ backgroundColor: THEME.secondary }}>
            <Card.Body className="p-3 p-md-4">
              <h5 className="mb-3 fw-bold" style={{ color: THEME.text }}>Filtros</h5>
              <Form>
                <Row className="g-3">
                  <Col md={6} lg={3}>
                    <Form.Group>
                      <Form.Label className="fw-medium">Fecha inicio</Form.Label>
                      <Form.Control
                        type="date"
                        name="fechaInicio"
                        value={filtros.fechaInicio}
                        onChange={handleFiltroChange}
                        className="rounded-3 border"
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6} lg={3}>
                    <Form.Group>
                      <Form.Label className="fw-medium">Fecha fin</Form.Label>
                      <Form.Control
                        type="date"
                        name="fechaFin"
                        value={filtros.fechaFin}
                        onChange={handleFiltroChange}
                        className="rounded-3 border"
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6} lg={3}>
                    <Form.Group>
                      <Form.Label className="fw-medium">Estado</Form.Label>
                      <Form.Select
                        name="estado"
                        value={filtros.estado}
                        onChange={handleFiltroChange}
                        className="rounded-3 border"
                      >
                        <option value="">Todos</option>
                        <option value="pagado">Pagado</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="parcial">Pago parcial</option>
                        <option value="cancelado">Cancelado</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6} lg={3}>
                    <Form.Group>
                      <Form.Label className="fw-medium">Método de pago</Form.Label>
                      <Form.Select
                        name="metodoPago"
                        value={filtros.metodoPago}
                        onChange={handleFiltroChange}
                        className="rounded-3 border"
                      >
                        <option value="">Todos</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="movil">Pago móvil</option>
                        <option value="credito">Crédito</option>
                        <option value="mixto">Pago mixto</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-flex justify-content-end mt-3 gap-2">
                  <Button 
                    variant="light"
                    className="text-secondary fw-medium d-flex align-items-center"
                    onClick={limpiarFiltros}
                  >
                    <i className="fas fa-undo me-2"></i>
                    Limpiar
                  </Button>
                  <Button 
                    variant="primary"
                    onClick={() => cargarVentas()}
                    className="fw-medium d-flex align-items-center"
                    style={{ backgroundColor: THEME.primary, borderColor: THEME.primary }}
                  >
                    <i className="fas fa-search me-2"></i>
                    Filtrar
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
          
          {/* Filtros versión móvil */}
          <div className="d-md-none mb-3">
            <div className="mb-3">
              <Form.Control
                type="date"
                name="fechaInicio"
                value={filtros.fechaInicio}
                onChange={handleFiltroChange}
                className="mb-2"
                placeholder="Fecha inicio"
              />
              <Form.Control
                type="date"
                name="fechaFin"
                value={filtros.fechaFin}
                onChange={handleFiltroChange}
                placeholder="Fecha fin"
              />
            </div>
            
            <div className="mobile-filter-scroll mb-3">
              <div 
                className={`mobile-filter-item ${filtros.estado === '' ? 'active' : ''}`}
                onClick={() => setFiltros({...filtros, estado: ''})}
              >
                Todos
              </div>
              <div 
                className={`mobile-filter-item ${filtros.estado === 'pagado' ? 'active' : ''}`}
                onClick={() => setFiltros({...filtros, estado: 'pagado'})}
              >
                Pagado
              </div>
              <div 
                className={`mobile-filter-item ${filtros.estado === 'pendiente' ? 'active' : ''}`}
                onClick={() => setFiltros({...filtros, estado: 'pendiente'})}
              >
                Pendiente
              </div>
              <div 
                className={`mobile-filter-item ${filtros.estado === 'parcial' ? 'active' : ''}`}
                onClick={() => setFiltros({...filtros, estado: 'parcial'})}
              >
                Parcial
              </div>
              <div 
                className={`mobile-filter-item ${filtros.estado === 'cancelado' ? 'active' : ''}`}
                onClick={() => setFiltros({...filtros, estado: 'cancelado'})}
              >
                Cancelado
              </div>
            </div>

            <div className="d-flex gap-2">
              <Button 
                variant="light"
                className="flex-grow-1"
                onClick={limpiarFiltros}
              >
                <i className="fas fa-undo me-1"></i>
                Limpiar
              </Button>
              <Button 
                variant="primary"
                className="flex-grow-1"
                onClick={() => cargarVentas()}
                style={{ backgroundColor: THEME.primary, borderColor: THEME.primary }}
              >
                <i className="fas fa-search me-1"></i>
                Buscar
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center my-5 py-5">
              <Spinner animation="border" style={{ color: THEME.primary }} />
              <p className="mt-3 text-secondary">Cargando ventas...</p>
            </div>
          ) : ventas.length === 0 ? (
            <div className="p-5 text-center bg-light rounded-3 border-0">
              <i className="fas fa-file-invoice-dollar fa-3x mb-3" style={{ color: THEME.textSecondary }}></i>
              <h5 className="text-secondary">No se encontraron ventas</h5>
              <p className="text-muted">Intenta modificar los filtros de búsqueda</p>
            </div>
          ) : (
            <>
              {/* Tabla de ventas versión escritorio */}
              <div className="table-responsive rounded-3 border overflow-hidden d-none d-md-block">
                <Table hover className="mb-0">
                  <thead style={{ backgroundColor: THEME.secondary }}>
                    <tr>
                      <th className="px-3 py-3 fw-semibold sticky-col">ID</th>
                      <th className="px-3 py-3 fw-semibold">Fecha</th>
                      <th className="px-3 py-3 fw-semibold d-none d-md-table-cell">Cliente</th>
                      <th className="px-3 py-3 fw-semibold text-end">Total</th>
                      <th className="px-3 py-3 fw-semibold d-none d-lg-table-cell">Método</th>
                      <th className="px-3 py-3 fw-semibold">Estado</th>
                      <th className="px-3 py-3 fw-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map(venta => (
                      <tr key={venta.id} className="align-middle">
                        <td className="px-3 py-3 sticky-col">
                          <span className="badge bg-light text-secondary fw-medium rounded-pill">
                            #{venta.id}
                          </span>
                        </td>
                        <td className="px-3 py-3 small">{formatearFecha(venta.fecha)}</td>
                        <td className="px-3 py-3 d-none d-md-table-cell">
                          {venta.cliente?.nombre || 
                            <span className="text-muted small">Cliente general</span>
                          }
                        </td>
                        <td className="px-3 py-3 text-end fw-bold">${venta.total?.toFixed(2) || '0.00'}</td>
                        <td className="px-3 py-3 d-none d-lg-table-cell">
                          {venta.metodo_pago ? (
                            <span className="badge bg-light text-secondary rounded-pill">
                              {obtenerNombreMetodoPago(venta.metodo_pago)}
                            </span>
                          ) : (
                            <span className="text-muted small">No especificado</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <Badge 
                            bg="light"
                            className="rounded-pill px-3 py-2"
                            style={{ 
                              color: colorEstado(venta.estado || 'pendiente'),
                              borderColor: colorEstado(venta.estado || 'pendiente'),
                              backgroundColor: `${colorEstado(venta.estado || 'pendiente')}15`
                            }}
                          >
                            <span className="text-capitalize">
                              {venta.estado || 'Pendiente'}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <Button 
                              variant="light"
                              size="sm"
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ 
                                ...actionButtonStyle,
                                backgroundColor: THEME.secondary,
                                color: THEME.primary,
                                width: '36px',
                                height: '36px'
                              }}
                              onClick={() => verDetalles(venta.id)}
                              title="Ver detalles"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button 
                              variant="light"
                              size="sm"
                              className="rounded-circle d-flex align-items-center justify-content-center d-none d-md-flex"
                              style={{ 
                                ...actionButtonStyle,
                                backgroundColor: THEME.secondary,
                                color: THEME.primary,
                                width: '36px',
                                height: '36px'
                              }}
                              title="Imprimir comprobante"
                            >
                              <i className="fas fa-print"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {/* Vista de ventas para móvil */}
              <MobileVentasList />
              
              {/* Paginación */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
                  <div className="text-secondary small">
                    <span className="d-none d-md-inline">Mostrando </span>{ventas.length} 
                    <span className="d-none d-md-inline"> de {totalPages * itemsPerPage} resultados</span>
                  </div>
                  <nav className="ms-auto">
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link rounded-start" 
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          style={{ color: THEME.text, border: `1px solid ${THEME.border}` }}
                        >
                          <i className="fas fa-chevron-left small"></i>
                        </button>
                      </li>
                      
                      {[...Array(totalPages).keys()].map(page => (
                        <li 
                          key={page + 1} 
                          className={`page-item ${currentPage === page + 1 ? 'active' : ''} d-none d-md-block`}
                        >
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(page + 1)}
                            style={{ 
                              color: currentPage === page + 1 ? '#fff' : THEME.text,
                              backgroundColor: currentPage === page + 1 ? THEME.primary : 'transparent',
                              borderColor: THEME.border
                            }}
                          >
                            {page + 1}
                          </button>
                        </li>
                      ))}
                      
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link rounded-end" 
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          style={{ color: THEME.text, border: `1px solid ${THEME.border}` }}
                        >
                          <i className="fas fa-chevron-right small"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
          
          {/* Botón de acción flotante para móvil */}
          <div className="d-md-none">
            <div 
              className="mobile-fab"
              onClick={() => window.location.href = '/nueva-venta'}
            >
              <i className="fas fa-plus"></i>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      {/* Modal de Detalle de Venta - UI mejorada */}
      <Modal
        show={showDetalleModal}
        onHide={() => setShowDetalleModal(false)}
        size="lg"
        className="modal-venta"
      >
        <Modal.Header closeButton style={{ backgroundColor: THEME.secondary, border: 'none' }}>
          <Modal.Title className="fw-bold">
            Detalle de Venta #<span style={{ color: THEME.primary }}>{detalleVenta?.id}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {detalleVenta && (
            <div>
              <div className="row m-0 p-3">
                <div className="col-md-6 mb-4 mb-md-0">
                  <div className="p-3 rounded-3 h-100" style={{ backgroundColor: THEME.secondary }}>
                    <h6 className="border-bottom pb-2 fw-bold" style={{ color: THEME.primary }}>Información General</h6>
                    <div className="mb-2 d-flex justify-content-between">
                      <span className="text-secondary">Fecha:</span>
                      <span className="fw-medium">{formatearFecha(detalleVenta.fecha)}</span>
                    </div>
                    <div className="mb-2 d-flex justify-content-between">
                      <span className="text-secondary">Cliente:</span>
                      <span className="fw-medium">{detalleVenta.cliente?.nombre || 'Cliente general'}</span>
                    </div>
                    <div className="mb-2 d-flex justify-content-between">
                      <span className="text-secondary">Atendido por:</span>
                      <span className="fw-medium">{detalleVenta.usuario?.nombre || 'No especificado'}</span>
                    </div>
                    <div className="mb-2 d-flex justify-content-between align-items-center">
                      <span className="text-secondary">Estado:</span>
                      <Badge 
                        bg="light"
                        className="rounded-pill px-3 py-2"
                        style={{ 
                          color: colorEstado(detalleVenta.estado || 'pendiente'),
                          backgroundColor: `${colorEstado(detalleVenta.estado || 'pendiente')}15`
                        }}
                      >
                        <span className="text-capitalize">
                          {detalleVenta.estado || 'Pendiente'}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="p-3 rounded-3 h-100" style={{ backgroundColor: THEME.secondary }}>
                    <h6 className="border-bottom pb-2 fw-bold" style={{ color: THEME.primary }}>Totales</h6>
                    <div className="mb-2 d-flex justify-content-between">
                      <span className="text-secondary">Subtotal:</span>
                      <span className="fw-medium">${detalleVenta.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    {detalleVenta.descuento > 0 && (
                      <div className="mb-2 d-flex justify-content-between">
                        <span className="text-secondary">Descuento:</span>
                        <span className="fw-medium text-danger">-${detalleVenta.descuento?.toFixed(2) || '0.00'}</span>
                      </div>
                    )}
                    <div className="mb-2 d-flex justify-content-between">
                      <span className="text-secondary">Total:</span>
                      <span className="fw-bold" style={{ color: THEME.primary, fontSize: '1.1rem' }}>
                        ${detalleVenta.total?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    
                    {/* Saldo pendiente, si aplica */}
                    {detalleVenta.estado === 'pendiente' && (
                      <div className="mb-1 d-flex justify-content-between">
                        <span className="text-secondary">Saldo pendiente:</span>
                        <span className="fw-medium text-warning">
                          ${detalleVenta.saldo_pendiente?.toFixed(2) || detalleVenta.total?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Productos */}
              <div className="px-3 py-1">
                <h6 className="fw-bold" style={{ color: THEME.primary }}>Productos</h6>
              </div>
              <div className="table-responsive mb-4">
                <Table hover size="sm" className="mb-0">
                  <thead style={{ backgroundColor: THEME.secondary }}>
                    <tr>
                      <th className="fw-semibold px-3 py-2">Producto</th>
                      <th className="fw-semibold px-3 py-2 text-center">Cantidad</th>
                      <th className="fw-semibold px-3 py-2 text-end">Precio</th>
                      <th className="fw-semibold px-3 py-2 text-end">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleVenta.productos?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">
                          <div className="d-flex align-items-center">
                            <div className="ms-2">
                              <div className="fw-medium">{item.nombre || `Producto #${item.producto_id}`}</div>
                              {item.codigo && <div className="small text-muted">SKU: {item.codigo}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center fw-medium">{item.cantidad}</td>
                        <td className="px-3 py-2 text-end">${item.precio_unitario?.toFixed(2) || '0.00'}</td>
                        <td className="px-3 py-2 text-end fw-bold">${item.subtotal?.toFixed(2) || '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ backgroundColor: THEME.secondary }}>
                    <tr>
                      <td colSpan="3" className="text-end fw-bold px-3 py-2">Total:</td>
                      <td className="text-end fw-bold px-3 py-2" style={{ color: THEME.primary }}>
                        ${detalleVenta.total?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
              
              {/* Pagos */}
              <div className="px-3 py-1">
                <h6 className="fw-bold" style={{ color: THEME.primary }}>Pagos Realizados</h6>
              </div>
              {detalleVenta.pagos?.length > 0 ? (
                <div className="table-responsive mb-4">
                  <Table hover size="sm" className="mb-0">
                    <thead style={{ backgroundColor: THEME.secondary }}>
                      <tr>
                        <th className="fw-semibold px-3 py-2">Fecha</th>
                        <th className="fw-semibold px-3 py-2">Método</th>
                        <th className="fw-semibold px-3 py-2">Referencia</th>
                        <th className="fw-semibold px-3 py-2 text-end">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleVenta.pagos.map((pago, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">{formatearFecha(pago.fecha)}</td>
                          <td className="px-3 py-2">
                            <span className="badge rounded-pill bg-light text-secondary">
                              {obtenerNombreMetodoPago(pago.metodo_pago)}
                            </span>
                          </td>
                          <td className="px-3 py-2 small">{pago.referencia || '-'}</td>
                          <td className="px-3 py-2 text-end fw-bold">${pago.monto?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot style={{ backgroundColor: THEME.secondary }}>
                      <tr>
                        <th colSpan="3" className="text-end fw-bold px-3 py-2">Total Pagado:</th>
                        <th className="text-end fw-bold px-3 py-2" style={{ color: THEME.success }}>
                          ${detalleVenta.pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0).toFixed(2)}
                        </th>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              ) : (
                <Alert variant="warning" className="m-3 rounded-3">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-exclamation-triangle me-3 fs-4" style={{ color: THEME.warning }}></i>
                    <div>No se han registrado pagos para esta venta.</div>
                  </div>
                </Alert>
              )}
              
              {/* Acciones adicionales según el estado */}
              {(detalleVenta.estado === 'pendiente' || detalleVenta.estado === 'parcial') && (
                <div className="m-3 p-3 rounded-3" style={{ backgroundColor: THEME.secondary }}>
                  <h6 className="mb-3 fw-bold" style={{ color: THEME.primary }}>Acciones</h6>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button 
                      variant="success" 
                      className="d-flex align-items-center fw-medium"
                      onClick={abrirModalPago}
                    >
                      <i className="fas fa-dollar-sign me-2"></i>
                      Registrar Pago
                    </Button>
                    
                    <Button 
                      variant="danger" 
                      className="d-flex align-items-center fw-medium"
                    >
                      <i className="fas fa-times-circle me-2"></i>
                      Cancelar Venta
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button 
            variant="light" 
            onClick={() => setShowDetalleModal(false)}
            className="fw-medium d-flex align-items-center"
          >
            <i className="fas fa-times me-2"></i>
            Cerrar
          </Button>
          <Button 
            variant="primary" 
            onClick={imprimirComprobante}
            className="fw-medium d-flex align-items-center"
            style={{ backgroundColor: THEME.primary, borderColor: THEME.primary }}
          >
            <i className="fas fa-print me-2"></i>
            Imprimir
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal para registrar pagos adicionales */}
      <Modal
        show={showPagoModal}
        onHide={() => setShowPagoModal(false)}
        backdrop="static"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Registrar Pago</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Método de pago</Form.Label>
              <Form.Select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="movil">Pago móvil</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Monto</Form.Label>
              <InputGroup>
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control
                  type="number"
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                  step="0.01"
                  min="0.01"
                />
              </InputGroup>
              {detalleVenta && (
                <Form.Text className="text-muted">
                  Saldo pendiente: ${(detalleVenta.total - detalleVenta.pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0)).toFixed(2)}
                </Form.Text>
              )}
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Referencia (opcional)</Form.Label>
              <Form.Control
                type="text"
                value={referenciaPago}
                onChange={(e) => setReferenciaPago(e.target.value)}
                placeholder="Número de transacción, últimos 4 dígitos, etc."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPagoModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={registrarPago}
            disabled={processingPago}
          >
            {processingPago ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Procesando...
              </>
            ) : (
              <>Registrar Pago</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal para el comprobante de venta */}
      <Modal
        show={showComprobanteModal}
        onHide={() => setShowComprobanteModal(false)}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Comprobante de Venta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {ventaActualizada && (
            <ComprobanteVenta 
              venta={ventaActualizada} 
              onClose={() => setShowComprobanteModal(false)} 
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

// Agregar estilos específicos para dispositivos móviles
const style = document.createElement('style');
style.innerHTML = `
  @media (max-width: 768px) {
    .table th, .table td {
      padding: 0.75rem 0.5rem;
    }
    
    .modal-venta .modal-dialog {
      margin: 0;
      max-width: 100%;
      height: 100%;
    }
    
    .modal-venta .modal-content {
      border-radius: 0;
      min-height: 100%;
    }
  }
  
  .rounded-pill {
    border-radius: 50rem !important;
  }
  
  .rounded-3 {
    border-radius: 0.5rem !important;
  }
  
  .modal-venta .modal-header .btn-close:focus {
    box-shadow: none;
    outline: none;
  }
  
  .pagination .page-link:focus {
    box-shadow: none;
  }
  
  .mobile-card {
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .mobile-filter-scroll {
    display: flex;
    overflow-x: auto;
    gap: 0.5rem;
  }
  
  .mobile-filter-item {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    background-color: #f5f5f7;
    color: #6e6e73;
    cursor: pointer;
    white-space: nowrap;
  }
  
  .mobile-filter-item.active {
    background-color: #8c5cf2;
    color: #fff;
  }
  
  .mobile-fab {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: #8c5cf2;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    cursor: pointer;
  }
  
  .mobile-fab:hover {
    background-color: #7647eb;
  }
`;
document.head.appendChild(style);

export default Ventas;
