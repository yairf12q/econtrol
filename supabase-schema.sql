-- יצירת טבלת לקוחות
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  total_hours DECIMAL(10,4) DEFAULT 0,
  sessions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת אינדקסים לביצועים טובים יותר
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_updated_at ON clients(updated_at);

-- יצירת טבלת סשנים (אופציונלי - אם רוצים טבלה נפרדת)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  hours DECIMAL(10,4) NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת אינדקסים לטבלת סשנים
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);

-- הגדרת RLS (Row Level Security) - אופציונלי
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- מדיניות גישה לטבלת לקוחות (כל אחד יכול לקרוא ולכתוב)
CREATE POLICY "Allow all operations on clients" ON clients
  FOR ALL USING (true);

-- מדיניות גישה לטבלת סשנים (כל אחד יכול לקרוא ולכתוב)
CREATE POLICY "Allow all operations on sessions" ON sessions
  FOR ALL USING (true);

-- פונקציה לעדכון זמן עדכון אוטומטי
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- טריגר לעדכון זמן עדכון אוטומטי
CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 