
import { Schema } from "jsonschema";

export class DeviceInterface {
    readonly id: string;
    readonly version: string;
    readonly properties: DeviceProperty[];
    readonly methods: DeviceMethod[];
    readonly signals: DeviceSignal[];
}

export abstract class DeviceCharacteristic {
    readonly name: string;
}

export class DeviceProperty extends DeviceCharacteristic {
    readonly canRead: boolean;
    readonly canWrite: boolean;
    readonly propertyType: Schema;
}

export class DeviceMethod extends DeviceCharacteristic {
    readonly parameters: DeviceParameter[];
    readonly returnType: Schema;
}

export class DeviceParameter extends DeviceCharacteristic {
    readonly parameterType: Schema;
}

export class DeviceSignal {
    readonly signalType: Schema;
}
