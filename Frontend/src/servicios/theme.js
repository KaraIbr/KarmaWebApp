/**
 * Paleta de colores corporativa para KarmaWebApp
 * 
 * Este archivo centraliza los colores y temas utilizados en toda la aplicación,
 * facilitando cambios globales y asegurando consistencia visual.
 */

// Paleta de colores principal
export const COLORS = {
  // Colores base de la nueva paleta
  lavenderStart: '#F8A4D8',  // Inicio del gradiente Lavender
  lavenderEnd: '#6C63FF',    // Fin del gradiente Lavender
  cornflowerBlue: '#6C63FF', // Para botones primarios, enlaces activos y elementos interactivos
  shuttleGray: '#5A6170',    // Para texto principal, íconos y elementos secundarios
  gullGray: '#9DA6B8',       // Para bordes, texto secundario y fondos ligeros
  alto: '#DADFEA',           // Para separadores, fondos de tarjetas y elementos neutros
  snowWhite: '#FFFFFF',      // Fondo principal y textos claros
  
  // Colores adicionales del sistema (mantenidos para compatibilidad)
  negro: '#000000',
  grisClaro: '#F8F9FA',
  grisMedio: '#CED4DA',
  grisOscuro: '#6C757D',
  
  // Colores antiguos (mantenidos para compatibilidad)
  pastelVioleta: '#C4C3E3',
  violetaOscuro: '#504E76',
  beigeClaro: '#FDF8E2',
  verdeCalmado: '#A3B565',
  naranjaSuave: '#FCDD9D',
  naranjaIntenso: '#F1642E',
  blanco: '#FFFFFF',
};

// Configuración de colores para componentes específicos
export const THEME = {
  // Colores para el navbar
  navbar: {
    background: COLORS.shuttleGray,
    text: COLORS.snowWhite,
    activeLink: COLORS.cornflowerBlue,
    hoverLink: `linear-gradient(to right, ${COLORS.lavenderStart}, ${COLORS.lavenderEnd})`,
  },
  
  // Colores para botones
  buttons: {
    primary: {
      background: COLORS.cornflowerBlue,
      border: COLORS.cornflowerBlue,
      text: COLORS.snowWhite,
      hoverBg: '#5A52E0', // Versión más oscura del cornflower blue
      shadow: '0 2px 4px rgba(108, 99, 255, 0.3)',
    },
    secondary: {
      background: COLORS.gullGray,
      border: COLORS.gullGray,
      text: COLORS.shuttleGray,
      hoverBg: '#8C96A8', // Versión más oscura del gull gray
    },
    success: {
      background: COLORS.cornflowerBlue,
      border: COLORS.cornflowerBlue,
      text: COLORS.snowWhite,
      hoverBg: '#5A52E0', // Versión más oscura del cornflower blue
    },
    outline: {
      background: 'transparent',
      border: COLORS.shuttleGray,
      text: COLORS.shuttleGray,
      hoverBg: COLORS.alto,
    },
  },
  
  // Colores para estados y notificaciones
  states: {
    success: COLORS.cornflowerBlue,
    warning: COLORS.lavenderStart,
    error: COLORS.shuttleGray,
    info: COLORS.gullGray,
  },
  
  // Colores de fondo
  backgrounds: {
    main: COLORS.snowWhite,
    card: COLORS.alto,
    sidebar: COLORS.shuttleGray,
    highlight: `linear-gradient(to right, ${COLORS.lavenderStart}, ${COLORS.lavenderEnd})`,
  },
  
  // Colores para texto
  text: {
    primary: COLORS.shuttleGray,
    secondary: COLORS.gullGray,
    light: COLORS.snowWhite,
    highlight: COLORS.cornflowerBlue,
    link: COLORS.cornflowerBlue,
  },
  
  // Colores para categorías de productos (actualizados)
  categoryColors: {
    'Electrónica': COLORS.cornflowerBlue,
    'Ropa': COLORS.gullGray,
    'Alimentos': COLORS.alto,
    'Hogar': COLORS.shuttleGray,
    'Belleza': COLORS.lavenderStart,
    'Deportes': COLORS.lavenderEnd,
    'Juguetes': '#9DA6B8',
    'Libros': '#DADFEA',
    'default': COLORS.shuttleGray
  },
};

// Función para crear un gradiente Lavender
export const createLavenderGradient = (direction = 'to right') => {
  return `linear-gradient(${direction}, ${COLORS.lavenderStart}, ${COLORS.lavenderEnd})`;
};

// Función para obtener un color con opacidad
export const getColorWithOpacity = (color, opacity) => {
  // Validar que es un color HEX
  if (!color || !color.startsWith('#')) {
    return color;
  }
  
  // Convertir HEX a RGB
  let r, g, b;
  if (color.length === 4) {
    r = parseInt(color[1] + color[1], 16);
    g = parseInt(color[2] + color[2], 16);
    b = parseInt(color[3] + color[3], 16);
  } else if (color.length === 7) {
    r = parseInt(color.substring(1, 3), 16);
    g = parseInt(color.substring(3, 5), 16);
    b = parseInt(color.substring(5, 7), 16);
  } else {
    return color;
  }
  
  // Devolver como rgba
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Función para determinar si el texto debe ser negro o blanco según el color de fondo
export const getContrastColor = (hexColor) => {
  // Si no hay color o no es un formato hexadecimal válido, devolver negro
  if (!hexColor || !hexColor.startsWith('#')) {
    return COLORS.negro;
  }

  // Convertir de formato hex a RGB
  let r = 0, g = 0, b = 0;
  if (hexColor.length === 4) {
    r = parseInt(hexColor[1] + hexColor[1], 16);
    g = parseInt(hexColor[2] + hexColor[2], 16);
    b = parseInt(hexColor[3] + hexColor[3], 16);
  } else if (hexColor.length === 7) {
    r = parseInt(hexColor.substring(1, 3), 16);
    g = parseInt(hexColor.substring(3, 5), 16);
    b = parseInt(hexColor.substring(5, 7), 16);
  }

  // Calcular la luminancia percibida
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Retornar negro o blanco según la luminancia
  return luminance > 0.5 ? COLORS.negro : COLORS.snowWhite;
};

export default THEME;