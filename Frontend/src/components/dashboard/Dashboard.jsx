import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import ProductosMasVendidos from './ProductosMasVendidos';
import TendenciasCategorias from './TendenciasCategorias';
import VentasDiarias from './VentasDiarias';
import PromedioTicket from './PromedioTicket';

// En un entorno real, estos datos vendrían de llamadas a API
// Aquí usamos datos de ejemplo para la demostración

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  
  // Simulamos una carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h2 className="mb-0">
                <i className="fas fa-chart-line me-2" style={{ color: '#8c5cf2' }}></i>
                Dashboard
              </h2>
              <p className="text-muted">Resumen de ventas y métricas clave</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="g-4 mb-4">
        <Col lg={6}>
          <ProductosMasVendidos loading={loading} />
        </Col>
        <Col lg={6}>
          <TendenciasCategorias loading={loading} />
        </Col>
      </Row>
      
      <Row className="g-4">
        <Col lg={6}>
          <VentasDiarias loading={loading} />
        </Col>
        <Col lg={6}>
          <PromedioTicket loading={loading} />
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;