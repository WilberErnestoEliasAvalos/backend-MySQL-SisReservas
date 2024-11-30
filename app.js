const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinaryConfig');
const cron = require('node-cron');
const app = express();
const port = process.env.PORT || 3000;

// Permitir CORS para recibir solicitudes desde Angular
app.use(cors());

// Middleware para leer JSON
app.use(express.json());

// Configuración de la conexión a la base de datos MySQL
const db = mysql.createConnection({
  host: "junction.proxy.rlwy.net",
  port: 42864,
  user: "root",
  password: "fhzTHeEPaahiBzXMdAuZAqVIIkkqHJBH",
  database: "railway",
});

// Verifica la conexión a la base de datos
db.connect((err) => {
  if (err) {
    console.error("Error conectando a MySQL:", err);
    return;
  }
  console.log("Conexión a MySQL exitosa");
});

// Cron job para actualizar el estado de las reservas
cron.schedule('* * * * *', () => {
  const query = `
    UPDATE reservas 
    SET estado_reserva_id = 2 
    WHERE estado_reserva_id = 1 
      AND hora_fin <= CONVERT_TZ(NOW(), @@session.time_zone, '-06:00')
  `;
  db.query(query, (err, result) => {
    if (err) {
      console.error("Error al actualizar el estado de las reservas:", err);
      return;
    }
    console.log(`Reservas actualizadas: ${result.affectedRows}`);
  });
});

// Configuración de Multer para usar Cloudinary 
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sistema_de_reservas', // Nombre de la carpeta en Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif'], // Formatos permitidos
  },
});

const upload = multer({ storage });

// Ruta para subir una imagen a Cloudinary
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No se ha subido ningún archivo" });
  }
  res.json({ url: file.path });
});

// Rutas para Salas
app.get("/salas", (req, res) => {
  const query = "SELECT * FROM vista_salas";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.get('/salas/:id', (req, res) => {
  const id = req.params.id;
  const query = 'SELECT * FROM vista_salas WHERE sala_id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }
    res.json(result[0]);
  });
});

app.post("/salas", (req, res) => {
  const { nombre, capacidad, ubicacion_id, precio, disponible, actividad, descripcion, img } = req.body;
  if (!img) {
    return res.status(400).json({ error: "No se ha subido ninguna imagen" });
  }
  const query = "INSERT INTO salas (nombre, capacidad, ubicacion_id, precio, disponible, actividad, descripcion, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(query, [nombre, capacidad, ubicacion_id, precio, disponible, actividad, descripcion, img], (err, result) => {
    if (err) {
      console.error("Error al crear la sala:", err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: "Sala creada exitosamente", salaId: result.insertId });
  });
});

app.put('/salas/:id', (req, res) => {
  const { nombre, capacidad, ubicacion_id, precio, disponible, actividad, descripcion, img } = req.body;
  const id = req.params.id;
  const query = 'UPDATE salas SET nombre = ?, capacidad = ?, ubicacion_id = ?, precio = ?, disponible = ?, actividad = ?, descripcion = ?, img = ? WHERE sala_id = ?';
  db.query(query, [nombre, capacidad, ubicacion_id, precio, disponible, actividad, descripcion, img, id], (err, result) => {
    if (err) {
      console.error("Error al actualizar la sala:", err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Sala actualizada exitosamente' });
  });
});

app.delete('/salas/:id', (req, res) => {
  const id = req.params.id;
  const query = 'DELETE FROM salas WHERE sala_id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar la sala:", err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Sala eliminada exitosamente' });
  });
});

// Ruta para obtener todas las ubicaciones
app.get('/ubicaciones', (req, res) => {
  const query = 'SELECT * FROM vista_ubicaciones';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener las ubicaciones:', err);
      return res.status(500).json({ error: 'Error al obtener las ubicaciones' });
    }
    res.json(results);
  });
});

// Rutas para Usuarios
app.get("/usuarios", (req, res) => {
  const query = "SELECT * FROM vista_usuarios";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Ruta para crear un usuario con contraseña encriptada
app.post("/usuarios", (req, res) => {
  const { nombre, email, password, rol_id } = req.body;

  // Generar un hash de la contraseña
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error("Error al encriptar la contraseña:", err);
      return res.status(500).json({ error: "Error al encriptar la contraseña" });
    }

    // Insertar el usuario con el hash de la contraseña
    const query = "INSERT INTO usuarios (nombre, email, password_hash, rol_id) VALUES (?, ?, ?, ?)";
    db.query(query, [nombre, email, hash, rol_id], (err, result) => {
      if (err) {
        console.error("Error al insertar el usuario:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Usuario creado exitosamente", usuarioId: result.insertId });
    });
  });
});

