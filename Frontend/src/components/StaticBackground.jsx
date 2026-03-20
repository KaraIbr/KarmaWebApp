import React from 'react';

/**
 * StaticBackground - Un fondo gradiente basado únicamente en CSS
 * que reemplaza el componente AnimatedBackground basado en canvas
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.primaryColor - Color primario (hexadecimal)
 * @param {string} props.secondaryColor - Color secundario (hexadecimal)
 * @param {string} props.accentColor - Color de acento (hexadecimal)
 */
const StaticBackground = ({
  primaryColor = '#ff85e4',   // Rosa Karma
  secondaryColor = '#c878b8', // Tono complementario
  accentColor = '#80b3c7',    // Azul complementario
}) => {
  // Variables CSS para el gradiente
  const style = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
    background: `radial-gradient(circle at 30% 30%, ${primaryColor}10, transparent 60%), 
                radial-gradient(circle at 70% 60%, ${secondaryColor}10, transparent 60%),
                radial-gradient(circle at 50% 50%, ${accentColor}08, transparent 70%),
                linear-gradient(135deg, #f5f7fa 0%, #f1f4f8 100%)`,
  };

  return <div style={style} />;
};

export default StaticBackground;