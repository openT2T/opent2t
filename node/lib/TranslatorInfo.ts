
/**
 * Information about a translator, as loaded from the translator's manifest.
 */
export class TranslatorInfo {
    /**
     * Fully-qualified name of the translator (required).
     */
    public readonly name: string;

    /**
     * List of interfaces implemented by the translator.
     */
    public readonly interfaceNames: string[];

    /**
     * Name of the onboarding module required by the thanslator.
     */
    public readonly onboardingName: string;

    /**
     * Dictionary of properties passed to the onboarding module. For example, a property
     * may specify a filter for the kind of device that is to be onboarded.
     */
    public readonly onboardingProperties: { [propertyName: string]: string };
}
