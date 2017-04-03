import { IThingTranslator } from "./IThingTranslator";
import { Logger } from "./Logger";
import { OpenT2TConstants } from "./OpenT2TConstants";
import { OpenT2TError } from "./OpenT2TError";
import { ThingSchema } from "./ThingSchema";
import { EventEmitter } from "events";

/**
 * Provides reflection-style access to thing properties and methods via translators.
 */
export class OpenT2T {

    private logger: Logger;

    constructor(logger: Logger = new Logger()) {
        this.logger = logger;
    }

    /**
     * Loads a schema from a module. This is just a convenience wrapper
     * around require(). Throws if the module could not be loaded.
     *
     * @param {string} schemaModuleName  Package-qualified name (or relative path) of
     *     the schema module. The package-qualified name can be obtained from
     *     PackageTranslatorInfo.schemas.
     *
     * @returns {Promise<ThingSchema>} The loaded thing schema.
     */
    public getSchemaAsync(schemaModuleName: string): Promise<ThingSchema>;

    /**
     * Loads a schema from a module. This is just a convenience wrapper
     * around require(). Throws if the module could not be loaded.
     *
     * @param {string} packageName  Name (or relative path) of the package containing
     *     the module. The name can be obtained from PackageInfo.name.
     * @param {string} schemaModuleName  Simple name of the schema module. Can be
     *     obtained from PackageInterfaceInfo.name.
     * @returns {Promise<ThingSchema>} The loaded thing schema.
     */
    public getSchemaAsync(
        packageName: string, schemaModuleName: string): Promise<ThingSchema>;

    /**
     * Loads a schema from a module. (Overloaded method implementation.)
     */
    public async getSchemaAsync(): Promise<ThingSchema> {
        let startTime = Date.now();
        let schemaModuleName: string = (arguments.length > 1 ?
            arguments[0] + "/" + arguments[1] : arguments[0]);

        this.logger.verbose(`Calling getSchemaAsync for ${schemaModuleName}`);
        let trackingData: any = { schemaName: schemaModuleName };

        let thingSchema: ThingSchema;
        let schemaExport: any = require(schemaModuleName);
        if (typeof schemaExport.then === "function") {
            // The schema module may indicate asynchronous loading by exporting a promise.
            thingSchema = await schemaExport;
        } else {
            thingSchema = schemaExport;
        }

        this.logger.event("GetSchema", Date.now() - startTime, trackingData);
        return thingSchema;
    }

    /**
     * Loads a translator from a module. This is just a convenience wrapper
     * around require(). Throws if the module could not be loaded.
     *
     * @param {string} translatorModuleName  Package-qualified name (or relative path) of
     *     the translator module.
     * @param {*} properties  Property bag to be passed to the translator constructor.
     * @returns {Promise<IThingTranslator>} The loaded translator instance.
     */
    public async createTranslatorAsync(
        translatorModuleName: string, properties: any): Promise<IThingTranslator>;

    /**
     * Loads a translator from a module. This is just a convenience wrapper
     * around require(). Throws if the module could not be loaded.
     *
     * @param {string} packageName  Name (or relative path) of the package containing
     *     the module. The name can be obtained from PackageInfo.name.
     * @param {string} translatorModuleName  Name of the translator module. Can be obtained
     *     from PackageTranslatorInfo.name.
     * @param {*} properties  Property bag to be passed to the translator constructor.
     * @returns {Promise<IThingTranslator>} The loaded translator instance.
     */
    public async createTranslatorAsync(
        packageName: string,
        translatorModuleName: string,
        properties: any): Promise<IThingTranslator>;

    /**
     * Loads a translator from a module. (Overload method implementation.)
     */
    public async createTranslatorAsync(): Promise<IThingTranslator> {
        let startTime = Date.now();
        let translatorModuleName: string = (arguments.length > 2 ?
            arguments[0] + "/" + arguments[1] : arguments[0]);
        let properties: any = (arguments.length > 2 ? arguments[2] : arguments[1]);

        this.logger.verbose(`Creating translator for module name: ${translatorModuleName}`);
        let trackingData: any = { translatorName: translatorModuleName };

        return new Promise<IThingTranslator>((resolve, reject) => {
            let translator: IThingTranslator;

            // Check for existance of the translator module
            try {
                require.resolve(translatorModuleName);
            } catch (err) {
                trackingData.statusCode = 404;
                this.throwError("CreateTranslator", startTime, new OpenT2TError(
                    404, `${OpenT2TConstants.MissingTranslator}: ${translatorModuleName}`), trackingData);
            }

            try {
                let translatorClass: any = require(translatorModuleName);
                translator = new translatorClass(this.logger, properties);
            } catch (err) {
                reject(err);
                return;
            }

            this.logger.event("CreateTranslator", Date.now() - startTime, trackingData);
            resolve(translator);
        });
    }