// Ruta para actualizar un usuario
app.put('/usuarios/:id', (req, res) => {
  const { nombre, email, rol_id } = req.body;
  const id = req.params.id;
  const query = 'UPDATE usuarios SET nombre = ?, email = ?, rol_id = ? WHERE usuario_id = ?';
  db.query(query, [nombre, email, rol_id, id], (err, result) => {
    if (err) {
      console.error("Error al actualizar el usuario:", err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Usuario actualizado exitosamente' });
  });
});

// Ruta para eliminar un usuario
app.delete('/usuarios/:id', (req, res) => {
  const id = req.params.id;
  const query = 'DELETE FROM usuarios WHERE usuario_id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar el usuario:", err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  });
});

// Ruta para el inicio de sesión
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Obtener el usuario por email
  const query = "SELECT * FROM usuarios WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener el usuario" });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const user = results[0];

    // Comparar la contraseña ingresada con el hash almacenado
    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) {
        console.error("Error al verificar la contraseña:", err);
        return res.status(500).json({ error: "Error al verificar la contraseña" });
      }
      if (!isMatch) {
        return res.status(401).json({ error: "Credenciales incorrectas" });
      }

      // Si coinciden, permite el acceso
      const token = "some-generated-token"; // Genera un token aquí
      res.json({ token, userId: user.usuario_id, role: user.rol_id });
    });
  });
});
// Ruta para obtener el perfil de usuario
app.get('/profile/:id', (req, res) => {
  const id = req.params.id;
  const query = 'SELECT * FROM vista_perfil_usuario WHERE usuario_id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(results[0]);
  });
});

// Ruta para actualizar el perfil de usuario
app.put('/profile/:id', (req, res) => {
  const id = req.params.id;
  const { nombre, email } = req.body;
  const query = 'UPDATE usuarios SET nombre = ?, email = ? WHERE usuario_id = ?';
  db.query(query, [nombre, email, id], (err, result) => {
    if (err) {
      console.error("Error al actualizar el perfil del usuario:", err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Perfil actualizado exitosamente' });
  });
});

// Ruta para cambiar la contraseña del usuario
app.put('/usuarios/:id/change-password', (req, res) => {
  const id = req.params.id;
  const { currentPassword, newPassword } = req.body;

  // Obtener el usuario por ID
  const queryGetUser = 'SELECT * FROM usuarios WHERE usuario_id = ?';
  db.query(queryGetUser, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener el usuario' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = results[0];

    // Comparar la contraseña actual ingresada con el hash almacenado
    bcrypt.compare(currentPassword, user.password_hash, (err, isMatch) => {
      if (err) {
        console.error('Error al verificar la contraseña:', err);
        return res.status(500).json({ error: 'Error al verificar la contraseña' });
      }
      if (!isMatch) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }

      // Generar un hash de la nueva contraseña
      bcrypt.hash(newPassword, 10, (err, hash) => {
        if (err) {
          console.error('Error al encriptar la nueva contraseña:', err);
          return res.status(500).json({ error: 'Error al encriptar la nueva contraseña' });
        }

        // Actualizar la contraseña en la base de datos
        const queryUpdatePassword = 'UPDATE usuarios SET password_hash = ? WHERE usuario_id = ?';
        db.query(queryUpdatePassword, [hash, id], (err, result) => {
          if (err) {
            console.error('Error al actualizar la contraseña:', err);
            return res.status(500).json({ error: 'Error al actualizar la contraseña' });
          }
          res.json({ message: 'Contraseña actualizada exitosamente' });
        });
      });
    });
  });
});

