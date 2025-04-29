-- --------------------------------------------------------
-- Creación de la base de datos y tablas para prestamos_web
-- --------------------------------------------------------

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS `prestamos_web` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seleccionar la base de datos
USE `prestamos_web`;

-- Crear tabla clientes
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha_solicitud` date DEFAULT NULL,
  `nombre_solicitante` varchar(100) DEFAULT NULL,
  `telefono_solicitante` varchar(20) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `tiempo_vivienda` varchar(50) DEFAULT NULL,
  `lugar_trabajo` varchar(100) DEFAULT NULL,
  `tipo_vivienda` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `ocupacion` varchar(100) DEFAULT NULL,
  `cedula` varchar(20) DEFAULT NULL,
  `tiempo_empresa` varchar(50) DEFAULT NULL,
  `otros_ingresos` decimal(10,2) DEFAULT NULL,
  `estado_civil` varchar(20) DEFAULT NULL,
  `celular_conyuge` varchar(20) DEFAULT NULL,
  `trabajo_conyuge` varchar(100) DEFAULT NULL,
  `dependientes` varchar(50) DEFAULT NULL,
  `direccion_solicitante` varchar(255) DEFAULT NULL,
  `lugar_vivienda` varchar(100) DEFAULT NULL,
  `ubicacion_trabajo` varchar(255) DEFAULT NULL,
  `telefono_trabajo` varchar(20) DEFAULT NULL,
  `pago_renta` decimal(10,2) DEFAULT NULL,
  `gastos_mensuales` decimal(10,2) DEFAULT NULL,
  `horario_trabajo` varchar(50) DEFAULT NULL,
  `ingresos_mensuales` decimal(10,2) DEFAULT NULL,
  `total_ingresos` varchar(50) DEFAULT NULL,
  `conyuge` varchar(100) DEFAULT NULL,
  `direccion_trabajo_conyuge` varchar(255) DEFAULT NULL,
  `telefono_trabajo_conyuge` varchar(20) DEFAULT NULL,
  `monto_solicitado` decimal(10,2) DEFAULT NULL,
  `ref_personal1_nombre` varchar(100) DEFAULT NULL,
  `ref_personal2_nombre` varchar(100) DEFAULT NULL,
  `ref_personal1_telefono` varchar(20) DEFAULT NULL,
  `ref_personal2_telefono` varchar(20) DEFAULT NULL,
  `ref_familiar1_nombre` varchar(100) DEFAULT NULL,
  `ref_familiar2_nombre` varchar(100) DEFAULT NULL,
  `ref_familiar1_telefono` varchar(20) DEFAULT NULL,
  `ref_familiar2_telefono` varchar(20) DEFAULT NULL,
  `ref_comercial_nombre` varchar(100) DEFAULT NULL,
  `ref_comercial_telefono` varchar(20) DEFAULT NULL,
  `para_que_necesita` text DEFAULT NULL,
  `prestamos_activos` varchar(10) DEFAULT NULL,
  `banco` varchar(100) DEFAULT NULL,
  `firma_digital` text DEFAULT NULL,
  `fecha_aprobacion` datetime NOT NULL DEFAULT current_timestamp(),
  `estado` enum('activo','moroso','pagado','aprobado') NOT NULL DEFAULT 'activo',
  `metodo_pago` varchar(50) DEFAULT NULL,
  `firma_contrato` text DEFAULT NULL,
  `garantia` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4;

-- Crear tabla contratos
CREATE TABLE IF NOT EXISTS `contratos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `solicitud_id` int(11) NOT NULL,
  `fecha_solicitud` date DEFAULT NULL,
  `monto` decimal(10,2) DEFAULT NULL,
  `nombre_cliente` varchar(50) DEFAULT NULL,
  `cedula_cliente` varchar(20) DEFAULT NULL,
  `condiciones_pago` text DEFAULT NULL,
  `garantia` text DEFAULT NULL,
  `monto_total` decimal(10,2) DEFAULT NULL,
  `deudor_nombre` text DEFAULT NULL,
  `deudor_apodo` text DEFAULT NULL,
  `deudor_cedula` text DEFAULT NULL,
  `codeudor_nombre` text DEFAULT NULL,
  `codeudor_apodo` text DEFAULT NULL,
  `codeudor_cedula` text DEFAULT NULL,
  `firma_deudor` text DEFAULT NULL,
  `firma_fiador` text DEFAULT NULL,
  `encargado_oficina` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

