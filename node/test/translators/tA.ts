
import { IDevice, ITranslator } from "../../lib/ITranslator";
import "../out/org.opent2t.test.A.ts";

export default class TestTranslatorA implements ITranslator {
    public createDevice(deviceProps: any): IDevice | Promise<IDevice> {
        return new TestDeviceA(deviceProps);
    }
}

class TestDeviceA implements IDevice, org.opent2t.test.A {
    constructor(deviceProps: any) {
        this.props = deviceProps;
        this.propA1 = 123;
        this.propA2 = "test";
    }

    public props: any;

    public readonly propA1: number;

    public propA2: string;

    public methodA1(): void {
    }

    public methodA2(param1: number, param2: string): boolean {
        return true;
    }

    public addSignalA1Listener(callback: (value: string) => void) {
    }
    public removeSignalA1Listener(callback: (value: string) => void) {
    }
}