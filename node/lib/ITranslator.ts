
/**
 * Interface that translators may (optionally!) implement.
 * Aside from the methods declared here, translators should also implement a
 * constructor that accepts a single property-bag parameter. (The contents of
 * the property-bag are TBD.)
 */
export interface ITranslator {
    /**
     * Optional method on a translator that requests a specific interface to the translator.
     * If the method is not available then properties and methods for all implemented
     * interfaces must be on the translator object itself; in that case there must be no
     * naming conflict among the interfaces.
     *
     * @param {string} interfaceName  Name of the interface requested
     * @returns {*} An object that implements the requested interface, or null if
     *     the translator does not have any implementation of the interface
     */
    as?(interfaceName: string): Object | null;
}
