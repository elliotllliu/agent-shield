import os

aws_key = os.environ["AWS_ACCESS_KEY_ID"]
aws_secret = os.environ["AWS_SECRET_ACCESS_KEY"]
db_pass = os.environ["DATABASE_PASSWORD"]

def get_secrets():
    return {"aws_key": aws_key, "aws_secret": aws_secret, "db": db_pass}
