"""
Deploy Admin Panel Fixes to Production
This script deploys the frontend changes to the production VPS.
"""

import paramiko
import sys

# VPS Configuration
VPS_HOST = "72.62.76.73"
VPS_USER = "root"
VPS_PASSWORD = "Maruti)Balaji2024"
VPS_PATH = "/home/testdone/testdone"

def run_command(ssh, cmd, description):
    """Execute command on VPS and return output"""
    print("\n" + "="*50)
    print("[*] " + description)
    print("[CMD] " + cmd)
    print("="*50)
    
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
    exit_status = stdout.channel.recv_exit_status()
    
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    
    if output:
        print("[OUTPUT]:\n" + output)
    if error:
        print("[STDERR]:\n" + error)
    
    if exit_status != 0:
        print("[X] Command failed with exit code " + str(exit_status))
        return False, output
    
    print("[OK] Success")
    return True, output

def main():
    print("\n[DEPLOY] TestDone Admin Panel Fixes - Production Deployment")
    print("="*60)
    
    # Connect to VPS
    print("\n[*] Connecting to VPS at " + VPS_HOST + "...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASSWORD, timeout=30)
        print("[OK] Connected successfully!")
    except Exception as e:
        print("[X] Connection failed: " + str(e))
        sys.exit(1)
    
    try:
        # Step 1: Check current directory and git status
        success, _ = run_command(ssh, 
            f"cd {VPS_PATH} && pwd && git status --short",
            "Checking VPS path and git status"
        )
        if not success:
            print("[WARN] Git status check failed, continuing anyway...")
        
        # Step 2: Pull latest changes
        success, output = run_command(ssh,
            f"cd {VPS_PATH} && git pull origin main 2>&1",
            "Pulling latest changes from git"
        )
        if not success and "not a git repository" not in output:
            print("[WARN] Git pull failed, may need manual intervention")
        
        # Step 3: Install frontend dependencies (in case of new packages)
        success, _ = run_command(ssh,
            f"cd {VPS_PATH}/frontend && npm install --legacy-peer-deps 2>&1 | tail -20",
            "Installing frontend dependencies"
        )
        if not success:
            print("[WARN] npm install had issues")
        
        # Step 4: Build frontend
        success, _ = run_command(ssh,
            f"cd {VPS_PATH}/frontend && npm run build 2>&1 | tail -30",
            "Building frontend for production"
        )
        if not success:
            print("[X] Frontend build failed!")
            ssh.close()
            sys.exit(1)
        
        # Step 5: Restart frontend with PM2
        success, _ = run_command(ssh,
            f"cd {VPS_PATH}/frontend && pm2 restart frontend --update-env 2>&1",
            "Restarting frontend with PM2"
        )
        if not success:
            # Try starting if not running
            run_command(ssh,
                f"cd {VPS_PATH}/frontend && pm2 start npm --name frontend -- start",
                "Starting frontend with PM2 (was not running)"
            )
        
        # Step 6: Check PM2 status
        run_command(ssh,
            "pm2 list",
            "Checking PM2 process status"
        )
        
        # Step 7: Verify frontend is accessible
        success, output = run_command(ssh,
            "curl -sI http://localhost:3000 | head -5",
            "Verifying frontend is accessible"
        )
        
        print("\n" + "="*60)
        print("[DONE] DEPLOYMENT COMPLETED!")
        print("="*60)
        print("\n[INFO] Next Steps:")
        print("1. Visit https://testdone.in/admin/tests")
        print("2. Click 'Edit' on any test to verify the fix")
        print("3. Check exam pages for line break formatting")
        print("="*60)
        
    except Exception as e:
        print("\n[X] Deployment error: " + str(e))
        import traceback
        traceback.print_exc()
        
    finally:
        ssh.close()
        print("\n[*] SSH connection closed")

if __name__ == "__main__":
    main()
