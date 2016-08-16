
import { PackageInfo } from "./PackageInfo";
import { PackageSource } from "./PackageSource";

/**
 * A combined prioritized view over multiple package sources.
 */
export class PackageSourceUnion extends PackageSource {
    public readonly sources: PackageSource[];

    /**
     * Creates a union view over multiple package sources.
     *
     * @param {IPackageSource[]} sources  Array of package sources in priority order.
     */
    constructor(sources: PackageSource[]) {
        super();
        this.sources = sources;
    }

    /**
     * Gets information about all OpenT2T packages currently available from the source.
     * This method is optional; it may not be implemented for remote sources.
     * CAUTION: This is a potentially slow operation.
     *
     * @returns {Promise<PackageInfo[]>} An array of package information
     * objects, or an empty array if the cache is empty
     */
    public async getAllPackageInfoAsync(): Promise<PackageInfo[]> {
        // Index by name and iterate in reverse to enforce cache priority and discard duplicates.
        let packageInfoMap: { [key: string]: PackageInfo } = {};
        for (let i = this.sources.length - 1; i >= 0; i--) {
            let sourceGetAll = this.sources[i].getAllPackageInfoAsync;
            if (sourceGetAll) {
                let sourcePackageInfos: PackageInfo[] = await sourceGetAll();
                sourcePackageInfos.forEach((translatorInfo: PackageInfo) => {
                    packageInfoMap[translatorInfo.name] = translatorInfo;
                });
            }
        }

        let packageInfos: PackageInfo[] =
                Object.keys(packageInfoMap).map((name: string) => packageInfoMap[name]);
        return packageInfos;
    }

    /**
     * Gets information about an OpenT2T package from the source
     * (potentially without downloading the whole package).
     *
     * @param {string} name  Name of the package
     * @returns {(Promise<PackageInfo | null)} Information about the requested
     * package, or null if the requested package is not found at the source
     */
    public async getPackageInfoAsync(name: string): Promise<PackageInfo | null> {
        for (let i = 0; i < this.sources.length; i++) {
            let packageInfo: PackageInfo | null =
                    await this.sources[i].getPackageInfoAsync(name);
            if (packageInfo) {
                return packageInfo;
            }
        }

        return null;
    }

    /**
     * Downloads or copies a package to a target (cache) directory.
     *
     * @param {string} name  Name of the package
     * @param {string} targetDirectory  Directory where the package is to be extracted
     */
    public async copyPackageAsync(name: string, targetDirectory: string): Promise<void> {
        for (let i = 0; i < this.sources.length; i++) {
            let packageInfo: PackageInfo | null =
                    await this.sources[i].getPackageInfoAsync(name);
            if (packageInfo) {
                await this.sources[i].copyPackageAsync(name, targetDirectory);
            }
        }

        throw new Error("Translator '" + name + "' was not found at source.");
    }
}
