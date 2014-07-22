import json

settings = {}

with open("../settings.json") as fileSettings:
	settings = json.loads(fileSettings.read())