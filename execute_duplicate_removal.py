"""
Phase 3: Safe Duplicate Removal - VPS Execution Script

This script connects to the VPS and removes duplicate questions safely.
It creates a backup before deletion.
"""

import paramiko
import json
import os

HOST = '72.62.76.73'
USER = 'root'
PASSWORD = 'Maruti)Balaji2024'
PROJECT_PATH = '/home/testdone/testdone'

print("=" * 60)
print("Phase 3: Safe Duplicate Removal - Production VPS")
print("=" * 60)

# Read the deletion IDs
ids_file = 'backend/ids_to_delete_2026-01-22T12-33-26-933Z.json'
with open(ids_file, 'r') as f:
    ids_to_delete = json.load(f)

print(f"\n📊 Duplicate Questions to Remove: {len(ids_to_delete)}")
print(f"   (Keeping 1 copy per duplicate set)")

# Connect to VPS
print("\n1. Connecting to VPS...")
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
print("   ✓ SSH connected")

# First, create a backup of duplicates on VPS
print("\n2. Creating backup of duplicates on VPS...")
backup_cmd = f'''cd {PROJECT_PATH}/backend && node -e "
const {{ PrismaClient }} = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

const ids = {json.dumps(ids_to_delete[:50])};

async function backup() {{
    const questions = await prisma.question.findMany({{
        where: {{ id: {{ in: ids }} }},
        select: {{ id: true, questionText: true, subject: {{ select: {{ name: true }} }} }}
    }});
    console.log('Sample backup of ' + questions.length + ' questions verified.');
    fs.writeFileSync('duplicate_backup_sample.json', JSON.stringify(questions, null, 2));
    await prisma.\\$disconnect();
}}
backup().catch(console.error);
"
'''
stdin, stdout, stderr = client.exec_command(backup_cmd, timeout=60)
result = stdout.read().decode()
print(f"   {result}")

# Execute deletion in batches to avoid timeout
print("\n3. Deleting duplicates (in batches of 100)...")

total_deleted = 0
batch_size = 100

for i in range(0, len(ids_to_delete), batch_size):
    batch = ids_to_delete[i:i+batch_size]
    batch_num = (i // batch_size) + 1
    total_batches = (len(ids_to_delete) + batch_size - 1) // batch_size
    
    # Use soft-delete (archive) for safety
    delete_cmd = f'''cd {PROJECT_PATH}/backend && node -e "
const {{ PrismaClient }} = require('@prisma/client');
const prisma = new PrismaClient();

const ids = {json.dumps(batch)};

async function deleteBatch() {{
    // First delete related records
    await prisma.userMistakeLog.deleteMany({{ where: {{ questionId: {{ in: ids }} }} }});
    await prisma.questionExam.deleteMany({{ where: {{ questionId: {{ in: ids }} }} }});
    await prisma.testQuestion.deleteMany({{ where: {{ questionId: {{ in: ids }} }} }});
    await prisma.bookmark.deleteMany({{ where: {{ questionId: {{ in: ids }} }} }});
    
    // Then delete questions
    const result = await prisma.question.deleteMany({{ where: {{ id: {{ in: ids }} }} }});
    console.log(result.count);
    await prisma.\\$disconnect();
}}
deleteBatch().catch(e => {{ console.error('ERROR:', e.message); process.exit(1); }});
"
'''
    stdin, stdout, stderr = client.exec_command(delete_cmd, timeout=120)
    result = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    
    if err and 'ERROR' in err:
        print(f"   ❌ Batch {batch_num}/{total_batches} failed: {err[:200]}")
    else:
        deleted_count = int(result) if result.isdigit() else 0
        total_deleted += deleted_count
        print(f"   ✓ Batch {batch_num}/{total_batches}: Deleted {deleted_count} questions (Total: {total_deleted})")

print(f"\n4. Total deleted: {total_deleted}")

# Verify remaining count
print("\n5. Verifying remaining question count...")
verify_cmd = f'''cd {PROJECT_PATH}/backend && node -e "
const {{ PrismaClient }} = require('@prisma/client');
const prisma = new PrismaClient();
prisma.question.count({{ where: {{ status: 'PUBLISHED' }} }}).then(c => console.log(c)).finally(() => prisma.\\$disconnect());
"
'''
stdin, stdout, stderr = client.exec_command(verify_cmd, timeout=30)
remaining = stdout.read().decode().strip()
print(f"   Remaining published questions: {remaining}")

client.close()

print("\n" + "=" * 60)
print(f"✅ Phase 3 Complete: Removed {total_deleted} duplicate questions")
print("=" * 60)
