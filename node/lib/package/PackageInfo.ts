
/**
 * Information about an OpenT2T package, as loaded from a source directory with
 * a translator manifest or from a built package.json.
 *
 * This class is not intended to represent every piece of metadata that might be in
 * package.json -- just the parts that are relevant to OpenT2T package discovery and
 * module resolution.
 *
 * By specifying module paths of schemas and translators in the package, this class
 * abstracts away the directory structure from the rest of the library and consumers
 * of it.
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

        let schemas: PackageSchemaInfo[] = [];
        let schemasJson: {[moduleName: string]: any} = packageJson.opent2t.schemas;
        if (typeof schemasJson === "object") {
            Object.keys(schemasJson).forEach((moduleName: string) => {
                schemas.push({
                    description: schemasJson[moduleName].description,
                    moduleName: moduleName,
                });
            });
        }

        let translators: PackageTranslatorInfo[] = [];
        let translatorsJson: {[moduleName: string]: any} = packageJson.opent2t.translators;
        if (typeof translatorsJson === "object") {
            Object.keys(translatorsJson).forEach((moduleName: string) => {

                let schemaReferences: string[] = translatorsJson[moduleName].schemas;
                if (!Array.isArray(schemaReferences)) {
                    throw new Error("Missing or invalid translator schema references: " +
                            JSON.stringify(schemaReferences));
                }

                schemaReferences = schemaReferences.map(<(value: string) => string>
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

                let onboardingFlow: OnboardingFlow[] =
                        translatorsJson[moduleName].onboardingFlow;
                if (!onboardingFlow || typeof onboardingFlow !== "object") {
                    throw new Error("Missing or invalid translator onboardingFlow information: " +
                            JSON.stringify(onboardingFlow));
                }

                translators.push({
                    description: translatorsJson[moduleName].description,
                    moduleName: moduleName,
                    onboarding: onboardingReference,
                    onboardingFlow: onboardingFlow,
                    onboardingProperties: onboardingProperties,
                    schemas: schemaReferences,
                });
            });
        }

        return {
            description: packageJson.description,
            name: packageJson.name,
            onboardingInfo: packageJson.opent2t.onboardingInfo,
            schemas: schemas,
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
     * Array of information about OpenT2T schema modules in the package.
     */
    public readonly schemas: PackageSchemaInfo[];

    /**
     * Array of information about OpenT2T translator modules in the package.
     */
    public readonly translators: PackageTranslatorInfo[];

    /**
     * Information about Onboarding package. (not applicable to translators or hub packages).
     */
    public readonly onboardingInfo: PackageOnboardingInfo | null;

}

/**
 * Information about an OpenT2T schema module in a package, as loaded from
 * the opent2t/schemas node of package.json.
 */
export class PackageSchemaInfo {
    /**
     * Relative path and name of the schema module within the package. This is not a fully-
     * qualified name; a package name prefix is normally required to resolve the module.
     */
    public readonly moduleName: string;

    /**
     * Optional description of the schema module.
     */
    public readonly description?: string;
}

/**
 * Information about an OpenT2T translator module in a package, as loaded from
 * the opent2t/translators node of package.json.
 */
export class PackageTranslatorInfo {
    /**
     * Relative path and name of the translator module within the package. This is not a
     * fully-qualified name; a package name prefix is normally required to resolve the
     * module.
     */
    public readonly moduleName: string;

    /**
     * Optional description of the translator module.
     */
    public readonly description?: string;

    /**
     * List of references to schemas implemented by the translator.
     * These are package-qualified schema module names.
     */
    public readonly schemas: string[];

    /**
     * Reference to the onboarding module required by the translator.
     * This is a package-qualified onboarding module name.
     */
    public readonly onboarding: string;

    /**
     * Dictionary of properties passed to the onboarding module. For example, a property
     * may specify a filter for the kind of thing that is to be onboarded.
     * This is optional and applicable only for devices that are connected through a hub.
     */
    public readonly onboardingProperties: { [propertyName: string]: string };


    /**
     * Onboarding information pertaining to the hub device, which will have the onboarding flow information. 
     * For example, an 'input' flow type for acquiring username/client_id/client_secret
     * This is optional and present only on hub devices.
     */
    public readonly onboardingFlow: OnboardingFlow[];
}

export class PackageOnboardingInfo
{
    /**
     * Relative path and name of the onboarding module within the package. This is not a
     * fully-qualified name; a package name prefix is normally required to resolve the
     * module.
     */
    public readonly moduleName: string;

    /**
     * List of references to schemas implemented by the onboarding.
     * These are package-qualified schema module names.
     */
    public readonly schemas: string[];
}

export class OnboardingFlow
{
    /**
     * Name of the onboarding flow method. Example: 'getUserInput'' to indicate input from the end-user.
     */
    public readonly name: string;

    /**
     * Represents individual steps in a given flow (ex: get username, get password).
     */
    public readonly flow: OnboardingFlowElement[];
}

export class OnboardingFlowElement
{
    /**
     * Specifies type of the flow step (ex: input, password). Each type has specified meaning.
     * For example, 'password' type indicates the UI to hide the text, when the user types.  
     */
    public readonly type: string;

    /**
     * Friendly name of the flow step.
     */
    public readonly name: string;

    /**
     * Dictionary of localized descriptions of each flow step, with a language (say en, fr) being the key.
     */
    public readonly descriptions: { [locale: string]: string };
}

