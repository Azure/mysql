import * as exec from '@actions/exec';
import AzureMySqlActionHelper from '../src/AzureMySqlActionHelper';
import AzureMySqlResourceManager, { FirewallRule } from '../src/AzureMySqlResourceManager';
import FirewallManager from '../src/FirewallManager';
import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';

let addFirewallRuleSpy = jest.fn().mockImplementation(() => {
    return {
        name: 'FirewallRule'
    };
})

let removeFirewallRuleSpy = jest.fn();

jest.mock('../src/AzureMySqlResourceManager', () => ({
    getResourceManager: () => ({
        addFirewallRule: addFirewallRuleSpy,
        removeFirewallRule: removeFirewallRuleSpy
    })
}));

describe('FirewallManager tests', () => {
    it('detects IP address and adds firewall rules successfully', async () => {
        let getMySqlClientPathSpy = jest.spyOn(AzureMySqlActionHelper, 'getMySqlClientPath').mockResolvedValue('mysql.exe');

        let execSpy = jest.spyOn(exec, 'exec').mockImplementation((commandLine, args, options) => {
            let mysqlClientError = `Client with IP address '1.2.3.4' is not allowed to access the server.`;
            options!.listeners!.stderr!(Buffer.from(mysqlClientError));
            return Promise.reject(1);
        }); 

        let firewallManager = new FirewallManager(await AzureMySqlResourceManager.getResourceManager('server', {} as IAuthorizer));

        await firewallManager.addFirewallRule('server', {});

        expect(getMySqlClientPathSpy).toHaveBeenCalledTimes(1);
        expect(addFirewallRuleSpy).toHaveBeenCalledTimes(1);
        expect(execSpy).toHaveBeenCalledTimes(1);
    })

    it('removes firewall rule successfully', async () => {
        jest.spyOn(AzureMySqlActionHelper, 'getMySqlClientPath').mockResolvedValue('mysql.exe');
        jest.spyOn(exec, 'exec').mockImplementation((commandLine, args, options) => {
            let mysqlClientError = `Client with IP address '1.2.3.4' is not allowed to access the server.`;
            options!.listeners!.stderr!(Buffer.from(mysqlClientError));
            return Promise.reject(1);
        }); 

        let firewallManager = new FirewallManager(await AzureMySqlResourceManager.getResourceManager('server', {} as IAuthorizer));
        await firewallManager.addFirewallRule('server', {});

        await firewallManager.removeFirewallRule();

        expect(removeFirewallRuleSpy).toHaveBeenCalledTimes(1);
    })

    it('does not add firewall rule if client has access to MySql server', async () => {
        let getMySqlClientPathSpy = jest.spyOn(AzureMySqlActionHelper, 'getMySqlClientPath').mockResolvedValue('mysql.exe');
        let execSpy = jest.spyOn(exec, 'exec').mockResolvedValue(0);

        let firewallManager = new FirewallManager(await AzureMySqlResourceManager.getResourceManager('server', {} as IAuthorizer));
        await firewallManager.addFirewallRule('server', {});

        expect(getMySqlClientPathSpy).toHaveBeenCalledTimes(1);
        expect(execSpy).toHaveBeenCalledTimes(1);
        expect(addFirewallRuleSpy).not.toHaveBeenCalled();
        expect(removeFirewallRuleSpy).not.toHaveBeenCalled();
    })
})
