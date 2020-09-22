import AzureMySqlResourceManager from '../src/AzureMySqlResourceManager';
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
    it('adds firewall rules successfully', async () => {
        let firewallManager = new FirewallManager(await AzureMySqlResourceManager.getResourceManager('server', {} as IAuthorizer));
        await firewallManager.addFirewallRule('1.2.3.4');
        
        expect(addFirewallRuleSpy).toHaveBeenCalledTimes(1);
    });

    it('removes firewall rule successfully', async () => {
        let firewallManager = new FirewallManager(await AzureMySqlResourceManager.getResourceManager('server', {} as IAuthorizer));
        await firewallManager.addFirewallRule('1.2.3.4');
        await firewallManager.removeFirewallRule();
        
        expect(removeFirewallRuleSpy).toHaveBeenCalledTimes(1);
    });

    it('does not add firewall rule if client has access to MySql server', async () => {
        let firewallManager = new FirewallManager(await AzureMySqlResourceManager.getResourceManager('server', {} as IAuthorizer));
        await firewallManager.addFirewallRule('');
        
        expect(addFirewallRuleSpy).not.toHaveBeenCalled();
        expect(removeFirewallRuleSpy).not.toHaveBeenCalled();
    });
    
})
