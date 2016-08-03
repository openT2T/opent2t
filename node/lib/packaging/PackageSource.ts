
import { PackageInfo } from "./PackageInfo";

/**
 * Base class for a local or remote source of OpenT2T packages. Also serves
 * as a factory for various package source subclasses. The factory pattern is
 * used to reduce the surface area of APIs exported from the library (and
 * projected to applications).
 */
export abstract class PackageSource {
    /**
     * Creates a new LocalPackageSource with a specified cache directory.
     *
     * @param {string} cacheDirectory  Path to the directory where packages are cached.
     */
    public static createLocalPackageSource(cacheDirectory: string): PackageSource {
        // Use delayed require to avoid recursive module dependency.
        let LocalPackageSource = require("./LocalPackageSource").LocalPackageSource;

        return new LocalPackageSource(cacheDirectory);
    }

    /**
     * Creates a combined prioritized view over multiple package sources.
     *
     * @param {IPackageSource[]} sources  Array of package sources in priority order.
     */
    public static createUnion(sources: PackageSource[]): PackageSource {
        // Use delayed require to avoid recursive module dependency.
        let PackageSourceUnion = require("./PackageSourceUnion").PackageSourceUnion;

        return new PackageSourceUnion(sources);
    }

    /**
     * Gets information about all OpenT2T packages currently available from the source.
     * This method is optional; it may not be implemented for remote sources.
     * CAUTION: This is a potentially slow operation.
     *
     * @returns {Promise<PackageInfo[]>} An array of package information
     * objects, or an empty array if the cache is empty
     */
    public getAllPackageInfoAsync?(): Promise<PackageInfo[]>;

    /**
     * Gets information about an OpenT2T package from the source
     * (potentially without downloading the whole package).
     *
     * @param {string} name  Name of the package
     * @returns {(Promise<PackageInfo | null)} Information about the requested
     * package, or null if the requested package is not found at the source
     */
    public abstract getPackageInfoAsync(name: string): Promise<PackageInfo | null>;

    /**
     * Downloads or copies a package to a target (cache) directory.
     *
     * @param {string} name  Name of the package
     * @param {string} targetDirectory  Directory where the package is to be extracted
     */
    public abstract copyPackageAsync(name: string, targetDirectory: string): Promise<void>;
}
