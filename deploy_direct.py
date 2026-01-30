import paramiko
import os

HOST = '72.62.76.73'
USER = 'root'  
PASSWORD = 'Maruti)Balaji2024'
PROJECT_PATH = '/home/testdone/testdone'
LOCAL_FILE = 'backend/src/routes/question.routes.ts'
REMOTE_FILE = f'{PROJECT_PATH}/backend/src/routes/question.routes.ts'

print("Connecting to VPS via SFTP...")
transport = paramiko.Transport((HOST, 22))
transport.connect(username=USER, password=PASSWORD)
sftp = paramiko.SFTPClient.from_transport(transport)

print(f"Uploading {LOCAL_FILE} to VPS...")
sftp.put(LOCAL_FILE, REMOTE_FILE)
print("✓ File uploaded successfully!")

sftp.close()
transport.close()

# Now rebuild and restart via SSH
print("\nConnecting via SSH to rebuild...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

# Build backend
print("Building backend...")
stdin, stdout, stderr = client.exec_command(f"cd {PROJECT_PATH}/backend && npm run build 2>&1", timeout=120)
build_output = stdout.read().decode()
build_err = stderr.read().decode()
print(build_output[-500:] if len(build_output) > 500 else build_output)

# Restart
print("\nRestarting backend...")
stdin, stdout, stderr = client.exec_command("pm2 restart testdone-backend", timeout=30)
print(stdout.read().decode())

# Verify
print("\nVerifying deployment...")
stdin, stdout, stderr = client.exec_command(f"grep 'PHASE 1' {REMOTE_FILE}", timeout=30)
result = stdout.read().decode()
if 'PHASE 1' in result:
    print("=" * 50)
    print("✓ SUCCESS! Changes deployed and verified!")
    print("=" * 50)
    print(result)
else:
    print("⚠ Verification failed")

# Check status
stdin, stdout, stderr = client.exec_command("pm2 list --no-color", timeout=30)
print("\nPM2 Status:")
print(stdout.read().decode())

client.close()
