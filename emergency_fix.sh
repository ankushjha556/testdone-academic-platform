#!/bin/bash
cd /home/testdone/testdone/backend

echo "Restarting Backend with --update-env..."
pm2 restart testdone-backend --update-env

echo "Restarting Frontend with --update-env..."
pm2 restart frontend --update-env

echo "Check logs..."
pm2 logs testdone-backend --lines 50 --nostream > /root/verification_logs.log
