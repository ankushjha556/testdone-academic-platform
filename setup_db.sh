#!/bin/bash
sudo -u postgres psql <<EOF
CREATE USER testdone WITH PASSWORD 'Ankush@2004';
CREATE DATABASE testdone OWNER testdone;
GRANT ALL PRIVILEGES ON DATABASE testdone TO testdone;
\q
EOF
