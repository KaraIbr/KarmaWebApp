import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { useReactToPrint } from 'react-to-print';

const ComprobanteVenta = ({ venta, compacto = false, onClose }) => {
  const comprobanteRef = React.useRef();
  
  // Función para formatear fecha
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'Fecha no disponible';
    
    try {
      const fecha = new Date(fechaISO);
      return fecha.toLocaleString();
    } catch (err) {
      return fechaISO;
    }
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
  
  // Función para manejar la impresión del comprobante
  const handlePrint = useReactToPrint({
    content: () => comprobanteRef.current,
    documentTitle: `Comprobante-${venta.id}`,
    onAfterPrint: () => console.log('Impresión completada')
  });
  
  if (!venta) {
    return <div>No hay información de venta disponible</div>;
  }
  
  return (
    <div className="comprobante-container">
      {/* Controles para imprimir, solo visibles en pantalla */}
      <div className="d-print-none mb-3">
        <div className="d-flex justify-content-between">
          <Button variant="outline-secondary" onClick={onClose}>
            <i className="fas fa-arrow-left me-2"></i>
            Volver
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            <i className="fas fa-print me-2"></i>
            Imprimir
          </Button>
        </div>
      </div>
      
      {/* Contenido imprimible */}
      <Card className="border shadow-sm" ref={comprobanteRef}>
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <h3 className="mb-1">Karma Joyería</h3>
            <p className="text-muted mb-1">Comprobante de venta</p>
            <h5 className="mb-0">#{venta.id}</h5>
          </div>
          
          <div className="row mb-4">
            <div className="col-6">
              <p className="mb-1"><strong>Fecha:</strong> {formatearFecha(venta.fecha)}</p>
              <p className="mb-0"><strong>Cliente:</strong> {venta.cliente?.nombre || 'Cliente general'}</p>
            </div>
            <div className="col-6 text-end">
              <p className="mb-1"><strong>Vendedor:</strong> {venta.usuario?.nombre || 'No especificado'}</p>
              <p className="mb-0"><strong>Estado:</strong> {venta.estado || 'Pendiente'}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h6 className="border-bottom pb-2">Productos</h6>
            <table className="table table-sm">
              <thead className="table-light">
                <tr>
                  <th>Producto</th>
                  <th className="text-center">Cant.</th>
                  <th className="text-end">Precio</th>
                  <th className="text-end">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {venta.productos?.map((item, index) => (
                  <tr key={index}>
                    <td>
                      {item.nombre || `Producto #${item.producto_id || item.id}`}
                      {!compacto && item.descripcion && (
                        <small className="d-block text-muted">{item.descripcion}</small>
                      )}
                    </td>
                    <td className="text-center">{item.cantidad}</td>
                    <td className="text-end">${(item.precio_unitario || item.precio || 0).toFixed(2)}</td>
                    <td className="text-end">${((item.subtotal || (item.precio * item.cantidad)) || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="3" className="text-end">Subtotal:</th>
                  <th className="text-end">${venta.subtotal?.toFixed(2) || '0.00'}</th>
                </tr>
                {venta.descuento > 0 && (
                  <tr>
                    <th colSpan="3" className="text-end">Descuento:</th>
                    <th className="text-end">${venta.descuento?.toFixed(2) || '0.00'}</th>
                  </tr>
                )}
                <tr>
                  <th colSpan="3" className="text-end">Total:</th>
                  <th className="text-end">${venta.total?.toFixed(2) || '0.00'}</th>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Detalles de pagos */}
          {((venta.pagos && venta.pagos.length > 0) || venta.metodoPago) && (
            <div className="mb-4">
              <h6 className="border-bottom pb-2">Pagos Realizados</h6>
              {venta.pagos && venta.pagos.length > 0 ? (
                <table className="table table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Método</th>
                      <th>Referencia</th>
                      <th className="text-end">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venta.pagos.map((pago, index) => (
                      <tr key={index}>
                        <td>{formatearFecha(pago.fecha)}</td>
                        <td>{obtenerNombreMetodoPago(pago.metodo_pago)}</td>
                        <td>{pago.referencia || '-'}</td>
                        <td className="text-end">${pago.monto?.toFixed(2) || '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colSpan="3" className="text-end">Total Pagado:</th>
                      <th className="text-end">
                        ${venta.pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0).toFixed(2)}
                      </th>
                    </tr>
                    {(venta.estado === 'pendiente' || venta.estado === 'parcial') && (
                      <tr>
                        <th colSpan="3" className="text-end">Saldo Pendiente:</th>
                        <th className="text-end">
                          ${(venta.total - venta.pagos.reduce((sum, pago) => sum + (pago.monto || 0), 0)).toFixed(2)}
                        </th>
                      </tr>
                    )}
                  </tfoot>
                </table>
              ) : (
                // Mostrar información del método de pago cuando no hay pagos explícitos
                <div className="p-3 bg-light rounded">
                  <p className="mb-2"><strong>Método de pago:</strong> {obtenerNombreMetodoPago(venta.metodoPago)}</p>
                  
                  {venta.metodoPago === 'efectivo' && venta.detallesPago && (
                    <div>
                      <p className="mb-1"><strong>Monto recibido:</strong> ${venta.detallesPago.amount}</p>
                      <p className="mb-0"><strong>Cambio:</strong> ${venta.detallesPago.change?.toFixed(2) || '0.00'}</p>
                    </div>
                  )}
                  
                  {venta.metodoPago === 'tarjeta' && venta.detallesPago && (
                    <div>
                      <p className="mb-1"><strong>Referencia:</strong> {venta.detallesPago.reference || 'No disponible'}</p>
                      {venta.detallesPago.cardDigits && (
                        <p className="mb-0"><strong>Tarjeta:</strong> XXXX-XXXX-XXXX-{venta.detallesPago.cardDigits}</p>
                      )}
                    </div>
                  )}
                  
                  {venta.metodoPago === 'transferencia' && venta.detallesPago && (
                    <div>
                      <p className="mb-0"><strong>Referencia:</strong> {venta.detallesPago.reference || 'No disponible'}</p>
                    </div>
                  )}
                  
                  {venta.metodoPago === 'credito' && venta.detallesPago && (
                    <div>
                      <p className="mb-1"><strong>Cliente:</strong> {venta.detallesPago.clientName || 'No especificado'}</p>
                      {venta.detallesPago.clientId && (
                        <p className="mb-1"><strong>ID/Documento:</strong> {venta.detallesPago.clientId}</p>
                      )}
                      <p className="mb-1"><strong>Monto pendiente:</strong> ${venta.detallesPago.dueAmount?.toFixed(2) || venta.total?.toFixed(2) || '0.00'}</p>
                      {venta.detallesPago.note && (
                        <p className="mb-0"><strong>Nota:</strong> {venta.detallesPago.note}</p>
                      )}
                    </div>
                  )}
                  
                  {venta.metodoPago === 'mixto' && venta.detallesPago && venta.detallesPago.mixedPayments && (
                    <div>
                      <p className="mb-2"><strong>Métodos combinados:</strong></p>
                      <ul className="list-unstyled">
                        {venta.detallesPago.mixedPayments.map((payment, idx) => (
                          <li key={idx} className="mb-1">
                            {obtenerNombreMetodoPago(payment.methodId)}: ${parseFloat(payment.amount).toFixed(2)}
                            {payment.reference && <span className="ms-2 text-muted small">Ref: {payment.reference}</span>}
                          </li>
                        ))}
                      </ul>
                      {venta.detallesPago.note && (
                        <p className="mb-0 mt-2"><strong>Nota:</strong> {venta.detallesPago.note}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Términos y condiciones */}
          {!compacto && (
            <div className="mt-4 pt-3 border-top">
              <h6>Términos y condiciones</h6>
              <ul className="small text-muted">
                <li>Las devoluciones deben realizarse dentro de los 7 días posteriores a la compra.</li>
                <li>Debe presentarse el comprobante de venta para cualquier reclamo o devolución.</li>
                <li>Las joyas con piedras naturales pueden tener ligeras variaciones en color y tamaño.</li>
                <li>Garantía de 3 meses por defectos de fabricación.</li>
              </ul>
            </div>
          )}
          
          <div className="text-center mt-4 pt-3 border-top">
            <p className="mb-1">¡Gracias por su compra!</p>
            <p className="small text-muted mb-0">
              {`Karma Joyería - Para consultas: karma@example.com - Tel: (123) 456-7890`}
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ComprobanteVenta;