import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, Spinner } from 'react-bootstrap';

// Datos de ejemplo - en producción estos vendrían de una API
const datosEjemplo = [
  { name: 'Pulsera Cristal', value: 400 },
  { name: 'Collar Plata', value: 300 },
  { name: 'Anillo Oro', value: 250 },
  { name: 'Aretes Perla', value: 200 },
  { name: 'Dije Corazón', value: 100 },
];

// Colores personalizados para cada segmento
const COLORS = ['#8c5cf2', '#ff7eb6', '#7afcff', '#feff9c', '#fff7ad'];

const ProductosMasVendidos = ({ datos = datosEjemplo, loading = false }) => {
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="custom-tooltip" 
          style={{ 
            backgroundColor: '#fff', 
            padding: '5px 10px', 
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
          }}
        >
          <p className="label" style={{ margin: '0', fontWeight: 'bold' }}>{`${payload[0].name}`}</p>
          <p className="value" style={{ margin: '0' }}>{`Ventas: ${payload[0].value}`}</p>
          <p className="percent" style={{ margin: '0' }}>{`(${(payload[0].percent * 100).toFixed(2)}%)`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-100 shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h5 className="text-center mb-0">Productos Más Vendidos</h5>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" style={{ color: '#8c5cf2' }} />
            <p className="mt-3">Cargando datos...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datos}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
              >
                {datos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="left" 
                wrapperStyle={{ paddingLeft: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProductosMasVendidos;