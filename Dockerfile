FROM python:3.11-slim

# Install tshark (wireshark-cli) required by pyshark
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y tshark && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project (backend and frontend)
COPY . .

# Set working directory to backend to run the FastAPI app
WORKDIR /app/backend

# Expose port 8000
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
