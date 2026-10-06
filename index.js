const express = require('express');
const net = require('net');
const path = require('path');
const db = require('./database');

const app = express();
app.use(express.json());

const HTTP_PORT = process.env.PORT || 8080;
const TCP_PORT = process.env.TCP_PORT || 6061;

// --- 1. ENDPOINTS HTTP EXISTENTES ---

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});

app.get('/api/categorias', (req, res) => {
  db.all('SELECT * FROM categorias', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/categorias', (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });
  db.run('INSERT INTO categorias (nombre) VALUES (?)', [nombre], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, nombre });
  });
});

app.delete('/api/categorias/:id', (req, res) => {
  db.run('DELETE FROM categorias WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Categoría eliminada', changes: this.changes });
  });
});

app.get('/api/productos', (req, res) => {
  const sql = `SELECT p.id, p.nombre, p.precio, p.categoria_id, c.nombre as categoria 
               FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/productos/:id', (req, res) => {
  db.get('SELECT * FROM productos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(row);
  });
});

app.post('/api/productos', (req, res) => {
  const { nombre, precio, categoria_id } = req.body;
  if (!nombre || precio == null || !categoria_id) {
    return res.status(400).json({ error: 'Nombre, precio y categoria_id son requeridos' });
  }
  db.run(
    'INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, ?)',
    [nombre, precio, categoria_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, nombre, precio, categoria_id });
    }
  );
});

app.delete('/api/productos/:id', (req, res) => {
  db.run('DELETE FROM productos WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Producto eliminado', changes: this.changes });
  });
});

// Descargar el archivo de la base de datos
app.get('/api/db/backup', (req, res) => {
  const dbPath = path.join(__dirname, 'midatabase.db');
  res.download(dbPath, 'backup-midatabase.db', (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Error al generar descarga del backup' });
    }
  });
});

app.post('/api/db/vaciar', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM productos');
    db.run('DELETE FROM categorias', [], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Base de datos vaciada correctamente' });
    });
  });
});

// --- 2. SERVIDOR SOCKET TCP (PUERTO 6061) ---

const tcpServer = net.createServer((socket) => {
  socket.on('data', (data) => {
    const rawInput = data.toString().trim();

    // Parseo para formato {insert:<element>}
    const insertMatch = rawInput.match(/^\{insert:(.+)\}$/i);
    // Parseo para formato {get:<element>}
    const getMatch = rawInput.match(/^\{get:(.+)\}$/i);

    if (insertMatch) {
      try {
        const payload = JSON.parse(insertMatch[1]);
        const { nombre, precio, categoria_id } = payload;

        if (!nombre || precio == null || !categoria_id) {
          socket.write(
            JSON.stringify({
              status: 'error',
              message: 'Campos requeridos: nombre, precio, categoria_id',
            }) + '\n'
          );
          return;
        }

        db.run(
          'INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, ?)',
          [nombre, precio, categoria_id],
          function (err) {
            if (err) {
              socket.write(JSON.stringify({ status: 'error', message: err.message }) + '\n');
            } else {
              socket.write(
                JSON.stringify({
                  status: 'success',
                  id: this.lastID,
                  data: payload,
                }) + '\n'
              );
            }
          }
        );
      } catch (e) {
        socket.write(
          JSON.stringify({
            status: 'error',
            message: 'Formato JSON invalido dentro de insert',
          }) + '\n'
        );
      }
    } else if (getMatch) {
      try {
        const target = getMatch[1].trim();
        let id;

        if (target.startsWith('{')) {
          const parsed = JSON.parse(target);
          id = parsed.id;
        } else {
          id = parseInt(target, 10);
        }

        if (isNaN(id)) {
          socket.write(
            JSON.stringify({ status: 'error', message: 'ID invalido en comando get' }) + '\n'
          );
          return;
        }

        const sql = `SELECT p.id, p.nombre, p.precio, p.categoria_id, c.nombre as categoria 
                     FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id 
                     WHERE p.id = ?`;

        db.get(sql, [id], (err, row) => {
          if (err) {
            socket.write(JSON.stringify({ status: 'error', message: err.message }) + '\n');
          } else if (!row) {
            socket.write(
              JSON.stringify({ status: 'error', message: 'Producto no encontrado' }) + '\n'
            );
          } else {
            socket.write(JSON.stringify({ status: 'success', data: row }) + '\n');
          }
        });
      } catch (e) {
        socket.write(
          JSON.stringify({ status: 'error', message: 'Error procesando comando get' }) + '\n'
        );
      }
    } else {
      socket.write(
        JSON.stringify({
          status: 'error',
          message: 'Sintaxis no reconocida. Usa {insert:<element>} o {get:<element>}',
        }) + '\n'
      );
    }
  });

  socket.on('error', (err) => {
    console.error('Error en socket TCP:', err.message);
  });
});

// --- INICIAR SERVIDORES ---


// Solo escuchar en puertos si NO se están ejecutando pruebas unitarias
if (process.env.NODE_ENV !== 'test') {
  app.listen(HTTP_PORT, () => {
    console.log(`Servidor HTTP corriendo en el puerto ${HTTP_PORT}`);
  });

  tcpServer.listen(TCP_PORT, '0.0.0.0', () => {
    console.log(`Servidor Socket TCP corriendo en el puerto ${TCP_PORT}`);
  });
}

module.exports = app;