    /**
     * Gets the value of a property on a thing, using a specified schema.
     *
     * @param {IThingTranslator} translator  Thing translator instance
     * @param {(string | ThingSchema)} schemaName  Name of the schema used
     *     to access the device, or a ThingSchema object
     * @param {string} propertyName  Name of the property to get
     * @returns {Promise<any>} Value returned by the property getter; the value is
     *     expected to conform to the JSON schema for the property value as specified
     *     by the thing schema
     */
    public async getPropertyAsync(
        translator: IThingTranslator,
        schemaName: string | ThingSchema,
        propertyName: string): Promise<any> {
        let startTime = Date.now();
        this.logger.verbose(
            `getPropertyAsync for : '${propertyName}' for translator schema: ${schemaName}`);
        let trackingData: any = { propertyName, schemaName, translatorName: (<any> translator).name };

        let translatorForSchema = this.getTranslatorForSchema(translator, schemaName);
        this.validateMemberName(propertyName);
        let memberName = this.uncapitalize(propertyName);
        let value: any = translatorForSchema[memberName];
        let returnValue: any;

        if (typeof value === "undefined") {
            // Allow (but do not require) the getProperty method to have an "Async" suffix
            // and/or return a Promise instead of an immediate value.
            memberName = "get" + this.capitalize(propertyName);
            let getPropertyMethod: any = translatorForSchema[memberName];
            if (typeof getPropertyMethod === "function") {
                // Invoke using call() to set `this` to translatorForSchema.
                value = getPropertyMethod.call(translatorForSchema);
            } else {
                memberName = memberName + "Async";
                getPropertyMethod = translatorForSchema[memberName];
                if (typeof getPropertyMethod === "function") {
                    // Not using await here; if a promise is returned it will be awaited below.
                    value = getPropertyMethod.call(translatorForSchema);
                }
            }
        }

        if (typeof value === "undefined") {
            this.throwError("GetProperty", startTime, new TypeError("Property '" + propertyName + "' getter " +
                "for schema " + schemaName + " not implemented by translator."), trackingData);
        } else if (typeof value === "object" && typeof value.then === "function") {
            // The value object looks like a Promise. Await it to get the value asynchronously.
            returnValue = await value;
        } else {
            returnValue = value;
        }

        this.logger.event("GetProperty", Date.now() - startTime, trackingData);
        return returnValue;
    }

    /**
     * Sets the value of a property on a device, using a specified schema.
     *
     * @param {IThingTranslator} translator  Thing translator instance
     * @param {(string | ThingSchema)} schemaName  Name of the schema used
     *     to access the device, or a ThingSchema object
     * @param {string} propertyName  Name of the property to set
     * @param {*} value  Value passed to the property setter; the value is
     *     expected to conform to the JSON schema for the property value as specified
     *     by the thing schema
     */
    public async setPropertyAsync(
        translator: IThingTranslator,
        schemaName: string | ThingSchema,
        propertyName: string,
        value: any): Promise<void> {
        let startTime = Date.now();
        this.logger.verbose(
            `setPropertyAsync for : '${propertyName}' for translator schema: ${schemaName}`);
        let trackingData: any = { propertyName, schemaName, value, translatorName: (<any> translator).name };
        let translatorForSchema = this.getTranslatorForSchema(translator, schemaName);
        this.validateMemberName(propertyName);

        let setPropertyMethod: any;
        let memberName = this.uncapitalize(propertyName);
        let currentValue = translatorForSchema[memberName];
        if (typeof currentValue !== "undefined") {
            setPropertyMethod = function (newValue: any) { this[memberName] = newValue; };
        } else {
            // Allow (but do not require) the setProperty method to have an "Async" suffix
            // and/or return a Promise.
            memberName = "set" + this.capitalize(propertyName);
            setPropertyMethod = translatorForSchema[memberName];
            if (typeof setPropertyMethod !== "function") {
                memberName = memberName + "Async";
                setPropertyMethod = translatorForSchema[memberName];
                if (typeof setPropertyMethod !== "function") {
                    this.throwError("SetProperty", startTime, new TypeError("Property '" + propertyName + "' setter " +
                        "for schema " + schemaName + " not implemented by translator."), trackingData);
                }
            }
        }

        // Invoke using call() to set `this` to translatorForSchema.
        let result = setPropertyMethod.call(translatorForSchema, value);
        if (typeof result === "object" && typeof result.then === "function") {
            // The result object looks like a Promise. Await it to complete async the operation.
            await result;
        }

        this.logger.event("SetProperty", Date.now() - startTime, trackingData);
    }

