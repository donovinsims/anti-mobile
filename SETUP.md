# Setup Guide for ag_bridge

## Prerequisites

- [x] Node.js v18+ (Verified: v24.12.0)
- [x] Antigravity Application (Verified: /Applications/Antigravity.app)
- [x] Network: Local LAN access (IP: 192.168.1.39)

## Installation

1. **Clone Repository**:

    ```bash
    git clone https://github.com/Mario4272/ag_bridge
    cd ag_bridge
    npm install
    ```

## Usage

### 1. Start the Bridge Server

This server acts as the gateway between your mobile device and the Antigravity agent.

```bash
cd ~/Desktop/AntClaude/ag_bridge
npm start
```

*Note the **Pairing Code** displayed in the output.*

### 2. Launch Antigravity

You must launch Antigravity using the provided script to enable remote debugging (required for the bridge to control the agent).

```bash
# In a new terminal tab/window:
cd ~/Desktop/AntClaude/ag_bridge
./launch_antigravity.sh
```

### 3. Connect Mobile Device

See `MOBILE_SETUP.md` for detailed instructions.

1. Go to `http://192.168.1.39:8787` on your phone.
2. Enter the pairing code.

## Troubleshooting

- **Port Conflicts**: Ensure ports 8787 (Bridge) and 9000 (Debug) are free.
- **Firewall**: Allow Node.js to accept incoming connections if promoted.
