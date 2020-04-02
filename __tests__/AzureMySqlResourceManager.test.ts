import * as core from '@actions/core';
import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';
import { WebRequest, WebResponse } from 'azure-actions-webclient/WebClient';
import { ServiceClient as AzureRestClient, ToError, AzureError } from 'azure-actions-webclient/AzureRestClient';

import AzureMySqlResourceManager, { FirewallRule } from '../src/AzureMySqlResourceManager';
import FirewallManager from '../src/FirewallManager';

jest.mock('azure-actions-webclient/AzureRestClient');

describe('AzureMySqlResourceManager tests', () => {
    it('initializes resource manager correctly', async () => {
        let getRequestUrlSpy = jest.spyOn(AzureRestClient.prototype, 'getRequestUri').mockReturnValue('https://randomUrl/');
        let beginRequestSpy = jest.spyOn(AzureRestClient.prototype, 'beginRequest').mockResolvedValue({
            statusCode: 200,
            body: {
                value: [
                    {
                        name: 'testServer',
                        id: '/subscriptions/SubscriptionId/resourceGroups/testrg/providers/Microsoft.DBforMySQL/servers/testServer'
                    },
                    {
                        name: 'testServer2',
                        id: '/subscriptions/SubscriptionId/resourceGroups/testrg/providers/Microsoft.DBforMySQL/servers/testServer2'
                    }
                ]
            },
            statusMessage: 'OK',
            headers: []
        });

        let resourceManager = await AzureMySqlResourceManager.getResourceManager('testServer', {} as IAuthorizer);
        let server = resourceManager.getMySqlServer();

        expect(server!.name).toEqual('testServer');
        expect(getRequestUrlSpy).toHaveBeenCalledTimes(1);
        expect(beginRequestSpy).toHaveBeenCalledTimes(1);

    })

    it('throws if resource manager fails to initialize', async () => {
        let getRequestUrlSpy = jest.spyOn(AzureRestClient.prototype, 'getRequestUri').mockReturnValue('https://randomUrl/');
        let beginRequestSpy = jest.spyOn(AzureRestClient.prototype, 'beginRequest').mockResolvedValue({
            statusCode: 200,
            body: {
                value: [
                    {
                        name: 'testServer1',
                        id: '/subscriptions/SubscriptionId/resourceGroups/testrg/providers/Microsoft.sql/servers/testServer'
                    },
                    {
                        name: 'testServer2',
                        id: '/subscriptions/SubscriptionId/resourceGroups/testrg/providers/Microsoft.sql/servers/testServer2'
                    }
                ]
            },
            statusMessage: 'OK',
            headers: []
        });

        let expectedError = `Unable to get details of MySQL server testServer. MySql server 'testServer' was not found in the subscription.`;
        expect(AzureMySqlResourceManager.getResourceManager('testServer', {} as IAuthorizer)).rejects.toThrowError(new Error(expectedError));
        expect(getRequestUrlSpy).toHaveBeenCalledTimes(1);
        expect(beginRequestSpy).toHaveBeenCalledTimes(1);
    })

    it('adds firewall rule successfully', async () => {
        let getRequestUrlSpy = jest.spyOn(AzureRestClient.prototype, 'getRequestUri').mockReturnValue('https://randomUrl/');
        let beginRequestSpy = jest.spyOn(AzureRestClient.prototype, 'beginRequest').mockResolvedValueOnce({
            statusCode: 200,
            body: {
                value: [
                    {
                        name: 'testServer',
                        id: '/subscriptions/SubscriptionId/resourceGroups/testrg/providers/Microsoft.DBforMySQL/servers/testServer'
                    },
                    {
                        name: 'testServer2',
                        id: '/subscriptions/SubscriptionId/resourceGroups/testrg/providers/Microsoft.DBforMySQL/servers/testServer2'
                    }
                ]
            },
            statusMessage: 'OK',
            headers: []
        }).mockResolvedValueOnce({
            statusCode: 202,
            body: {},
            statusMessage: 'OK',
            headers: {
                'azure-asyncoperation': 'http://asyncRedirectionURI'
            }
        }).mockResolvedValueOnce({
            statusCode: 200,
            body: {
                'status': 'Succeeded'
            },
            statusMessage: 'OK',
            headers: {}
        });;

        let getFirewallRuleSpy = jest.spyOn(AzureMySqlResourceManager.prototype, 'getFirewallRule').mockResolvedValue({
            name: 'FirewallRule'
        } as FirewallRule);
        
        let resourceManager = await AzureMySqlResourceManager.getResourceManager('testServer', {} as IAuthorizer);
        await resourceManager.addFirewallRule('0.0.0.0', '1.1.1.1');

        expect(getRequestUrlSpy).toHaveBeenCalledTimes(2);
        expect(beginRequestSpy).toHaveBeenCalledTimes(3);
        expect(getFirewallRuleSpy).toHaveBeenCalledTimes(1);
    })

    it('removes firewall rule successfully', async () => {
        let getRequestUrlSpy = jest.spyOn(AzureRestClient.prototype, 'getRequestUri').mockReturnValue('https://randomUrl/');
        let beginRequestSpy = jest.spyOn(AzureRestClient.prototype, 'beginRequest').mockResolvedValueOnce({
            statusCode: 200,
            body: {
                value: [
                    {
                        name: 'testServer',
                        id: '/subscriptions/SubscriptionId/resourceGroups/testrg/providers/Microsoft.DBforMySQL/servers/testServer'
                    },
                    {
                        name: 'testServer2',
                        id: '/subscriptions/SubscriptionId/resourceGroups/testrg/providers/Microsoft.DBforMySQL/servers/testServer2'
                    }
                ]
            },
            statusMessage: 'OK',
            headers: []
        }).mockResolvedValueOnce({
            statusCode: 202,
            body: {},
            statusMessage: 'OK',
            headers: {
                'azure-asyncoperation': 'http://asyncRedirectionURI'
            }
        }).mockResolvedValueOnce({
            statusCode: 200,
            body: {
                'status': 'Succeeded'
            },
            statusMessage: 'OK',
            headers: {}
        });

        let resourceManager = await AzureMySqlResourceManager.getResourceManager('testServer', {} as IAuthorizer);
        await resourceManager.removeFirewallRule({ name: 'FirewallRule' }  as FirewallRule);

        expect(getRequestUrlSpy).toHaveBeenCalledTimes(2);
        expect(beginRequestSpy).toHaveBeenCalledTimes(3);
    })
})