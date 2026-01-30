# Verify and investigate issues
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
    # Check if edit page exists
    ("Check edit page file", "ls -la /home/testdone/testdone/frontend/src/app/admin/tests/\\[id\\]/edit/"),
    
    # Check git status
    ("Git log", "cd /home/testdone/testdone && git log --oneline -3"),
    
    # Check if ExamDetailContent was updated
    ("Check line break fix", "grep -c 'formatTextWithLineBreaks' /home/testdone/testdone/frontend/src/components/exam/ExamDetailContent.tsx || echo 'NOT FOUND'"),
    
    # Check PM2 status
    ("PM2 status", "pm2 list"),
    
    # Check frontend build date
    ("Build date", "ls -la /home/testdone/testdone/frontend/.next/BUILD_ID 2>/dev/null || echo 'No BUILD_ID'"),
]

for desc, cmd in commands:
    print(f"\n=== {desc} ===")
    print(f"$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    if output:
        print(output)
    if error:
        print(f"Error: {error}")

ssh.close()
print("\nDone!")
