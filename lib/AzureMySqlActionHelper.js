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
const io = __importStar(require("@actions/io"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const glob = __importStar(require("glob"));
const winreg_1 = __importDefault(require("winreg"));
const IS_WINDOWS = process.platform === 'win32';
class AzureMySqlActionHelper {
    static getRegistrySubKeys(path) {
        return new Promise((resolve) => {
            core.debug(`Getting sub-keys at registry path: HKLM:${path}`);
            let regKey = new winreg_1.default({
                hive: winreg_1.default.HKLM,
                key: path
            });
            regKey.keys((error, result) => {
                return !!error ? '' : resolve(result);
            });
        });
    }
    static getRegistryValue(registryKey, name) {
        return new Promise((resolve) => {
            core.debug(`Getting registry value ${name} at path: HKLM:${registryKey.key}`);
            registryKey.get(name, (error, result) => {
                resolve(!!error ? '' : result.value);
            });
        });
    }
    static registryKeyExists(path) {
        core.debug(`Checking if registry key 'HKLM:${path}' exists.`);
        return new Promise((resolve) => {
            let regKey = new winreg_1.default({
                hive: winreg_1.default.HKLM,
                key: path
            });
            regKey.keyExists((error, result) => {
                resolve(!!error ? false : result);
            });
        });
    }
    static getMySqlClientPath() {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Getting location of MySql client on ${os.hostname()}`);
            if (IS_WINDOWS) {
                return this._getMySqlClientOnWindows();
            }
            else {
                return this._getMySqlClientOnLinux();
            }
        });
    }
    static resolveFilePath(filePathPattern) {
        let filePath = filePathPattern;
        if (glob.hasMagic(filePathPattern)) {
            let matchedFiles = glob.sync(filePathPattern);
            if (matchedFiles.length === 0) {
                throw new Error(`No files found matching pattern ${filePathPattern}`);
            }
            if (matchedFiles.length > 1) {
                throw new Error(`Muliple files found matching pattern ${filePathPattern}`);
            }
            filePath = matchedFiles[0];
        }
        if (!fs.existsSync(filePath)) {
            throw new Error(`Unable to find file at location: ${filePath}`);
        }
        return filePath;
    }
    static _getMySqlClientOnWindows() {
        return __awaiter(this, void 0, void 0, function* () {
            let mySqlClientRegistryKey = path.join('\\', 'Software', 'MySQL AB');
            let mySqlClientRegistryKeyWow6432 = path.join('\\', 'Software', 'Wow6432Node', 'MySQL AB');
            let mySqlClientPath = '';
            if (yield AzureMySqlActionHelper.registryKeyExists(mySqlClientRegistryKey)) {
                mySqlClientPath = yield this._getMySqlClientPathFromRegistry(mySqlClientRegistryKey);
            }
            if (!mySqlClientPath && (yield AzureMySqlActionHelper.registryKeyExists(mySqlClientRegistryKeyWow6432))) {
                mySqlClientPath = yield this._getMySqlClientPathFromRegistry(mySqlClientRegistryKeyWow6432);
            }
            if (!mySqlClientPath) {
                core.debug(`Unable to find mysql client executable on ${os.hostname()} from registry.`);
                core.debug(`Getting location of mysql.exe from PATH environment variable.`);
                mySqlClientPath = yield io.which('mysql', false);
            }
            if (mySqlClientPath) {
                core.debug(`MySql client found at path ${mySqlClientPath}`);
                return mySqlClientPath;
            }
            else {
                throw new Error(`Unable to find mysql client executable on ${os.hostname()}.`);
            }
        });
    }
    static _getMySqlClientPathFromRegistry(registryPath) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`Getting location of mysql.exe from registryPath HKLM:${registryPath}`);
            let registrySubKeys = yield AzureMySqlActionHelper.getRegistrySubKeys(registryPath);
            for (let registryKey of registrySubKeys) {
                if (registryKey.key.match('MySQL Server')) {
                    let mySqlServerPath = yield AzureMySqlActionHelper.getRegistryValue(registryKey, 'Location');
                    if (!!mySqlServerPath) {
                        let mySqlClientExecutablePath = path.join(mySqlServerPath, 'bin', 'mysql.exe');
                        if (fs.existsSync(mySqlClientExecutablePath)) {
                            core.debug(`MySQL client executable found at path ${mySqlClientExecutablePath}`);
                            return mySqlClientExecutablePath;
                        }
                    }
                }
            }
            return '';
        });
    }
    static _getMySqlClientOnLinux() {
        return __awaiter(this, void 0, void 0, function* () {
            let mySqlClientPath = yield io.which('mysql', true);
            core.debug(`MySQL client found at path ${mySqlClientPath}`);
            return mySqlClientPath;
        });
    }
}
exports.default = AzureMySqlActionHelper;
