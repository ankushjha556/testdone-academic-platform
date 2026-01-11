
#!/bin/bash
sed -i 's/local.*all.*postgres.*peer/local   all             postgres                                md5/' /etc/postgresql/*/main/pg_hba.conf
systemctl restart postgresql
