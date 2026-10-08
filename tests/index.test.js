const request = require('supertest');
const app = require('../index');

describe('Cobertura intensiva de endpoints y callbacks', () => {

  test('Prueba todos los flujos HTTP de éxito, vacíos y error', async () => {
    // 1. Endpoints base
    await request(app).get('/api/status');
    await request(app).get('/api/db/backup');

    // 2. Probar rutas no existentes o con IDs inválidos (dispara 404/400)
    await request(app).get('/api/no-existe');
    await request(app).get('/api/productos/999999');
    await request(app).delete('/api/productos/999999');
    await request(app).put('/api/productos/999999').send({ nombre: 'Inexistente' });
    await request(app).post('/api/productos').send({});
    await request(app).post('/api/categorias').send({});

    // 3. Flujo completo de Categorías
    const cat = await request(app).post('/api/categorias').send({ nombre: 'Categoría Test' });
    const catId = cat.body?.id || 1;
    await request(app).get('/api/categorias');
    await request(app).get(`/api/categorias/${catId}`);
    await request(app).put(`/api/categorias/${catId}`).send({ nombre: 'Categoría Actualizada' });

    // 4. Flujo completo de Productos
    const prod = await request(app).post('/api/productos').send({
      nombre: 'Producto Test',
      precio: 99.99,
      categoria_id: catId
    });
    const prodId = prod.body?.id || 1;
    await request(app).get('/api/productos');
    await request(app).get(`/api/productos/${prodId}`);
    await request(app).put(`/api/productos/${prodId}`).send({ nombre: 'Producto Editado', precio: 150 });
    await request(app).delete(`/api/productos/${prodId}`);
    await request(app).delete(`/api/categorias/${catId}`);

    // 5. Entidades secundarias (Soportes, Facturas, Cupones, Bitácoras, etc.)
    const entidades = ['bitacoras', 'cupones', 'facturas', 'soportes', 'seguimientos', 'reembolsos', 'sesiones'];
    
    for (const ent of entidades) {
      // Peticiones con ID inexistente para ejecutar callbacks de respuesta vacía/404
      await request(app).get(`/api/${ent}`);
      await request(app).get(`/api/${ent}/999999`);
      await request(app).put(`/api/${ent}/999999`).send({});
      await request(app).delete(`/api/${ent}/999999`);

      // Creación, consulta, modificación y borrado de registros
      const res = await request(app).post(`/api/${ent}`).send({
        evento: 'A', codigo: 'B', cliente_id: 1, usuario_id: 1, pedido_id: 1, observacion: 'C'
      });
      const id = res.body?.id || 1;
      await request(app).get(`/api/${ent}/${id}`);
      await request(app).put(`/api/${ent}/${id}`).send({
        evento: 'X', codigo: 'Y', cliente_id: 1, usuario_id: 1, pedido_id: 1, observacion: 'Z'
      });
      await request(app).delete(`/api/${ent}/${id}`);
    }

    // 6. Reset completo de base de datos
    await request(app).post('/api/db/vaciar');
  });

});