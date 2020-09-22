import * as exec from '@actions/exec';
import AzureMySqlActionHelper from '../src/AzureMySqlActionHelper';
import MySqlConnectionStringBuilder from '../src/MySqlConnectionStringBuilder';
import AzureMySqlAction, { IActionInputs } from '../src/AzureMySqlAction';

jest.mock('../src/MySqlConnectionStringBuilder', () => {
    return jest.fn().mockImplementation(() => {
        return {
            server: 'testmysqlserver.mysql.database.azure.com',
            userId: 'testuser@testmysqlserver',
            password: 'testpassword',
            database: 'testdb'
        }
    })
});

describe('AzureMySqlAction tests', () => {
    it('executes sql file on target database', async () => {
        let inputs = getInputs();
        let action = new AzureMySqlAction(inputs);

        let getMySqlClientPathSpy = jest.spyOn(AzureMySqlActionHelper, 'getMySqlClientPath').mockResolvedValue('mysql.exe');
        let execSpy = jest.spyOn(exec, 'exec').mockResolvedValue(0);

        await action.execute();

        expect(getMySqlClientPathSpy).toHaveBeenCalledTimes(1);
        expect(execSpy).toHaveBeenCalledTimes(1);
        expect(execSpy).toHaveBeenCalledWith(`"mysql.exe" -h testmysqlserver.mysql.database.azure.com -D testdb -u testuser@testmysqlserver -t 10 -e "source ./testsqlfile.sql"`, ['--password=testpassword']);
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
        connectionString: new MySqlConnectionStringBuilder('testmysqlserver.mysql.database.azure.com; Port=3306; Database=testdb; Uid=testuser@testmysqlserver; Pwd=testpassword; SslMode=Preferred'),
        sqlFile: './testsqlfile.sql',
        additionalArguments: '-t 10'
    } as IActionInputs;
}