
#!/bin/bash
cd /home/testdone/testdone/backend
# Load env vars
export $(grep -v '^#' .env | xargs)
# parse DATABASE_URL enough to get password if needed, or just assume it from .env if variables are set clearly
# But .env usually has DATABASE_URL.
# Let's try to extract password from .env or just hardcode the known one
export PGPASSWORD='TestDone2024'
pg_dump -h 127.0.0.1 -U testdone -d testdone > /root/backup_phase1_video_record.sql
ls -lh /root/backup_phase1_video_record.sql
