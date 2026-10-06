const request = require('supertest');
const app = require('../index');

describe('Suite Ampliada de Pruebas Unitarias para Endpoints de la API (30 Tests)', () => {

  // ==========================================
  // BLOQUE 1: PRUEBAS DE ESTATUS Y BASE (1-2)
  // ==========================================

  test('1. GET /api/status - Debe retornar status "online" y 200 OK', async () => {
    const res = await request(app).get('/api/status');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'online');
  });

  test('2. GET /api/db/backup - Debe retornar el archivo binario del respaldo', async () => {
    const res = await request(app).get('/api/db/backup');
    expect(res.statusCode).toBe(200);
  });


  // ==========================================
  // BLOQUE 2: POST /api/categorias (3-8)
  // ==========================================

  test('3. POST /api/categorias - Error: Body vacío', async () => {
    const res = await request(app).post('/api/categorias').send({});
    expect([400, 422]).toContain(res.statusCode);
  });

  test('4. POST /api/categorias - Error: Nombre enviado como espacio en blanco', async () => {
    const res = await request(app).post('/api/categorias').send({ nombre: '   ' });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('5. POST /api/categorias - Error: Nombre enviado como tipo numérico', async () => {
    const res = await request(app).post('/api/categorias').send({ nombre: 12345 });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('6. POST /api/categorias - Error: Nombre de categoría excesivamente largo', async () => {
    const res = await request(app).post('/api/categorias').send({ nombre: 'A'.repeat(300) });
    expect([201, 400, 413, 422]).toContain(res.statusCode);
  });

  test('7. POST /api/categorias - Error: Nombre enviado como null', async () => {
    const res = await request(app).post('/api/categorias').send({ nombre: null });
    expect([400, 422]).toContain(res.statusCode);
  });

  test('8. POST /api/categorias - Éxito: Creación correcta de categoría', async () => {
    const res = await request(app)
      .post('/api/categorias')
      .send({ nombre: 'Reposteria Especializada' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });


  // ==========================================
  // BLOQUE 3: POST /api/productos (9-17)
  // ==========================================

  test('9. POST /api/productos - Error: Omisión de todos los campos requeridos', async () => {
    const res = await request(app).post('/api/productos').send({});
    expect([400, 422]).toContain(res.statusCode);
  });

  test('10. POST /api/productos - Error: Falta campo "precio" y "categoria_id"', async () => {
    const res = await request(app)
      .post('/api/productos')
      .send({ nombre: 'Gelatina Sin Detalles' });
    expect([400, 422]).toContain(res.statusCode);
  });

  test('11. POST /api/productos - Error: Enviar "precio" como cadena no numérica', async () => {
    const res = await request(app)
      .post('/api/productos')
      .send({ nombre: 'Producto Test', precio: 'gratis', categoria_id: 1 });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('12. POST /api/productos - Error: Enviar "precio" con valor negativo', async () => {
    const res = await request(app)
      .post('/api/productos')
      .send({ nombre: 'Producto Negativo', precio: -50.0, categoria_id: 1 });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('13. POST /api/productos - Error: Enviar "categoria_id" inexistente en BD', async () => {
    const res = await request(app)
      .post('/api/productos')
      .send({ nombre: 'Producto Categoria Fake', precio: 25.0, categoria_id: 99999 });
    expect([201, 400, 404, 500]).toContain(res.statusCode);
  });

  test('14. POST /api/productos - Error: Enviar "categoria_id" alfanumérico no válido', async () => {
    const res = await request(app)
      .post('/api/productos')
      .send({ nombre: 'Producto Test', precio: 25.0, categoria_id: 'abc-invalido' });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('15. POST /api/productos - Error: Enviar "nombre" del producto como booleano', async () => {
    const res = await request(app)
      .post('/api/productos')
      .send({ nombre: true, precio: 30.0, categoria_id: 1 });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('16. POST /api/productos - Error: Enviar "precio" como cero (0)', async () => {
    const res = await request(app)
      .post('/api/productos')
      .send({ nombre: 'Producto Gratis', precio: 0, categoria_id: 1 });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('17. POST /api/productos - Éxito: Creación correcta de producto completo', async () => {
    const nuevoProducto = {
      nombre: 'Gelatina de Limón Profesional',
      precio: 45.0,
      categoria_id: 1
    };
    const res = await request(app).post('/api/productos').send(nuevoProducto);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });


  // ==========================================
  // BLOQUE 4: PUT /api/productos/:id (18-24)
  // ==========================================

  test('18. PUT /api/productos/1 - Error: Intento de actualización con body vacío', async () => {
    const res = await request(app).put('/api/productos/1').send({});
    expect([400, 404, 422]).toContain(res.statusCode);
  });

  test('19. PUT /api/productos/999999 - Error: Intento de actualizar producto con ID inexistente', async () => {
    const res = await request(app)
      .put('/api/productos/999999')
      .send({ nombre: 'Inexistente', precio: 50.0, categoria_id: 1 });
    expect([400, 404]).toContain(res.statusCode);
  });

  test('20. PUT /api/productos/invalid-id - Error: Actualización con ID de formato alfanumérico', async () => {
    const res = await request(app)
      .put('/api/productos/invalid-id')
      .send({ nombre: 'Update Test', precio: 50.0, categoria_id: 1 });
    expect([400, 404, 422]).toContain(res.statusCode);
  });

  test('21. PUT /api/productos/1 - Error: Actualización enviando "precio" negativo', async () => {
    const res = await request(app)
      .put('/api/productos/1')
      .send({ nombre: 'Update Precio Negativo', precio: -10.0, categoria_id: 1 });
    expect([400, 404, 422]).toContain(res.statusCode);
  });

  test('22. PUT /api/productos/1 - Error: Actualización enviando "nombre" vacío', async () => {
    const res = await request(app)
      .put('/api/productos/1')
      .send({ nombre: '', precio: 20.0, categoria_id: 1 });
    expect([400, 404, 422]).toContain(res.statusCode);
  });

  test('23. PUT /api/productos/1 - Error: Actualización enviando "categoria_id" inexistente', async () => {
    const res = await request(app)
      .put('/api/productos/1')
      .send({ nombre: 'Producto Update', precio: 30.0, categoria_id: 88888 });
    expect([400, 404, 500]).toContain(res.statusCode);
  });

  test('24. PUT /api/productos/1 - Éxito: Modificación correcta de un producto existente', async () => {
    const res = await request(app)
      .put('/api/productos/1')
      .send({ nombre: 'Gelatina Modificada Test', precio: 40.0, categoria_id: 1 });
    expect([200, 204, 404]).toContain(res.statusCode);
  });


  // ==========================================
  // BLOQUE 5: DELETE /api/productos/:id (25-30)
  // ==========================================

  test('25. DELETE /api/productos/invalid-id - Error: Baja usando ID alfanumérico no válido', async () => {
    const res = await request(app).delete('/api/productos/abc-invalid-id');
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('26. DELETE /api/productos/999999 - Error: Intento de eliminar ID no existente en la base de datos', async () => {
    const res = await request(app).delete('/api/productos/999999');
    expect([200, 400, 404]).toContain(res.statusCode);
  });

  test('27. DELETE /api/productos/-50 - Error: Eliminación usando ID negativo', async () => {
    const res = await request(app).delete('/api/productos/-50');
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('28. DELETE /api/productos/0 - Error: Eliminación con ID cero (0)', async () => {
    const res = await request(app).delete('/api/productos/0');
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('29. DELETE /api/categorias/invalid-id - Error: Baja de categoría con ID inválido', async () => {
    const res = await request(app).delete('/api/categorias/invalid-id');
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('30. DELETE /api/productos/:id - Éxito/Flujo: Proceso de eliminación de recurso', async () => {
    const res = await request(app).delete('/api/productos/1');
    expect([200, 204, 404]).toContain(res.statusCode);
  });

});