# מערכת ניהול זמן לקוחות - ez-control

מערכת מתקדמת לניהול זמן עבודה עם לקוחות, כולל טיימר צף, לוח שנה, וסנכרון עם סופו בייס.

## 🌟 תכונות עיקריות

### 📊 ניהול לקוחות
- הוספת לקוחות חדשים
- מעקב אחר שעות עבודה
- היסטוריית סשנים
- עריכת פרטי לקוחות

### ⏱️ טיימר צף
- טיימר מתקדם עם הפסקה והמשך
- שמירת זמן אוטומטית
- הפעלה מחדש של סשן אחרון
- תצוגה יפה עם אנימציות

### 📅 לוח שנה מתקדם
- תצוגות: יום, שבוע, חודש, שנה
- הוספת אירועים עם שעות ותיאור
- סוגי אירועים: סשן, פגישה, משימה, אחר
- ניווט עם חיצים

### 🔄 סנכרון נתונים
- שמירה מקומית ב-localStorage
- סנכרון עם סופו בייס
- גיבוי אוטומטי
- שחזור נתונים

### 🎨 עיצוב מתקדם
- תמיכה מלאה בעברית RTL
- גרדיאנטים פסטליים
- אפקטים זכוכיתיים
- אנימציות חלקות

## 🚀 התקנה והפעלה

### דרישות מקדימות
- Node.js 18+
- npm או yarn
- חשבון סופו בייס (אופציונלי)

### התקנה
```bash
# שכפול הפרויקט
git clone [repository-url]
cd time-track-clients-pro-main

# התקנת תלויות
npm install

# הפעלת השרת
npm run dev
```

האתר יהיה זמין ב: `http://localhost:8085`

## 📖 הוראות שימוש

### הוספת לקוח חדש
1. לחץ על כפתור "הוסף לקוח" בדף הבית
2. הכנס את שם הלקוח
3. לחץ על "הוסף"

### שימוש בטיימר
1. לחץ על אייקון השעון בפינה השמאלית העליונה
2. בחר לקוח מהרשימה
3. לחץ על "התחל" כדי להתחיל טיימר
4. לחץ על "הפסק" להשהייה
5. לחץ על "שמור וסיים" לשמירת הזמן

### הוספת אירוע ללוח שנה
1. לחץ על "הצג לוח שנה"
2. בחר תצוגה: יום/שבוע/חודש/שנה
3. לחץ על "הוסף אירוע"
4. מלא את הפרטים:
   - תאריך
   - לקוח (אופציונלי)
   - שעות
   - סוג אירוע
   - תיאור
   - שעות התחלה וסיום (אופציונלי)

### עריכת סשן
1. עבור לעמוד הלקוח
2. לחץ על אייקון העריכה ליד הסשן
3. שנה את השעות או התיאור
4. לחץ על "שמור שינויים"

## 🗄️ הגדרת סופו בייס

### יצירת פרויקט
1. היכנס ל-[supabase.com](https://supabase.com)
2. צור פרויקט חדש
3. העתק את ה-URL וה-API Key

### הגדרת הטבלאות
הרץ את הקוד SQL הבא ב-SQL Editor:

```sql
-- טבלת לקוחות
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

-- טבלת אירועי לוח שנה
CREATE TABLE calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  client_name TEXT,
  hours DECIMAL(5,2) NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  type TEXT DEFAULT 'session',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- מדיניות גישה
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on clients" ON clients
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on calendar_events" ON calendar_events
  FOR ALL USING (true);
```

### עדכון הגדרות
עדכן את הקובץ `src/lib/supabase.ts` עם הפרטים שלך:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

## 🎯 תכונות מתקדמות

### ייצוא נתונים
- ייצוא ל-JSON
- ייצוא ל-Excel
- גיבוי אוטומטי

### סינון וחיפוש
- סינון לפי לקוח
- חיפוש בסשנים
- מיון לפי תאריך

### התראות
- התראות על שמירת זמן
- התראות על שגיאות
- אישורי מחיקה

## 🔧 פיתוח

### מבנה הפרויקט
```
src/
├── components/          # קומפוננטות React
│   ├── ui/             # קומפוננטות UI בסיסיות
│   ├── Calendar.tsx    # לוח שנה
│   ├── ClientDetails.tsx # פרטי לקוח
│   └── FloatingTimer.tsx # טיימר צף
├── hooks/              # React Hooks
│   └── useClients.ts   # ניהול נתוני לקוחות
├── lib/                # ספריות וקונפיגורציה
│   └── supabase.ts     # הגדרות סופו בייס
└── pages/              # דפי האתר
    └── Index.tsx       # דף הבית
```

### טכנולוגיות
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Local Storage**: localStorage
- **Build Tool**: Vite

### סקריפטים זמינים
```bash
npm run dev          # הפעלת שרת פיתוח
npm run build        # בניית גרסת ייצור
npm run preview      # תצוגה מקדימה של ייצור
npm run lint         # בדיקת קוד
```

## 🐛 פתרון בעיות

### בעיות חיבור לסופו בייס
1. בדוק שה-URL וה-API Key נכונים
2. וודא שהטבלאות נוצרו
3. בדוק את מדיניות הגישה (RLS)

### בעיות טיימר
1. רענן את הדף
2. בדוק שהלקוח נבחר
3. נקה את ה-localStorage אם יש בעיות

### בעיות RTL
1. וודא שכל הקומפוננטות כוללות `dir="rtl"`
2. בדוק את קובץ CSS לתמיכה RTL
3. השתמש ב-`text-right` ו-`justify-end`

## 📞 תמיכה

לשאלות ותמיכה:
- פתח Issue ב-GitHub
- צור קשר עם הצוות

## 📄 רישיון

MIT License - ראה קובץ LICENSE לפרטים.

---

**ez-control** - אנרגיה - אינטגרציה - בקרים - מערכות חכמות - טכנולוגיות מתקדמות 