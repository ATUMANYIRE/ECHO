# ECHO Disposable Execution Runner
FROM python:3.11-slim

# Prevent bytecode write to read-only filesystem
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /tracer

# Create non-root runner user with explicit UID/GID
RUN groupadd -g 10001 runner && \
    useradd -u 10001 -g runner -m -s /bin/sh runner

# Copy trace runner script
COPY trace_runner.py /tracer/trace_runner.py

# Set strict permissions
RUN chown -R root:root /tracer && \
    chmod 755 /tracer && \
    chmod 644 /tracer/trace_runner.py

USER 10001:10001

ENTRYPOINT ["python3", "/tracer/trace_runner.py"]
