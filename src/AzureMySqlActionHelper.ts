import * as core from '@actions/core';
import * as io from '@actions/io';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';
import winreg from 'winreg';

const IS_WINDOWS = process.platform === 'win32';

export default class AzureMySqlActionHelper {  
    public static getRegistrySubKeys(path: string): Promise<winreg.Registry[]> {
        return new Promise((resolve) => {
            core.debug(`Getting sub-keys at registry path: HKLM:${path}`);
            let regKey = new winreg({
                hive: winreg.HKLM,
                key: path
            });

            regKey.keys((error, result) => {
                return !!error ? '' : resolve(result);
            })
        });
    }

    public static getRegistryValue(registryKey: winreg.Registry, name: string): Promise<string> {
        return new Promise((resolve) => {
            core.debug(`Getting registry value ${name} at path: HKLM:${registryKey.key}`);
            registryKey.get(name, (error, result: winreg.RegistryItem) => {
                resolve(!!error ? '' : result.value);
            });
        });
    }

    public static registryKeyExists(path: string): Promise<boolean> {
        core.debug(`Checking if registry key 'HKLM:${path}' exists.`);
        return new Promise((resolve) => {
            let regKey = new winreg({
                hive: winreg.HKLM,
                key: path
            });

            regKey.keyExists((error, result: boolean) => {
                resolve(!!error ? false : result);
            })
        });
    }

    public static async getMySqlClientPath(): Promise<string> {
        core.debug(`Getting location of MySql client on ${os.hostname()}`);
        if (IS_WINDOWS) {
            return this._getMySqlClientOnWindows();
        }
        else {
            return this._getMySqlClientOnLinux();
        }
    }

    public static resolveFilePath(filePathPattern: string): string {
        let filePath = filePathPattern;
        if (glob.hasMagic(filePathPattern)) {
            let matchedFiles: string[] = glob.sync(filePathPattern);
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

    private static async _getMySqlClientOnWindows(): Promise<string> {
        let mySqlClientRegistryKey = path.join('\\', 'Software', 'MySQL AB');
        let mySqlClientRegistryKeyWow6432 = path.join('\\', 'Software', 'Wow6432Node', 'MySQL AB');
        let mySqlClientPath = '';
        
        if (await AzureMySqlActionHelper.registryKeyExists(mySqlClientRegistryKey)) {
            mySqlClientPath = await this._getMySqlClientPathFromRegistry(mySqlClientRegistryKey);    
        }

        if (!mySqlClientPath && await AzureMySqlActionHelper.registryKeyExists(mySqlClientRegistryKeyWow6432)) {
            mySqlClientPath = await this._getMySqlClientPathFromRegistry(mySqlClientRegistryKeyWow6432);
        }  

        if (!mySqlClientPath) {
            core.debug(`Unable to find mysql client executable on ${os.hostname()} from registry.`);
            core.debug(`Getting location of mysql.exe from PATH environment variable.`);
            mySqlClientPath = await io.which('mysql', false);
        }

        if (mySqlClientPath) {
            core.debug(`MySql client found at path ${mySqlClientPath}`);
            return mySqlClientPath;
        }
        else {
            throw new Error(`Unable to find mysql client executable on ${os.hostname()}.`);
        }
    }

    private static async _getMySqlClientPathFromRegistry(registryPath: string): Promise<string> {
        core.debug(`Getting location of mysql.exe from registryPath HKLM:${registryPath}`);
        let registrySubKeys = await AzureMySqlActionHelper.getRegistrySubKeys(registryPath);
        for (let registryKey of registrySubKeys) {
            if (registryKey.key.match('MySQL Server')) {
                let mySqlServerPath = await AzureMySqlActionHelper.getRegistryValue(registryKey, 'Location');
                if (!!mySqlServerPath) {
                    let mySqlClientExecutablePath = path.join(mySqlServerPath, 'bin', 'mysql.exe');
                    if (fs.existsSync(mySqlClientExecutablePath)) {
                        core.debug(`MySQL client executable found at location ${mySqlClientExecutablePath}`);
                        return mySqlClientExecutablePath;
                    }
                }
            }
        }

        return '';
    }

    private static async _getMySqlClientOnLinux(): Promise<string> {
        let  mySqlClientPath = await io.which('mysql', true);
        core.debug(`MySql client found at path ${mySqlClientPath}`);
        return mySqlClientPath;
    }
}