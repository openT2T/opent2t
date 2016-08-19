
import { IThingTranslator } from "./IThingTranslator";
import { ThingSchema } from "./ThingSchema";
import { EventEmitter } from "events";

/**
 * Provides reflection-style access to thing properties and methods via translators.
 */
export class OpenT2T {
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
    public static getSchemaAsync(schemaModuleName: string): Promise<ThingSchema>;

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
    public static getSchemaAsync(
            packageName: string, schemaModuleName: string): Promise<ThingSchema>;

    /**
     * Loads a schema from a module. (Overloaded method implementation.)
     */
    public static async getSchemaAsync(): Promise<ThingSchema> {
        let schemaModuleName: string = (arguments.length > 1 ?
                arguments[0] + "/" + arguments[1] : arguments[0]);
        let thingSchema: ThingSchema;
        let schemaExport: any = require(schemaModuleName);
        if (typeof schemaExport.then === "function") {
            // The schema module may indicate asynchronous loading by exporting a promise.
            thingSchema = await schemaExport;
        } else {
            thingSchema = schemaExport;
        }
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
    public static async createTranslatorAsync(
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
    public static async createTranslatorAsync(
            packageName: string,
            translatorModuleName: string,
            properties: any): Promise<IThingTranslator>;

    /**
     * Loads a translator from a module. (Overload method implementation.)
     */
    public static async createTranslatorAsync(): Promise<IThingTranslator> {
        let translatorModuleName: string = (arguments.length > 2 ?
                arguments[0] + "/" + arguments[1] : arguments[0]);
        let properties: any = (arguments.length > 2 ? arguments[2] : arguments[1]);

        return new Promise<IThingTranslator>((resolve, reject) => {
            let translator: IThingTranslator;
            try {
                let translatorClass: any = require(translatorModuleName);
                translator = new translatorClass(properties);
            } catch (err) {
                reject(err);
                return;
            }
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
    public static async getPropertyAsync(
            translator: IThingTranslator,
            schemaName: string | ThingSchema,
            propertyName: string): Promise<any> {
        let translatorForSchema = OpenT2T.getTranslatorForSchema(translator, schemaName);
        OpenT2T.validateMemberName(propertyName);

        let memberName = OpenT2T.uncapitalize(propertyName);
        let value: any = translatorForSchema[memberName];
        if (typeof value === "undefined") {
            // Allow (but do not require) the getProperty method to have an "Async" suffix
            // and/or return a Promise instead of an immediate value.
            memberName = "get" + OpenT2T.capitalize(propertyName);
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
            throw new TypeError("Property '" + propertyName + "' getter " +
                "for schema " + schemaName + " not implemented by translator.");
        } else if (typeof value === "object" && typeof value.then === "function") {
            // The value object looks like a Promise. Await it to get the value asynchronously.
            return await value;
        } else {
            return value;
        }
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
    public static async setPropertyAsync(
            translator: IThingTranslator,
            schemaName: string | ThingSchema,
            propertyName: string,
            value: any): Promise<void> {
        let translatorForSchema = OpenT2T.getTranslatorForSchema(translator, schemaName);
        OpenT2T.validateMemberName(propertyName);

        let setPropertyMethod: any;
        let memberName = OpenT2T.uncapitalize(propertyName);
        let currentValue = translatorForSchema[memberName];
        if (typeof currentValue !== "undefined") {
            setPropertyMethod = function (newValue: any) { this[memberName] = newValue; };
        } else {
            // Allow (but do not require) the setProperty method to have an "Async" suffix
            // and/or return a Promise.
            memberName = "set" + OpenT2T.capitalize(propertyName);
            setPropertyMethod = translatorForSchema[memberName];
            if (typeof setPropertyMethod !== "function") {
                memberName = memberName + "Async";
                setPropertyMethod = translatorForSchema[memberName];
                if (typeof setPropertyMethod !== "function") {
                    throw new TypeError("Property '" + propertyName + "' setter " +
                        "for schema " + schemaName + " not implemented by translator.");
                }
            }
        }

        // Invoke using call() to set `this` to translatorForSchema.
        let result = setPropertyMethod.call(translatorForSchema, value);
        if (typeof result === "object" && typeof result.then === "function") {
            // The result object looks like a Promise. Await it to complete async the operation.
            await result;
        }
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
    public static addPropertyListener(
            translator: IThingTranslator,
            schemaName: string | ThingSchema,
            propertyName: string,
            callback: (value: any) => void): void {
        let translatorForSchema = OpenT2T.getTranslatorForSchema(translator, schemaName);
        OpenT2T.validateMemberName(propertyName);

        // The "on" method is defined by the Node.js EventEmitter class,
        // which device classes inherit from if they implement notifications.
        let addListenerMethod: any = (<EventEmitter> translatorForSchema).on;

        if (typeof addListenerMethod !== "function") {
            throw new TypeError("Property '" + propertyName + "' notifier " +
                "for schema " + schemaName + " not implemented by translator.");
        } else {
            // Invoke using call() to set `this` to translatorForSchema.
            addListenerMethod.call(translatorForSchema, propertyName, callback);
        }
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
    public static removePropertyListener(
            translator: IThingTranslator,
            schemaName: string | ThingSchema,
            propertyName: string,
            callback: (value: any) => void): void {
        let translatorForSchema = OpenT2T.getTranslatorForSchema(translator, schemaName);
        OpenT2T.validateMemberName(propertyName);

        // The "removeListener" method is defined by the Node.js EventEmitter class,
        // which device classes inherit from if they implement notifications.
        let removeListenerMethod: any = (<EventEmitter> translatorForSchema).removeListener;

        if (typeof removeListenerMethod !== "function") {
            throw new TypeError("Property '" + propertyName + "' notifier removal " +
                "for schema " + schemaName + " not implemented by translator.");
        } else {
            // Invoke using call() to set `this` to translatorForSchema.
            removeListenerMethod.call(translatorForSchema, propertyName, callback);
        }
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
    public static async invokeMethodAsync(
            translator: IThingTranslator,
            schemaName: string | ThingSchema,
            methodName: string,
            args: any[]): Promise<any> {
        let translatorForSchema = OpenT2T.getTranslatorForSchema(translator, schemaName);
        OpenT2T.validateMemberName(methodName);
        if (!Array.isArray(args)) {
            throw new TypeError("Args argument must be an array.");
        }

        // Allow (but do not require) the method to have an "Async" suffix
        // and/or return a Promise instead of an immediate value.
        let method: any = translatorForSchema[methodName];
        if (typeof method !== "function") {
            method = translatorForSchema[methodName + "Async"];
            if (typeof method !== "function") {
                throw new TypeError("Method '" + methodName + "' " +
                    "for schema " + schemaName + " not implemented by translator.");
            }
        }

        // Invoke using apply() to set `this` to translatorForSchema and pass the
        // arguments as an array.
        let result = method.apply(translatorForSchema, args);
        if (typeof result === "object" && typeof result.then === "function") {
            // The result object looks like a Promise. Await it to get the result asynchronously.
            return await result;
        } else {
            return result;
        }
    }

    /**
     * Check for a `resolveSchema` method on the translator, and if found use it to request an object
     * that implements properties and methods for the requested schema.
     */
    private static getTranslatorForSchema(
            translator: IThingTranslator, schemaName: string | ThingSchema): {[key: string]: any} {
        if (typeof translator !== "object") {
            throw new TypeError("Translator argument must be an object.");
        }

        if (typeof translator.resolveSchema !== "function") {
            // The device doesn't implement a "resolveSchema" method, so it is assumed to implement
            // all schema properties and methods directly.
            return <{[key: string]: any}> translator;
        }

        if (typeof schemaName !== "string") {
            schemaName = schemaName.name;
        }

        let translatorForSchema: Object | null = translator.resolveSchema(schemaName);
        if (!translatorForSchema) {
            throw new TypeError("Schema not implemented by translator: " + schemaName);
        }

        return <{[key: string]: any}> translatorForSchema;
    }

    private static validateMemberName(memberName: string) {
        if (typeof memberName !== "string") {
            throw new TypeError("Member name argument must be a string.");
        }
        if (memberName.length === 0) {
            throw new TypeError("Member name argument must be nonempty.");
        }
    }

    private static capitalize(propertyName: string) {
        if (propertyName.length > 1) {
            return propertyName[0].toUpperCase() + propertyName.substr(1);
        }

        return propertyName;
    }

    private static uncapitalize(propertyName: string) {
        if (propertyName.length > 1) {
            return propertyName[0].toLowerCase() + propertyName.substr(1);
        }

        return propertyName;
    }
}
