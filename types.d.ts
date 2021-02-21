declare module 'geojson2h3' {
    import {Feature, FeatureCollection, GeoJsonProperties} from 'geojson';

    /**
     * Convert a GeoJSON feature to a set of hexagons. Only hexagons whose centers
     * fall within the feature will be included. Note that conversion from GeoJSON
     * is lossy; the resulting hexagon set only approximately describes the original
     * shape, at a level of precision determined by the hexagon resolution.
     */
    export function featureToH3Set(feature: Feature, resolution: number): string[];
    
    /**
     * Convert a single H3 hexagon to a GeoJSON `Polygon` feature
     */
    export function h3ToFeature(h3Index: string, properties: GeoJsonProperties): Feature;
    
    /**
     * Convert a set of hexagons to a GeoJSON `Feature` with the set outline(s). The
     * feature's geometry type will be either `Polygon` or `MultiPolygon` depending on
     * the number of outlines required for the set.
     */
    export function h3SetToFeature(hexagons: string[], properties: GeoJsonProperties): Feature;
    
    /**
     * Convert a set of hexagons to a GeoJSON `MultiPolygon` feature with the
     * outlines of each individual hexagon.
     */
    export function h3SetToMultiPolygonFeature(
        hexagons: string[],
        properties: GeoJsonProperties
    ): Feature;

    /**
     * Convert a set of hexagons to a GeoJSON `FeatureCollection` with each hexagon
     * in a separate `Polygon` feature with optional properties.
     */
    export function h3SetToFeatureCollection(
        hexagons: string[],
        getProperties: (h3Index: string) => GeoJsonProperties
    ): FeatureCollection;
}