// Ruta para obtener reservas (todas o filtradas por fecha, usuario y estado)
app.get("/reservas", (req, res) => {
  const { fecha_reserva, usuario_id, estado_reserva_id } = req.query;
  let query = "SELECT * FROM vista_reservas";
  const queryParams = [];
  const conditions = [];

  if (fecha_reserva) {
    conditions.push("fecha_reserva = ?");
    queryParams.push(fecha_reserva);
  }
  if (usuario_id) {
    conditions.push("usuario_id = ?");
    queryParams.push(usuario_id);
  }
  if (estado_reserva_id) {
    conditions.push("estado_reserva_id = ?");
    queryParams.push(estado_reserva_id);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Ruta para crear una reserva y su historial
app.post("/reservas", (req, res) => {
  const {
    usuario_id,
    sala_id,
    fecha_reserva,
    hora_inicio,
    hora_fin,
    estado_reserva_id,
  } = req.body;

  // Verificar si hay conflictos de horario
  const queryConflict = `
  SELECT * FROM reservas 
  WHERE sala_id = ? 
    AND fecha_reserva = ? 
    AND estado_reserva_id = 1
    AND NOT (hora_fin <= ? OR hora_inicio >= ?)
`;
db.query(
  queryConflict,
  [sala_id, fecha_reserva, hora_inicio, hora_fin],
  (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      return res.status(400).json({ error: "El horario seleccionado ya está ocupado" });
    }

      // Si no hay conflictos, crear la reserva
      const queryReserva =
        "INSERT INTO reservas (usuario_id, sala_id, fecha_reserva, hora_inicio, hora_fin, estado_reserva_id) VALUES (?, ?, ?, ?, ?, ?)";
      
      db.query(
        queryReserva,
        [
          usuario_id,
          sala_id,
          fecha_reserva,
          hora_inicio,
          hora_fin,
          estado_reserva_id,
        ],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          const reservaId = result.insertId;
          const queryHistorial =
            'INSERT INTO historiales_reserva (reserva_id, fecha_modificacion) VALUES (?, CURRENT_TIMESTAMP)';
          
          db.query(queryHistorial, [reservaId], (err, result) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json({
              message: 'Reserva y historial creados exitosamente',
              reservaId: reservaId,
              historialId: result.insertId
            });
          });
        }
      );
    }
  );
});

// Ruta para obtener reservas por sala y fecha
app.get("/reservas_por_sala_y_fecha", (req, res) => {
  const { sala_id, fecha_reserva } = req.query;
  const query = `
    SELECT * FROM reservas 
    WHERE sala_id = ? 
      AND fecha_reserva = ? 
      AND estado_reserva_id = 1
  `;
  db.query(query, [sala_id, fecha_reserva], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Rutas para Estados de Reserva
app.get("/estados_reserva", (req, res) => {
  const query = "SELECT * FROM vista_estados_reserva";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Ruta para crear un estado de reserva
app.post("/estados_reserva", (req, res) => {
  const { estado } = req.body;
  const query = "INSERT INTO estados_reserva (estado) VALUES (?)";
  db.query(query, [estado], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      message: "Estado de reserva creado exitosamente",
      estadoReservaId: result.insertId,
    });
  });
});

// Rutas para Contactos
app.get("/contactos", (req, res) => {
  const query = "SELECT * FROM vista_contactos";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Ruta para crear un contacto
app.post("/contactos", (req, res) => {
  const { usuario_id, telefono, direccion } = req.body;
  const query =
    "INSERT INTO contactos (usuario_id, telefono, direccion) VALUES (?, ?, ?)";
  db.query(query, [usuario_id, telefono, direccion], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      message: "Contacto creado exitosamente",
      contactoId: result.insertId,
    });
  });
});

// Rutas para Roles
app.get("/roles", (req, res) => {
  const query = "SELECT * FROM vista_roles";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Ruta para crear un rol
app.post("/roles", (req, res) => {
  const { nombre } = req.body;
  const query = "INSERT INTO roles (nombre) VALUES (?)";
  db.query(query, [nombre], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: "Rol creado exitosamente", rolId: result.insertId });
  });
});

// Rutas para Obtener Reservas con detalles de usuario y sala
app.get("/reservas_detalles", (req, res) => {
  const query = "SELECT * FROM vista_reservas_detalles";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Endpoint para obtener todos los administradores
app.get("/usuarios/admins", (req, res) => {
  const query = "SELECT * FROM vista_usuarios WHERE rol_id = 1"; // Administradores tienen rol_id = 1
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener administradores:", err);
      return res.status(500).json({ error: "Error al obtener administradores" });
    }
    res.json(results);
  });
});

