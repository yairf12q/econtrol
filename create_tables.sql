-- יצירת טבלאות בסיסיות למערכת e-control

-- טבלת לקוחות
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  total_hours DECIMAL(10,2) DEFAULT 0,
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

-- הפעלת RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- יצירת מדיניות גישה
CREATE POLICY "Allow all operations on clients" ON clients
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on calendar_events" ON calendar_events
    FOR ALL USING (true);

-- מתן הרשאות
GRANT ALL ON clients TO anon;
GRANT ALL ON calendar_events TO anon;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON calendar_events TO authenticated;

-- הוספת לקוח לדוגמה
INSERT INTO clients (id, name, total_hours) 
VALUES ('demo-client', 'לקוח לדוגמה', 0)
ON CONFLICT (id) DO NOTHING; 