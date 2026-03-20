// Update vaciarCarrito function to support clearing a specific user's cart
export const vaciarCarrito = async (usuarioId = null) => {
  try {
    const response = await authedFetch(`${API_URL}${API_PREFIX}carrito/vaciar`, {
      method: 'DELETE',
      body: usuarioId ? JSON.stringify({ cliente_id: usuarioId }) : null
    });
    
    // Si la API devuelve éxito
    if (response.ok) {
      console.log("Carrito vaciado exitosamente desde la API");
      
      // Limpiar también la caché local
      localStorage.removeItem('carritoCache');
      localStorage.removeItem('carritoCacheTimestamp');
      
      return { success: true, message: "Carrito vaciado correctamente" };
    }
    
    // Si el endpoint específico falla, intentar con un enfoque alternativo
    console.warn(`Error al vaciar carrito con endpoint específico: ${response.status}. Intentando alternativa...`);
    
    // Rest of the function remains the same...
    // This is just an example of how to update the function
    return { success: false };
  } catch (error) {
    console.error("Error al vaciar el carrito:", error);
    return { success: false, error: error.message };
  }
};
