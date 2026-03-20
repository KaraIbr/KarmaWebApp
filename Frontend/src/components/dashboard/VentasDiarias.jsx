import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, Spinner } from 'react-bootstrap';

// Datos de ejemplo - en producción estos vendrían de una API
const datosEjemplo = [
  { name: 'Lunes', ventas: 2400 },
  { name: 'Martes', ventas: 1398 },
  { name: 'Miércoles', ventas: 9800 },
  { name: 'Jueves', ventas: 3908 },
  { name: 'Viernes', ventas: 4800 },
  { name: 'Sábado', ventas: 3800 },
  { name: 'Domingo', ventas: 4300 },
];

// Colores para las barras
const COLORS = ['#8c5cf2', '#ff7eb6', '#7afcff', '#feff9c', '#ff5c8d', '#a988df', '#64aeff'];

const VentasDiarias = ({ datos = datosEjemplo, loading = false }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="custom-tooltip" 
          style={{ 
            backgroundColor: '#fff', 
            padding: '10px', 
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
          }}
        >
          <p className="label" style={{ margin: '0', fontWeight: 'bold' }}>{`${label}`}</p>
          <p className="value" style={{ margin: '5px 0 0', color: '#8c5cf2' }}>
            {`Ventas: $${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-100 shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h5 className="text-center mb-0">Ventas Diarias</h5>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" style={{ color: '#8c5cf2' }} />
            <p className="mt-3">Cargando datos...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={datos}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="ventas" 
                fill="#8c5cf2" 
                animationBegin={0}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {datos.map((entry, index) => (
                  <Bar key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card>
  );
};

export default VentasDiarias;