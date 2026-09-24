-- ==========================================
-- XpiPet Database Schema - SQLite/Turso MVP v1.0
-- ==========================================

-- 1. Usuarios
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  avatar_key TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

-- 2. Mascotas
CREATE TABLE IF NOT EXISTS pets (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  color TEXT,
  sex TEXT,
  status TEXT DEFAULT 'home',
  microchip TEXT,
  gps_enabled INTEGER DEFAULT 0,
  last_known_location_lat REAL,
  last_known_location_lng REAL,
  last_location_updated_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  deleted_at TEXT
);

-- 3. Perfiles detallados
CREATE TABLE IF NOT EXISTS pet_profiles (
  pet_id TEXT PRIMARY KEY REFERENCES pets(id),
  birth_date TEXT,
  arrival_date TEXT,
  origin TEXT,
  story TEXT,
  characteristics TEXT,
  weight_current REAL,
  weight_unit TEXT DEFAULT 'kg'
);

-- 4. Multimedia (Fotos, Videos, Documentos)
CREATE TABLE IF NOT EXISTS pet_media (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id),
  type TEXT NOT NULL,
  object_key TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  visibility TEXT DEFAULT 'private',
  category TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 5. Eventos (Línea de tiempo)
CREATE TABLE IF NOT EXISTS pet_events (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL,
  location TEXT,
  latitude REAL,
  longitude REAL,
  media_ids TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 6. Registros médicos
CREATE TABLE IF NOT EXISTS medical_records (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  vet_name TEXT,
  vet_contact TEXT,
  date TEXT NOT NULL,
  next_control TEXT,
  document_keys TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 7. Vacunas
CREATE TABLE IF NOT EXISTS vaccinations (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id),
  vaccine_name TEXT NOT NULL,
  date_administered TEXT NOT NULL,
  next_due TEXT,
  lot_number TEXT,
  vet_name TEXT,
  document_key TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 8. Reportes de pérdida
CREATE TABLE IF NOT EXISTS lost_reports (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id),
  date_lost TEXT NOT NULL,
  location_text TEXT,
  latitude REAL,
  longitude REAL,
  description TEXT,
  additional_photos TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

-- 9. Reportes de encontrados
CREATE TABLE IF NOT EXISTS found_reports (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id),
  reporter_name TEXT,
  reporter_contact TEXT,
  reporter_message TEXT,
  location_text TEXT,
  latitude REAL,
  longitude REAL,
  photo_key TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 10. Ubicaciones GPS Crowdsourced
CREATE TABLE IF NOT EXISTS gps_locations (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id),
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy_meters INTEGER,
  reported_by_user_id TEXT REFERENCES users(id),
  is_anonymous INTEGER DEFAULT 1,
  device_type TEXT DEFAULT 'crowdsourced',
  battery_level INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 11. Permisos
CREATE TABLE IF NOT EXISTS pet_permissions (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL,
  granted_at TEXT DEFAULT (datetime('now')),
  granted_by TEXT REFERENCES users(id),
  expires_at TEXT,
  UNIQUE(pet_id, user_id)
);

-- 12. Recordatorios
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  recurrence TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 13. Logs de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 14. Códigos QR
CREATE TABLE IF NOT EXISTS qr_codes (
  id TEXT PRIMARY KEY,
  pet_id TEXT UNIQUE NOT NULL REFERENCES pets(id),
  public_url TEXT NOT NULL,
  qr_image_key TEXT,
  scan_count INTEGER DEFAULT 0,
  last_scanned_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 15. Etiquetas NFC
CREATE TABLE IF NOT EXISTS nfc_tags (
  id TEXT PRIMARY KEY,
  pet_id TEXT UNIQUE NOT NULL REFERENCES pets(id),
  tag_identifier TEXT,
  public_url TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 16. Suscripciones (Futuro)
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  plan TEXT DEFAULT 'free',
  storage_limit_gb INTEGER DEFAULT 1,
  pets_limit INTEGER DEFAULT 1,
  stripe_customer_id TEXT,
  current_period_end TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

-- ==========================================
-- Índices Críticos
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_pets_public_id ON pets(public_id);
CREATE INDEX IF NOT EXISTS idx_pets_owner_status ON pets(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_pets_gps_enabled ON pets(gps_enabled, status);
CREATE INDEX IF NOT EXISTS idx_pet_media_pet_visibility ON pet_media(pet_id, visibility);
CREATE INDEX IF NOT EXISTS idx_lost_reports_status ON lost_reports(status);
CREATE INDEX IF NOT EXISTS idx_found_reports_pet_status ON found_reports(pet_id, status);
CREATE INDEX IF NOT EXISTS idx_gps_locations_pet_created ON gps_locations(pet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_pet_date ON medical_records(pet_id, date);
CREATE INDEX IF NOT EXISTS idx_events_pet_date ON pet_events(pet_id, event_date);