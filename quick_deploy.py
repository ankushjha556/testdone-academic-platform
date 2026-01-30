# Simple deploy script for VPS
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
    "cd /home/testdone/testdone && git pull origin main",
    "cd /home/testdone/testdone/frontend && npm run build 2>&1 | tail -10",
    "pm2 restart frontend",
    "pm2 list"
]

for cmd in commands:
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    if output:
        print(output)
    if error:
        print(f"STDERR: {error}")
    if exit_status != 0:
        print(f"Exit code: {exit_status}")

ssh.close()
print("\nDone!")
