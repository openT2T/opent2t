
export default new TestTranslatorA();

class TestTranslatorA {
    createDevice(deviceProps) {
        return new TestDeviceA(deviceProps);
    }
}

class TestDeviceA {
    constructor(deviceProps) {
        this.props = deviceProps;
        this.propA1 = 123;
        this.propA2 = "test";
    }
    methodA1() {
    }
    methodA2(param1, param2) {
        return true;
    }
    addSignalA1Listener(callback) {
    }
    removeSignalA1Listener(callback) {
    }
}
