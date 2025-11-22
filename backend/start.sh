#!/bin/bash
# Load environment variables from .env file
set -a
source "$(dirname "$0")/.env"
set +a

# Start the Node.js server
exec node "$(dirname "$0")/src/server.js"
