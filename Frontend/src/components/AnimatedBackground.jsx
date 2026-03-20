import React, { useRef, useEffect } from 'react';

/**
 * AnimatedBackground - Crea un fondo suave y elegante con estética moderna
 * @param {Object} props - Propiedades del componente
 * @param {string} props.primaryColor - Color principal (hex)
 * @param {string} props.secondaryColor - Color secundario (hex)
 * @param {string} props.accentColor - Color de acento (hex)
 * @param {number} props.speed - Velocidad de la animación
 * @param {boolean} props.mouseInteraction - Activar interacción con mouse
 * @param {number} props.orbSize - Factor de tamaño para los orbes (1 = normal)
 * @param {number} props.particleSize - Factor de tamaño para las partículas (1 = normal)
 */
const AnimatedBackground = ({
  primaryColor = '#ff85e4',   // Rosa Karma
  secondaryColor = '#c878b8', // Tono complementario
  accentColor = '#80b3c7',    // Azul complementario
  speed = 0.2,                // Velocidad reducida para movimientos más suaves
  mouseInteraction = true,
  orbSize = 1.0,              // Factor multiplicador de tamaño de orbes
  particleSize = 1.0          // Factor multiplicador de tamaño de partículas
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width, height;
    
    // Variables para interacción del mouse
    let mouseX = 0;
    let mouseY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseRadius = 200;
    let mouseStrength = 2.5; // Fuerza reducida para movimientos más suaves
    let isMouseActive = false;
    let mouseSmoothness = 0.08; // Factor de suavizado para movimiento del mouse

    // Redimensionar canvas
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr); // Escalar para retina displays
    };

    // Eventos del mouse - ahora añadidos al document para capturar en toda la página
    const handleMouseMove = (e) => {
      if (!mouseInteraction) return;

      // Calcular la posición relativa al canvas
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;

      // Asegurar que el mouse esté dentro de los límites del canvas
      targetMouseX = Math.max(0, Math.min(width, targetMouseX));
      targetMouseY = Math.max(0, Math.min(height, targetMouseY));

      isMouseActive = true;

      // Reiniciar el temporizador de inactividad
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        isMouseActive = false;
        startVirtualMouseMovement();
      }, 3000); // 3 segundos sin movimiento activa el modo automático
    };

    // Iniciar movimiento virtual del mouse
    const startVirtualMouseMovement = () => {
      if (isMouseActive) return; // No iniciar si hay actividad real del mouse

      const moveVirtualMouse = () => {
        if (isMouseActive) return; // Detener si se detecta actividad real

        const time = Date.now() * 0.0005; // Movimiento más lento
        targetMouseX = width / 2 + Math.sin(time * 0.7) * width * 0.35;
        targetMouseY = height / 2 + Math.cos(time * 0.5) * height * 0.35;

        if (!isMouseActive) {
          setTimeout(moveVirtualMouse, 50);
        }
      };

      moveVirtualMouse();
    };

    let inactivityTimer = setTimeout(() => {
      isMouseActive = false;
      startVirtualMouseMovement();
    }, 500); // Iniciar movimiento automático después de medio segundo

    // Registrar eventos a nivel de document para capturar en toda la página
    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resize);
    resize();

    // Convertir hex a rgba con corrección gamma para colores más suaves
    const hexToRgba = (hex, alpha = 1) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      // Corrección gamma para colores más naturales
      const correctedR = Math.pow(r, 0.8) * 255;
      const correctedG = Math.pow(g, 0.8) * 255;
      const correctedB = Math.pow(b, 0.8) * 255;
      
      return `rgba(${correctedR}, ${correctedG}, ${correctedB}, ${alpha})`;
    };
    
    // Convertir hex a otro color con matiz modificado (para variaciones suaves)
    const getHarmonizedColor = (hex, hueShift = 10, saturationMult = 1, lightnessMult = 1) => {
      // Convertir hex a HSL
      let r = parseInt(hex.slice(1, 3), 16) / 255;
      let g = parseInt(hex.slice(3, 5), 16) / 255;
      let b = parseInt(hex.slice(5, 7), 16) / 255;
      
      let max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if(max === min) {
        h = s = 0; // achromatic
      } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch(max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
          default: h = 0;
        }
        
        h /= 6;
      }

      // Aplicar cambios de matiz, saturación y luminosidad
      h = (h * 360 + hueShift) % 360 / 360;
      s = Math.min(1, Math.max(0, s * saturationMult));
      l = Math.min(1, Math.max(0, l * lightnessMult));

      // Convertir HSL nuevamente a RGB
      function hue2rgb(p, q, t) {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      }

      let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      let p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
      
      // Convertir RGB a hex
      const toHex = (c) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    // Crear orbes flotantes con efecto de glassmorphism
    const orbs = [];
    const orbCount = 10; // Menos orbes para un aspecto más minimalista
    
    for (let i = 0; i < orbCount; i++) {
      // Colores ligeramente variados basados en los principales
      let orbColor;
      if (i % 3 === 0) {
        orbColor = getHarmonizedColor(primaryColor, i * 5, 0.95, 1.05);
      } else if (i % 3 === 1) {
        orbColor = getHarmonizedColor(secondaryColor, -i * 5, 0.95, 1.05);
      } else {
        orbColor = getHarmonizedColor(accentColor, i * 3, 0.9, 1.1);
      }
      
      const size = (Math.random() * (width * 0.35) + (width * 0.15)) * orbSize;
      orbs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: size,
        initialRadius: size,
        // Velocidad muy lenta para movimientos más elegantes
        xSpeed: (Math.random() - 0.5) * 0.15,
        ySpeed: (Math.random() - 0.5) * 0.15,
        color: orbColor,
        alpha: Math.random() * 0.18 + 0.05,
        vx: 0,
        vy: 0,
        damping: 0.97 + Math.random() * 0.02,
        blurFactor: 20 + Math.random() * 40, // Para efecto glassmorphism
        // Parámetros para fluctuación del tamaño
        pulseSpeed: Math.random() * 0.01 + 0.005,
        pulseSize: Math.random() * 0.08 + 0.02
      });
    }

    // Crear partículas brillantes
    const particles = [];
    const particleCount = 120;
    
    for (let i = 0; i < particleCount; i++) {
      // Variación de color ligeramente más coordinada
      let particleColor;
      if (i % 5 === 0) {
        particleColor = '#ffffff'; // Algunas blancas para más visibilidad
      } else if (i % 3 === 0) {
        particleColor = getHarmonizedColor(primaryColor, i, 0.9, 1.2);
      } else if (i % 3 === 1) {
        particleColor = getHarmonizedColor(secondaryColor, -i, 0.9, 1.2);
      } else {
        particleColor = getHarmonizedColor(accentColor, i * 2, 0.8, 1.3);
      }
      
      // Distribuir partículas estratégicamente
      let px, py;
      if (i < particleCount * 0.6) {
        // Distribuir en los bordes y esquinas
        const edge = Math.floor(Math.random() * 4);
        switch(edge) {
          case 0: // top
            px = Math.random() * width;
            py = Math.random() * height * 0.3;
            break;
          case 1: // right
            px = width * 0.7 + Math.random() * width * 0.3;
            py = Math.random() * height;
            break;
          case 2: // bottom
            px = Math.random() * width;
            py = height * 0.7 + Math.random() * height * 0.3;
            break;
          case 3: // left
            px = Math.random() * width * 0.3;
            py = Math.random() * height;
            break;
        }
      } else {
        // Resto distribuidas por toda la pantalla
        px = Math.random() * width;
        py = Math.random() * height;
      }
      
      particles.push({
        x: px,
        y: py,
        initialX: px,
        initialY: py,
        radius: (Math.random() * 4 + 1.5) * particleSize,
        // Velocidad reducida para movimiento más suave
        xSpeed: (Math.random() - 0.5) * 0.4,
        ySpeed: (Math.random() - 0.5) * 0.4,
        color: particleColor,
        alpha: Math.random() * 0.7 + 0.3,
        pulse: Math.random() * 0.05 + 0.02, // Pulso más suave
        vx: 0,
        vy: 0,
        damping: 0.95,
        // Parámetros para la cola
        hasTail: Math.random() > 0.4, // 60% con cola
        tailLength: Math.floor(Math.random() * 4) + 3,
        positions: [],
        // Brillo variable
        glowFactor: Math.random() * 0.3 + 0.7,
        glowSpeed: Math.random() * 0.01 + 0.005
      });
    }

    // Función para calcular distancia al cuadrado (optimización)
    const distSq = (x1, y1, x2, y2) => {
      const dx = x1 - x2;
      const dy = y1 - y2;
      return dx * dx + dy * dy;
    };

    // Tiempo de inicio para animación
    const startTime = Date.now();

    // Crear nuevo array para las ondas con propiedades mejoradas
    const waves = [
      { amplitude: 30, frequency: 0.008, speed: 0.2, phase: 0, color: primaryColor, opacity: 0.12 },
      { amplitude: 12, frequency: 0.012, speed: 0.15, phase: 2, color: secondaryColor, opacity: 0.09 },
      { amplitude: 10, frequency: 0.01, speed: 0.25, phase: 4, color: accentColor, opacity: 0.07 }
    ];

    // Función de animación con fisica mejorada y transiciones más suaves
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Tiempo transcurrido
      const elapsed = (Date.now() - startTime) * 0.001;
      
      // Interpolar posición del mouse para movimiento más suave
      mouseX += (targetMouseX - mouseX) * mouseSmoothness;
      mouseY += (targetMouseY - mouseY) * mouseSmoothness;
      
      // Fondo con gradiente mejorado
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      
      // Crear gradiente radial con efecto de viñeta suave
      const grd = ctx.createRadialGradient(
        centerX, centerY, 0, 
        centerX, centerY, Math.max(width, height) * 0.9
      );
      
      // Colores más sutiles con transiciones suaves
      grd.addColorStop(0, hexToRgba('#ffffff', 0.97));
      grd.addColorStop(0.7, hexToRgba('#f8f8f8', 0.95));
      grd.addColorStop(1, hexToRgba('#f0f0f0', 0.92));
      
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, width, height);
      
      // Área de influencia del mouse con transición suave
      if (mouseInteraction) {
        // Efecto de destello sutil siguiendo al mouse
        const mouseGlow = ctx.createRadialGradient(
          mouseX, mouseY, 0,
          mouseX, mouseY, mouseRadius
        );
        
        // Color de resplandor basado en posición
        const mouseColorFactor = (mouseX / width + mouseY / height) / 2;
        let mouseColor = primaryColor;
        if (mouseColorFactor < 0.33) {
          mouseColor = primaryColor;
        } else if (mouseColorFactor < 0.66) {
          mouseColor = secondaryColor;
        } else {
          mouseColor = accentColor;
        }
        
        mouseGlow.addColorStop(0, hexToRgba(mouseColor, 0.08));
        mouseGlow.addColorStop(0.5, hexToRgba(mouseColor, 0.05));
        mouseGlow.addColorStop(1, hexToRgba(mouseColor, 0));
        
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, mouseRadius, 0, Math.PI * 2);
        ctx.fillStyle = mouseGlow;
        ctx.fill();
      }
      
      // Dibujar orbes con efecto glassmorphism
      ctx.save();
      orbs.forEach((orb, index) => {
        // Fluctuación suave del tamaño para un efecto orgánico
        const sizePulse = Math.sin(elapsed * orb.pulseSpeed * Math.PI * 2) * orb.pulseSize + 1;
        const currentRadius = orb.radius * sizePulse;
        
        // Calcular influencia del mouse
        if (mouseInteraction) {
          const distanceToMouseSq = distSq(mouseX, mouseY, orb.x, orb.y);
          const mouseRadiusSq = mouseRadius * mouseRadius;
          
          if (distanceToMouseSq < mouseRadiusSq) {
            // Calcular repulsión basada en la distancia
            const distance = Math.sqrt(distanceToMouseSq);
            const force = (1 - distance / mouseRadius) * mouseStrength;
            
            // Vector de dirección desde el mouse al orbe
            const dx = orb.x - mouseX;
            const dy = orb.y - mouseY;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // Aplicar fuerza de repulsión con suavidad
            orb.vx += (dx / len) * force * 0.8;
            orb.vy += (dy / len) * force * 0.8;
          }
        }
        
        // Aplicar velocidad y amortiguamiento
        orb.vx *= orb.damping;
        orb.vy *= orb.damping;
        orb.x += orb.vx + orb.xSpeed * speed;
        orb.y += orb.vy + orb.ySpeed * speed;
        
        // Rebote en bordes con transición suave
        if (orb.x - currentRadius > width) orb.x = -currentRadius;
        if (orb.x + currentRadius < 0) orb.x = width + currentRadius;
        if (orb.y - currentRadius > height) orb.y = -currentRadius;
        if (orb.y + currentRadius < 0) orb.y = height + currentRadius;
        
        // Efecto glassmorphism
        // Sombra difusa para profundidad
        ctx.shadowColor = hexToRgba(orb.color, 0.3);
        ctx.shadowBlur = orb.blurFactor;
        
        // Gradiente suave
        const orbGrd = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, currentRadius
        );
        
        orbGrd.addColorStop(0, hexToRgba(orb.color, orb.alpha * 0.8));
        orbGrd.addColorStop(0.5, hexToRgba(orb.color, orb.alpha * 0.5));
        orbGrd.addColorStop(1, hexToRgba(orb.color, 0));
        
        // Dibujar orbe principal
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = orbGrd;
        ctx.fill();
        
        // Brillo interno sutil
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentRadius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba('#ffffff', orb.alpha * 0.6);
        ctx.fill();
        
        // Anillo decorativo
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentRadius * 0.6 + Math.sin(elapsed * 0.5) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(orb.color, orb.alpha * 0.3);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });
      ctx.restore();
      
      // Dibujar partículas brillantes con movimiento suave
      ctx.save();
      particles.forEach(particle => {
        // Guardar posición actual para la cola
        if (particle.hasTail) {
          particle.positions.unshift({x: particle.x, y: particle.y});
          if (particle.positions.length > particle.tailLength) {
            particle.positions.pop();
          }
        }
        
        // Brillo variable
        const currentGlow = (Math.sin(elapsed * particle.glowSpeed * Math.PI * 2) * 0.5 + 0.5) * particle.glowFactor;
        
        // Interacción con el mouse
        if (mouseInteraction) {
          const distToMouseSq = distSq(mouseX, mouseY, particle.x, particle.y);
          if (distToMouseSq < mouseRadius * mouseRadius) {
            // Calcular fuerza de atracción
            const distance = Math.sqrt(distToMouseSq);
            const force = (1 - distance / mouseRadius) * 2;
            
            // Vector dirección hacia el mouse (atracción)
            const dx = mouseX - particle.x;
            const dy = mouseY - particle.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // Aplicar fuerza de atracción con suavidad
            particle.vx += (dx / len) * force * 0.2;
            particle.vy += (dy / len) * force * 0.2;
          } else {
            // Volver gradualmente a la trayectoria original
            particle.vx += (particle.initialX - particle.x) * 0.0008;
            particle.vy += (particle.initialY - particle.y) * 0.0008;
          }
        }
        
        // Añadir turbulencia suave
        particle.vx += Math.sin(elapsed * 0.5 + particle.x * 0.01) * 0.01;
        particle.vy += Math.cos(elapsed * 0.5 + particle.y * 0.01) * 0.01;
        
        // Aplicar velocidad y amortiguamiento
        particle.vx *= particle.damping;
        particle.vy *= particle.damping;
        particle.x += particle.vx + particle.xSpeed * speed;
        particle.y += particle.vy + particle.ySpeed * speed;
        
        // Rebote en bordes
        if (particle.x > width) particle.x = 0;
        if (particle.x < 0) particle.x = width;
        if (particle.y > height) particle.y = 0;
        if (particle.y < 0) particle.y = height;
        
        // Efecto de pulso suave para el brillo
        const pulseOffset = Math.sin(elapsed * particle.pulse * 10) * 0.5 + 0.5;
        const currentAlpha = particle.alpha * (0.5 + pulseOffset * 0.5);
        
        // Configurar sombras para el brillo
        ctx.shadowColor = hexToRgba(particle.color, currentGlow * 0.8);
        ctx.shadowBlur = particle.radius * 3;
        
        // Dibujar cola si tiene (con degradado suave)
        if (particle.hasTail && particle.positions.length > 1) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          
          for (let i = 0; i < particle.positions.length; i++) {
            const pos = particle.positions[i];
            const alpha = currentAlpha * (1 - i / particle.positions.length) * 0.6;
            
            if (i === 0) {
              ctx.lineTo(pos.x, pos.y);
            } else {
              // Curva suave para la cola
              const prevPos = particle.positions[i-1];
              ctx.quadraticCurveTo(
                prevPos.x, prevPos.y,
                (prevPos.x + pos.x) / 2,
                (prevPos.y + pos.y) / 2
              );
            }
          }
          
          // Trazo semitransparente para la cola
          ctx.strokeStyle = hexToRgba(particle.color, currentAlpha * 0.5);
          ctx.lineWidth = particle.radius * 0.6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
        
        // Dibujar partícula principal con efecto de resplandor
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * (1 + currentGlow * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(particle.color, currentAlpha * (0.7 + currentGlow * 0.3));
        ctx.fill();
        
        // Brillo extendido
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 2.5 * currentGlow, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(particle.color, currentAlpha * 0.2 * currentGlow);
        ctx.fill();
        
        // Destello central
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba('#ffffff', currentAlpha * 0.9);
        ctx.fill();
      });
      ctx.restore();
      
      // Ondas con movimiento más natural
      ctx.save();
      waves.forEach((wave, index) => {
        ctx.beginPath();
        
        // Actualizar fase de onda
        wave.phase = (elapsed * wave.speed) % (Math.PI * 2);
        
        // Altura de onda variable basada en la posición del ratón
        const baseY = height * (0.5 + index * 0.12);
        
        // Dibujar onda con curvas bezier para mayor suavidad
        let xPrev = 0;
        let yPrev = baseY + Math.sin(wave.phase) * wave.amplitude;
        
        ctx.moveTo(xPrev, yPrev);
        
        for (let x = 20; x <= width; x += 20) {
          // Calcular altura de onda
          const waveHeight = Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
          
          // Añadir influencia del mouse para interactividad
          let mouseEffect = 0;
          if (mouseInteraction) {
            const distToWavePointSq = distSq(mouseX, mouseY, x, baseY);
            if (distToWavePointSq < mouseRadius * mouseRadius) {
              const dist = Math.sqrt(distToWavePointSq);
              mouseEffect = (1 - dist / mouseRadius) * 30 * Math.sin(elapsed * 2);
            }
          }
          
          const y = baseY + waveHeight + mouseEffect;
          
          // Usar curvas de bezier para suavizar la onda
          const xMid = (xPrev + x) / 2;
          ctx.quadraticCurveTo(xPrev, yPrev, xMid, (yPrev + y) / 2);
          
          xPrev = x;
          yPrev = y;
        }
        
        // Completar el camino hasta la parte inferior con curva suave
        ctx.quadraticCurveTo(xPrev, yPrev, width, yPrev);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        
        // Gradiente mejorado para la onda
        const gradient = ctx.createLinearGradient(0, baseY - wave.amplitude, 0, height);
        gradient.addColorStop(0, hexToRgba(wave.color, wave.opacity));
        gradient.addColorStop(0.5, hexToRgba(wave.color, wave.opacity * 0.5));
        gradient.addColorStop(1, hexToRgba(wave.color, wave.opacity * 0.2));
        
        ctx.fillStyle = gradient;
        ctx.fill();
      });
      ctx.restore();
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Limpieza
    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(inactivityTimer);
      window.removeEventListener('resize', resize);
    };
  }, [primaryColor, secondaryColor, accentColor, speed, mouseInteraction, orbSize, particleSize]);

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none' // Permite que los eventos de mouse pasen a través de este div
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
};

export default AnimatedBackground;