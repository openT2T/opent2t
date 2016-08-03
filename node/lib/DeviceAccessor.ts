
import { DeviceInterface } from "./DeviceInterface";
import { ITranslator } from "./ITranslator";

import { EventEmitter } from "events";

/**
 * Provides reflection-style access to device properties and methods via device interfaces.
 */
export class DeviceAccessor {
    /**
     * Loads an interface from a module. This is just a convenience wrapper
     * around require(). Throws if the module could not be loaded.
     *
     * @param {string} interfaceModuleName  Package-qualified name (or relative path) of
     *     the interface module. The package-qualified name can be obtained from
     *     PackageTranslatorInfo.interfaces.
     *
     * @returns {Promise<DeviceInterface>} The loaded device interface.
     */
    public static getInterfaceAsync(interfaceModuleName: string): Promise<DeviceInterface>;

    /**
     * Loads an interface from a module. This is just a convenience wrapper
     * around require(). Throws if the module could not be loaded.
     *
     * @param {string} packageName  Name (or relative path) of the package containing
     *     the module. The name can be obtained from PackageInfo.name.
     * @param {string} interfaceName  Simple name of the interface module. Can be obtained
     *     from PackageInterfaceInfo.name.
     * @returns {Promise<DeviceInterface>} The loaded device interface.
     */
    public static getInterfaceAsync(
            packageName: string, interfaceName: string): Promise<DeviceInterface>;

    /**
     * Loads an interface from a module. (Overloaded method implementation.)
     */
    public static getInterfaceAsync(): Promise<DeviceInterface> {
        let interfaceModuleName: string = (arguments.length > 1 ?
                arguments[0] + "/" + arguments[1] : arguments[0]);
        return new Promise<DeviceInterface>((resolve, reject) => {
            let deviceInterface: DeviceInterface;
            try {
                deviceInterface = require(interfaceModuleName);
            } catch (err) {
                reject(err);
                return;
            }
            resolve(deviceInterface);
        });
    }

    /**
     * Loads a translator from a module. This is just a convenience wrapper
     * around require(). Throws if the module could not be loaded.
     *
     * @param {string} translatorModuleName  Package-qualified name (or relative path) of
     *     the translator module.
     * @param {*} properties  Property bag to be passed to the translator constructor.
     * @returns {Promise<ITranslator>} The loaded translator instance.
     */
    public static async createTranslatorAsync(
            translatorModuleName: string, properties: any): Promise<ITranslator>;

    /**
     * Loads a translator from a module. This is just a convenience wrapper
     * around require(). Throws if the module could not be loaded.
     *
     * @param {string} packageName  Name (or relative path) of the package containing
     *     the module. The name can be obtained from PackageInfo.name.
     * @param {string} translatorName  Name of the translator module. Can be obtained from
     *     PackageTranslatorInfo.name.
     * @param {*} properties  Property bag to be passed to the translator constructor.
     * @returns {Promise<ITranslator>} The loaded translator instance.
     */
    public static async createTranslatorAsync(
            packageName: string, translatorName: string, properties: any): Promise<ITranslator>;

