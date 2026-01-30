import paramiko

HOST = '72.62.76.73'
USER = 'root'  
PASSWORD = 'Maruti)Balaji2024'

print("Connecting to VPS...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
print("Connected!\n")

# Find the project directory
commands = [
    "ls -la /var/www/",
    "ls -la /root/",
    "find /var -name 'testdone*' -type d 2>/dev/null | head -5",
    "find /root -name 'testdone*' -type d 2>/dev/null | head -5",
    "pm2 list",
    "pm2 show testdone-backend 2>/dev/null | grep 'script path' || pm2 show 1 | grep 'script path'",
]

for cmd in commands:
    print(f">>> {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out:
        print(out)
    if err and 'No such' not in err:
        print(f"ERR: {err}")
    print()

client.close()
