import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Spinner, Alert, Form } from 'react-bootstrap';
import { Html5Qrcode } from 'html5-qrcode';

const API_URL = 'http://127.0.0.1:5000';

const EscanerProducto = ({ onProductFound, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize scanner when component mounts
  useEffect(() => {
    let html5QrCode;
    
    const initializeScanner = async () => {
      try {
        if (containerRef.current) {
          // Create scanner instance
          html5QrCode = new Html5Qrcode("scanner-container");
          scannerRef.current = html5QrCode;
          setScannerReady(true);
          
          // Start scanner with camera
          await startScanner(html5QrCode);
        }
      } catch (err) {
        console.error("Failed to initialize scanner:", err);
        setError("No se pudo inicializar la cámara. Intenta con un código manual.");
      }
    };
    
    initializeScanner();
    
    // Clean up scanner when component unmounts
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => {
          console.error("Failed to stop scanner:", err);
        });
      }
    };
  }, []);

  const startScanner = async (scanner) => {
    try {
      setLoading(true);
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      console.error("Scanner start error:", err);
      setError("No se pudo iniciar la cámara. Intenta con un código manual.");
    } finally {
      setLoading(false);
    }
  };

  const onScanSuccess = async (decodedText) => {
    try {
      // Stop scanner to prevent multiple scans
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      
      await processCode(decodedText);
    } catch (err) {
      setError(err.message);
      // Restart scanner to allow another try
      if (scannerRef.current) {
        startScanner(scannerRef.current);
      }
    }
  };

  const onScanFailure = (error) => {
    // Don't show error for every failed scan attempt
    console.log("Scan unsuccessful, trying again...");
  };

  const processCode = async (code) => {
    try {
      setLoading(true);
      setError(null);
      
      // First check if it's a QR code from our system
      const response = await fetch(`${API_URL}/productos/codigo/${code}`);
      
      if (response.ok) {
        const product = await response.json();
        onProductFound(product);
      } else {
        // If not a system QR code, try looking up by product ID
        const productIdResponse = await fetch(`${API_URL}/productos/${code}`);
        
        if (productIdResponse.ok) {
          const product = await productIdResponse.json();
          onProductFound(product);
        } else {
          throw new Error("Producto no encontrado con este código");
        }
      }
    } catch (err) {
      setError(err.message || "Error al procesar el código");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      setError("Ingresa un código válido");
      return;
    }
    
    await processCode(manualCode.trim());
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-qrcode me-2" style={{ color: '#8c5cf2' }}></i>
            Escanear Producto
          </h5>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </Alert>
        )}
        
        <div 
          id="scanner-container" 
          ref={containerRef}
          style={{ width: '100%', height: '300px', position: 'relative' }}
          className="mb-4 border rounded"
        >
          {!scannerReady && !error && (
            <div className="d-flex justify-content-center align-items-center h-100">
              <Spinner animation="border" variant="primary" />
              <span className="ms-2">Iniciando cámara...</span>
            </div>
          )}
        </div>
        
        <div className="text-center mb-4">
          <p>Escanea un código QR o código de barras de producto</p>
        </div>
        
        <hr className="my-4" />
        
        <h6 className="mb-3">¿No funciona el escáner? Ingresa el código manualmente:</h6>
        
        <Form onSubmit={handleManualSubmit}>
          <Form.Group className="mb-3">
            <Form.Control 
              type="text" 
              placeholder="Ingresa el código del producto" 
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              disabled={loading}
            />
          </Form.Group>
          
          <div className="d-grid">
            <Button 
              type="submit" 
              disabled={loading || !manualCode.trim()}
              style={{ backgroundColor: '#8c5cf2', borderColor: '#7647eb' }}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Buscando...
                </>
              ) : (
                <>
                  <i className="fas fa-search me-2"></i>
                  Buscar producto
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default EscanerProducto;