    /**
     * Adds a listener callback to a property that will be invoked if and when the
     * property sends notifications.
     *
     * @param {IThingTranslator} translator  Thing translator instance
     * @param {(string | ThingSchema)} schemaName  Name of the schema used
     *     to access the device, or a ThingSchema object
     * @param {string} propertyName  Name of the property to listen to
     * @param {(value: any) => void} callback  Callback function that will be invoked
     *     if and when the property sends notifications; the callback takes a single
     *     parameter, which is expected to conform to the property value schema as
     *     specified by the thing schema
     */
    public addPropertyListener(
        translator: IThingTranslator,
        schemaName: string | ThingSchema,
        propertyName: string,
        callback: (value: any) => void): void {
        let startTime = Date.now();
        this.logger.verbose(
            `addPropertyListener for : '${propertyName}' for translator schema: ${schemaName}`);
        let trackingData: any = { propertyName, schemaName, translatorName: (<any> translator).name };
        let translatorForSchema = this.getTranslatorForSchema(translator, schemaName);
        this.validateMemberName(propertyName);

        // The "on" method is defined by the Node.js EventEmitter class,
        // which device classes inherit from if they implement notifications.
        let addListenerMethod: any = (<EventEmitter> translatorForSchema).on;

        if (typeof addListenerMethod !== "function") {
            this.throwError("AddPropertyListener", startTime,
            new TypeError("Property '" + propertyName + "' notifier " +
                "for schema " + schemaName + " not implemented by translator."), trackingData);
        } else {
            // Invoke using call() to set `this` to translatorForSchema.
            addListenerMethod.call(translatorForSchema, propertyName, callback);
        }

        this.logger.event("AddPropertyListener", Date.now() - startTime, trackingData);
    }

    /**
     * Removes a listener callback that was previously added to a property.
     *
     * @param {IThingTranslator} translator  Thing translator instance
     * @param {(string | ThingSchema)} schemaName  Name of the schema used
     *     to access the device, or a ThingSchema object
     * @param {string} propertyName  Name of the property that is being listened to
     * @param {(value: any) => void} callback  Callback function that was previously
     *     added as a listener to the same property on the same device
     */
    public removePropertyListener(
        translator: IThingTranslator,
        schemaName: string | ThingSchema,
        propertyName: string,
        callback: (value: any) => void): void {
        let startTime = Date.now();
        this.logger.info(
            `removePropertyListener for : '${propertyName}' for translator schema: ${schemaName}`);
        let trackingData: any = { propertyName, schemaName, translatorName: (<any> translator).name };
        let translatorForSchema = this.getTranslatorForSchema(translator, schemaName);
        this.validateMemberName(propertyName);

        // The "removeListener" method is defined by the Node.js EventEmitter class,
        // which device classes inherit from if they implement notifications.
        let removeListenerMethod: any = (<EventEmitter> translatorForSchema).removeListener;

        if (typeof removeListenerMethod !== "function") {
            this.throwError("RemovePropertyListener", startTime,
            new TypeError("Property '" + propertyName + "' notifier removal " +
                "for schema " + schemaName + " not implemented by translator."), trackingData);
        } else {
            // Invoke using call() to set `this` to translatorForSchema.
            removeListenerMethod.call(translatorForSchema, propertyName, callback);
        }

        this.logger.event("RemovePropertyListener", Date.now() - startTime, trackingData);
    }

