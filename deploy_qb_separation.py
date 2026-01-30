import paramiko

HOST = '72.62.76.73'
USER = 'root'  
PASSWORD = 'Maruti)Balaji2024'
PROJECT_PATH = '/home/testdone/testdone'  # Correct path!

print("Connecting to VPS...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
print("Connected!\n")

commands = [
    # Check current state
    (f"cd {PROJECT_PATH} && git log --oneline -1", "Current commit"),
    
    # Pull latest changes
    (f"cd {PROJECT_PATH} && git pull origin main", "Git pull"),
    
    # Build backend
    (f"cd {PROJECT_PATH}/backend && npm run build 2>&1 | tail -5", "Build backend"),
    
    # Restart backend gracefully
    ("pm2 restart testdone-backend --update-env", "Restart backend"),
    
    # Verify changes deployed
    (f"grep -n 'PHASE 1' {PROJECT_PATH}/backend/src/routes/question.routes.ts", "Verify changes"),
    
    # Check PM2 status
    ("pm2 list", "PM2 status"),
]

for cmd, desc in commands:
    print(f"\n{'='*50}")
    print(f">>> {desc}")
    print(f"{'='*50}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(out)
    if err:
        print(f"STDERR: {err}")
    print()

client.close()
print("\n✓ Deployment complete!")
