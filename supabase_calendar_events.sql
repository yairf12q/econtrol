-- טבלת אירועי לוח שנה
CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
    client_name TEXT,
    hours DECIMAL(5,2) NOT NULL DEFAULT 0,
    description TEXT,
    start_time TIME,
    end_time TIME,
    type TEXT NOT NULL DEFAULT 'session' CHECK (type IN ('session', 'meeting', 'task', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- אינדקסים לביצועים טובים יותר
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client_id ON calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_at ON calendar_events(created_at);

-- פונקציה לעדכון זמן עדכון אוטומטי
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- טריגר לעדכון זמן עדכון אוטומטי
DROP TRIGGER IF EXISTS trigger_update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER trigger_update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_events_updated_at();

-- מדיניות גישה (RLS) - רק משתמשים מחוברים יכולים לגשת
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- מדיניות לקריאה - כל המשתמשים יכולים לקרוא
CREATE POLICY "Allow read access to calendar events" ON calendar_events
    FOR SELECT USING (true);

-- מדיניות לכתיבה - כל המשתמשים יכולים לכתוב
CREATE POLICY "Allow insert access to calendar events" ON calendar_events
    FOR INSERT WITH CHECK (true);

-- מדיניות לעדכון - כל המשתמשים יכולים לעדכן
CREATE POLICY "Allow update access to calendar events" ON calendar_events
    FOR UPDATE USING (true);

-- מדיניות למחיקה - כל המשתמשים יכולים למחוק
CREATE POLICY "Allow delete access to calendar events" ON calendar_events
    FOR DELETE USING (true);

-- פונקציה לקבלת אירועים לפי תאריך
CREATE OR REPLACE FUNCTION get_events_by_date(event_date DATE)
RETURNS TABLE (
    id TEXT,
    date DATE,
    client_id TEXT,
    client_name TEXT,
    hours DECIMAL(5,2),
    description TEXT,
    start_time TIME,
    end_time TIME,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.date,
        ce.client_id,
        ce.client_name,
        ce.hours,
        ce.description,
        ce.start_time,
        ce.end_time,
        ce.type,
        ce.created_at,
        ce.updated_at
    FROM calendar_events ce
    WHERE ce.date = event_date
    ORDER BY ce.start_time ASC NULLS LAST, ce.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- פונקציה לקבלת אירועים לפי לקוח
CREATE OR REPLACE FUNCTION get_events_by_client(client_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    date DATE,
    client_id TEXT,
    client_name TEXT,
    hours DECIMAL(5,2),
    description TEXT,
    start_time TIME,
    end_time TIME,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id,
        ce.date,
        ce.client_id,
        ce.client_name,
        ce.hours,
        ce.description,
        ce.start_time,
        ce.end_time,
        ce.type,
        ce.created_at,
        ce.updated_at
    FROM calendar_events ce
    WHERE ce.client_id = client_id_param
    ORDER BY ce.date DESC, ce.start_time ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- פונקציה לקבלת סיכום שעות לפי חודש
CREATE OR REPLACE FUNCTION get_monthly_hours_summary(year_param INTEGER, month_param INTEGER)
RETURNS TABLE (
    client_id TEXT,
    client_name TEXT,
    total_hours DECIMAL(8,2),
    event_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.client_id,
        ce.client_name,
        SUM(ce.hours) as total_hours,
        COUNT(*) as event_count
    FROM calendar_events ce
    WHERE EXTRACT(YEAR FROM ce.date) = year_param 
      AND EXTRACT(MONTH FROM ce.date) = month_param
    GROUP BY ce.client_id, ce.client_name
    ORDER BY total_hours DESC;
END;
$$ LANGUAGE plpgsql;

-- הוספת הערות לטבלה
COMMENT ON TABLE calendar_events IS 'טבלת אירועי לוח שנה למערכת ניהול זמן';
COMMENT ON COLUMN calendar_events.id IS 'מזהה ייחודי של האירוע';
COMMENT ON COLUMN calendar_events.date IS 'תאריך האירוע';
COMMENT ON COLUMN calendar_events.client_id IS 'מזהה הלקוח (קישור לטבלת לקוחות)';
COMMENT ON COLUMN calendar_events.client_name IS 'שם הלקוח (שמירה מקומית)';
COMMENT ON COLUMN calendar_events.hours IS 'מספר השעות של האירוע';
COMMENT ON COLUMN calendar_events.description IS 'תיאור האירוע';
COMMENT ON COLUMN calendar_events.start_time IS 'שעת התחלה (אופציונלי)';
COMMENT ON COLUMN calendar_events.end_time IS 'שעת סיום (אופציונלי)';
COMMENT ON COLUMN calendar_events.type IS 'סוג האירוע: session, meeting, task, other';
COMMENT ON COLUMN calendar_events.created_at IS 'זמן יצירת הרשומה';
COMMENT ON COLUMN calendar_events.updated_at IS 'זמן עדכון אחרון של הרשומה'; 