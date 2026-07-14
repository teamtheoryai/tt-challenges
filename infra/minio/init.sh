#!/bin/sh
# Declared object-storage state: one bucket, two service accounts, least-privilege
# policies (AWS IAM JSON format, in this folder). Idempotent — safe to re-run.
set -e

mc alias set local http://minio:9000 minio-root minio-secret

# Bucket for raw document uploads. The pipeline reads from it; the API writes to it.
mc mb --ignore-existing local/uploads

# Service accounts (the apps never use root credentials).
mc admin user add local api-svc api-secret2026 || true
mc admin user add local pipeline-svc pipeline-secret2026 || true

# Policies: declared in this folder, applied to the live server here.
mc admin policy create local api-policy /init/api-policy.json || true
mc admin policy create local pipeline-policy /init/pipeline-policy.json || true

mc admin policy attach local api-policy --user api-svc || true
mc admin policy attach local pipeline-policy --user pipeline-svc || true

echo "minio-init: done"