    /**
     * Invokes a method on a device, using a specified schema.
     *
     * @param {IThingTranslator} translator  Thing translator instance
     * @param {(string | ThingSchema)} schemaName  Name of the schema used
     *     to access the device, or a ThingSchema object
     * @param {string} methodName  Name of the method to invoke
     * @param {any[]} args  Arguments to pass to the method; the number and types of
     *     arguments are expected to conform to the thing schema definition of the method
     *     and the JSON schemas for each method argument in the schema.
     * @returns {Promise<any>} Value returned by the method, or undefined if the
     *     method has a void return type; the value is expected to conform to the
     *     JSON schema for the method return value as specified by the thing schema
     */
    public async invokeMethodAsync(
        translator: IThingTranslator,
        schemaName: string | ThingSchema,
        methodName: string,
        args: any[]): Promise<any> {
        let startTime = Date.now();
        this.logger.verbose(
            `invokeMethodAsync '${methodName}' (args: ${args}) for translator schema: ${schemaName}`);
        let trackingData: any = { methodName, schemaName, translatorName: (<any> translator).name };
        if (methodName !== "get") {
            trackingData.args = JSON.stringify(args);
        }
        let translatorForSchema = this.getTranslatorForSchema(translator, schemaName);
        this.validateMemberName(methodName);
        if (!Array.isArray(args)) {
            this.throwError("InvokeMethod", startTime,
            new TypeError("Args argument must be an array."), trackingData);
        }

        // Allow (but do not require) the method to have an "Async" suffix
        // and/or return a Promise instead of an immediate value.
        let method: any = translatorForSchema[methodName];
        if (typeof method !== "function") {
            method = translatorForSchema[methodName + "Async"];
            if (typeof method !== "function") {
                this.throwError("InvokeMethod", startTime, new TypeError("Method '" + methodName + "' " +
                    "for schema " + schemaName + " not implemented by translator."), trackingData);
            }
        }

        // Invoke using apply() to set `this` to translatorForSchema and pass the
        // arguments as an array.
        let result = method.apply(translatorForSchema, args);
        let returnValue: any;
        if (typeof result === "object" && typeof result.then === "function") {
            // The result object looks like a Promise. Await it to get the result asynchronously.
            returnValue = await result;
        } else {
            returnValue = result;
        }

        this.logger.event("InvokeMethod", Date.now() - startTime, trackingData);
        return returnValue;
    }

    /**
     * Check for a `resolveSchema` method on the translator, and if found use it to request an object
     * that implements properties and methods for the requested schema.
     */
    private getTranslatorForSchema(
        translator: IThingTranslator, schemaName: string | ThingSchema): { [key: string]: any } {
        if (typeof translator !== "object") {
            throw new TypeError("Translator argument must be an object.");
        }

        if (typeof translator.resolveSchema !== "function") {
            // The device doesn't implement a "resolveSchema" method, so it is assumed to implement
            // all schema properties and methods directly.
            return <{ [key: string]: any }> translator;
        }

        if (typeof schemaName !== "string") {
            schemaName = schemaName.name;
        }

        let translatorForSchema: Object | null = translator.resolveSchema(schemaName);
        if (!translatorForSchema) {
            throw new TypeError("Schema not implemented by translator: " + schemaName);
        }

        return <{ [key: string]: any }> translatorForSchema;
    }

    private validateMemberName(memberName: string) {
        if (typeof memberName !== "string") {
            throw new TypeError("Member name argument must be a string.");
        }
        if (memberName.length === 0) {
            throw new TypeError("Member name argument must be nonempty.");
        }
    }

    private capitalize(propertyName: string) {
        if (propertyName.length > 1) {
            return propertyName[0].toUpperCase() + propertyName.substr(1);
        }

        return propertyName;
    }

    private uncapitalize(propertyName: string) {
        if (propertyName.length > 1) {
            return propertyName[0].toLowerCase() + propertyName.substr(1);
        }

        return propertyName;
    }

    private throwError(eventName: string, startTime: number, error: Error, data: { [key: string]: any; }) {
        this.logger.exception(error, data);
        data.Error = error;
        this.logger.event(eventName, Date.now() - startTime, data);
        throw error;
    }
}
