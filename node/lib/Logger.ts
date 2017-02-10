import * as winston from 'winston';
import {ILogger} from "./ILogger";
import {Utilities} from "./LoggerUtilities";
import {LoggerInstance} from "winston";
//const uuid = require('uuid');

export class Logger implements ILogger {
    //private transactionID = uuid.v4();
    private logger : LoggerInstance;
    private static flag: boolean = true;

    private normalize = (logObject) =>{
        if(logObject === null || logObject === undefined){
            return;
        }

        let cLogObject = Utilities.cloneObject(logObject);
        //cLogObject["transactionID"] = this.transactionID;
        cLogObject["timestamp"] = Date.now();
        return cLogObject;
    };

    public error(msg:string, logObject?): void {
        this.logger.error(msg, logObject);
    }    

    public warn(msg:string, logObject?): void {
        this.logger.warn(msg, logObject);
    }    

    public info(msg:string, logObject?): void {
        this.logger.info(msg, logObject)
    }

    public verbose(msg:string, logObject?): void {
        this.logger.verbose(msg, logObject);
    }    

    public debug(msg:string, logObject?): void {
        this.logger.debug(msg, logObject);
    }

    public silly(msg:string, logObject?): void {
        this.logger.silly(msg, logObject);
    }

    public normalizeWith(normalizer: (lobObject) => any) : ILogger {
        this.normalize = normalizer;
        return this;
    }

    constructor(logger?: LoggerInstance) {
        this.logger = logger || winston;

        // If you want to turn off console logging 
        this.logger.remove(winston.transports.Console);
        this.logger.add(winston.transports.Console, {colorize: true});

        if(Logger.flag == true)
        {
            this.logger.add(winston.transports.File, {
                filename: 'testfile.log',
                handleExceptions: true,
                level: 'silly'});            
            Logger.flag = false;
        }        
    }
}