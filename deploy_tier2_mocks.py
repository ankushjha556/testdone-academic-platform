import paramiko
import time

VPS_HOST = "72.62.76.73"
VPS_USER = "root"
VPS_PASSWORD = "Maruti)Balaji2024"

def run_cmd(ssh, cmd, timeout=300, show=True):
    if show:
        print(f"\n$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8')
    err = stderr.read().decode('utf-8')
    if show:
        combined = out + err
        print(combined[-2500:] if len(combined) > 2500 else combined)
    return out, err

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASSWORD)
print("Connected to VPS")

# Find actual backend path with package.json
print("\n=== Finding backend path ===")
run_cmd(ssh, "find /home/testdone -name 'package.json' -type f 2>/dev/null")

# Check both potential paths
print("\n=== Checking /home/testdone/backend ===")
run_cmd(ssh, "ls -la /home/testdone/backend/package.json 2>/dev/null || echo 'Not found'")

print("\n=== Checking /home/testdone/testdone/backend ===")
run_cmd(ssh, "ls -la /home/testdone/testdone/backend/package.json 2>/dev/null || echo 'Not found'")

# Use the correct path
backend_path = "/home/testdone/backend"

# Check if node_modules exists
print("\n=== Checking node_modules ===")
out, _ = run_cmd(ssh, f"ls {backend_path}/node_modules 2>/dev/null | head -5 || echo 'No node_modules'")

if "No node_modules" in out or not out.strip():
    print("\n=== Installing npm dependencies (this takes a few minutes) ===")
    run_cmd(ssh, f"cd {backend_path} && npm install 2>&1 | tail -30", timeout=300)

# Generate prisma client
print("\n=== Generating Prisma client ===")
run_cmd(ssh, f"cd {backend_path} && npx prisma generate 2>&1", timeout=120)

# Verify prisma client exists
print("\n=== Verifying @prisma/client ===")
run_cmd(ssh, f"ls {backend_path}/node_modules/@prisma/client 2>/dev/null | head -3 || echo 'Prisma client not found'")

# Run seeder
print("\n=== Running seeder (this may take 5-10 minutes) ===")
out, err = run_cmd(ssh, f"cd {backend_path} && npx tsx scripts/seed_ssc_cgl_tier2_v7.ts 2>&1", timeout=600)

# Verify final results
print("\n=== Final Verification ===")
verify_script = '''
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
    const mocks = await p.mockTest.findMany({
        where: { slug: { startsWith: "ssc-cgl-2026-tier2-mock-" } },
        orderBy: { name: "asc" }
    });
    console.log("Total Tier-2 mocks:", mocks.length);
    for (const m of mocks) {
        console.log("  -", m.name + ":", m.totalQuestions, "Qs,", m.accessType);
    }
    await p.$disconnect();
})();
'''
# Write and run verification
run_cmd(ssh, f'echo \'{verify_script}\' > {backend_path}/verify_tier2.js && cd {backend_path} && node verify_tier2.js')

ssh.close()
print("\n✅ Done!")
