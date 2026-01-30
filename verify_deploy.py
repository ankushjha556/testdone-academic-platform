# Verify deployment
import paramiko
import warnings
warnings.filterwarnings('ignore')

VPS_HOST = "72.62.76.73"
VPS_USER = "root"
VPS_PASSWORD = "Maruti)Balaji2024"

print("Connecting to VPS...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASSWORD, timeout=30)
print("Connected!")

commands = [
    "ls -la /home/testdone/testdone/frontend/src/app/admin/tests/*/edit/",
    "head -5 /home/testdone/testdone/frontend/src/app/admin/tests/*/edit/page.tsx 2>/dev/null || echo 'File not found'",
    "curl -sI http://localhost:3000 | head -3",
    "pm2 status"
]

for cmd in commands:
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    if output:
        print(output)
    if error and 'No such file' not in error:
        print(f"STDERR: {error}")

ssh.close()
print("\nDone!")
