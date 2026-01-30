import paramiko

HOST = '72.62.76.73'
USER = 'root'  
PASSWORD = 'Maruti)Balaji2024'
PROJECT_PATH = '/home/testdone/testdone'

print("Final Verification...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

# Check the file content
cmd = f"grep -n 'PHASE 1\\|exam removed\\|subject-first' {PROJECT_PATH}/backend/src/routes/question.routes.ts"
stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
result = stdout.read().decode()

print("=" * 60)
if 'PHASE 1' in result or 'subject-first' in result:
    print("✓ DEPLOYMENT VERIFIED SUCCESSFULLY!")
    print("=" * 60)
    print("\nChanges found in question.routes.ts:")
    print(result)
else:
    print("⚠ Could not verify changes")
    print(result)
print("=" * 60)

# Check PM2 status
cmd2 = "pm2 jlist 2>/dev/null"
stdin, stdout, stderr = client.exec_command(cmd2, timeout=30)
import json
try:
    data = json.loads(stdout.read().decode())
    print("\nPM2 Process Status:")
    for p in data:
        status = p.get('pm2_env', {}).get('status', 'unknown')
        name = p.get('name', 'unknown')
        print(f"  {name}: {status}")
except:
    stdin, stdout, stderr = client.exec_command("pm2 list", timeout=30)
    print(stdout.read().decode())

client.close()
print("\n✓ All done!")
