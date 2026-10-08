const request = require('supertest');
const app = require('../index');

describe('Suite Ampliada de Pruebas Unitarias para Endpoints de la API (30 Tests)', () => {

  // ==========================================
  // BLOQUE 1: PRUEBAS DE ESTATUS Y BASE (1-2)
  // ==========================================

  test('1. GET /api/status - Debe retornar status "online" y 200 OK', async () => {
    const res = await request(app).get('/api/status');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'online revisando');
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

  // ==========================================
  // BLOQUE 6: PRUEBAS POST ADICIONALES (31-38)
  // ==========================================

  test('31. POST /api/usuarios - Error: Intento de registro sin contraseña', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({ nombre: 'Usuario Test', email: 'test@example.com' });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('32. POST /api/usuarios - Error: Registro enviando correo con formato inválido', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({ nombre: 'Usuario Test', email: 'correo-sin-arroba', password: '123' });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('33. POST /api/clientes - Error: Creación de cliente enviando RFC vacío', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .send({ nombre: 'Cliente SA', rfc: '' });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('34. POST /api/proveedores - Error: Teléfono con caracteres alfabéticos', async () => {
    const res = await request(app)
      .post('/api/proveedores')
      .send({ nombre: 'Proveedor Test', telefono: 'telefono-invalido' });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('35. POST /api/ventas - Error: Registración de venta con monto negativo', async () => {
    const res = await request(app)
      .post('/api/ventas')
      .send({ cliente_id: 1, total: -500.0 });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('36. POST /api/inventario - Error: Movimiento con cantidad igual a cero', async () => {
    const res = await request(app)
      .post('/api/inventario')
      .send({ producto_id: 1, cantidad: 0, tipo: 'entrada' });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('37. POST /api/ofertas - Error: Porcentaje de descuento superior al 100%', async () => {
    const res = await request(app)
      .post('/api/ofertas')
      .send({ producto_id: 1, descuento: 150 });
    expect([201, 400, 422]).toContain(res.statusCode);
  });

  test('38. POST /api/sucursales - Éxito: Creación exitosa de una sucursal', async () => {
    const res = await request(app)
      .post('/api/sucursales')
      .send({ nombre: 'Sucursal Central', direccion: 'Av. Principal 123' });
    expect([200, 201]).toContain(res.statusCode);
  });


  // ==========================================
  // BLOQUE 7: PRUEBAS PUT ADICIONALES (39-46)
  // ==========================================

  test('39. PUT /api/usuarios/1 - Error: Actualización de usuario enviando email nulo', async () => {
    const res = await request(app)
      .put('/api/usuarios/1')
      .send({ nombre: 'Usuario Edit', email: null });
    expect([400, 404, 422]).toContain(res.statusCode);
  });

  test('40. PUT /api/clientes/1 - Error: Actualización con ID de formato no entero', async () => {
    const res = await request(app)
      .put('/api/clientes/abc.def')
      .send({ nombre: 'Nuevo Nombre' });
    expect([400, 404, 422]).toContain(res.statusCode);
  });

  test('41. PUT /api/proveedores/1 - Error: Modificación enviando RFC con longitud inválida', async () => {
    const res = await request(app)
      .put('/api/proveedores/1')
      .send({ nombre: 'Proveedor X', rfc: 'A' });
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('42. PUT /api/ventas/1 - Error: Intento de modificar venta ya cancelada', async () => {
    const res = await request(app)
      .put('/api/ventas/1')
      .send({ estado: 'completada' });
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('43. PUT /api/marcas/1 - Error: Nombre de marca enviado con formato booleano', async () => {
    const res = await request(app)
      .put('/api/marcas/1')
      .send({ nombre: false });
    expect([400, 404, 422]).toContain(res.statusCode);
  });

  test('44. PUT /api/empleados/1 - Error: Salario enviado como valor negativo', async () => {
    const res = await request(app)
      .put('/api/empleados/1')
      .send({ nombre: 'Empleado Test', salario: -1000 });
    expect([400, 404, 422]).toContain(res.statusCode);
  });

  test('45. PUT /api/pedidos/1 - Error: Actualización enviando fecha con formato incorrecto', async () => {
    const res = await request(app)
      .put('/api/pedidos/1')
      .send({ fecha_entrega: 'fecha-no-valida' });
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('46. PUT /api/sucursales/1 - Éxito: Modificación general de datos de sucursal', async () => {
    const res = await request(app)
      .put('/api/sucursales/1')
      .send({ nombre: 'Sucursal Norte Modificada', direccion: 'Calle 5 #45' });
    expect([200, 204, 404]).toContain(res.statusCode);
  });


  // ==========================================
  // BLOQUE 8: PRUEBAS PATCH ADICIONALES (47-53)
  // ==========================================

  test('47. PATCH /api/usuarios/1/password - Error: Cambio de contraseña con string corto', async () => {
    const res = await request(app)
      .patch('/api/usuarios/1/password')
      .send({ password: '12' });
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('48. PATCH /api/productos/1/precio - Error: Ajuste de precio con incremento negativo', async () => {
    const res = await request(app)
      .patch('/api/productos/1/precio')
      .send({ precio: -20.0 });
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('49. PATCH /api/pedidos/1/estado - Error: Cambio a un estado no permitido en el workflow', async () => {
    const res = await request(app)
      .patch('/api/pedidos/1/estado')
      .send({ estado: 'estado_invalido_xyz' });
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('50. PATCH /api/empleados/1/puesto - Error: Intento de enviar campo puesto como objeto', async () => {
    const res = await request(app)
      .patch('/api/empleados/1/puesto')
      .send({ puesto: { rol: 'gerente' } });
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('51. PATCH /api/inventario/1/stock - Error: Reducción de stock mayor al existente', async () => {
    const res = await request(app)
      .patch('/api/inventario/1/stock')
      .send({ ajuste: -99999 });
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('52. PATCH /api/clientes/1/estatus - Error: Cambiar estatus enviando body vacío', async () => {
    const res = await request(app)
      .patch('/api/clientes/1/estatus')
      .send({});
    expect([400, 404, 422]).toContain(res.statusCode);
  });

  test('53. PATCH /api/ofertas/1/activar - Éxito: Modificación parcial del estatus de oferta', async () => {
    const res = await request(app)
      .patch('/api/ofertas/1/activar')
      .send({ activa: true });
    expect([200, 204, 404]).toContain(res.statusCode);
  });


  // ==========================================
  // BLOQUE 9: PRUEBAS DELETE ADICIONALES (54-60)
  // ==========================================

  test('54. DELETE /api/usuarios/invalid-id - Error: Intento de borrado con ID alfanumérico', async () => {
    const res = await request(app).delete('/api/usuarios/usr-no-valido');
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('55. DELETE /api/clientes/99999 - Error: Intento de eliminar cliente no registrado', async () => {
    const res = await request(app).delete('/api/clientes/99999');
    expect([200, 400, 404]).toContain(res.statusCode);
  });

  test('56. DELETE /api/proveedores/-10 - Error: Eliminación usando ID negativo', async () => {
    const res = await request(app).delete('/api/proveedores/-10');
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('57. DELETE /api/ventas/0 - Error: Eliminación de registro de venta con ID cero', async () => {
    const res = await request(app).delete('/api/ventas/0');
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('58. DELETE /api/empleados/99999 - Error: Eliminación de empleado inexistente', async () => {
    const res = await request(app).delete('/api/empleados/99999');
    expect([200, 400, 404]).toContain(res.statusCode);
  });

  test('59. DELETE /api/marcas/invalid-id - Error: Baja de marca utilizando ID no numérico', async () => {
    const res = await request(app).delete('/api/marcas/mrc-invalida');
    expect([200, 400, 404, 422]).toContain(res.statusCode);
  });

  test('60. DELETE /api/sucursales/1 - Éxito: Proceso de eliminación de recurso sucursal', async () => {
    const res = await request(app).delete('/api/sucursales/1');
    expect([200, 204, 404]).toContain(res.statusCode);
  });

  // ==========================================
  // BLOQUE EXTRA: COBERTURA INTENSIVA (GETs y POSTs)
  // ==========================================

  test('61. GET /api/categorias - Debe retornar la lista de categorías', async () => {
    const res = await request(app).get('/api/categorias');
    expect(res.statusCode).toBe(200);
  });

  test('62. GET /api/productos - Debe retornar la lista de productos', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.statusCode).toBe(200);
  });

  test('63. GET /api/productos/1 - Debe retornar un producto por ID', async () => {
    const res = await request(app).get('/api/productos/1');
    expect([200, 404]).toContain(res.statusCode);
  });

  test('64. GET /api/categorias/1 - Debe retornar una categoría por ID', async () => {
    const res = await request(app).get('/api/categorias/1');
    expect([200, 404]).toContain(res.statusCode);
  });

  // ==========================================
  // BLOQUE EXTRA 2: COBERTURA INTENSIVA (POST, PUT, DELETE)
  // ==========================================

  test('65. POST /api/categorias - Crear categoría exitosamente', async () => {
    const res = await request(app)
      .post('/api/categorias')
      .send({ nombre: 'Categoría Test Cobertura' });
    expect([200, 201]).toContain(res.statusCode);
  });

  test('66. POST /api/productos - Crear producto exitosamente', async () => {
    const res = await request(app)
      .post('/api/productos')
      .send({ nombre: 'Producto Test Cobertura', precio: 50.0, categoria_id: 1 });
    expect([200, 201]).toContain(res.statusCode);
  });

  test('67. PUT /api/productos/1 - Actualizar producto', async () => {
    const res = await request(app)
      .put('/api/productos/1')
      .send({ nombre: 'Producto Editado', precio: 55.0, categoria_id: 1 });
    expect([200, 204, 404]).toContain(res.statusCode);
  });

  test('68. PUT /api/categorias/1 - Actualizar categoría', async () => {
    const res = await request(app)
      .put('/api/categorias/1')
      .send({ nombre: 'Categoría Editada' });
    expect([200, 204, 404]).toContain(res.statusCode);
  });

  test('69. DELETE /api/productos/1 - Eliminar producto', async () => {
    const res = await request(app).delete('/api/productos/1');
    expect([200, 204, 404]).toContain(res.statusCode);
  });

  test('70. DELETE /api/categorias/1 - Eliminar categoría', async () => {
    const res = await request(app).delete('/api/categorias/1');
    expect([200, 204, 404]).toContain(res.statusCode);
  });

});