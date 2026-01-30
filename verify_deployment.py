import paramiko

HOST = '72.62.76.73'
USER = 'root'  
PASSWORD = 'Maruti)Balaji2024'
PROJECT_PATH = '/home/testdone/testdone'

print("Connecting to VPS...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
print("Connected!\n")

# Simple verification - check if PHASE 1 comment exists
cmd = f"grep -c 'PHASE 1' {PROJECT_PATH}/backend/src/routes/question.routes.ts 2>/dev/null || echo '0'"
stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
count = stdout.read().decode().strip()

if count != '0' and count.isdigit() and int(count) > 0:
    print("=" * 50)
    print("✓ SUCCESS! Changes are deployed!")
    print("=" * 50)
    print(f"Found {count} occurrence(s) of 'PHASE 1' comment")
    
    # Show the specific lines
    cmd2 = f"grep -A2 'PHASE 1' {PROJECT_PATH}/backend/src/routes/question.routes.ts"
    stdin, stdout, stderr = client.exec_command(cmd2, timeout=30)
    print("\nDeployed code:")
    print(stdout.read().decode())
else:
    print("=" * 50)
    print("⚠ Changes NOT yet deployed")
    print("=" * 50)
    print("Attempting to pull latest changes...")
    
    # Pull changes
    cmd3 = f"cd {PROJECT_PATH} && git fetch origin main && git reset --hard origin/main"
    stdin, stdout, stderr = client.exec_command(cmd3, timeout=60)
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    # Build
    print("\nBuilding backend...")
    cmd4 = f"cd {PROJECT_PATH}/backend && npm run build"
    stdin, stdout, stderr = client.exec_command(cmd4, timeout=120)
    print(stdout.read().decode())
    
    # Restart
    print("\nRestarting backend...")
    cmd5 = "pm2 restart testdone-backend"
    stdin, stdout, stderr = client.exec_command(cmd5, timeout=30)
    print(stdout.read().decode())

# Check PM2 status
print("\n" + "=" * 50)
print("PM2 Status:")
print("=" * 50)
stdin, stdout, stderr = client.exec_command("pm2 jlist | python3 -c \"import json,sys; data=json.load(sys.stdin); print('\\n'.join([f\\\"{p['name']}: {p['pm2_env']['status']}\\\" for p in data]))\"", timeout=30)
out = stdout.read().decode().strip()
if out:
    print(out)
else:
    stdin, stdout, stderr = client.exec_command("pm2 list", timeout=30)
    print(stdout.read().decode())

client.close()
