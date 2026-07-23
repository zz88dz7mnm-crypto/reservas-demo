-- =============================================
-- Schema inicial — Sistema de reservas peluquería
-- Aplicar con: supabase db push
-- =============================================

CREATE TABLE IF NOT EXISTS servicios (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT    NOT NULL,
  duracion  INTEGER NOT NULL,
  precio    INTEGER,
  activo    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS horarios (
  id           SERIAL PRIMARY KEY,
  dia_semana   INTEGER NOT NULL UNIQUE,
  hora_inicio  TEXT    NOT NULL,
  hora_fin     TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS bloqueos (
  id           SERIAL PRIMARY KEY,
  fecha        TEXT    NOT NULL,
  hora_inicio  TEXT    NOT NULL,
  hora_fin     TEXT    NOT NULL,
  motivo       TEXT
);

CREATE TABLE IF NOT EXISTS reservas (
  id                SERIAL PRIMARY KEY,
  cliente_nombre    TEXT    NOT NULL,
  cliente_telefono  TEXT    NOT NULL,
  servicio_id       INTEGER NOT NULL REFERENCES servicios(id),
  fecha             TEXT    NOT NULL,
  hora_inicio       TEXT    NOT NULL,
  hora_fin          TEXT    NOT NULL,
  estado            TEXT    NOT NULL DEFAULT 'confirmada',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id             SERIAL PRIMARY KEY,
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL
);

-- Índices para acelerar consultas de agenda
CREATE INDEX IF NOT EXISTS idx_reservas_fecha        ON reservas(fecha);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha_estado ON reservas(fecha, estado);
CREATE INDEX IF NOT EXISTS idx_bloqueos_fecha        ON bloqueos(fecha);

-- =============================================
-- Función atómica para crear reserva sin doble turno
-- Verifica conflictos y hace el INSERT en una sola transacción
-- =============================================
CREATE OR REPLACE FUNCTION crear_reserva(
  p_nombre       TEXT,
  p_telefono     TEXT,
  p_servicio_id  INTEGER,
  p_fecha        TEXT,
  p_hora_inicio  TEXT,
  p_hora_fin     TEXT
) RETURNS INTEGER AS $$
DECLARE
  conflicto  INTEGER;
  nueva_id   INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflicto
  FROM reservas
  WHERE fecha = p_fecha
    AND estado != 'cancelada'
    AND hora_inicio < p_hora_fin
    AND hora_fin    > p_hora_inicio;

  IF conflicto > 0 THEN
    RAISE EXCEPTION 'HORARIO_OCUPADO';
  END IF;

  SELECT COUNT(*) INTO conflicto
  FROM bloqueos
  WHERE fecha = p_fecha
    AND hora_inicio < p_hora_fin
    AND hora_fin    > p_hora_inicio;

  IF conflicto > 0 THEN
    RAISE EXCEPTION 'HORARIO_BLOQUEADO';
  END IF;

  INSERT INTO reservas
    (cliente_nombre, cliente_telefono, servicio_id, fecha, hora_inicio, hora_fin, estado)
  VALUES
    (p_nombre, p_telefono, p_servicio_id, p_fecha, p_hora_inicio, p_hora_fin, 'confirmada')
  RETURNING id INTO nueva_id;

  RETURN nueva_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Datos iniciales (solo si las tablas están vacías)
-- =============================================
INSERT INTO servicios (nombre, duracion)
SELECT 'Corte de pelo', 30
WHERE NOT EXISTS (SELECT 1 FROM servicios LIMIT 1);

INSERT INTO servicios (nombre, duracion)
SELECT 'Corte de pelo + Barba', 45
WHERE NOT EXISTS (SELECT 1 FROM servicios WHERE nombre = 'Corte de pelo + Barba');

INSERT INTO horarios (dia_semana, hora_inicio, hora_fin)
SELECT d, '09:00', '18:00'
FROM generate_series(1, 5) AS d
WHERE NOT EXISTS (SELECT 1 FROM horarios WHERE dia_semana = d);
