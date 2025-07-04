-- =====================================================
-- סכמת מסד נתונים למערכת ניהול זמן לקוחות - ez-control
-- =====================================================

-- טבלת לקוחות
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  total_hours DECIMAL(10,2) DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  last_work_date DATE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  sessions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- טבלת אירועי לוח שנה
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  client_name TEXT,
  hours DECIMAL(5,2) NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  type TEXT DEFAULT 'session' CHECK (type IN ('session', 'meeting', 'task', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- טבלת סשנים (נפרדת)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  hours DECIMAL(5,2) NOT NULL,
  minutes INTEGER DEFAULT 0,
  description TEXT,
  project_name TEXT,
  task_type TEXT,
  status TEXT DEFAULT 'completed',
  rate_per_hour DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- טבלת פרויקטים
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  total_hours DECIMAL(10,2) DEFAULT 0,
  budget DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- טבלת הגדרות מערכת
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT DEFAULT 'ez-control',
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

-- טבלת גיבויים
CREATE TABLE IF NOT EXISTS backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL,
  data JSONB NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- טבלת לוג פעילות
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  user_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- אינדקסים לביצועים טובים יותר
-- =====================================================

-- אינדקסים לטבלת לקוחות
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- אינדקסים לטבלת אירועי לוח שנה
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client_id ON calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);

-- אינדקסים לטבלת סשנים
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- אינדקסים לטבלת פרויקטים
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- אינדקסים לטבלת לוג פעילות
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- =====================================================
-- פונקציות טריגר לעדכון timestamps
-- =====================================================

-- פונקציה לעדכון updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- טריגרים לעדכון updated_at
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at 
    BEFORE UPDATE ON calendar_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- פונקציות עזר
-- =====================================================

-- פונקציה לחישוב שעות כוללות של לקוח
CREATE OR REPLACE FUNCTION calculate_client_total_hours(client_id_param TEXT)
RETURNS DECIMAL AS $$
DECLARE
    total DECIMAL;
BEGIN
    SELECT COALESCE(SUM(hours), 0) INTO total
    FROM sessions 
    WHERE client_id = client_id_param;
    
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- פונקציה לעדכון שעות כוללות של לקוח
CREATE OR REPLACE FUNCTION update_client_total_hours()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE clients 
    SET total_hours = calculate_client_total_hours(NEW.client_id),
        updated_at = NOW()
    WHERE id = NEW.client_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- טריגר לעדכון שעות כוללות
CREATE TRIGGER update_client_hours_after_session
    AFTER INSERT OR UPDATE OR DELETE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_client_total_hours();

-- =====================================================
-- מדיניות גישה (RLS)
-- =====================================================

-- הפעלת RLS על כל הטבלאות
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- מדיניות גישה - מאפשרת כל הפעולות (לצורך פיתוח)
CREATE POLICY "Allow all operations on clients" ON clients
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on calendar_events" ON calendar_events
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on sessions" ON sessions
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on projects" ON projects
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on system_settings" ON system_settings
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on backups" ON backups
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on activity_logs" ON activity_logs
    FOR ALL USING (true);

-- =====================================================
-- נתונים ראשוניים
-- =====================================================

-- הכנסת הגדרות מערכת ראשוניות
INSERT INTO system_settings (company_name, company_slogan, default_rate_per_hour, currency, timezone, language, theme)
VALUES (
    'ez-control',
    'אנרגיה - אינטגרציה - בקרים - מערכות חכמות - טכנולוגיות מתקדמות',
    150.00,
    'ILS',
    'Asia/Jerusalem',
    'he',
    'light'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- הרשאות
-- =====================================================

-- מתן הרשאות למשתמש anon
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- מתן הרשאות למשתמש authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- הודעת סיום
-- =====================================================

-- הצגת הודעת סיום
DO $$
BEGIN
    RAISE NOTICE 'סכמת מסד הנתונים נוצרה בהצלחה!';
    RAISE NOTICE 'הטבלאות זמינות לשימוש במערכת ez-control';
END $$; 