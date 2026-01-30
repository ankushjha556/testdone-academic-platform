# Simple VPS check
import paramiko
import warnings
warnings.filterwarnings('ignore')

VPS_HOST = "72.62.76.73"
VPS_USER = "root"
VPS_PASSWORD = "Maruti)Balaji2024"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASSWORD, timeout=30)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out + err

# Check 1: Is the edit page file there?
print("1. Edit page exists?")
result = run("test -f /home/testdone/testdone/frontend/src/app/admin/tests/\\[id\\]/edit/page.tsx && echo 'YES' || echo 'NO'")
print(result)

# Check 2: Content of edit page
print("2. Edit page content (first 30 lines):")
result = run("head -30 /home/testdone/testdone/frontend/src/app/admin/tests/\\[id\\]/edit/page.tsx 2>/dev/null || echo 'FILE NOT FOUND'")
print(result)

# Check 3: Is the build folder up to date?
print("3. Build folder test edit route:")
result = run("ls -la /home/testdone/testdone/frontend/.next/server/app/admin/tests/ 2>/dev/null | head -10")
print(result)

# Check 4: ExamDetailContent has the fix?
print("4. Line break fix in ExamDetailContent:")
result = run("grep -n 'formatTextWithLineBreaks' /home/testdone/testdone/frontend/src/components/exam/ExamDetailContent.tsx 2>/dev/null || echo 'NOT FOUND'")
print(result)

# Check 5: PM2 logs
print("5. PM2 frontend status:")
result = run("pm2 show frontend 2>/dev/null | head -20")
print(result)

ssh.close()
print("DONE")
