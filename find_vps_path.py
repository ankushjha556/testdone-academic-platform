import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('72.62.76.73', username='root', password='Maruti)Balaji2024')

# Check exact structure
commands = [
    'ls -la /home/testdone/',
    'ls -la /home/testdone/backend/ 2>/dev/null | head -10',
    'ls -la /home/testdone/backend/scripts/ 2>/dev/null | head -10',
]

for cmd in commands:
    print(f"\n$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())

ssh.close()
