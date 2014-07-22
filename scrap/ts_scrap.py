#!/usr/bin/python
from ts_net import get_torrents
from ts_settings import settings
import json
import time

t = int(time.time())

print "-- ts_scrap.py : %s (%s)" % (time.strftime("%d/%m/%Y %H:%M:%S"), t)

r = get_torrents()
torrents = json.loads(r.text)["arguments"]["torrents"]

hashs = []
for tor in torrents:
	hashs.append(tor['hashString'][:6])

keep_lines = []
with open(settings["file_storage"], "r") as f:
	deleted = 0
	for line in f:
		parts = line.split('|')
		dt = t - int(parts[0])

		# Double check : record isn't stale and torrent is still in transmission
		if dt < settings['time_limit'] and parts[1] in hashs :
			keep_lines.append(line.strip())
		else:
			deleted += 1
	print "%s\tlines cleansed from %s (%s preserved)." % (deleted, settings["file_storage"], len(keep_lines))

with open(settings["file_storage"], "w") as f:
	for line in keep_lines:
		print>>f, line
	for tor in torrents:
		# Six char per hashString is enough to differenciate ~100 elements.
		print>>f, "%s|%s|%s" % (t, tor['hashString'][:6], tor['uploadedEver'])
	print "%s\tlines written to %s" % (len(torrents), settings["file_storage"])
	print "%s\tlines total.\n" % (len(keep_lines)+len(torrents))