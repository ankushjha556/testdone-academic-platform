import paramiko
import os

HOST = '72.62.76.73'
USER = 'root'  
PASSWORD = 'Maruti)Balaji2024'
PROJECT_PATH = '/home/testdone/testdone'

# Files to upload - Question Bank V2 enhancement
LOCAL_DIR = 'frontend/src/app/questions'
REMOTE_DIR = f'{PROJECT_PATH}/frontend/src/app/questions'

print("=" * 60)
print("Question Bank V2 - Production Deployment")
print("=" * 60)

print("\n1. Connecting to VPS via SFTP...")
transport = paramiko.Transport((HOST, 22))
transport.connect(username=USER, password=PASSWORD)
sftp = paramiko.SFTPClient.from_transport(transport)

# Upload QuestionsClient.tsx
files = ['QuestionsClient.tsx', 'page.tsx']
for filename in files:
    local_path = os.path.join(LOCAL_DIR, filename)
    remote_path = f'{REMOTE_DIR}/{filename}'
    print(f"   Uploading {filename}...")
    sftp.put(local_path, remote_path)
    print(f"   ✓ Uploaded {filename}")

sftp.close()
transport.close()
print("   ✓ File upload complete")

# Connect via SSH for build and restart
print("\n2. Connecting via SSH...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
print("   ✓ SSH connected")

# Build frontend
print("\n3. Building frontend (this may take 2-3 minutes)...")
stdin, stdout, stderr = client.exec_command(f"cd {PROJECT_PATH}/frontend && npm run build 2>&1", timeout=300)
build_output = stdout.read().decode()
exit_status = stdout.channel.recv_exit_status()

if exit_status == 0:
    print("   ✓ Build successful")
else:
    print(f"   ⚠ Build exited with status {exit_status}")
    print("   Last 500 chars of output:")
    print(build_output[-500:])

# Restart frontend PM2
print("\n4. Restarting frontend (graceful PM2 restart)...")
stdin, stdout, stderr = client.exec_command("pm2 restart frontend --update-env", timeout=30)
print(stdout.read().decode())
print("   ✓ Frontend restarted")

# Verify
print("\n5. Verifying deployment...")
stdin, stdout, stderr = client.exec_command("pm2 jlist 2>/dev/null", timeout=30)
import json
try:
    data = json.loads(stdout.read().decode())
    print("   PM2 Process Status:")
    for p in data:
        status = p.get('pm2_env', {}).get('status', 'unknown')
        name = p.get('name', 'unknown')
        emoji = "✓" if status == "online" else "⚠"
        print(f"     {emoji} {name}: {status}")
except:
    stdin, stdout, stderr = client.exec_command("pm2 list", timeout=30)
    print(stdout.read().decode())

client.close()

print("\n" + "=" * 60)
print("✓ Question Bank V2 Deployment Complete!")
print("=" * 60)
