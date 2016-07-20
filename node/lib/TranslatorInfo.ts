
export class TranslatorInfo {
    public readonly id: string;
    public readonly version: string;
    public readonly interfaces: { [interfaceId: string]: string };
    public readonly onboardingId: string;
    public readonly onboardingProperties: { [propertyName: string]: string };
}
