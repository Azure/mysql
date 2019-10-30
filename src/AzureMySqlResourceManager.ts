import * as core from '@actions/core';
import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';
import { WebRequest, WebResponse } from 'azure-actions-webclient/WebClient';
import { ServiceClient as AzureRestClient, ToError, AzureError } from 'azure-actions-webclient/AzureRestClient';

export interface AzureMySqlServer {
    id: string;
    location: string;
    name: string;
    properties: {
        administratorLogin: string;
        earliestRestoreDate: string;
        fullyQualifiedDomainName: string;
        masterServerId: string;
        replicaCapacity: number;
        replicationRole: string;
        storageProfile: {
            backupRetentionDays: string;
            geoRedundantBackup: string;
            storageAutogrow: string;
            storageMB: number;
        };
        userVisibleState: string;
        sslEnforcement: string;
        version: string;
    };
    type: string;
    sku: {
        capacity: number;
        family: string;
        name: string;
        size: string;
        tier: string;
    }
}

export interface FirewallRule {
    id: string;
    name: string;
    type: string;
    properties: {
        startIpAddress: string;
        endIpAddress: string;
    }
}

export default class AzureMySqlResourceManager {
    private constructor(resourceAuthorizer: IAuthorizer) {
        // making the constructor private, so that object initialization can only be done by the class factory GetResourceManager
        this._restClient = new AzureRestClient(resourceAuthorizer);
    }

    public static async getResourceManager(serverName: string, resourceAuthorizer: IAuthorizer): Promise<AzureMySqlResourceManager> {
        // a factory method to return asynchronously created object
        let resourceManager = new AzureMySqlResourceManager(resourceAuthorizer);
        await resourceManager._populateMySqlServerData(serverName);
        return resourceManager;
    }

    public getMySqlServer() {
        return this._resource;
    }

    public async addFirewallRule(startIpAddress: string, endIpAddress: string): Promise<FirewallRule> {
        let firewallRuleName = `ClientIPAddress_${Date.now()}`;
        let httpRequest: WebRequest = {
            method: 'PUT',
            uri: this._restClient.getRequestUri(`/${this._resource!.id}/firewallRules/${firewallRuleName}`, {}, [], '2017-12-01'),
            body: JSON.stringify({
                'properties': {
                    'startIpAddress': startIpAddress,
                    'endIpAddress': endIpAddress
                }
            })
        };

        try {
            let httpResponse = await this._restClient.beginRequest(httpRequest);
            if (httpResponse.statusCode === 202) {
                let asyncOperationResponse = await this._getLongRunningOperationResult(httpResponse);
                if (asyncOperationResponse.statusCode === 200 && asyncOperationResponse.body['status'] && asyncOperationResponse.body['status'].toLowerCase() === 'succeeded') {
                    core.debug(JSON.stringify(asyncOperationResponse.body));
                    return this.getFirewallRule(firewallRuleName);
                }
                else {
                    throw ToError(asyncOperationResponse);
                }
            }
            else if (httpResponse.statusCode === 200 || httpResponse.statusCode === 201) {
                return httpResponse.body as FirewallRule;
            }

            throw ToError(httpResponse);
        }
        catch(error) {
            if (error instanceof AzureError) {
                throw new Error(JSON.stringify(error));
            }
            
            throw error;
        }
    }

    public async removeFirewallRule(firewallRule: FirewallRule): Promise<void> {
        let httpRequest: WebRequest = {
            method: 'DELETE',
            uri: this._restClient.getRequestUri(`/${this._resource!.id}/firewallRules/${firewallRule.name}`, {}, [], '2017-12-01')
        };

        try {
            let httpResponse = await this._restClient.beginRequest(httpRequest);
            if (httpResponse.statusCode === 202) {
                let asyncOperationResponse = await this._getLongRunningOperationResult(httpResponse);
                if (asyncOperationResponse.statusCode === 200 && asyncOperationResponse.body['status'] && asyncOperationResponse.body['status'].toLowerCase() === 'succeeded') {
                    core.debug(JSON.stringify(asyncOperationResponse.body));
                }
                else {
                    throw ToError(asyncOperationResponse);
                }
            }
            else if (httpResponse.statusCode !== 200 && httpResponse.statusCode !== 204) {
                throw ToError(httpResponse);
            }
        }
        catch(error) {
            if (error instanceof AzureError) {
                throw new Error(JSON.stringify(error));
            }
            
            throw error;
        }
    }

    public async getFirewallRule(ruleName: string): Promise<FirewallRule> {
        let httpRequest: WebRequest = {
            method: 'GET',
            uri: this._restClient.getRequestUri(`/${this._resource!.id}/firewallRules/${ruleName}`, {}, [], '2017-12-01')
        };

        try {
            let httpResponse = await this._restClient.beginRequest(httpRequest);
            if (httpResponse.statusCode !== 200) {
                throw ToError(httpResponse);
            }

            return httpResponse.body as FirewallRule;
        }
        catch(error) {
            if (error instanceof AzureError) {
                throw new Error(JSON.stringify(error));
            }
            
            throw error;
        }
    }

    private async _getLongRunningOperationResult(response: WebResponse): Promise<WebResponse> {
        let timeoutInMinutes = 2;
        let timeout = new Date().getTime() + timeoutInMinutes * 60 * 1000;
        
        let request = {
            method: 'GET',
            uri: response.headers['azure-asyncoperation'] || response.headers['location']
        } as WebRequest;

        if (!request.uri) {
            throw new Error('Unable to find the Azure-Async operation polling URI.');
        }

        while (true) {
            response = await this._restClient.beginRequest(request);
            if (response.statusCode === 202 || (response.body && (response.body.status == 'Accepted' || response.body.status == 'Running' || response.body.status == 'InProgress'))) {
                if (timeout < new Date().getTime()) {
                    throw new Error(`Async polling request timed out. URI: ${request.uri}`);
                }

                let retryAfterInterval = response.headers['retry-after'] && parseInt(response.headers['retry-after']) || 15;
                await this._sleep(retryAfterInterval);
            } 
            else {
                break;
            }
        }

        return response;
    }

    private async _populateMySqlServerData(serverName: string) {
        // trim the cloud hostname suffix from servername
        serverName = serverName.split('.')[0];
        let httpRequest: WebRequest = {
            method: 'GET',
            uri: this._restClient.getRequestUri('//subscriptions/{subscriptionId}/providers/Microsoft.DBforMySQL/servers', {}, [], '2017-12-01')
        }

        core.debug(`Get MySQL server '${serverName}' details`);
        try {
            let httpResponse = await this._restClient.beginRequest(httpRequest);
            if (httpResponse.statusCode !== 200) {
                throw ToError(httpResponse);
            }

            let sqlServers = httpResponse.body && httpResponse.body.value as AzureMySqlServer[];
            if (sqlServers && sqlServers.length > 0) {
                this._resource = sqlServers.filter((sqlResource) => sqlResource.name === serverName)[0];
                if (!this._resource) {
                    throw new Error(`Unable to get details of MySQL server ${serverName}. MySql server '${serverName}' was not found in the subscription.`);
                }

                core.debug(JSON.stringify(this._resource));
            }
            else {
                throw new Error(`Unable to get details of MySQL server ${serverName}. No MySQL servers were found in the subscription.`);
            }
        }
        catch(error) {
            if (error instanceof AzureError) {
                throw new Error(JSON.stringify(error));
            }
            
            throw error;
        }
    }

    private _sleep(sleepDurationInSeconds: number): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(resolve, sleepDurationInSeconds * 1000);
        });
    }

    private _resource?: AzureMySqlServer;
    private _restClient: AzureRestClient;
}