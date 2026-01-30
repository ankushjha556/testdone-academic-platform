"""
Quick verification of question count after duplicate removal
"""
import paramiko

HOST = '72.62.76.73'
USER = 'root'
PASSWORD = 'Maruti)Balaji2024'
PROJECT_PATH = '/home/testdone/testdone'

print("Verifying question count on production...")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

verify_cmd = f'''cd {PROJECT_PATH}/backend && node -e "
const {{ PrismaClient }} = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {{
    const total = await prisma.question.count();
    const published = await prisma.question.count({{ where: {{ status: 'PUBLISHED' }} }});
    console.log('Total:', total);
    console.log('Published:', published);
    await prisma.\\$disconnect();
}}
verify().catch(console.error);
"
'''
stdin, stdout, stderr = client.exec_command(verify_cmd, timeout=30)
print(stdout.read().decode())
client.close()
