import * as exec from '@actions/exec';
import AzureMySqlActionHelper from '../src/AzureMySqlActionHelper';
import MySqlConnectionStringBuilder from '../src/MySqlConnectionStringBuilder';
import AzureMySqlAction, { IActionInputs } from '../src/AzureMySqlAction';

describe('AzureMySqlAction.ng tests', () => {
    it('executes sql file on target database', async () => {

        let inputs = getInputs();
        let action = new AzureMySqlAction(inputs);

        let getMySqlClientPathSpy = jest.spyOn(AzureMySqlActionHelper, 'getMySqlClientPath').mockResolvedValue('mysql.exe');
        let execSpy = jest.spyOn(exec, 'exec').mockResolvedValue(0);

        await action.execute();

        expect(getMySqlClientPathSpy).toHaveBeenCalledTimes(1);
        expect(execSpy).toHaveBeenCalledTimes(1);
        expect(execSpy).toHaveBeenCalledWith(`"mysql.exe" -t 10`,
            [
                "-h", "testmysqlserver.mysql.database.azure.com",
                "-u", "testuser@testmysqlserver",
                "-e", "source ./testsqlfile.sql",
                "-D", "testdb"
            ], {
            env: {
                "MYSQL_PWD": "testpassword"
            }
        })
    })

    it('executes sql file on target server', async () => {

        let inputsNoDB = getInputsNoDatabase();
        let action = new AzureMySqlAction(inputsNoDB);

        let getMySqlClientPathSpy = jest.spyOn(AzureMySqlActionHelper, 'getMySqlClientPath').mockResolvedValue('mysql.exe');
        let execSpy = jest.spyOn(exec, 'exec').mockResolvedValue(0);

        await action.execute();

        expect(getMySqlClientPathSpy).toHaveBeenCalledTimes(1);
        expect(execSpy).toHaveBeenCalledTimes(1);
        expect(execSpy).toHaveBeenCalledWith(`"mysql.exe" -t 10`,
            [
                "-h", "testmysqlserver.mysql.database.azure.com",
                "-u", "testuser@testmysqlserver",
                "-e", "source ./testsqlfile.sql"
            ], {
            env: {
                "MYSQL_PWD": "testpassword"
            }
        })
    })

    it('throws if mysql client fails to execute', async () => {
        let inputs = getInputs();
        let action = new AzureMySqlAction(inputs);

        let getMySqlClientPathSpy = jest.spyOn(AzureMySqlActionHelper, 'getMySqlClientPath').mockResolvedValue('mysql.exe');
        let execSpy = jest.spyOn(exec, 'exec').mockRejectedValue(1);

        expect.assertions(3);
        await expect(action.execute()).rejects.toEqual(1);
        expect(getMySqlClientPathSpy).toHaveBeenCalledTimes(1);
        expect(execSpy).toHaveBeenCalledTimes(1);
    })
})

function getInputs() {
    return {
        serverName: 'testmysqlserver.mysql.database.azure.com',
        connectionString: {
            server: 'testmysqlserver.mysql.database.azure.com',
            userId: 'testuser@testmysqlserver',
            password: 'testpassword',
            database: 'testdb'
        },
        sqlFile: './testsqlfile.sql',
        additionalArguments: '-t 10'
    } as IActionInputs;
}

function getInputsNoDatabase() {
    return {
        serverName: 'testmysqlserver.mysql.database.azure.com',
        connectionString: {
            server: 'testmysqlserver.mysql.database.azure.com',
            userId: 'testuser@testmysqlserver',
            password: 'testpassword'
        },
        sqlFile: './testsqlfile.sql',
        additionalArguments: '-t 10'
    } as IActionInputs;
}