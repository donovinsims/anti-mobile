# AG Bridge v1

**LAN-only companion app for agent supervision.**
Allows you to approve/deny agent actions from your phone on the same Wi-Fi network.

## Quick Start

1. **Install Dependencies**
   ```powershell
   cd ag-bridge
   npm install
   ```

2. **Start Server**
   ```powershell
   npm start
   ```
   
3. **Pair Phone**
   - The server will print a **6-digit pairing code** and a URL (e.g., `http://192.168.1.5:8787`).
   - Open that URL on your phone (must be on same Wi-Fi).
   - Enter the code to pair.

## Features
- **Mobile-friendly Dashboard**: View status and approval queue.
- **Real-time**: Updates via WebSocket (no refresh needed).
- **Secure-ish**: Pairing token stored on device; no open access without pairing.

## Troubleshooting

### Phone can't load page?
- **Firewall**: Windows Firewall likely blocked the port. Allow `node` on **Private** networks, or manually open port **8787**.
- **Wi-Fi**: Ensure phone and laptop are on the **same** network (not Guest vs Main).
- **IP Address**: Ensure you are using the LAN IP shown in the console, not `localhost`.

### Pairing fails?
- **Code**: The code regenerates every time you restart the server. Check the console for the *current* code.
  
## Development
- **Structure**:
  - `server.mjs`: Express + WS server.
  - `public/index.html`: Frontend.
- **Debug**:
  - Use the "Create Test Approval" button on the dashboard to verify the flow.
