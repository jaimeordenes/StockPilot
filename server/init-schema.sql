-- Tablas para sistema local (adaptado: columna contrasena_hash en ascii)

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    estado BOOLEAN DEFAULT TRUE
);

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    contacto VARCHAR(150),
    telefono VARCHAR(20),
    correo VARCHAR(150),
    direccion VARCHAR(255)
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    contacto VARCHAR(150),
    telefono VARCHAR(20),
    correo VARCHAR(150),
    direccion VARCHAR(255)
);

-- Tabla de bodegas
CREATE TABLE IF NOT EXISTS bodegas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    ubicacion VARCHAR(255),
    capacidad INTEGER,
    responsable_id INT REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(100),
    descripcion TEXT,
    unidad VARCHAR(50),
    precio_compra NUMERIC(12,2),
    precio_venta NUMERIC(12,2),
    stock_min INTEGER,
    stock_max INTEGER,
    proveedor_id INT REFERENCES proveedores(id) ON DELETE SET NULL,
    fecha_caducidad DATE,
    lote VARCHAR(50),
    serie VARCHAR(50)
);

-- Tabla de inventario
CREATE TABLE IF NOT EXISTS inventario (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
    bodega_id INT REFERENCES bodegas(id) ON DELETE CASCADE,
    cantidad_actual INTEGER NOT NULL DEFAULT 0,
    UNIQUE(producto_id, bodega_id)
);

-- Tabla de movimientos
CREATE TABLE IF NOT EXISTS movimientos (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
    bodega_origen INT REFERENCES bodegas(id) ON DELETE SET NULL,
    bodega_destino INT REFERENCES bodegas(id) ON DELETE SET NULL,
    tipo VARCHAR(50) NOT NULL,
    cantidad INTEGER NOT NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT,
    documento_asociado VARCHAR(100)
);

-- Tabla de configuración
CREATE TABLE IF NOT EXISTS configuracion (
    id SERIAL PRIMARY KEY,
    parametro VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL
);
