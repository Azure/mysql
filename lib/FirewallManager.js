"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const AzureMySqlActionHelper_1 = __importDefault(require("./AzureMySqlActionHelper"));
const ipv4MatchPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
class FirewallManager {
    constructor(azureMySqlResourceManager) {
        this._resourceManager = azureMySqlResourceManager;
    }
    addFirewallRule(serverName, connectionString) {
        return __awaiter(this, void 0, void 0, function* () {
            let ipAddress = yield this._detectIPAddress(serverName, connectionString);
            if (!ipAddress) {
                core.debug(`Client has access to MySql server. Skip adding firewall exception.`);
                return;
            }
            console.log(`Client does not have access to MySql server. Adding firewall exception for client's IP address.`);
            this._firewallRule = yield this._resourceManager.addFirewallRule(ipAddress, ipAddress);
            core.debug(JSON.stringify(this._firewallRule));
            console.log(`Successfully added firewall rule ${this._firewallRule.name}.`);
        });
    }
    removeFirewallRule() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._firewallRule) {
                console.log(`Removing firewall rule '${this._firewallRule.name}'.`);
                yield this._resourceManager.removeFirewallRule(this._firewallRule);
                console.log('Successfully removed firewall rule.');
            }
            else {
                core.debug('No firewall exception was added.');
            }
        });
    }
    _detectIPAddress(serverName, connectionString) {
        return __awaiter(this, void 0, void 0, function* () {
            let mySqlClientPath = yield AzureMySqlActionHelper_1.default.getMySqlClientPath();
            let ipAddress = '';
            let mySqlError = '';
            try {
                core.debug(`Validating if client has access to MySql Server '${serverName}'.`);
                core.debug(`"${mySqlClientPath}" -h ${serverName} -u "${connectionString.userId}" -e "show databases"`);
                yield exec.exec(`"${mySqlClientPath}" -h ${serverName} -u "${connectionString.userId}" --password="${connectionString.password}" -e "show databases"`, [], {
                    silent: true,
                    listeners: {
                        stderr: (data) => mySqlError += data.toString()
                    }
                });
            }
            catch (error) {
                core.debug(mySqlError);
                let ipAddresses = mySqlError.match(ipv4MatchPattern);
                if (!!ipAddresses) {
                    ipAddress = ipAddresses[0];
                }
                else {
                    throw new Error(`Failed to add firewall rule. Unable to detect client IP Address. ${mySqlError} ${error}`);
                }
            }
            //ipAddress will be an empty string if client has access to SQL server
            return ipAddress;
        });
    }
}
exports.default = FirewallManager;
