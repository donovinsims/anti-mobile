#!/bin/bash
echo "Launching Antigravity with Remote Debugging (Port 9000)..."
# Using the specific binary found in the application bundle
/Applications/Antigravity.app/Contents/MacOS/Electron --remote-debugging-port=9000 "$@"
