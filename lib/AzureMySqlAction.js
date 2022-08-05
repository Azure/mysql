"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
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
