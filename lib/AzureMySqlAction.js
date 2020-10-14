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
class AzureMySqlAction {
    constructor(inputs) {
        this._inputs = inputs;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug('Begin executing action...');
            let mySqlClientPath = yield AzureMySqlActionHelper_1.default.getMySqlClientPath();
            let parameters = [
                "-h", this._inputs.serverName,
                "-u", this._inputs.connectionString.userId,
                "-e", `source ${this._inputs.sqlFile}`,
            ];
            if (this._inputs.connectionString.database) {
                parameters.push("-D");
                parameters.push(this._inputs.connectionString.database);
            }
            yield exec.exec(`"${mySqlClientPath}" ${this._inputs.additionalArguments}`, parameters, {
                env: {
                    "MYSQL_PWD": this._inputs.connectionString.password
                }
            });
            console.log('Successfully executed sql file on target database');
        });
    }
}
exports.default = AzureMySqlAction;
