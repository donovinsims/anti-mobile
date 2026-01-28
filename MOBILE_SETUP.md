# Mobile Connection Guide

## 1. Connect from your Phone

1. **Network Check**: Ensure your mobile device is connected to the same Wi-Fi network as this computer (`192.168.1.39`).
2. **Open Browser**: On your mobile phone, open Chrome or Safari.
3. **Navigate to URL**: Enter the following address:

    ```
    http://192.168.1.39:8787
    ```

4. **Enter Pairing Code**: When prompted, enter the code displayed in the server console (currently: **315780**).

## 2. Troubleshooting

* **Connection Refused / Timed Out**:
  * Verify both devices are on the same local network.
  * Check if your computer's firewall is blocking incoming connections on port 8787.
* **"Agent Offline" / No Response**:
  * Ensure Antigravity is running.
  * Verify it was launched with the prompt script (`./launch_antigravity.sh`) which enables the remote debugging port 9000.
  * Check the server console for "POKE" errors.

## 3. Usage

* **Chat**: Send messages to the agent directly from the mobile web interface.
* **Poke**: Use the "Poke" button to wake up the agent if it's idle.
* **History**: View previous conversations and agent status.
