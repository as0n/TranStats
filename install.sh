#!/bin/bash
dir=`pwd`

# Create necessary files.
storfile=`cat settings.json | grep file_storage | cut -d \" -f 4`
logfile=`cat settings.json | grep file_log | cut -d \" -f 4`
touch scrap/$logfile
touch scrap/$storfile

# Create scrapper file.
echo "cd $dir/scrap
python ts_scrap.py >> $logfile" > scrap/scrapper.sh
chmod u+x scrap/scrapper.sh

# Register the cron job.
task="0 * * * * $dir/scrap/scrapper.sh"
(crontab -l 2>/dev/null | grep -Fv "scrapper.sh" ; printf -- "$task\r\n" ) | crontab