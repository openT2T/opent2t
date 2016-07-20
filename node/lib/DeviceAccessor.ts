
import { IDevice } from "./ITranslator";
import { DeviceInterface } from "./DeviceInterface";

/**
 * Provides reflection-style access to device properties and methods via device interfaces.
 */
export class DeviceAccessor {
    public static async getPropertyAsync(
            device: IDevice,
            interfaceName: string | DeviceInterface,
            propertyName: string): Promise<any> {
        let deviceInterface = DeviceAccessor.getDeviceInterface(device, interfaceName);
        DeviceAccessor.validateMemberName(propertyName);

        let value: any = deviceInterface[propertyName];
        if (typeof value === "undefined") {
            let methodName = "get" + DeviceAccessor.capitalize(propertyName);
            let getPropertyMethod: any = deviceInterface[methodName];
            if (typeof getPropertyMethod === "function") {
                value = getPropertyMethod.call(deviceInterface);
            } else {
                getPropertyMethod = deviceInterface[methodName + "Async"];
                if (typeof getPropertyMethod === "function") {
                    value = getPropertyMethod.call(deviceInterface);
                }
            }
        }

        if (typeof value === "undefined") {
            throw new TypeError("Property '" + propertyName + "' getter " +
                "for interface " + interfaceName + " not implemented by device.");
        } else if (typeof value === "object" && typeof value.then === "function") {
            return await value;
        } else {
            return value;
        }
    }

    public static async setPropertyAsync(
            device: IDevice,
            interfaceName: string | DeviceInterface,
            propertyName: string,
            value: any): Promise<void> {
        let deviceInterface = DeviceAccessor.getDeviceInterface(device, interfaceName);
        DeviceAccessor.validateMemberName(propertyName);

        let setPropertyMethod: any;
        let currentValue = deviceInterface[propertyName];
        if (typeof currentValue !== "undefined") {
            setPropertyMethod = function (newValue: any) { this[propertyName] = newValue; };
        } else {
            let methodName = "set" + DeviceAccessor.capitalize(propertyName);
            setPropertyMethod = deviceInterface[methodName];
            if (typeof setPropertyMethod !== "function") {
                setPropertyMethod = deviceInterface[methodName + "Async"];
                if (typeof setPropertyMethod !== "function") {
                    throw new TypeError("Property '" + propertyName + "' setter " +
                        "for interface " + interfaceName + " not implemented by device.");
                }
            }
        }

        let result = setPropertyMethod.call(deviceInterface, value);
        if (typeof result === "object" && typeof result.then === "function") {
            await result;
        }
    }

    public static addPropertyListener(
            device: IDevice,
            interfaceName: string | DeviceInterface,
            propertyName: string,
            callback: (value: any) => void): void {
        let deviceInterface = DeviceAccessor.getDeviceInterface(device, interfaceName);
        DeviceAccessor.validateMemberName(propertyName);

        // TODO: Update to use node events API
        let methodName = "add" + DeviceAccessor.capitalize(propertyName) + "Listener";
        let addListenerMethod: any = deviceInterface[methodName];

        if (typeof addListenerMethod !== "function") {
            throw new TypeError("Property '" + propertyName + "' notifier " +
                "for interface " + interfaceName + " not implemented by device.");
        } else {
            addListenerMethod.call(deviceInterface, callback);
        }
    }

    public static removePropertyListener(
            device: IDevice,
            interfaceName: string | DeviceInterface,
            propertyName: string,
            callback: (value: any) => void): void {
        let deviceInterface = DeviceAccessor.getDeviceInterface(device, interfaceName);
        DeviceAccessor.validateMemberName(propertyName);

        // TODO: Update to use node events API
        let methodName = "remove" + DeviceAccessor.capitalize(propertyName) + "Listener";
        let removeListenerMethod: any = deviceInterface[methodName];

        if (typeof removeListenerMethod !== "function") {
            throw new TypeError("Property '" + propertyName + "' notifier removal " +
                "for interface " + interfaceName + " not implemented by device.");
        } else {
            removeListenerMethod.call(deviceInterface, callback);
        }
    }

    public static async invokeMethodAsync(
            device: IDevice,
            interfaceName: string | DeviceInterface,
            methodName: string,
            args: any[]): Promise<any> {
        let deviceInterface = DeviceAccessor.getDeviceInterface(device, interfaceName);
        DeviceAccessor.validateMemberName(methodName);
        if (!Array.isArray(args)) {
            throw new TypeError("Args argument must be an array.");
        }

        let method: any = deviceInterface[methodName];
        if (typeof method !== "function") {
            throw new TypeError("Method '" + methodName + "' " +
                "for interface " + interfaceName + " not implemented by device.");
        } else {
            let result = method.apply(deviceInterface, args);
            if (typeof result === "object" && typeof result.then === "function") {
                return await result;
            } else {
                return result;
            }
        }
    }

    private static getDeviceInterface(
            device: IDevice, interfaceName: string | DeviceInterface): {[key: string]: any} {
        if (typeof device !== "object") {
            throw new TypeError("Device argument must be an object.");
        }

        if (typeof device.as !== "function") {
            return <{[key: string]: any}> device;
        }

        if (typeof interfaceName !== "string") {
            interfaceName = interfaceName.name;
        }

        let deviceInterface = device.as(interfaceName);
        if (typeof deviceInterface !== "object") {
            throw new TypeError("Interface not implemented by device: " + interfaceName);
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
