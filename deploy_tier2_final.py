import paramiko

VPS_HOST = "72.62.76.73"
VPS_USER = "root"  
VPS_PASSWORD = "Maruti)Balaji2024"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASSWORD)
print("Connected to VPS\n")

# The correct path is /home/testdone/testdone/backend based on earlier findings
BACKEND_PATH = "/home/testdone/testdone/backend"

def run(cmd, timeout=300):
    print(f"$ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    result = out + err
    print(result[-2000:] if len(result) > 2000 else result)
    return out, err

# Step 1: Verify the backend path
print("=== Step 1: Verify backend path ===")
run(f"ls {BACKEND_PATH}/package.json {BACKEND_PATH}/prisma/schema.prisma 2>/dev/null && echo 'Path OK' || echo 'Path NOT OK'")

# Step 2: Upload seeder to correct location
print("\n=== Step 2: Upload seeder script ===")
sftp = ssh.open_sftp()
local_seeder = r"c:\Users\jaiba\Downloads\TestDone\testdone-app\backend\scripts\seed_ssc_cgl_tier2_v7.ts"
remote_seeder = f"{BACKEND_PATH}/scripts/seed_ssc_cgl_tier2_v7.ts"
try:
    sftp.put(local_seeder, remote_seeder)
    print(f"Uploaded seeder to {remote_seeder}")
except Exception as e:
    print(f"Upload failed: {e}")
sftp.close()

# Step 3: Fix the mock data path in the script
print("\n=== Step 3: Fix paths in seeder ===")
run(f"sed -i \"s|path.join(__dirname, '..', '..', 'SSC_CGL_2')|path.join('/home/testdone', 'SSC_CGL_2')|g\" {remote_seeder}")

# Step 4: Ensure prisma is generated
print("\n=== Step 4: Generate Prisma client ===")
run(f"cd {BACKEND_PATH} && npx prisma generate 2>&1", timeout=120)

# Step 5: Run seeder
print("\n=== Step 5: Running seeder (may take 5-10 mins) ===")
out, err = run(f"cd {BACKEND_PATH} && npx tsx scripts/seed_ssc_cgl_tier2_v7.ts 2>&1", timeout=600)

# Step 6: Verify
print("\n=== Step 6: Verification ===")
run(f'''cd {BACKEND_PATH} && node -e "
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();
p.mockTest.findMany({{
    where: {{ slug: {{ startsWith: 'ssc-cgl-2026-tier2-mock-' }} }},
    select: {{ name: true, totalQuestions: true, accessType: true }},
    orderBy: {{ name: 'asc' }}
}}).then(m => {{
    console.log('Found', m.length, 'Tier-2 mocks:');
    m.forEach(x => console.log(' ', x.name + ':', x.totalQuestions, 'Qs,', x.accessType));
    p.\\$disconnect();
}});
"''')

ssh.close()
print("\n✅ Done!")
