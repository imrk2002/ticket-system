FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt /app/
RUN apt-get update && apt-get install -y --no-install-recommends build-essential libssl-dev && \
    pip install --no-cache-dir -r requirements.txt && \
    apt-get purge -y build-essential && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

COPY . /app

EXPOSE 5001

CMD ["python", "app.py"]

