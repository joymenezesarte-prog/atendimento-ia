# Para usar: defina a variável de ambiente GITHUB_TOKEN antes de rodar
# $env:GITHUB_TOKEN = "seu_token_aqui"
$TOKEN = $env:GITHUB_TOKEN
if (-not $TOKEN) {
    Write-Host "ERRO: Defina a variável GITHUB_TOKEN antes de executar este script." -ForegroundColor Red
    Write-Host "Exemplo: `$env:GITHUB_TOKEN = 'ghp_...'" -ForegroundColor Yellow
    pause
    exit 1
}

$REPO = "joymenezesarte-prog/atendimento-ia"
$BRANCH = "main"
$BASE = $PSScriptRoot

$headers = @{
    Authorization = "token $TOKEN"
    Accept = "application/vnd.github.v3+json"
    "Content-Type" = "application/json"
}

function Push-File($localPath, $remotePath) {
    $content = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($localPath))

    try {
        $current = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/contents/$remotePath" -Headers $headers -Method Get
        $sha = $current.sha
    } catch {
        $sha = $null
    }

    $body = @{ message = "feat: automacao n8n para whatsapp instagram e widget + fix offline"; content = $content; branch = $BRANCH }
    if ($sha) { $body.sha = $sha }

    try {
        Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/contents/$remotePath" -Headers $headers -Method Put -Body ($body | ConvertTo-Json -Depth 5) | Out-Null
        Write-Host "OK: $remotePath" -ForegroundColor Green
    } catch {
        Write-Host "ERRO: $remotePath - $_" -ForegroundColor Red
    }
}

Write-Host "Enviando arquivos para o GitHub..." -ForegroundColor Cyan

Push-File "$BASE\src\lib\supabase-admin.ts" "src/lib/supabase-admin.ts"
Push-File "$BASE\src\lib\chatwoot.ts" "src/lib/chatwoot.ts"
Push-File "$BASE\src\app\admin\clients\page.tsx" "src/app/admin/clients/page.tsx"
Push-File "$BASE\src\app\admin\agents\page.tsx" "src/app/admin/agents/page.tsx"
Push-File "$BASE\src\app\api\admin\clients\[id]\access\route.ts" "src/app/api/admin/clients/%5Bid%5D/access/route.ts"
Push-File "$BASE\src\app\api\admin\clients\setup\route.ts" "src/app/api/admin/clients/setup/route.ts"
Push-File "$BASE\src\app\api\admin\agents\[id]\route.ts" "src/app/api/admin/agents/%5Bid%5D/route.ts"
Push-File "$BASE\src\app\api\admin\agents\[id]\create-widget\route.ts" "src/app/api/admin/agents/%5Bid%5D/create-widget/route.ts"
Push-File "$BASE\src\app\api\admin\agents\[id]\fix-inbox\route.ts" "src/app/api/admin/agents/%5Bid%5D/fix-inbox/route.ts"

Write-Host ""
Write-Host "Pronto! Aguarde o EasyPanel fazer o deploy automatico (~2 min)." -ForegroundColor Cyan
pause
