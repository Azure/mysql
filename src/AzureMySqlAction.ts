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
        await exec.exec(`"${mySqlClientPath}" -h ${this._inputs.serverName} -D ${this._inputs.connectionString.database} -u ${this._inputs.connectionString.userId} --password="${this._inputs.connectionString.password}" ${this._inputs.additionalArguments} -e "source ${this._inputs.sqlFile}"`)
        
        console.log('Successfully executed sql file on target database');
    }

    private _inputs: IActionInputs;
}