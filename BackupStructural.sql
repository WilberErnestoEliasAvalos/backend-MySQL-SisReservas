-- Eliminando las tablas si existen previamente
DROP TABLE IF EXISTS `contactos`;
DROP TABLE IF EXISTS `historiales_reserva`;
DROP TABLE IF EXISTS `reservas`;
DROP TABLE IF EXISTS `estados_reserva`;
DROP TABLE IF EXISTS `usuarios`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `salas`;

-- Tabla Roles
CREATE TABLE `roles` (
  `rol_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`rol_id`),
  UNIQUE KEY `uq_rol_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla Usuarios
CREATE TABLE `usuarios` (
  `usuario_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`usuario_id`),
  UNIQUE KEY `uq_usuario_email` (`email`),
  KEY `fk_rol_usuario` (`rol_id`),
  CONSTRAINT `fk_rol_usuario` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`rol_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla Contactos
CREATE TABLE `contactos` (
  `contacto_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` INT UNSIGNED NOT NULL,
  `telefono` VARCHAR(15),
  `direccion` VARCHAR(255),
  PRIMARY KEY (`contacto_id`),
  KEY `fk_usuario_contacto` (`usuario_id`),
  CONSTRAINT `fk_usuario_contacto` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla Salas
CREATE TABLE `salas` (
  `sala_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `capacidad` SMALLINT UNSIGNED NOT NULL CHECK (capacidad > 0),
  `ubicacion` VARCHAR(255) NOT NULL,
  `precio` DECIMAL(10,2) NOT NULL,
  `disponible` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`sala_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla Estados Reserva
CREATE TABLE `estados_reserva` (
  `estado_reserva_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `estado` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`estado_reserva_id`),
  UNIQUE KEY `uq_estado_nombre` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla Reservas
CREATE TABLE `reservas` (
  `reserva_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` INT UNSIGNED NOT NULL,
  `sala_id` INT UNSIGNED NOT NULL,
  `fecha_reserva` DATE NOT NULL,
  `hora_inicio` TIME NOT NULL,
  `hora_fin` TIME NOT NULL,
  `estado_reserva_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`reserva_id`),
  KEY `idx_fecha_sala_usuario` (`fecha_reserva`, `sala_id`, `usuario_id`),
  CONSTRAINT `fk_usuario_reserva` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sala_reserva` FOREIGN KEY (`sala_id`) REFERENCES `salas` (`sala_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_estado_reserva` FOREIGN KEY (`estado_reserva_id`) REFERENCES `estados_reserva` (`estado_reserva_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabla Historiales Reserva
CREATE TABLE `historiales_reserva` (
  `historial_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reserva_id` INT UNSIGNED NOT NULL,
  `fecha_modificacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`historial_id`),
  KEY `fk_reserva_historial` (`reserva_id`),
  CONSTRAINT `fk_reserva_historial` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`reserva_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;