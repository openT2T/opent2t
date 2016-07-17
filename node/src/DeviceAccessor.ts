
import { IDevice } from "./ITranslator";

/**
 * Provides reflection-style access to device interface properties and methods.
 */
export class DeviceAccessor {
    public static getProperty(
            device: IDevice,
            interfaceId: string,
            propertyName: string): Promise<any> {
        let deviceInterface = DeviceAccessor.getDeviceInterface(device, interfaceId);
        DeviceAccessor.validateMemberName(propertyName);

        return new Promise<any>((resolve, reject) => {
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
                reject(new TypeError("Property '" + propertyName + "' getter " +
                    "for interface " + interfaceId + " not implemented by device."));
            } else if (typeof value === "object" && typeof value.then === "function") {
                value.then((asyncValue: any) => {
                    resolve(asyncValue);
                }, (asyncError: Error) => {
                    reject(asyncError);
                });
            } else {
                resolve(value);
            }
        });
    }

    public static setProperty(
            device: IDevice,
            interfaceId: string,
            propertyName: string,
            value: any): Promise<void> {
        let deviceInterface = DeviceAccessor.getDeviceInterface(device, interfaceId);
        DeviceAccessor.validateMemberName(propertyName);

        return new Promise<any>((resolve, reject) => {
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
                        reject(new TypeError("Property '" + propertyName + "' setter " +
                            "for interface " + interfaceId + " not implemented by device."));
                    }
                }
            }

            let result = setPropertyMethod.call(deviceInterface, value);
            if (typeof result === "object" && typeof result.then === "function") {
                result.then(() => {
                    resolve();
                }, (asyncError: Error) => {
                    reject(asyncError);
                });
            } else {
                resolve();
            }
        });
    }

    public static addPropertyListener(
            device: IDevice,
            interfaceId: string,
            propertyName: string,
            callback: (value: any) => void): void {
        let deviceInterface = DeviceAccessor.getDeviceInterface(device, interfaceId);
        DeviceAccessor.validateMemberName(propertyName);

        let methodName = "add" + DeviceAccessor.capitalize(propertyName) + "Listener";
        let addListenerMethod: any = deviceInterface[methodName];

        if (typeof addListenerMethod !== "function") {
            throw new TypeError("Property '" + propertyName + "' notifier " +
                "for interface " + interfaceId + " not implemented by device.");
        } else {
            addListenerMethod.call(deviceInterface, callback);
        }
    }

    public static removePropertyListener(
            device: IDevice,
            interfaceId: string,
            propertyName: string,
            callback: (value: any) => void): void {
        let deviceInterface = DeviceAccessor.getDeviceInterface(device, interfaceId);
        DeviceAccessor.validateMemberName(propertyName);

        let methodName = "remove" + DeviceAccessor.capitalize(propertyName) + "Listener";
        let removeListenerMethod: any = deviceInterface[methodName];

        if (typeof removeListenerMethod !== "function") {
            throw new TypeError("Property '" + propertyName + "' notifier removal " +
                "for interface " + interfaceId + " not implemented by device.");
        } else {
            removeListenerMethod.call(deviceInterface, callback);
        }
    }

    public static invokeMethod(
            device: IDevice,
            interfaceId: string,
            methodName: string,
            args: any[]): Promise<any> {
        let deviceInterface = DeviceAccessor.getDeviceInterface(device, interfaceId);
        DeviceAccessor.validateMemberName(methodName);
        if (!Array.isArray(args)) {
            throw new TypeError("Args argument must be an array.");
        }

        return new Promise<any>((resolve, reject) => {
            let method: any = deviceInterface[methodName];
            if (typeof method !== "function") {
                reject(new TypeError("Method '" + methodName + "' " +
                    "for interface " + interfaceId + " not implemented by device."));
            } else {
                let result = method.apply(deviceInterface, args);
                if (typeof result === "object" && typeof result.then === "function") {
                    result.then((asyncResult: any) => {
                        resolve(asyncResult);
                    }, (asyncError: Error) => {
                        reject(asyncError);
                    });
                } else {
                    resolve(result);
                }
            }
        });
    }

    private static getDeviceInterface(device: IDevice, interfaceId: string): {[key: string]: any} {
        if (typeof device !== "object") {
            throw new TypeError("Device argument must be an object.");
        }

        if (typeof device.as !== "function") {
            return <{[key: string]: any}> device;
        }

        let deviceInterface = device.as(interfaceId);
        if (typeof deviceInterface !== "object") {
            throw new TypeError("Interface not implemented by device: " + interfaceId);
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
