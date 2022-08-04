"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core = __importStar(require("@actions/core"));
const crypto = __importStar(require("crypto"));
const path = __importStar(require("path"));
const AuthorizerFactory_1 = require("azure-actions-webclient/AuthorizerFactory");
const AzureMySqlActionHelper_1 = __importDefault(require("./AzureMySqlActionHelper"));
const AzureMySqlAction_1 = __importDefault(require("./AzureMySqlAction"));
const FirewallManager_1 = __importDefault(require("./FirewallManager"));
const AzureMySqlResourceManager_1 = __importDefault(require("./AzureMySqlResourceManager"));
const MySqlConnectionStringBuilder_1 = __importDefault(require("./MySqlConnectionStringBuilder"));
const MySqlUtils_1 = __importDefault(require("./MySqlUtils"));
let userAgentPrefix = !!process.env.AZURE_HTTP_USER_AGENT ? `${process.env.AZURE_HTTP_USER_AGENT}` : "";
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let firewallManager;
        try {
            // Set user agent variable
            let usrAgentRepo = crypto.createHash('sha256').update(`${process.env.GITHUB_REPOSITORY}`).digest('hex');
            let actionName = 'AzureMySqlAction';
            let userAgentString = (!!userAgentPrefix ? `${userAgentPrefix}+` : '') + `GITHUBACTIONS_${actionName}_${usrAgentRepo}`;
            core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentString);
            let inputs = getInputs();
            let azureMySqlAction = new AzureMySqlAction_1.default(inputs);
            const runnerIPAddress = yield MySqlUtils_1.default.detectIPAddress(inputs.serverName, inputs.connectionString);
            if (runnerIPAddress) {
                let azureResourceAuthorizer = yield AuthorizerFactory_1.AuthorizerFactory.getAuthorizer();
                let azureMySqlResourceManager = yield AzureMySqlResourceManager_1.default.getResourceManager(inputs.serverName, azureResourceAuthorizer);
                firewallManager = new FirewallManager_1.default(azureMySqlResourceManager);
                yield firewallManager.addFirewallRule(runnerIPAddress);
            }
            yield azureMySqlAction.execute();
        }
        catch (error) {
            core.setFailed(error.message);
        }
        finally {
            if (firewallManager) {
                yield firewallManager.removeFirewallRule();
            }
            // Reset AZURE_HTTP_USER_AGENT
            core.exportVariable('AZURE_HTTP_USER_AGENT', userAgentPrefix);
        }
    });
}
exports.run = run;
function getInputs() {
    let serverName = core.getInput('server-name', { required: true });
    // Support both auth methods. Passing all parameters (login,pwd,db) or the legacy connection string
    const connectionString = core.getInput('connection-string', { required: false });
    const username = core.getInput('username', { required: false });
    if (username && username !== '' && connectionString && connectionString !== '') {
        throw new Error('Cannot specify both username and connection string');
    }
    let connectionStringBuilder;
    if (username && username !== '') {
        connectionStringBuilder = {
            server: serverName,
            userId: username,
            password: core.getInput('password', { required: true }),
            database: core.getInput('database', { required: false })
        };
    }
    else if (!connectionString || connectionString === '') {
        throw new Error('Need to specify either username and password or connection-string');
    }
    else { // use deprecated connection string
        connectionStringBuilder = new MySqlConnectionStringBuilder_1.default(connectionString);
        // validate that the server name input matches the connection string server name
        if (serverName.toLowerCase() !== connectionStringBuilder.server.toLowerCase()) {
            throw new Error('Server name mismatch error. The server name provided in the action input does not match the server name provided in the connection string.');
        }
    }
    const sqlFile = AzureMySqlActionHelper_1.default.resolveFilePath(core.getInput('sql-file', { required: true }));
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
