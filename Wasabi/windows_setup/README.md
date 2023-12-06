1. **Install and Configure Sysmon:**
   Run the following command in the command prompt:

    ```sh
    .\Sysmon\sysmon.exe -accepteula -i sysmonconfig.xml
    ```

2. **Configure Wazuh Agent to Collect Sysmon Events:**
   Navigate to `C:\Program Files (x86)\ossec-agent\ossec.conf` and update the file with the following XML configuration:

    ```xml
    <ossec_config>
      <localfile>
        <location>Microsoft-Windows-Sysmon/Operational</location>
        <log_format>eventchannel</log_format>
      </localfile>
    </ossec_config>
    ```

3. **Restart the Wazuh Agent:**
   Execute the following command to restart the Wazuh agent:

    ```sh
    Restart-Service -Name wazuh
    ```

4. **Update Local Rules on Wazuh Server:**
   Add the content of `local_rules.xml` to `/var/ossec/etc/rules/local_rules.xml` on the Wazuh server.

5. **Restart Wazuh Manager:**
   Execute the following command to restart the Wazuh manager:

    ```sh
    systemctl restart wazuh-manager
    ```

