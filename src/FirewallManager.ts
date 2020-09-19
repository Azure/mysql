import * as core from '@actions/core';
import AzureMySqlResourceManager from './AzureMySqlResourceManager';

export default class FirewallManager {
    constructor(azureMySqlResourceManager: AzureMySqlResourceManager) {
        this._resourceManager = azureMySqlResourceManager;
    }

    public async addFirewallRule(ipAddress: string): Promise<void> {
        if (!ipAddress) {
            core.debug(`Client has access to MySql server. Skip adding firewall exception.`);
            return;
        }
        console.log(`Client does not have access to MySql server. Adding firewall exception for client's IP address.`)
        this._firewallRule = await this._resourceManager.addFirewallRule(ipAddress, ipAddress);
        core.debug(JSON.stringify(this._firewallRule));
        console.log(`Successfully added firewall rule ${this._firewallRule.name}.`);
    }

    public async removeFirewallRule(): Promise<void> {
        if (this._firewallRule) {
            console.log(`Removing firewall rule '${this._firewallRule.name}'.`);
            await this._resourceManager.removeFirewallRule(this._firewallRule);
            console.log('Successfully removed firewall rule.');
        }
        else {
            core.debug('No firewall exception was added.')
        }
    }

    private _firewallRule: any; // assign proper type
    private _resourceManager: AzureMySqlResourceManager;
}