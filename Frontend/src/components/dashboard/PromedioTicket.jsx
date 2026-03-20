import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, Spinner, Badge } from 'react-bootstrap';

// Datos de ejemplo - en producción estos vendrían de una API
const datosEjemplo = [
  { month: 'Enero', promedio: 1200 },
  { month: 'Febrero', promedio: 1400 },
  { month: 'Marzo', promedio: 1300 },
  { month: 'Abril', promedio: 1500 },
  { month: 'Mayo', promedio: 1700 },
  { month: 'Junio', promedio: 1600 },
  { month: 'Julio', promedio: 1800 },
];

const PromedioTicket = ({ datos = datosEjemplo, loading = false }) => {
  // Calculamos el valor actual (el último del array)
  const valorActual = datos.length > 0 ? datos[datos.length - 1].promedio : 0;

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
            {`Promedio: $${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-100 shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h5 className="text-center mb-0">Promedio de Ticket</h5>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" style={{ color: '#8c5cf2' }} />
            <p className="mt-3">Cargando datos...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-3">
              <h2 style={{ color: '#8c5cf2', margin: 0 }}>${valorActual.toFixed(2)}</h2>
              <p className="text-muted mb-0">Promedio actual</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={datos}
                margin={{
                  top: 10,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={valorActual}
                  stroke="#ff7eb6"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Actual',
                    position: 'right',
                    fill: '#ff7eb6',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="promedio"
                  stroke="#8c5cf2"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#8c5cf2', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#8c5cf2', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default PromedioTicket;