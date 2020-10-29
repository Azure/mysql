import * as core from '@actions/core';
import * as crypto from 'crypto';
import * as path from 'path';
import { AuthorizerFactory } from 'azure-actions-webclient/AuthorizerFactory';

import AzureMySqlActionHelper from './AzureMySqlActionHelper';
import AzureMySqlAction, { IActionInputs } from "./AzureMySqlAction";
import FirewallManager from './FirewallManager';
import AzureMySqlResourceManager from './AzureMySqlResourceManager';
import MySqlConnectionStringBuilder from './MySqlConnectionStringBuilder';
import MySqlUtils from './MySqlUtils';
import { MySqlConnectionString } from './MySqlConnectionString';

let userAgentPrefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";

export async function run() {
    let firewallManager;
    try {
        // Set user agent variable
        let usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
        let actionName = 'AzureMySqlAction';
        let userAgentString = (!!userAgentPrefix ? `${userAgentPrefix}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
        core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);

        let inputs = getInputs();
        let azureMySqlAction = new AzureMySqlAction(inputs);
        const runnerIPAddress = await MySqlUtils.detectIPAddress(inputs.serverName, inputs.connectionString);
        if (runnerIPAddress) {
            let azureResourceAuthorizer = await AuthorizerFactory.getAuthorizer();
            let azureMySqlResourceManager = await AzureMySqlResourceManager.getResourceManager(inputs.serverName, azureResourceAuthorizer);
            firewallManager = new FirewallManager(azureMySqlResourceManager);
            await firewallManager.addFirewallRule(runnerIPAddress);
        }
        await azureMySqlAction.execute();
    }
    catch (error) {
        core.setFailed(error.message);
    }
    finally {
        if (firewallManager) {
            await firewallManager.removeFirewallRule();
        }

        // Reset AZURE_HTTP_USER_AGENT
        core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentPrefix);
    }
}

function getInputs(): IActionInputs {
    let serverName = core.getInput('server-name', { required: true });

    // Support both auth methods. Passing all parameters (login,pwd,db) or the legacy connection string
    const connectionString = core.getInput('connection-string', { required: false });
    const username = core.getInput('username', { required: false });

    if (username && username !== '' && connectionString && connectionString !== '') {
        throw new Error('Cannot specify both username and connection string')
    }

    let connectionStringBuilder: MySqlConnectionString

    if (username && username !== '') {

        connectionStringBuilder = {
            server: serverName,
            userId: username,
            password: core.getInput('password', { required: true }),
            database: core.getInput('database', { required: false })
        }
    } else if (!connectionString || connectionString === '') {
        throw new Error('Need to specify either username and password or connection-string')
    } else { // use deprecated connection string
        connectionStringBuilder = new MySqlConnectionStringBuilder(connectionString);

        // validate that the server name input matches the connection string server name
        if (serverName.toLowerCase() !== connectionStringBuilder.server.toLowerCase()) {
            throw new Error('Server name mismatch error. The server name provided in the action input does not match the server name provided in the connection string.');
        }
    }

    const sqlFile = AzureMySqlActionHelper.resolveFilePath(core.getInput('sql-file', { required: true }));

    if (path.extname(sqlFile).toLowerCase() !== '.sql') {
        throw new Error(`Invalid sql file path provided as input ${sqlFile}`);
    }

    const additionalArguments = core.getInput('arguments');

    return {
        serverName: serverName,
        connectionString: connectionStringBuilder,
        sqlFile: sqlFile,
        additionalArguments: additionalArguments
    };
}

run();