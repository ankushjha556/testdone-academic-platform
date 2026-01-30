import paramiko

HOST = '72.62.76.73'
USER = 'root'  
PASSWORD = 'Maruti)Balaji2024'
PROJECT_PATH = '/home/testdone/testdone'

print("Checking production frontend...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

# Check if TARGET EXAM exists in the frontend code  
cmd = f"grep -l 'TARGET EXAM\\|Target Exam' {PROJECT_PATH}/frontend/src/app/questions/*.tsx 2>/dev/null"
stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
files = stdout.read().decode().strip()
print(f"Files with 'TARGET EXAM': {files}")

# Check what filter state variables exist
cmd2 = f"grep -n 'exam.*filter\\|filterByExam\\|examFilter\\|selectedExam\\|TARGET' {PROJECT_PATH}/frontend/src/app/questions/QuestionsClient.tsx 2>/dev/null | head -20"
stdin, stdout, stderr = client.exec_command(cmd2, timeout=30)
print("\n=== Exam filter references in QuestionsClient.tsx ===")
print(stdout.read().decode())

# Check the filter state definition
cmd3 = f"grep -A10 'useState.*filters\\|filters.*useState' {PROJECT_PATH}/frontend/src/app/questions/QuestionsClient.tsx 2>/dev/null | head -15"
stdin, stdout, stderr = client.exec_command(cmd3, timeout=30)
print("\n=== Filter state definition ===")
print(stdout.read().decode())

client.close()
