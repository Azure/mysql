import * as exec from '@actions/exec';
import MySqlUtils from "../src/MySqlUtils";
import AzureMySqlActionHelper from "../src/AzureMySqlActionHelper";
import { HttpClient } from '@actions/http-client';

jest.mock('@actions/http-client');

describe('MySqlUtils tests', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('detectIPAddress should return ip address', async () => {
        let getMySqlClientPathSpy = jest.spyOn(AzureMySqlActionHelper, 'getMySqlClientPath').mockResolvedValue('mysql.exe');

        let execSpy = jest.spyOn(exec, 'exec').mockImplementation((_commandLine, _args, options) => {
            let mysqlClientError = `Client with IP address '1.2.3.4' is not allowed to access the server.`;
            options!.listeners!.stderr!(Buffer.from(mysqlClientError));
            return Promise.reject(1);
        });

        let httpSpy = jest.spyOn(HttpClient.prototype, 'getJson').mockResolvedValue({
            statusCode: 200,
            result: {
                ip: '1.2.3.4',
            },
            headers: {},
        });

        let ipAddress = await MySqlUtils.detectIPAddress('serverName', 'connString');

        expect(getMySqlClientPathSpy).toHaveBeenCalledTimes(1);
        expect(execSpy).toHaveBeenCalledTimes(1);
        expect(httpSpy).toHaveBeenCalledTimes(1);
        expect(ipAddress).toBe('1.2.3.4');
    });

    it('detectIPAddress should return empty string', async () => {
        let getMySqlClientPathSpy = jest.spyOn(AzureMySqlActionHelper, 'getMySqlClientPath').mockResolvedValue('mysql.exe');
    
        let execSpy = jest.spyOn(exec, 'exec').mockResolvedValue(0);

        let ipAddress = await MySqlUtils.detectIPAddress('serverName', 'connString');

        expect(getMySqlClientPathSpy).toHaveBeenCalledTimes(1);
        expect(execSpy).toHaveBeenCalledTimes(1);
        expect(ipAddress).toBe('');
    });
});