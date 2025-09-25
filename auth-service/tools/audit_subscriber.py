# auth-service/tools/audit_subscriber.py
import os
import time
import redis

REDIS_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/0')

def main():
    r = redis.from_url(REDIS_URL)
    p = r.pubsub(ignore_subscribe_messages=True)
    p.subscribe('audit')
    print("Subscribed to audit channel, waiting messages...")
    for msg in p.listen():
        print("AUDIT MSG:", msg)
        # do minimal processing — in prod you'd forward to DB or external service

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("exiting")
