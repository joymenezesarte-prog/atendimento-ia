@echo off
cd /d "%~dp0"

echo Removendo arquivos de script do git...
git rm --cached setup-stripe.js 2>nul
git rm --cached ENVIAR-GITHUB.bat 2>nul
git rm --cached push-github.ps1 2>nul
git rm --cached FAZER-PUSH.bat 2>nul
git rm --cached INSTALAR-SUPABASE.bat 2>nul
git rm --cached CRIAR-PLANOS-STRIPE.bat 2>nul
git rm --cached PUSH-ATUALIZACAO.bat 2>nul

echo Fazendo commit e push...
git add .
git commit -m "feat: supabase auth, stripe integration, APIs, tabelas e correcoes"
git push origin main

echo.
echo Pronto!
pause
