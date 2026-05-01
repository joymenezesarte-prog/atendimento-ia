@echo off
cd /d "%~dp0"
echo Enviando atualizacoes para o GitHub...
git add .
git commit -m "feat: supabase auth, stripe integration, APIs e tabelas do banco"
git push origin main
echo.
echo Pronto!
pause
