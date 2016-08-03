
/**
 * Information about an OpenT2T package, as loaded from the package.json.
 *
 * This class is not intended to represent every piece of metadata that might be in
 * package.json -- just the parts that are relevant to OpenT2T package discovery and
 * module resolution.
 */
export class PackageInfo {
    /**
     * Parses information about OpenT2T modules from a package.json. Returns null if not
     * an OpenT2T package. Throws an Error if parsing failed or the data is invalid.
     *
     * @param {any} packageJson  JSON string or pre-parsed JSON object for the package.json
     * @returns {PackageInfo | null} The parsed package information, or null if not an
     *     OpenT2T package
     */
    public static parse(packageJson: any): PackageInfo | null {
        if (typeof packageJson === "string") {
            packageJson = JSON.parse(packageJson);
        }

        if (typeof packageJson !== "object") {
            throw new Error("Not a valid opent2t package.json.");
        }

        if (typeof packageJson.opent2t !== "object") {
            // Not an OpenT2T package.
            return null;
        }

        let interfaces: PackageInterfaceInfo[] = [];
        let interfacesJson: {[moduleName: string]: any} = packageJson.opent2t.interfaces;
        if (typeof interfacesJson === "object") {
            Object.keys(interfacesJson).forEach((moduleName: string) => {
                interfaces.push({
                    description: interfacesJson[moduleName].description,
                    name: moduleName,
                });
            });
        }

        let translators: PackageTranslatorInfo[] = [];
        let translatorsJson: {[moduleName: string]: any} = packageJson.opent2t.translators;
        if (typeof translatorsJson === "object") {
            Object.keys(translatorsJson).forEach((moduleName: string) => {

                let interfaceReferences: string[] = translatorsJson[moduleName].interfaces;
                if (!Array.isArray(interfaceReferences)) {
                    throw new Error("Missing or invalid translator interface references: " +
                            JSON.stringify(interfaceReferences));
                }

                interfaceReferences = interfaceReferences.map(<(value: string) => string>
                    PackageInfo.resolveModuleName.bind(null, packageJson.name));

                let onboardingReference: string = translatorsJson[moduleName].onboarding;
                if (!onboardingReference || typeof onboardingReference !== "string") {
                    throw new Error("Missing or invalid translator onboarding reference: " +
                            JSON.stringify(onboardingReference));
                }

                onboardingReference =
                    PackageInfo.resolveModuleName(packageJson.name, onboardingReference);

                let onboardingProperties: { [propertyName: string]: string } =
                        translatorsJson[moduleName].onboardingProperties;
                if (!onboardingProperties || typeof onboardingProperties !== "object") {
                    throw new Error("Missing or invalid translator onboarding properties: " +
                            JSON.stringify(onboardingProperties));
                }

                translators.push({
                    description: translatorsJson[moduleName].description,
                    interfaces: interfaceReferences,
                    name: moduleName,
                    onboarding: onboardingReference,
                    onboardingProperties: onboardingProperties,
                });
            });
        }

        return {
            description: packageJson.description,
            interfaces: interfaces,
            name: packageJson.name,
            translators: translators,
            version: packageJson.version,
        };
    }

    /**
     * Converts references to modules within the same package (using a ./ prefix) into
     * package-qualified module references.
     */
    private static resolveModuleName(packageName: string, moduleName: string): string {
        return moduleName.startsWith("./") ? (packageName + "/" + moduleName.substr(2)) : moduleName;
    }

    /**
     * Name of the package. This is an NPM package name, which may optionally include a scope
     * name prefix, e.g. "@opent2t/somepackage".
     */
    public readonly name: string;

    /**
     * Semantic version of the package.
     */
    public readonly version: string;

    /**
     * Optional description of the package.
     */
    public readonly description?: string;

    /**
     * Array of information about OpenT2T interface modules in the package.
     */
    public readonly interfaces: PackageInterfaceInfo[];

    /**
     * Array of information about OpenT2T translator modules in the package.
     */
    public readonly translators: PackageTranslatorInfo[];
}

/**
 * Information about an OpenT2T interface module in a package, as loaded from
 * the opent2t/interfaces node of package.json.
 */
export class PackageInterfaceInfo {
    /**
     * Name of the interface module within the package. This is not a fully-qualified
     * name; a package name prefix is normally required to resolve the module.
     */
    public readonly name: string;

    /**
     * Optional description of the interface module.
     */
    public readonly description?: string;
}

/**
 * Information about an OpenT2T translator module in a package, as loaded from
 * the opent2t/translators node of package.json.
 */
export class PackageTranslatorInfo {
    /**
     * Name of the translator module within the package. This is not a fully-qualified
     * name; a package name prefix is normally required to resolve the module.
     */
    public readonly name: string;

    /**
     * Optional description of the translator module.
     */
    public readonly description?: string;

    /**
     * List of references to interfaces implemented by the translator.
     * These are package-qualified interface module names.
     */
    public readonly interfaces: string[];

    /**
     * Reference to the onboarding module required by the translator.
     * This is a package-qualified onboarding module name.
     */
    public readonly onboarding: string;

    /**
     * Dictionary of properties passed to the onboarding module. For example, a property
     * may specify a filter for the kind of device that is to be onboarded.
     */
    public readonly onboardingProperties: { [propertyName: string]: string };
}
