#!/bin/bash
# Generate self-signed test certificates for integration tests.
# Re-run this script to regenerate expired certs.
set -e

DIR="$(cd "$(dirname "$0")/certs" && pwd)"

# CA
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
  -keyout "$DIR/ca-key.pem" -out "$DIR/ca.pem" \
  -days 3650 -nodes -subj "/CN=Test CA"

# Server cert signed by CA
openssl req -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
  -keyout "$DIR/server-key.pem" -out "$DIR/server.csr" \
  -nodes -subj "/CN=localhost"
openssl x509 -req -in "$DIR/server.csr" -CA "$DIR/ca.pem" -CAkey "$DIR/ca-key.pem" \
  -CAcreateserial -out "$DIR/server.pem" -days 3650 \
  -extfile <(printf "subjectAltName=IP:127.0.0.1,DNS:localhost")

# Client cert signed by CA
openssl req -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
  -keyout "$DIR/client-key.pem" -out "$DIR/client.csr" \
  -nodes -subj "/CN=testclient"
openssl x509 -req -in "$DIR/client.csr" -CA "$DIR/ca.pem" -CAkey "$DIR/ca-key.pem" \
  -CAcreateserial -out "$DIR/client.pem" -days 3650

# Cleanup CSRs and serial
rm -f "$DIR"/*.csr "$DIR"/*.srl

echo "Certificates generated in $DIR"
