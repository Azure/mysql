import * as core from '@actions/core';
import * as path from 'path';
import { AuthorizerFactory } from 'azure-actions-webclient/AuthorizerFactory';

import AzureMySqlActionHelper from './AzureMySqlActionHelper';
import AzureMySqlAction, { IActionInputs } from "./AzureMySqlAction";
import FirewallManager from './FirewallManager';
import AzureMySqlResourceManager from './AzureMySqlResourceManager';
import MySqlConnectionStringBuilder from './MySqlConnectionStringBuilder';

export async function run() {
    let firewallManager;
    try {
        let inputs = getInputs();
        let azureMySqlAction = new AzureMySqlAction(inputs);
        let azureResourceAuthorizer = await AuthorizerFactory.getAuthorizer();
        let azureMySqlResourceManager = await AzureMySqlResourceManager.getResourceManager(inputs.serverName, azureResourceAuthorizer);
        firewallManager = new FirewallManager(azureMySqlResourceManager);

        await firewallManager.addFirewallRule(inputs.serverName, inputs.connectionString);
        await azureMySqlAction.execute();
    }
    catch(error) {
        core.setFailed(error.message);
    }
    finally {
        if (firewallManager) {
            await firewallManager.removeFirewallRule();
        }
    }
}

function getInputs(): IActionInputs {
    let serverName = core.getInput('server-name', { required: true });
    
    let connectionString = core.getInput('connection-string', { required: true });
    let connectionStringBuilder = new MySqlConnectionStringBuilder(connectionString);
    
    let sqlFile = AzureMySqlActionHelper.resolveFilePath(core.getInput('sql-file', { required: true }));
    if (path.extname(sqlFile).toLowerCase() !== '.sql') {
        throw new Error(`Invalid sql file path provided as input ${sqlFile}`);
    }

    let additionalArguments = core.getInput('arguments');
    
    return {
        serverName: serverName,
        connectionString: connectionStringBuilder,
        sqlFile: sqlFile,
        additionalArguments: additionalArguments   
    };
}

run();