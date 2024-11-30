DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `rol_id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`rol_id`),
  UNIQUE KEY `uq_rol_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
  `usuario_id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol_id` int unsigned NOT NULL,
  PRIMARY KEY (`usuario_id`),
  UNIQUE KEY `uq_usuario_email` (`email`),
  KEY `fk_rol_usuario` (`rol_id`),
  CONSTRAINT `fk_rol_usuario` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`rol_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `contactos`;

CREATE TABLE `contactos` (
  `contacto_id` int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned NOT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`contacto_id`),
  KEY `fk_usuario_contacto` (`usuario_id`),
  CONSTRAINT `fk_usuario_contacto` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `estados_reserva`;

CREATE TABLE `estados_reserva` (
  `estado_reserva_id` int unsigned NOT NULL AUTO_INCREMENT,
  `estado` varchar(50) NOT NULL,
  PRIMARY KEY (`estado_reserva_id`),
  UNIQUE KEY `uq_estado_nombre` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `ubicaciones`;

CREATE TABLE `ubicaciones` (
  `ubicacion_id` int unsigned NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(255) NOT NULL,
  PRIMARY KEY (`ubicacion_id`),
  UNIQUE KEY `uq_ubicacion_descripcion` (`descripcion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `salas`;

CREATE TABLE `salas` (
  `sala_id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `capacidad` smallint unsigned NOT NULL,
  `ubicacion_id` int unsigned NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `disponible` tinyint(1) DEFAULT '1',
  `actividad` varchar(100) NOT NULL DEFAULT 'Multifuncional',
  `descripcion` VARCHAR(500),
  `img` text,
  PRIMARY KEY (`sala_id`),
  KEY `fk_ubicacion_sala` (`ubicacion_id`),
  CONSTRAINT `fk_ubicacion_sala` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones` (`ubicacion_id`) ON DELETE CASCADE,
  CONSTRAINT `salas_chk_1` CHECK ((`capacidad` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `reservas`;

CREATE TABLE `reservas` (
  `reserva_id` int unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int unsigned NOT NULL,
  `sala_id` int unsigned NOT NULL,
  `fecha_reserva` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `estado_reserva_id` int unsigned NOT NULL,
  PRIMARY KEY (`reserva_id`),
  KEY `idx_fecha_sala_usuario` (`fecha_reserva`,`sala_id`,`usuario_id`),
  KEY `fk_usuario_reserva` (`usuario_id`),
  KEY `fk_sala_reserva` (`sala_id`),
  KEY `fk_estado_reserva` (`estado_reserva_id`),
  CONSTRAINT `fk_estado_reserva` FOREIGN KEY (`estado_reserva_id`) REFERENCES `estados_reserva` (`estado_reserva_id`),
  CONSTRAINT `fk_sala_reserva` FOREIGN KEY (`sala_id`) REFERENCES `salas` (`sala_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_usuario_reserva` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`usuario_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `historiales_reserva`;

CREATE TABLE `historiales_reserva` (
  `historial_id` int unsigned NOT NULL AUTO_INCREMENT,
  `reserva_id` int unsigned NOT NULL,
  `fecha_modificacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`historial_id`),
  KEY `fk_reserva_historial` (`reserva_id`),
  CONSTRAINT `fk_reserva_historial` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`reserva_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;