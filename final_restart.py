# Final restart and verification
import paramiko
import warnings
import time
warnings.filterwarnings('ignore')

VPS_HOST = "72.62.76.73"
VPS_USER = "root"
VPS_PASSWORD = "Maruti)Balaji2024"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASSWORD, timeout=30)

def run(cmd, timeout=120):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out + err, exit_status == 0

# Step 1: Stop frontend
print("Step 1: Stopping frontend...")
out, _ = run("pm2 stop frontend 2>&1")
print(out)

# Step 2: Clear Next.js cache
print("Step 2: Clearing Next.js cache...")
out, _ = run("rm -rf /home/testdone/testdone/frontend/.next/cache 2>&1")
print(out or "Done")

# Step 3: Rebuild
print("Step 3: Rebuilding frontend...")
out, success = run("cd /home/testdone/testdone/frontend && npm run build 2>&1 | tail -20", timeout=300)
print(out)
if not success:
    print("BUILD FAILED!")
else:
    print("Build OK")

# Step 4: Restart frontend
print("Step 4: Starting frontend...")
out, _ = run("pm2 start frontend 2>&1")
print(out)

# Wait a moment
time.sleep(3)

# Step 5: Verify
print("Step 5: Verifying...")
out, _ = run("curl -sI http://localhost:3000 | head -5")
print(out)

out, _ = run("pm2 list")
print(out)

# Step 6: Test the admin tests edit route
print("Step 6: Testing admin tests edit route...")
out, _ = run("curl -sI http://localhost:3000/admin/tests/some-id/edit | head -5")
print(out)

ssh.close()
print("\n=== COMPLETE ===")
