import * as core from '@actions/core';
import * as exec from '@actions/exec';
import AzureMySqlActionHelper from './AzureMySqlActionHelper';
import MySqlConnectionStringBuilder from './MySqlConnectionStringBuilder';

export interface IActionInputs {
    serverName: string;
    connectionString: MySqlConnectionStringBuilder;
    sqlFile: string;
    additionalArguments: string;
}

export default class AzureMySqlAction {
    constructor(inputs: IActionInputs) {
        this._inputs = inputs;
    }

    public async execute() {
        core.debug('Begin executing action...');

        let mySqlClientPath = await AzureMySqlActionHelper.getMySqlClientPath();

        let parameters = [
            "-h", this._inputs.serverName,
            "-u", this._inputs.connectionString.userId,
            "-e", `source ${this._inputs.sqlFile}`,
        ]

        if (this._inputs.connectionString.database) {
            parameters.push("-D")
            parameters.push(this._inputs.connectionString.database)
        }

        await exec.exec(`"${mySqlClientPath}" ${this._inputs.additionalArguments}`,
            parameters, {
            env: {
                "MYSQL_PWD": this._inputs.connectionString.password
            }
        });
        
        console.log('Successfully executed sql file on target database');
    }

    private _inputs: IActionInputs;
}