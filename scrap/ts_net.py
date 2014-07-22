from ts_settings import settings
import json
import requests

hdrs = {}

def conn(payload):
	r = requests.post(settings['rpc_addr'], headers=hdrs, auth=(settings['rpc_user'], settings['rpc_pass']), data=json.dumps(payload))
	if r.status_code == 409:
		sid = r.headers['X-Transmission-Session-Id']
		hdrs['X-Transmission-Session-Id'] = sid
		#print "Switching to sid %s ..." % sid
		return conn(payload)
	return r

def get_torrents():
	return conn({
		"method": "torrent-get",
		"arguments": {
			"fields": ["hashString", "uploadedEver"]
		}
	})