    /**
     * Loads a translator from a module. (Overload method implementation.)
     */
    public static async createTranslatorAsync(): Promise<ITranslator> {
        let translatorModuleName: string = (arguments.length > 2 ?
                arguments[0] + "/" + arguments[1] : arguments[0]);
        let properties: any = (arguments.length > 2 ? arguments[2] : arguments[1]);

        return new Promise<ITranslator>((resolve, reject) => {
            let translator: ITranslator;
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
     * Gets the value of a property on a device, using a specified interface.
     *
     * @param {ITranslator} translator  Device translator instance
     * @param {(string | DeviceInterface)} interfaceName  Name of the interface used
     *     to access the device, or a DeviceInterface object
     * @param {string} propertyName  Name of the property to get
     * @returns {Promise<any>} Value returned by the property getter; the value is
     *     expected to conform to the JSON schema for the property as specified
     *     by the interface
     */
    public static async getPropertyAsync(
            translator: ITranslator,
            interfaceName: string | DeviceInterface,
            propertyName: string): Promise<any> {
        let deviceInterface = DeviceAccessor.getTranslatorInterface(translator, interfaceName);
        DeviceAccessor.validateMemberName(propertyName);

        let value: any = deviceInterface[propertyName];
        if (typeof value === "undefined") {
            // Allow (but do not require) the getProperty method to have an "Async" suffix
            // and/or return a Promise instead of an immediate value.
            let methodName = "get" + DeviceAccessor.capitalize(propertyName);
            let getPropertyMethod: any = deviceInterface[methodName];
            if (typeof getPropertyMethod === "function") {
                // Invoke using call() to set `this` to deviceInterface.
                value = getPropertyMethod.call(deviceInterface);
            } else {
                getPropertyMethod = deviceInterface[methodName + "Async"];
                if (typeof getPropertyMethod === "function") {
                    // Not using await here; if a promise is returned it will be awaited below.
                    value = getPropertyMethod.call(deviceInterface);
                }
            }
        }

        if (typeof value === "undefined") {
            throw new TypeError("Property '" + propertyName + "' getter " +
                "for interface " + interfaceName + " not implemented by translator.");
        } else if (typeof value === "object" && typeof value.then === "function") {
            // The value object looks like a Promise. Await it to get the value asynchronously.
            return await value;
        } else {
            return value;
        }
    }

    /**
     * Sets the value of a property on a device, using a specified interface.
     *
     * @param {ITranslator} translator  Device translator instance
     * @param {(string | DeviceInterface)} interfaceName  Name of the interface used
     *     to access the device, or a DeviceInterface object
     * @param {string} propertyName  Name of the property to set
     * @param {*} value  Value passed to the property setter; the value is
     *     expected to conform to the JSON schema for the property as specified
     *     by the interface
     */
    public static async setPropertyAsync(
            translator: ITranslator,
            interfaceName: string | DeviceInterface,
            propertyName: string,
            value: any): Promise<void> {
        let deviceInterface = DeviceAccessor.getTranslatorInterface(translator, interfaceName);
        DeviceAccessor.validateMemberName(propertyName);

        let setPropertyMethod: any;
        let currentValue = deviceInterface[propertyName];
        if (typeof currentValue !== "undefined") {
            setPropertyMethod = function (newValue: any) { this[propertyName] = newValue; };
        } else {
            // Allow (but do not require) the setProperty method to have an "Async" suffix
            // and/or return a Promise.
            let methodName = "set" + DeviceAccessor.capitalize(propertyName);
            setPropertyMethod = deviceInterface[methodName];
            if (typeof setPropertyMethod !== "function") {
                setPropertyMethod = deviceInterface[methodName + "Async"];
                if (typeof setPropertyMethod !== "function") {
                    throw new TypeError("Property '" + propertyName + "' setter " +
                        "for interface " + interfaceName + " not implemented by translator.");
                }
            }
        }

        // Invoke using call() to set `this` to deviceInterface.
        let result = setPropertyMethod.call(deviceInterface, value);
        if (typeof result === "object" && typeof result.then === "function") {
            // The result object looks like a Promise. Await it to complete async the operation.
            await result;
        }
    }

    /**
     * Adds a listener callback to a property that will be invoked if and when the
     * property sends notifications.
     *
     * @param {ITranslator} translator  Device translator instance
     * @param {(string | DeviceInterface)} interfaceName  Name of the interface used
     *     to access the device, or a DeviceInterface object
     * @param {string} propertyName  Name of the property to listen to
     * @param {(value: any) => void} callback  Callback function that will be invoked
     *     if and when the property sends notifications; the callback takes a single
     *     parameter, which is expected to conform to the property schema as specified
     *     by the interface
     */
    public static addPropertyListener(
            translator: ITranslator,
            interfaceName: string | DeviceInterface,
            propertyName: string,
            callback: (value: any) => void): void {
        let deviceInterface = DeviceAccessor.getTranslatorInterface(translator, interfaceName);
        DeviceAccessor.validateMemberName(propertyName);

        // The "on" method is defined by the Node.js EventEmitter class,
        // which device classes inherit from if they implement notifications.
        let addListenerMethod: any = (<EventEmitter> deviceInterface).on;

        if (typeof addListenerMethod !== "function") {
            throw new TypeError("Property '" + propertyName + "' notifier " +
                "for interface " + interfaceName + " not implemented by translator.");
        } else {
            // Invoke using call() to set `this` to deviceInterface.
            addListenerMethod.call(deviceInterface, propertyName, callback);
        }
    }

    /**
     * Removes a listener callback that was previously added to a property.
     *
     * @param {ITranslator} translator  Device translator instance
     * @param {(string | DeviceInterface)} interfaceName  Name of the interface used
     *     to access the device, or a DeviceInterface object
     * @param {string} propertyName  Name of the property that is being listened to
     * @param {(value: any) => void} callback  Callback function that was previously
     *     added as a listener to the same property on the same device
     */
    public static removePropertyListener(
            translator: ITranslator,
            interfaceName: string | DeviceInterface,
            propertyName: string,
            callback: (value: any) => void): void {
        let deviceInterface = DeviceAccessor.getTranslatorInterface(translator, interfaceName);
        DeviceAccessor.validateMemberName(propertyName);

        // The "removeListener" method is defined by the Node.js EventEmitter class,
        // which device classes inherit from if they implement notifications.
        let removeListenerMethod: any = (<EventEmitter> deviceInterface).removeListener;

        if (typeof removeListenerMethod !== "function") {
            throw new TypeError("Property '" + propertyName + "' notifier removal " +
                "for interface " + interfaceName + " not implemented by translator.");
        } else {
            // Invoke using call() to set `this` to deviceInterface.
            removeListenerMethod.call(deviceInterface, propertyName, callback);
        }
    }

    /**
     * Invokes a method on a device, using a specified interface.
     *
     * @param {ITranslator} translator  Device translator instance
     * @param {(string | DeviceInterface)} interfaceName  Name of the interface used
     *     to access the device, or a DeviceInterface object
     * @param {string} methodName  Name of the method to invoke
     * @param {any[]} args  Arguments to pass to the method; the number and types of
     *     arguments are expected to conform to the interface definition of the method
     *     and the JSON schemas for each method argument in the interface.
     * @returns {Promise<any>} Value returned by the method, or undefined if the
     *     method has a void return type; the value is expected to conform to the
     *     JSON schema for the method return value as specified by the interface
     */
    public static async invokeMethodAsync(
            translator: ITranslator,
            interfaceName: string | DeviceInterface,
            methodName: string,
            args: any[]): Promise<any> {
        let deviceInterface = DeviceAccessor.getTranslatorInterface(translator, interfaceName);
        DeviceAccessor.validateMemberName(methodName);
        if (!Array.isArray(args)) {
            throw new TypeError("Args argument must be an array.");
        }

        // Allow (but do not require) the method to have an "Async" suffix
        // and/or return a Promise instead of an immediate value.
        let method: any = deviceInterface[methodName];
        if (typeof method !== "function") {
            method = deviceInterface[methodName + "Async"];
            if (typeof method !== "function") {
                throw new TypeError("Method '" + methodName + "' " +
                    "for interface " + interfaceName + " not implemented by translator.");
            }
        }

        // Invoke using apply() to set `this` to deviceInterface and pass the
        // arguments as an array.
        let result = method.apply(deviceInterface, args);
        if (typeof result === "object" && typeof result.then === "function") {
            // The result object looks like a Promise. Await it to get the result asynchronously.
            return await result;
        } else {
            return result;
        }
    }

    /**
     * Check for an `as` method on the translator, and if found use it to request an object
     * that implements the specified interface.
     */
    private static getTranslatorInterface(
            translator: ITranslator, interfaceName: string | DeviceInterface): {[key: string]: any} {
        if (typeof translator !== "object") {
            throw new TypeError("Translator argument must be an object.");
        }

        if (typeof translator.as !== "function") {
            // The device doesn't implement an "as" method, so it is assumed to implement
            // all interface methods directly.
            return <{[key: string]: any}> translator;
        }

        if (typeof interfaceName !== "string") {
            interfaceName = interfaceName.name;
        }

        let deviceInterface: Object | null = translator.as(interfaceName);
        if (!deviceInterface) {
            throw new TypeError("Interface not implemented by translator: " + interfaceName);
        }

        return <{[key: string]: any}> deviceInterface;
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
            return propertyName.substr(0, 1).toUpperCase() + propertyName.substr(1);
        }

        return propertyName;
    }
}
