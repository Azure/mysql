import * as exec from '@actions/exec';
import MySqlUtils from "../src/MySqlUtils";
import AzureMySqlActionHelper from "../src/AzureMySqlActionHelper";

describe('MySqlUtils tests', () => {
    it('detectIPAddress should return ipaddress', async () => {
        let getMySqlClientPathSpy = jest.spyOn(AzureMySqlActionHelper, 'getMySqlClientPath').mockResolvedValue('mysql.exe')
        let execSpy = jest.spyOn(exec, 'exec').mockImplementation((_commandLine, _args, options) => {
            let mysqlClientError = `Client with IP address '1.2.3.4' is not allowed to access the server.`;
            options!.listeners!.stderr!(Buffer.from(mysqlClientError));
            return Promise.reject(1);
        }); 

        let ipAddress = await MySqlUtils.detectIPAddress('serverName', 'connString');

        expect(getMySqlClientPathSpy).toHaveBeenCalledTimes(1);
        expect(execSpy).toHaveBeenCalledTimes(1);
        expect(ipAddress).toBe('1.2.3.4');
    });

    it('detectIPAddress should return empty', async () => {
        let getMySqlClientPathSpy = jest.spyOn(AzureMySqlActionHelper, 'getMySqlClientPath').mockResolvedValue('mysql.exe')
        let execSpy = jest.spyOn(exec, 'exec').mockResolvedValue(0);

        let ipAddress = await MySqlUtils.detectIPAddress('serverName', 'connString');

        expect(getMySqlClientPathSpy).toHaveBeenCalledTimes(1);
        expect(execSpy).toHaveBeenCalledTimes(1);
        expect(ipAddress).toBe('');
    });

    it('detectIPAddress should throw error', () => {
        let getMySqlClientPathSpy = jest.spyOn(AzureMySqlActionHelper, 'getMySqlClientPath').mockResolvedValue('mysql.exe')
        let execSpy = jest.spyOn(exec, 'exec').mockImplementation((_commandLine, _args, options) => {
            let mysqlClientError = `error does not contain IPAddress`;
            options!.listeners!.stderr!(Buffer.from(mysqlClientError));
            return Promise.reject(1);
        }); 

        expect(MySqlUtils.detectIPAddress('serverName', 'connString')).rejects;
        expect(getMySqlClientPathSpy).toHaveBeenCalledTimes(1);
    });

});