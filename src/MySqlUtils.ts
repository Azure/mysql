import * as core from "@actions/core";
import * as exec from "@actions/exec";
import AzureMySqlActionHelper from "./AzureMySqlActionHelper";
import Constants from "./Constants";

export default class MySqlUtils {
    static async detectIPAddress(serverName: string, connectionString: any): Promise<string> {
        let mySqlClientPath = await AzureMySqlActionHelper.getMySqlClientPath();

        let ipAddress = '';
        let mySqlError = '';
        
        try {
            core.debug(`Validating if client has access to MySql Server '${serverName}'.`);
            core.debug(`"${mySqlClientPath}" -h ${serverName} -u "${connectionString.userId}" -e "show databases"`);
            await exec.exec(`"${mySqlClientPath}" -h ${serverName} -u "${connectionString.userId}" -e "show databases"`, [`--password=${connectionString.password}`], {
                silent: true,
                listeners: {
                    stderr: (data: Buffer) => mySqlError += data.toString()
                }
            });
        }
        catch (error) {
            core.debug(mySqlError);
            
            let ipAddresses = mySqlError.match(Constants.ipv4MatchPattern);
            if (!!ipAddresses) {
                ipAddress = ipAddresses[0];      
            }
            else {
                throw new Error(`Unable to detect client IP Address. ${mySqlError} ${error}`)
            }
        }

        //ipAddress will be an empty string if client has access to SQL server
        return ipAddress;
    }


}
