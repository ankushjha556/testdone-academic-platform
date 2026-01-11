
#!/bin/bash
sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:ankush@2004@localhost/testdone?schema=public&host=/var/run/postgresql"|' ~/testdone/backend/.env
