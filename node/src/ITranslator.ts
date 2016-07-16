
export interface ITranslator {
    /**
     * Fully-qualified translator identifier, for example org.example.widgettranslator.
     */
    readonly id: string;

    /**
     * Mapping from interface identifiers to interface versions, indicating the
     * set of interfaces and versions of each interface supported by the translator.
     * (A translator may not support multiple versions of the same interface.)
     */
    readonly interfaces: { [interfaceId: string]: string; };

    /**
     * Creates an instance of the device, given device properties obtained from onboarding.
     */
    createDevice(deviceProps: Object): IDevice | Promise<IDevice>;
}

export interface IDevice {
    as(interfaceId: string): Object;
}
