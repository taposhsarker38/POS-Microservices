FROM python:3.11-slim
WORKDIR /app

# Install system deps (libpq for psycopg2 + netcat for wait loop)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev gcc netcat-openbsd \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

# Wait for DB then migrate and runserver
CMD ["bash","-c","until nc -z db 5432; do echo 'Waiting for db...'; sleep 1; done; python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:8000"]
