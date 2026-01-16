
import wexpect
import sys
import time
import os

print("Starting deployment via Pexpect...")

try:
    child = wexpect.spawn('ssh root@72.62.76.73 "bash"')
    idx = child.expect(['password:', 'yes/no'], timeout=10)
    
    if idx == 1:
        child.sendline('yes')
        child.expect('password:')
    
    child.sendline('Maruti)Balaji2024')
    child.expect(['#', '$'], timeout=10)
    print("Logged in.")
    
    with open('deploy_cmds.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Total lines to send: {len(lines)}")
    
    for i, line in enumerate(lines):
        child.send(line)
        if i % 50 == 0:
            sys.stdout.write(f"\rSent {i}/{len(lines)} lines")
            sys.stdout.flush()
            time.sleep(0.1) 
            
    print("\nFile transmission complete.")
    child.sendline('exit')
    print("Waiting for exit...")
    child.expect(wexpect.EOF)
    print("Deployment Script Finished.")

except Exception as e:
    print(f"Error: {e}")
    if 'child' in locals():
        print("Output before error:")
        print(child.before)
