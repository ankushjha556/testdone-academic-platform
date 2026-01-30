# Test admin APIs on VPS
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
    print(f"$ {cmd[:100]}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    if output:
        print(output[:2000])
    if error:
        print(f"ERR: {error[:500]}")
    return output

# Test 1: Check Cloudinary config
print("=== 1. Check Cloudinary Config ===")
run("grep -i cloudinary /home/testdone/testdone/backend/.env | head -3")

# Test 2: Check if backend is running
print("\n=== 2. Backend Health Check ===")
run("curl -s http://localhost:5000/health")

# Test 3: Get admin token via login
print("\n=== 3. Admin Login ===")
login_output = run('''curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@testdone.in","password":"Admin@TestDone123"}' ''')

# Extract token
import json
try:
    data = json.loads(login_output)
    if data.get('success') and data.get('data', {}).get('accessToken'):
        token = data['data']['accessToken']
        print(f"Token obtained: {token[:30]}...")
        
        # Test 4: Get admin tests list
        print("\n=== 4. Get Admin Tests ===")
        run(f'''curl -s http://localhost:5000/api/v1/admin/tests \
          -H "Authorization: Bearer {token}" | head -500''')
        
        # Test 5: Get specific test for edit
        print("\n=== 5. Get Test Details for Edit ===")
        # First get a test ID
        tests_output = run(f'''curl -s http://localhost:5000/api/v1/admin/tests \
          -H "Authorization: Bearer {token}"''')
        try:
            tests_data = json.loads(tests_output)
            if tests_data.get('data', {}).get('tests'):
                test_id = tests_data['data']['tests'][0]['id']
                print(f"\nGetting test {test_id}...")
                run(f'''curl -s http://localhost:5000/api/v1/admin/tests/{test_id} \
                  -H "Authorization: Bearer {token}"''')
        except:
            print("Could not parse tests")
            
    else:
        print("Login failed!")
        print(login_output)
except Exception as e:
    print(f"Error: {e}")
    print(login_output)

ssh.close()
print("\n=== DONE ===")