// Endpoint para obtener todos los usuarios
app.get("/usuarios/user", (req, res) => {
  const query = "SELECT * FROM vista_usuarios where rol_id=2"; 
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener todos los usuarios:", err);
      return res.status(500).json({ error: "Error al obtener todos los usuarios" });
    }
    res.json(results);
  });
});

// Ruta para obtener el reporte de reservas por sala
app.get("/reporte_reservas_por_sala", (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  const query = `
    SELECT s.nombre AS sala, COUNT(r.reserva_id) AS total_reservas
    FROM reservas r
    JOIN salas s ON r.sala_id = s.sala_id
    WHERE r.fecha_reserva BETWEEN ? AND ?
    GROUP BY s.nombre
    ORDER BY total_reservas DESC
  `;
  db.query(query, [fecha_inicio, fecha_fin], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Ruta para obtener el reporte de reservas por usuario
app.get("/reporte_reservas_por_usuario", (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  const query = `
    SELECT u.nombre AS usuario, COUNT(r.reserva_id) AS total_reservas
    FROM reservas r
    JOIN usuarios u ON r.usuario_id = u.usuario_id
    WHERE r.fecha_reserva BETWEEN ? AND ?
    GROUP BY u.nombre
    ORDER BY total_reservas DESC
  `;
  db.query(query, [fecha_inicio, fecha_fin], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Ruta para obtener el reporte de estados de reservas
app.get("/reporte_estados_reservas", (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  const query = `
    SELECT e.estado AS estado_reserva, COUNT(r.reserva_id) AS total_reservas
    FROM reservas r
    JOIN estados_reserva e ON r.estado_reserva_id = e.estado_reserva_id
    WHERE r.fecha_reserva BETWEEN ? AND ?
    GROUP BY e.estado
    ORDER BY total_reservas DESC
  `;
  db.query(query, [fecha_inicio, fecha_fin], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Ruta para obtener el reporte de ingresos por sala
app.get("/reporte_ingresos_por_sala", (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  const query = `
    SELECT s.nombre AS sala, SUM(s.precio * TIMESTAMPDIFF(HOUR, r.hora_inicio, r.hora_fin)) AS ingresos
    FROM reservas r
    JOIN salas s ON r.sala_id = s.sala_id
    WHERE r.fecha_reserva BETWEEN ? AND ?
    GROUP BY s.nombre
    ORDER BY ingresos DESC
  `;
  db.query(query, [fecha_inicio, fecha_fin], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Ruta para obtener el reporte de uso de salas por ubicación
app.get("/reporte_uso_salas_por_ubicacion", (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  const query = `
    SELECT u.descripcion AS ubicacion, COUNT(r.reserva_id) AS total_reservas
    FROM reservas r
    JOIN salas s ON r.sala_id = s.sala_id
    JOIN ubicaciones u ON s.ubicacion_id = u.ubicacion_id
    WHERE r.fecha_reserva BETWEEN ? AND ?
    GROUP BY u.descripcion
    ORDER BY total_reservas DESC
  `;
  db.query(query, [fecha_inicio, fecha_fin], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Ruta para obtener un contacto por usuario_id
app.get("/contactos/:usuario_id", (req, res) => {
  const usuario_id = req.params.usuario_id;
  const query = "SELECT * FROM contactos WHERE usuario_id = ?";
  db.query(query, [usuario_id], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    res.json(results[0]);
  });
});

// Ruta para crear un contacto
app.post("/contactos", (req, res) => {
  const { usuario_id, telefono, direccion } = req.body;
  const query = "INSERT INTO contactos (usuario_id, telefono, direccion) VALUES (?, ?, ?)";
  db.query(query, [usuario_id, telefono, direccion], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      message: "Contacto creado exitosamente",
      contactoId: result.insertId,
    });
  });
});

// Ruta para actualizar un contacto
app.put("/contactos/:id", (req, res) => {
  const id = req.params.id;
  const { telefono, direccion } = req.body;
  const query = "UPDATE contactos SET telefono = ?, direccion = ? WHERE contacto_id = ?";
  db.query(query, [telefono, direccion, id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: "Contacto actualizado exitosamente" });
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor backend corriendo en ${port}`);
});