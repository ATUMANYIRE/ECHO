# Start ECHO Next.js Frontend on Windows
Write-Host "Starting ECHO Frontend on port 3005..." -ForegroundColor Cyan

$env:PORT = "3005"
$env:NEXT_PUBLIC_API_URL = "http://localhost:8005"

npm run dev --prefix frontend
