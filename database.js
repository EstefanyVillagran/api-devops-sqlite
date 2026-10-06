const sqlite3 = require('sqlite3').verbose();

// Conectar a la BD (si no existe el archivo 'midatabase.db', SQLite lo crea solo)
const db = new sqlite3.Database('./midatabase.db', (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err.message);
  } else {
    console.log('Conectado exitosamente a SQLite.');
  }
});

// Crear las tablas e insertar datos iniciales
db.serialize(() => {
  // 1. Tabla Categorías (Normalización)
  db.run(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL
    )
  `);

  // 2. Tabla Productos (con Llave Foránea hacia Categorías)
  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      categoria_id INTEGER,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
    )
  `);

  // 3. Insertar datos de prueba para verificar
  db.run(`INSERT OR IGNORE INTO categorias (id, nombre) VALUES (1, 'Bebidas')`);
  db.run(`INSERT OR IGNORE INTO categorias (id, nombre) VALUES (2, 'Botanas')`);

  db.run(`INSERT OR IGNORE INTO productos (id, nombre, precio, categoria_id) VALUES (1, 'Refresco 600ml', 18.50, 1)`);
  db.run(`INSERT OR IGNORE INTO productos (id, nombre, precio, categoria_id) VALUES (2, 'Papas Saladas', 22.00, 2)`);
  
  console.log('Tablas preparadas e información inicial cargada.');
});

module.exports = db;