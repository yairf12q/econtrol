@echo off
setlocal enabledelayedexpansion

:: === עדכן כאן את ה־URL של הריפו החדש שלך ===
set NEW_REPO_URL=https://github.com/ticnutai/time-track-clients-pro.git

echo 🚨 מוחק origin ישן (אם קיים)...
git remote remove origin 2>nul

echo 🔗 מחבר לריפו חדש...
git remote add origin %NEW_REPO_URL%

echo ✅ מוסיף את כל הקבצים...
git add .

echo 📝 מבצע commit...
git commit -m "Initial commit to new repo" -a

echo 🚀 דוחף ל-main...
git push -u origin main

echo 🎉 בוצע בהצלחה!
pause
