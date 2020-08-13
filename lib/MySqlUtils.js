"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const AzureMySqlActionHelper_1 = __importDefault(require("./AzureMySqlActionHelper"));
const Constants_1 = __importDefault(require("./Constants"));
class MySqlUtils {
    static connectsToDB(serverName, connectionString) {
        return __awaiter(this, void 0, void 0, function* () {
            let mySqlClientPath = yield AzureMySqlActionHelper_1.default.getMySqlClientPath();
            let mySqlError = '';
            try {
                core.debug(`Checking if client has access to MySQL Server'${serverName}'.`);
                core.debug(`"${mySqlClientPath}" -h ${serverName} -u "${connectionString.userId}" -e "show databases"`);
                yield exec.exec(`"${mySqlClientPath}" -h ${serverName} -u "${connectionString.userId}" -e "show databases"`, [`--password=${connectionString.password}`], {
                    silent: true,
                    listeners: {
                        stderr: (data) => mySqlError += data.toString()
                    }
                });
            }
            catch (error) {
                core.debug(mySqlError);
                if (mySqlError.match(Constants_1.default.ipv4MatchPattern)) {
                    return false;
                }
                throw new Error(`Error while checking connectivity to MySQL Server.. ${mySqlError} ${error}`);
            }
            return true;
        });
    }
}
exports.default = MySqlUtils;
