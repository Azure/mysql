import * as core from "@actions/core";
import * as exec from "@actions/exec";
import AzureMySqlActionHelper from "./AzureMySqlActionHelper";
import { HttpClient } from '@actions/http-client';

export default class MySqlUtils {
    static async detectIPAddress(serverName: string, connectionString: any): Promise<string> {
        let mySqlClientPath = await AzureMySqlActionHelper.getMySqlClientPath();
        let ipAddress = '';
        let mySqlError = '';

        try {
            const command = `"${mySqlClientPath}" -h ${serverName} -u "${connectionString.userId}" -e "show databases" --connect-timeout 10`;
            core.debug(`Validating if client has access to MySql Server '${serverName}'.`);
            core.debug(command);
            await exec.exec(command, [], {
                silent: true,
                listeners: {
                    stderr: (data: Buffer) => mySqlError += data.toString()
                },
                env: {
                    "MYSQL_PWD": connectionString.password
                }
            });
        } catch {
            if (mySqlError) {
                const http = new HttpClient();
                try {
                    const ipv4 = await http.getJson<IPResponse>('https://api.ipify.org?format=json');
                    ipAddress = ipv4.result?.ip || '';
                } catch(err) {
                    throw new Error(`Unable to detect client IP Address: ${err.message}`);
                }
            }
        }

        //ipAddress will be an empty string if client has access to SQL server
        return ipAddress;
    }
}

export interface IPResponse {
    ip: string;
}
