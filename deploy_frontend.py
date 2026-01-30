import paramiko
import os

HOST = '72.62.76.73'
USER = 'root'  
PASSWORD = 'Maruti)Balaji2024'
PROJECT_PATH = '/home/testdone/testdone'

# Files to upload
LOCAL_DIR = 'frontend/src/app/questions'
REMOTE_DIR = f'{PROJECT_PATH}/frontend/src/app/questions'

print("Connecting to VPS via SFTP...")
transport = paramiko.Transport((HOST, 22))
transport.connect(username=USER, password=PASSWORD)
sftp = paramiko.SFTPClient.from_transport(transport)

# Upload both Question Bank files
files = ['QuestionsClient.tsx', 'page.tsx']
for filename in files:
    local_path = os.path.join(LOCAL_DIR, filename)
    remote_path = f'{REMOTE_DIR}/{filename}'
    print(f"Uploading {filename}...")
    sftp.put(local_path, remote_path)
    print(f"✓ Uploaded {filename}")

sftp.close()
transport.close()

# Rebuild frontend
print("\nConnecting via SSH to rebuild frontend...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

# Build frontend (this may take a while)
print("Building frontend (this may take 2-3 minutes)...")
stdin, stdout, stderr = client.exec_command(f"cd {PROJECT_PATH}/frontend && npm run build 2>&1", timeout=300)
build_output = stdout.read().decode()
# Print last 30 lines
lines = build_output.split('\n')
print('\n'.join(lines[-30:]))

# Restart frontend PM2 process
print("\nRestarting frontend...")
stdin, stdout, stderr = client.exec_command("pm2 restart frontend", timeout=30)
print(stdout.read().decode())

# Check status
stdin, stdout, stderr = client.exec_command("pm2 list --no-color", timeout=30)
print("\nPM2 Status:")
print(stdout.read().decode())

client.close()
print("\n✓ Frontend deployment complete!")
