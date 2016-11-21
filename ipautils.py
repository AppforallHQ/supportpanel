import re
import zipfile
import plistlib
import logging

logger = logging.getLogger(__name__)

def get_ipa_info(path):
	with zipfile.ZipFile(path, "r") as ipa:
		plist_file = None
		
		for f in ipa.namelist():
			match = re.match(r"^Payload/([^/]+\.app)/Info.plist$", f)
			if match:
				plist_file = f
				package_name = match.group(1)
				break
				
		plist_data = ipa.read(plist_file)
		
	info = plistlib.loads(plist_data)
	
	return package_name, info
	
def is_newer_version(current, new):
	try:
		current = [int(x) for x in current.split(".")]
		new = [int(x) for x in new.split(".")]
		
		for i in range(min(len(current), len(new))):
			if current[i] < new[i]:
				return True
			elif current[i] > new[i]:
				return False
		
		return len(current) < len(new)
		
	except Exception as ex:
		logger.exception(ex)
		return None
