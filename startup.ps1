# --- Local ---
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "cd 'C:\Users\gfmatos\Documents\project\src\backend'; python perimetro.py"

# --- Remoto via Tailscale SSH ---
ssh user@100.92.202.79 "pkill -f perimetro.py; sleep 2; cd /caminho/para/project/src/backend && nohup python perimetro.py &"