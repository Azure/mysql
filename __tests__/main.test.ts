import * as core from '@actions/core';

import { run } from "../src/main";
import { AuthorizerFactory } from 'azure-actions-webclient/AuthorizerFactory';

import AzureMySqlAction from '../src/AzureMySqlAction';
import AzureMySqlActionHelper from '../src/AzureMySqlActionHelper';
import MySqlConnectionStringBuilder from '../src/MySqlConnectionStringBuilder';
import FirewallManager from '../src/FirewallManager';
import AzureMySqlResourceManager from '../src/AzureMySqlResourceManager';

jest.mock('@actions/core');
jest.mock('azure-actions-webclient/AuthorizerFactory');
jest.mock('../src/AzureMySqlAction');
jest.mock('../src/FirewallManager');
jest.mock('../src/AzureMySqlResourceManager');
jest.mock('../src/MySqlConnectionStringBuilder', () => {
    return jest.fn().mockImplementation(() => {
        return {
            server: 'testmysqlserver.mysql.database.azure.com'
        }
    })
});

describe('main.ts tests', () => {
    it('gets inputs and runs sql file', async () => {
        let getInputSpy = jest.spyOn(core, 'getInput').mockImplementation((name, options): string => {
            switch(name) {
                case 'server-name': return 'testmysqlserver.mysql.database.azure.com';
                case 'connection-string': return 'testmysqlserver.mysql.database.azure.com; Port=3306; Database=testdb; Uid=testuser@testmysqlserver; Pwd=testpassword; SslMode=Preferred';
                case 'sql-file': return './testsqlfile.sql';
                case 'arguments': return '-t 10';
            }

            return '';
        });

        let resolveFilePathSpy = jest.spyOn(AzureMySqlActionHelper, 'resolveFilePath').mockReturnValue('./testsqlfile.sql');
        let getResourceManagerSpy = jest.spyOn(AzureMySqlResourceManager, 'getResourceManager');
        let getAuthorizerSpy = jest.spyOn(AuthorizerFactory, 'getAuthorizer');
        let addFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'addFirewallRule');
        let actionExecuteSpy = jest.spyOn(AzureMySqlAction.prototype, 'execute');
        let removeFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'removeFirewallRule');
        let setFailedSpy = jest.spyOn(core, 'setFailed');

        await run();

        expect(AzureMySqlAction).toHaveBeenCalled();
        expect(getAuthorizerSpy).toHaveBeenCalled();
        expect(getInputSpy).toHaveBeenCalledTimes(4);
        expect(getResourceManagerSpy).toHaveBeenCalled();
        expect(MySqlConnectionStringBuilder).toHaveBeenCalled();
        expect(resolveFilePathSpy).toHaveBeenCalled();
        expect(addFirewallRuleSpy).toHaveBeenCalled();
        expect(actionExecuteSpy).toHaveBeenCalled();    
        expect(removeFirewallRuleSpy).toHaveBeenCalled();    
        expect(setFailedSpy).not.toHaveBeenCalled();
    })

    it('throws error if sql server name mismatch occurs', async () => {
        let getInputSpy = jest.spyOn(core, 'getInput').mockImplementation((name, options): string => {
            switch(name) {
                case 'server-name': return 'testmysqlserver2.mysql.database.azure.com';
                case 'connection-string': return 'testmysqlserver.mysql.database.azure.com; Port=3306; Database=testdb; Uid=testuser@testmysqlserver; Pwd=testpassword; SslMode=Preferred';
                case 'sql-file': return './testsqlfile.sql';
                case 'arguments': return '-t 10';
            }

            return '';
        });

        let resolveFilePathSpy = jest.spyOn(AzureMySqlActionHelper, 'resolveFilePath').mockReturnValue('./testsqlfile.sql');

        let getAuthorizerSpy = jest.spyOn(AuthorizerFactory, 'getAuthorizer');
        let addFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'addFirewallRule');
        let actionExecuteSpy = jest.spyOn(AzureMySqlAction.prototype, 'execute');
        let removeFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'removeFirewallRule');
        let setFaledSpy = jest.spyOn(core, 'setFailed');

        await run();

        expect(AzureMySqlAction).not.toHaveBeenCalled();
        expect(getAuthorizerSpy).not.toHaveBeenCalled();
        expect(addFirewallRuleSpy).not.toHaveBeenCalled();
        expect(actionExecuteSpy).not.toHaveBeenCalled();    
        expect(removeFirewallRuleSpy).not.toHaveBeenCalled();

        expect(getInputSpy).toHaveBeenCalledTimes(3);
        expect(resolveFilePathSpy).toHaveBeenCalled();
        expect(MySqlConnectionStringBuilder).toHaveBeenCalled();
        expect(setFaledSpy).toHaveBeenCalledWith('Server name mismatch error. The server name provided in the action input does not match the server name provided in the connection string.'); 
    })

    it('throws error if sql file path is invalid', async () => {
        let getInputSpy = jest.spyOn(core, 'getInput').mockImplementation((name, options): string => {
            switch(name) {
                case 'server-name': return 'testmysqlserver2.mysql.database.azure.com';
                case 'connection-string': return 'testmysqlserver.mysql.database.azure.com; Port=3306; Database=testdb; Uid=testuser@testmysqlserver; Pwd=testpassword; SslMode=Preferred';
                case 'sql-file': return './testsqlfile.random';
                case 'arguments': return '-t 10';
            }

            return '';
        });

        let resolveFilePathSpy = jest.spyOn(AzureMySqlActionHelper, 'resolveFilePath').mockReturnValue('./testsqlfile.random');

        let getAuthorizerSpy = jest.spyOn(AuthorizerFactory, 'getAuthorizer');
        let addFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'addFirewallRule');
        let actionExecuteSpy = jest.spyOn(AzureMySqlAction.prototype, 'execute');
        let removeFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'removeFirewallRule');
        let setFaledSpy = jest.spyOn(core, 'setFailed');

        await run();

        expect(AzureMySqlAction).not.toHaveBeenCalled();
        expect(getAuthorizerSpy).not.toHaveBeenCalled();
        expect(addFirewallRuleSpy).not.toHaveBeenCalled();
        expect(actionExecuteSpy).not.toHaveBeenCalled();    
        expect(removeFirewallRuleSpy).not.toHaveBeenCalled();

        expect(getInputSpy).toHaveBeenCalledTimes(3);
        expect(resolveFilePathSpy).toHaveBeenCalled();
        expect(MySqlConnectionStringBuilder).toHaveBeenCalled();
        expect(setFaledSpy).toHaveBeenCalledWith('Invalid sql file path provided as input ./testsqlfile.random'); 
    })
})