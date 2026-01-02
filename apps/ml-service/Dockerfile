# FedEx DCA Control Tower - ML Service Dockerfile
# Python FastAPI application

# ==================================
# Build stage
# ==================================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY apps/ml-service/requirements.txt ./

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ==================================
# Production stage
# ==================================
FROM python:3.11-slim AS runner

WORKDIR /app

# Create non-root user for security
RUN groupadd --gid 1001 mlservice && \
    useradd --uid 1001 --gid mlservice --shell /bin/false mlservice

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY apps/ml-service/ ./

# Ensure proper ownership
RUN chown -R mlservice:mlservice /app

USER mlservice

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
