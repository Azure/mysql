import * as core from "@actions/core";
import * as exec from "@actions/exec";
import AzureMySqlActionHelper from "./AzureMySqlActionHelper";
import Constants from "./Constants";

export default class MySqlUtils {
    static async connectsToDB(serverName: string, connectionString: any) {
        let mySqlClientPath = await AzureMySqlActionHelper.getMySqlClientPath();
        let mySqlError = '';
        try {
            core.debug(`Checking if client has access to MySQL Server'${serverName}'.`);
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
            if (mySqlError.match(Constants.ipv4MatchPattern)) {
                return false;      
            }
            throw new Error(`Error while checking connectivity to MySQL Server.. ${mySqlError} ${error}`)
        }
        return true;
    }

}
