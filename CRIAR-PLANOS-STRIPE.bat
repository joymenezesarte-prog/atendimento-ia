@echo off
cd /d "%~dp0"
echo Criando planos no Stripe...
node setup-stripe.js
pause
