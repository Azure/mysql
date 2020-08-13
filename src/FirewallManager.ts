import * as core from '@actions/core';
import * as exec from '@actions/exec';
import AzureMySqlActionHelper from "./AzureMySqlActionHelper";
import AzureMySqlResourceManager from './AzureMySqlResourceManager';
import Constants from './Constants';


export default class FirewallManager {
    constructor(azureMySqlResourceManager: AzureMySqlResourceManager) {
        this._resourceManager = azureMySqlResourceManager;
    }

    public async addFirewallRule(serverName: string, connectionString: any): Promise<void> {
        let ipAddress = await this._detectIPAddress(serverName, connectionString);
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

    private async _detectIPAddress(serverName: string, connectionString: any): Promise<string> {
        let mySqlClientPath = await AzureMySqlActionHelper.getMySqlClientPath();

        let ipAddress = '';
        let mySqlError = '';
        
        try {
            core.debug(`Validating if client has access to MySql Server '${serverName}'.`);
            core.debug(`"${mySqlClientPath}" -h ${serverName} -u "${connectionString.userId}" -e "show databases"`);
            await exec.exec(`"${mySqlClientPath}" -h ${serverName} -u "${connectionString.userId}" -e "show databases"`, [`--password=${connectionString.password}`], {
                silent: true,
                listeners: {
                    stderr: (data: Buffer) => mySqlError += data.toString()
                }
            });
        }
        catch (error) {
            core.debug(mySqlError);
            
            let ipAddresses = mySqlError.match(Constants.ipv4MatchPattern);
            if (!!ipAddresses) {
                ipAddress = ipAddresses[0];      
            }
            else {
                throw new Error(`Failed to add firewall rule. Unable to detect client IP Address. ${mySqlError} ${error}`)
            }
        }

        //ipAddress will be an empty string if client has access to SQL server
        return ipAddress;
    }

    private _firewallRule: any; // assign proper type
    private _resourceManager: AzureMySqlResourceManager;
}