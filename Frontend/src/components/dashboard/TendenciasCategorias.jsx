import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, Spinner } from 'react-bootstrap';

// Datos de ejemplo - en producción estos vendrían de una API
const datosEjemplo = [
  { month: 'Ene', Pulseras: 4000, Collares: 2400, Anillos: 2400, Aretes: 1200 },
  { month: 'Feb', Pulseras: 3000, Collares: 1398, Anillos: 2210, Aretes: 1500 },
  { month: 'Mar', Pulseras: 2000, Collares: 9800, Anillos: 2290, Aretes: 1700 },
  { month: 'Abr', Pulseras: 2780, Collares: 3908, Anillos: 2000, Aretes: 1890 },
  { month: 'May', Pulseras: 1890, Collares: 4800, Anillos: 2181, Aretes: 2390 },
  { month: 'Jun', Pulseras: 2390, Collares: 3800, Anillos: 2500, Aretes: 2100 },
  { month: 'Jul', Pulseras: 3490, Collares: 4300, Anillos: 2100, Aretes: 1800 },
];

// Colores para cada categoría
const COLORS = {
  Pulseras: '#8c5cf2',
  Collares: '#ff7eb6',
  Anillos: '#7afcff',
  Aretes: '#feff9c'
};

const TendenciasCategorias = ({ datos = datosEjemplo, loading = false }) => {
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
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ 
              margin: '5px 0 0', 
              color: entry.color 
            }}>
              {`${entry.name}: $${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Obtener las categorías dinámicamente (excluyendo la propiedad 'month')
  const categorias = datos.length > 0 
    ? Object.keys(datos[0]).filter(key => key !== 'month') 
    : [];

  return (
    <Card className="h-100 shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h5 className="text-center mb-0">Tendencias por Categoría</h5>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" style={{ color: '#8c5cf2' }} />
            <p className="mt-3">Cargando datos...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={datos}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {categorias.map((categoria, index) => (
                <Line
                  key={`line-${index}`}
                  type="monotone"
                  dataKey={categoria}
                  stroke={COLORS[categoria] || `#${Math.floor(Math.random()*16777215).toString(16)}`}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card>
  );
};

export default TendenciasCategorias;