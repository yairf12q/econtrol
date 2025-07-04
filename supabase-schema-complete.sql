-- =====================================================
-- סכמה מלאה למערכת ezcontrol - ניהול זמן לקוחות
-- =====================================================

-- יצירת טבלת לקוחות
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  total_hours DECIMAL(10,4) DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  last_work_date TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  sessions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת סשנים מפורטים
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  hours DECIMAL(10,4) NOT NULL,
  minutes INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  project_name TEXT,
  task_type TEXT,
  status TEXT DEFAULT 'completed',
  rate_per_hour DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת פרויקטים
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'active',
  total_hours DECIMAL(10,4) DEFAULT 0,
  budget DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת הגדרות מערכת
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT DEFAULT 'ezcontrol',
  company_slogan TEXT DEFAULT 'אנרגיה - אינטגרציה - בקרים - מערכות חכמות - טכנולוגיות מתקדמות',
  default_rate_per_hour DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'ILS',
  timezone TEXT DEFAULT 'Asia/Jerusalem',
  language TEXT DEFAULT 'he',
  theme TEXT DEFAULT 'light',
  backup_frequency TEXT DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת גיבויים
CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  backup_type TEXT NOT NULL, -- 'manual', 'auto', 'export'
  data JSONB NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת לוגים
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'export', 'import'
  table_name TEXT,
  record_id TEXT,
  user_id TEXT DEFAULT 'system',
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- יצירת אינדקסים לביצועים טובים יותר
-- =====================================================

-- אינדקסים לטבלת לקוחות
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_updated_at ON clients(updated_at);
CREATE INDEX IF NOT EXISTS idx_clients_total_hours ON clients(total_hours);

-- אינדקסים לטבלת סשנים
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_project_name ON sessions(project_name);

-- אינדקסים לטבלת פרויקטים
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- אינדקסים לטבלת לוגים
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_table_name ON activity_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- =====================================================
-- הגדרת RLS (Row Level Security)
-- =====================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- מדיניות גישה לטבלת לקוחות
CREATE POLICY "Allow all operations on clients" ON clients
  FOR ALL USING (true);

-- מדיניות גישה לטבלת סשנים
CREATE POLICY "Allow all operations on sessions" ON sessions
  FOR ALL USING (true);

-- מדיניות גישה לטבלת פרויקטים
CREATE POLICY "Allow all operations on projects" ON projects
  FOR ALL USING (true);

-- מדיניות גישה לטבלת הגדרות
CREATE POLICY "Allow all operations on system_settings" ON system_settings
  FOR ALL USING (true);

-- מדיניות גישה לטבלת גיבויים
CREATE POLICY "Allow all operations on backups" ON backups
  FOR ALL USING (true);

-- מדיניות גישה לטבלת לוגים
CREATE POLICY "Allow all operations on activity_logs" ON activity_logs
  FOR ALL USING (true);

-- =====================================================
-- פונקציות וטריגרים
-- =====================================================

-- פונקציה לעדכון זמן עדכון אוטומטי
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- פונקציה לעדכון סטטיסטיקות לקוח
CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- עדכון סטטיסטיקות לקוח
  UPDATE clients 
  SET 
    total_hours = (
      SELECT COALESCE(SUM(hours), 0) 
      FROM sessions 
      WHERE client_id = NEW.client_id
    ),
    total_minutes = (
      SELECT COALESCE(SUM(minutes), 0) 
      FROM sessions 
      WHERE client_id = NEW.client_id
    ),
    total_sessions = (
      SELECT COUNT(*) 
      FROM sessions 
      WHERE client_id = NEW.client_id
    ),
    last_work_date = (
      SELECT MAX(date) 
      FROM sessions 
      WHERE client_id = NEW.client_id
    ),
    updated_at = NOW()
  WHERE id = NEW.client_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- פונקציה ליצירת לוג פעילות
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (action, table_name, record_id, details)
  VALUES (
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- =====================================================
-- טריגרים
-- =====================================================

-- טריגר לעדכון זמן עדכון אוטומטי
CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
  BEFORE UPDATE ON sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON system_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- טריגר לעדכון סטטיסטיקות לקוח
CREATE TRIGGER update_client_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_client_stats();

-- טריגר ללוג פעילות
CREATE TRIGGER log_clients_activity
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_sessions_activity
  AFTER INSERT OR UPDATE OR DELETE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_projects_activity
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION log_activity();

-- =====================================================
-- הכנסת נתונים ראשוניים
-- =====================================================

-- הכנסת הגדרות מערכת ברירת מחדל
INSERT INTO system_settings (id, company_name, company_slogan, default_rate_per_hour, currency, timezone, language, theme)
VALUES (
  'default',
  'ezcontrol',
  'אנרגיה - אינטגרציה - בקרים - מערכות חכמות - טכנולוגיות מתקדמות',
  150.00,
  'ILS',
  'Asia/Jerusalem',
  'he',
  'light'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- הרשאות
-- =====================================================

-- מתן הרשאות לקריאה וכתיבה
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- =====================================================
-- הודעת סיום
-- =====================================================

-- SELECT 'ezcontrol database schema created successfully!' as status; 