
/**
 * Interface that translators may (optionally!) implement.
 * Aside from the methods declared here, translators should also implement a
 * constructor that accepts a single property-bag parameter. (The contents of
 * the property-bag are TBD.)
 */
export interface IThingTranslator {
    /**
     * Optional method on a translator that requests an interface to a specific
     * schema that the translator implements. If this method is not available on
     * a translator then properties and methods for all implemented schemas must
     * be on the translator object itself; in that case there must be no
     * naming conflict among the schemas.
     *
     * @param {string} schemaName  Name of the schema requested
     * @returns {*} An object that implements properties and methods in the
     *     requested schema, or null if the translator does not have any
     *     implementation of the schema
     */
    resolveSchema?(schemaName: string): Object | null;
}
