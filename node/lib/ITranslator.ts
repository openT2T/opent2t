
/**
 * Interface that all translators implement.
 */
export interface ITranslator {
    /**
     * Creates an instance of the device, given device properties obtained from onboarding.
     * This method is optionally async, meaning it may return either an immediate device
     * instance or a promise for a device instance.
     */
    createDevice(deviceProps: any): IDevice | Promise<IDevice>;
}

/**
 * Interface that all device instances (created by translators) implement.
 */
export interface IDevice {
    /**
     * Optional method on a device that requests a specific interface to the device.
     * If the method is not available then properties and methods for all implemented
     * interfaces must be on the device object itself; in that case there must be no
     * naming conflict among the interfaces.
     *
     * @param {string} interfaceName  Name of the interface requested
     * @returns {*} An object that implements the requested interface, or null if
     *     the device does not have any implementation of the interface
     */
    as?(interfaceName: string): Object | null;
}
