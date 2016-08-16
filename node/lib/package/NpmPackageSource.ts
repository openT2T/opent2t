
import { PackageInfo } from "./PackageInfo";
import { PackageSource } from "./PackageSource";

/**
 * Acquires OpenT2T packages from an NPM registry.
 */
export class NpmPackageSource extends PackageSource {
    public readonly registryUri: string;

    constructor(registryUri?: string) {
        super();
        this.registryUri = registryUri || "https://registry.npmjs.org/";
    }

    /**
     * Gets information about an OpenT2T package from the source
     * (potentially without downloading the whole package).
     *
     * @param {string} name  Name of the package
     * @returns {(Promise<PackageInfo | null)} Information about the requested
     * package, or null if the requested package is not found at the source
     */
    public getPackageInfoAsync(name: string): Promise<PackageInfo | null> {
        // TODO: Use 'npm info' to download the package.json
        throw new Error("Not implemented.");
    }

    /**
     * Downloads or copies a package to a target (cache) directory.
     *
     * @param {string} name  Name of the package
     * @param {string} targetDirectory  Directory where the package is to be extracted
     */
    public copyPackageAsync(name: string, targetDirectory: string): Promise<void> {
        // TODO: Use 'npm install' to download and extract the package.
        // TODO: Verify targetDirectory ends with /node_modules/
        throw new Error("Not implemented.");
    }
}
