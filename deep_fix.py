# Deep investigation and fix
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
print("Connected!\n")

def run(cmd):
    print(f"$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    if output:
        print(output)
    if error:
        print(f"STDERR: {error}")
    return exit_status == 0, output

# Step 1: Check current state
print("=== Step 1: Check Git Status ===")
run("cd /home/testdone/testdone && git status")

# Step 2: Force pull latest changes
print("\n=== Step 2: Force Pull Latest Changes ===")
run("cd /home/testdone/testdone && git fetch origin && git reset --hard origin/main")

# Step 3: Verify edit page exists
print("\n=== Step 3: Verify Edit Page Exists ===")
run("ls -la /home/testdone/testdone/frontend/src/app/admin/tests/\\[id\\]/edit/")

# Step 4: Verify line break fix
print("\n=== Step 4: Verify Line Break Fix ===")
run("grep 'formatTextWithLineBreaks' /home/testdone/testdone/frontend/src/components/exam/ExamDetailContent.tsx | head -3")

# Step 5: Install dependencies
print("\n=== Step 5: Install Dependencies ===")
run("cd /home/testdone/testdone/frontend && npm install --legacy-peer-deps 2>&1 | tail -5")

# Step 6: Build frontend
print("\n=== Step 6: Build Frontend ===")
success, _ = run("cd /home/testdone/testdone/frontend && npm run build 2>&1 | tail -15")
if not success:
    print("BUILD FAILED!")
    
# Step 7: Restart PM2
print("\n=== Step 7: Restart PM2 ===")
run("pm2 restart frontend")

# Step 8: Verify
print("\n=== Step 8: Verify Frontend ===")
run("curl -sI http://localhost:3000 | head -3")
run("pm2 list")

ssh.close()
print("\n=== DONE ===")