-- Crear procedimiento para agregar columna cedula a clientes y solicitudes
DELIMITER //
CREATE PROCEDURE `agregar_cedula`()
BEGIN
    ALTER TABLE solicitudes ADD COLUMN cedula VARCHAR(20) NULL;
    ALTER TABLE clientes ADD COLUMN cedula VARCHAR(20) NULL;
END//
DELIMITER ;

-- Crear tabla solicitudes
CREATE TABLE IF NOT EXISTS `solicitudes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha_solicitud` date DEFAULT NULL,
  `nombre_solicitante` varchar(100) DEFAULT NULL,
  `telefono_solicitante` varchar(20) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `tiempo_vivienda` varchar(50) DEFAULT NULL,
  `lugar_trabajo` varchar(100) DEFAULT NULL,
  `tipo_vivienda` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `ocupacion` varchar(100) DEFAULT NULL,
  `cedula` varchar(20) DEFAULT NULL,
  `tiempo_empresa` varchar(50) DEFAULT NULL,
  `otros_ingresos` decimal(10,2) DEFAULT NULL,
  `estado_civil` varchar(20) DEFAULT NULL,
  `celular_conyuge` varchar(20) DEFAULT NULL,
  `trabajo_conyuge` varchar(100) DEFAULT NULL,
  `dependientes` varchar(50) DEFAULT NULL,
  `direccion_solicitante` varchar(255) DEFAULT NULL,
  `lugar_vivienda` varchar(100) DEFAULT NULL,
  `ubicacion_trabajo` varchar(255) DEFAULT NULL,
  `telefono_trabajo` varchar(20) DEFAULT NULL,
  `pago_renta` decimal(10,2) DEFAULT NULL,
  `gastos_mensuales` decimal(10,2) DEFAULT NULL,
  `horario_trabajo` varchar(50) DEFAULT NULL,
  `ingresos_mensuales` decimal(10,2) DEFAULT NULL,
  `total_ingresos` varchar(50) DEFAULT NULL,
  `conyuge` varchar(100) DEFAULT NULL,
  `direccion_trabajo_conyuge` varchar(255) DEFAULT NULL,
  `telefono_trabajo_conyuge` varchar(20) DEFAULT NULL,
  `monto_solicitado` decimal(10,2) DEFAULT NULL,
  `ref_personal1_nombre` varchar(100) DEFAULT NULL,
  `ref_personal2_nombre` varchar(100) DEFAULT NULL,
  `ref_personal1_telefono` varchar(20) DEFAULT NULL,
  `ref_personal2_telefono` varchar(20) DEFAULT NULL,
  `ref_familiar1_nombre` varchar(100) DEFAULT NULL,
  `ref_familiar2_nombre` varchar(100) DEFAULT NULL,
  `ref_familiar1_telefono` varchar(20) DEFAULT NULL,
  `ref_familiar2_telefono` varchar(20) DEFAULT NULL,
  `ref_comercial_nombre` varchar(100) DEFAULT NULL,
  `ref_comercial_telefono` varchar(20) DEFAULT NULL,
  `para_que_necesita` text DEFAULT NULL,
  `prestamos_activos` varchar(10) DEFAULT NULL,
  `banco` varchar(100) DEFAULT NULL,
  `firma_digital` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4;

-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `password` varchar(20) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT current_timestamp(),
  `estado` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
