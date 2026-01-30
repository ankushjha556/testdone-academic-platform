import paramiko

VPS_HOST = "72.62.76.73"
VPS_USER = "root"  
VPS_PASSWORD = "Maruti)Balaji2024"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASSWORD)
print("Connected")

# Find where the actual running backend is
cmds = [
    # Check PM2 for running process path
    "pm2 jlist 2>/dev/null | python3 -c \"import sys,json; d=json.load(sys.stdin); print([p.get('pm2_env',{}).get('pm_cwd','') for p in d])\" 2>/dev/null || pm2 list",
    # Find package.json in testdone dirs
    "find /home/testdone -name 'package.json' -type f 2>/dev/null",
    # Check the testdone/testdone path structure
    "ls -la /home/testdone/testdone/ 2>/dev/null | head -10",
]

for cmd in cmds:
    print(f"\n$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    out = stdout.read().decode()
    err = stderr.read().decode()
    print(out[:1500] if out else err[:1500])

ssh.close()
