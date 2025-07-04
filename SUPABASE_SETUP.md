# הוראות הגדרת סופו בייס - ez-control

## 📋 שלבים להגדרת מסד הנתונים

### 1. יצירת פרויקט בסופו בייס

1. היכנס ל-[supabase.com](https://supabase.com)
2. לחץ על "New Project"
3. בחר ארגון או צור חדש
4. תן שם לפרויקט: `ez-control`
5. בחר סיסמה חזקה למסד הנתונים
6. בחר אזור קרוב (למשל: West Europe)
7. לחץ על "Create new project"

### 2. קבלת פרטי החיבור

1. לאחר יצירת הפרויקט, עבור ל-Settings > API
2. העתק את ה-URL וה-anon key
3. עדכן את הקובץ `src/lib/supabase.ts`:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. יצירת הטבלאות

#### שיטה 1: SQL Editor (מומלץ)

1. עבור ל-SQL Editor בסופו בייס
2. לחץ על "New Query"
3. העתק את כל התוכן מקובץ `supabase_schema.sql`
4. לחץ על "Run" או Ctrl+Enter

#### שיטה 2: Table Editor

אם אתה מעדיף ליצור טבלאות ידנית:

##### טבלת לקוחות (clients)
```sql
CREATE TABLE clients (
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
```

##### טבלת אירועי לוח שנה (calendar_events)
```sql
CREATE TABLE calendar_events (
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
```

### 4. הגדרת מדיניות גישה (RLS)

לאחר יצירת הטבלאות, הפעל את הפקודות הבאות:

```sql
-- הפעלת RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- יצירת מדיניות גישה
CREATE POLICY "Allow all operations on clients" ON clients
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on calendar_events" ON calendar_events
    FOR ALL USING (true);
```

### 5. בדיקת החיבור

1. הפעל את האפליקציה: `npm run dev`
2. פתח את הדפדפן ב-`http://localhost:8085`
3. פתח את Developer Tools (F12)
4. עבור לטאב Console
5. בדוק שאין שגיאות חיבור לסופו בייס

### 6. פתרון בעיות נפוצות

#### שגיאה: "relation does not exist"
- וודא שהטבלאות נוצרו בהצלחה
- בדוק את שמות הטבלאות (case sensitive)
- רענן את הדף

#### שגיאה: "permission denied"
- וודא שה-RLS מוגדר נכון
- בדוק שה-policies נוצרו
- וודא שה-anon key נכון

#### שגיאה: "network error"
- בדוק את ה-URL של סופו בייס
- וודא שהפרויקט פעיל
- בדוק את חיבור האינטרנט

### 7. בדיקת הטבלאות

לאחר יצירת הטבלאות, תוכל לבדוק אותן:

1. עבור ל-Table Editor בסופו בייס
2. תראה את הטבלאות: `clients`, `calendar_events`
3. לחץ על כל טבלה כדי לראות את המבנה

### 8. הוספת נתונים לדוגמה

```sql
-- הוספת לקוח לדוגמה
INSERT INTO clients (id, name, email, company) 
VALUES ('client-1', 'לקוח לדוגמה', 'test@example.com', 'חברה לדוגמה');

-- הוספת אירוע לוח שנה לדוגמה
INSERT INTO calendar_events (date, client_id, client_name, hours, description, type)
VALUES ('2024-01-15', 'client-1', 'לקוח לדוגמה', 2.5, 'פגישה ראשונית', 'meeting');
```

## 🔧 הגדרות נוספות

### הגדרת Webhooks (אופציונלי)
אם תרצה לקבל התראות על שינויים:

1. עבור ל-Database > Webhooks
2. צור webhook חדש
3. הגדר URL endpoint
4. בחר את הטבלאות הרלוונטיות

### הגדרת Storage (אופציונלי)
לשמירת קבצים:

1. עבור ל-Storage
2. צור bucket חדש
3. הגדר מדיניות גישה
4. עדכן את הקוד בהתאם

## 📞 תמיכה

אם אתה נתקל בבעיות:

1. בדוק את ה-logs בסופו בייס
2. פתח את Developer Tools בדפדפן
3. בדוק את ה-Console לראות שגיאות
4. צור Issue ב-GitHub עם פרטי השגיאה

## ✅ סימון השלמה

- [ ] פרויקט סופו בייס נוצר
- [ ] URL ו-API Key הועתקו
- [ ] קובץ `supabase.ts` עודכן
- [ ] הטבלאות נוצרו
- [ ] RLS הוגדר
- [ ] האפליקציה מתחברת בהצלחה
- [ ] נתונים נשמרים ונטענים

---

**ez-control** - מערכת ניהול זמן מתקדמת 🚀 