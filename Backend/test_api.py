import pytest
from app import app
import json
import os

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    """Verifica que el health check responda correctamente"""
    response = client.get('/')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'ok'

def test_productos_endpoint(client):
    """Verifica que el endpoint de productos responda correctamente"""
    response = client.get('/api/productos')
    assert response.status_code in [200, 401]  # 200 si no requiere auth, 401 si requiere

# Añade más pruebas para otros endpoints según sea necesario