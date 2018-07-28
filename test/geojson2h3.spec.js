/*
 * Copyright 2018 Uber Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const test = require('tape');
const h3 = require('h3-js');
const geojson2h3 = require('../src/geojson2h3');

const DEFAULT_RES = 9;

const {
    featureToH3Set,
    h3ToFeature,
    h3SetToFeature,
    h3SetToMultiPolygonFeature,
    h3SetToFeatureCollection
} = geojson2h3;

const GEO_PRECISION = 12;

// 89283085507ffff
const HEX_OUTLINE_1 = [
    [
        [-122.47485823276713, 37.85878356045377],
        [-122.47378734444064, 37.860465621984154],
        [-122.47504834087829, 37.86196795698972],
        [-122.47738022442019, 37.861788207189115],
        [-122.47845104316997, 37.86010614563313],
        [-122.4771900479571, 37.85860383390307],
        [-122.47485823276713, 37.85878356045377]
    ]
];

// 892830855b3ffff
const HEX_OUTLINE_2 = [
    [
        [-122.48147295617736, 37.85187534491365],
        [-122.48040229236011, 37.85355749750206],
        [-122.48166324644575, 37.85505983954851],
        [-122.48399486310532, 37.85488000572598],
        [-122.48506545734224, 37.85319785312151],
        [-122.48380450450253, 37.851695534355315],
        [-122.48147295617736, 37.85187534491365]
    ]
];

const POLYGON = [
    [
        [-122.26184837431902, 37.8346695948541],
        [-122.26299146613795, 37.8315769200876],
        [-122.26690391101923, 37.830681442651134],
        [-122.2696734085486, 37.83287856171719],
        [-122.26853055028259, 37.835971208076515],
        [-122.26461796082103, 37.83686676365336],
        [-122.26184837431902, 37.8346695948541]
    ]
];
const POLYGON_CONTIGUOUS = [
    [
        [-122.25793560913665, 37.835564941293676],
        [-122.26184837431902, 37.8346695948541],
        [-122.26299146613795, 37.8315769200876],
        [-122.26022202614566, 37.82937956347423],
        [-122.25630940542779, 37.830274831952494],
        [-122.25516608024519, 37.83336753500189],
        [-122.25793560913665, 37.835564941293676]
    ]
];
const POLYGON_NONCONTIGUOUS = [
    [
        [-122.23511849129424, 37.829458676659385],
        [-122.23788784659696, 37.831656795184344],
        [-122.24180113856318, 37.83076207598435],
        [-122.24294493056115, 37.827669316312495],
        [-122.24017566397347, 37.825471247577006],
        [-122.2362625166653, 37.82636588872747],
        [-122.23511849129424, 37.829458676659385]
    ]
];

function toLowPrecision(maybeNumber) {
    if (typeof maybeNumber === 'number') {
        return Number(maybeNumber.toPrecision(GEO_PRECISION));
    }
    if (Array.isArray(maybeNumber)) {
        return maybeNumber.map(toLowPrecision);
    }
    if (typeof maybeNumber === 'object') {
        /* eslint-disable guard-for-in */
        for (const key in maybeNumber) {
            maybeNumber[key] = toLowPrecision(maybeNumber[key]);
        }
    }
    return maybeNumber;
}

function assertEqualFeatures(assert, feature1, feature2, msg) {
    assert.deepEqual(
        toLowPrecision(feature1),
        toLowPrecision(feature2),
        msg || 'Features are equivalent'
    );
}

function assertSymmetrical(assert, feature, hexagons) {
    assert.deepEqual(
        featureToH3Set(feature, DEFAULT_RES).sort(),
        hexagons.sort(),
        'featureToH3Set matches expected'
    );
    assertEqualFeatures(
        assert,
        h3SetToFeature(hexagons),
        feature,
        'h3SetToFeature matches expected'
    );
    // not sure this adds anything, but it makes me feel good
    assert.deepEqual(
        featureToH3Set(h3SetToFeature(hexagons), DEFAULT_RES).sort(),
        hexagons.sort(),
        'featureToH3Set round-trip matches expected'
    );
    assertEqualFeatures(
        assert,
        h3SetToFeature(featureToH3Set(feature, DEFAULT_RES)),
        feature,
        'h3SetToFeature round-trip matches expected'
    );
}

test('Symmetrical - Empty', assert => {
    const feature = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: []
        }
    };
    const hexagons = [];

    assertSymmetrical(assert, feature, hexagons);

    assert.end();
});

test('Symmetrical - One hexagon', assert => {
    const hexagons = ['89283082837ffff'];
    const vertices = h3.h3ToGeoBoundary(hexagons[0], true);
    const feature = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [
                // Note that this is a little brittle; iterating from any
                // starting vertex would be correct
                [...vertices.slice(2, 6), ...vertices.slice(0, 3)]
            ]
        }
    };

    assertSymmetrical(assert, feature, hexagons);

    assert.end();
});

test('Symmetrical - Two hexagons', assert => {
    const feature = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [-122.42419231791126, 37.7746633251758],
                    [-122.42312112449315, 37.776346021077586],
                    [-122.42438078060647, 37.77785047757876],
                    [-122.42671162907993, 37.777672214849176],
                    [-122.42797132395157, 37.7791765946462],
                    [-122.4303021418057, 37.778998255103545],
                    [-122.4313731964829, 37.77731555898803],
                    [-122.43011350268344, 37.77581120251896],
                    [-122.42778275313196, 37.775989518837726],
                    [-122.42652309807923, 37.77448508566524],
                    [-122.42419231791126, 37.7746633251758]
                ]
            ]
        }
    };

    const hexagons = ['89283082833ffff', '89283082837ffff'];

    assertSymmetrical(assert, feature, hexagons);

    assert.end();
});

test('featureToH3Set - one contained hex', assert => {
    const hexagons = ['89283085507ffff'];

    const feature = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'MultiPolygon',
            coordinates: HEX_OUTLINE_1
        }
    };

    assert.deepEqual(
        featureToH3Set(feature, DEFAULT_RES),
        hexagons,
        'featureToH3Set matches expected'
    );

    assert.end();
});

test('featureToH3Set - no contained hex centers', assert => {
    const feature = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [-122.26985598997341, 37.83598006884068],
                    [-122.26836960154117, 37.83702107154188],
                    [-122.26741606933939, 37.835426338014386],
                    [-122.26985598997341, 37.83598006884068]
                ]
            ]
        }
    };

    const hexagons = [];

    assert.deepEqual(featureToH3Set(feature, 8), hexagons, 'featureToH3Set matches expected');

    assert.end();
});

test('featureToH3Set - MultiPolygon, contiguous', assert => {
    const feature = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'MultiPolygon',
            coordinates: [POLYGON, POLYGON_CONTIGUOUS]
        }
    };

    const hexagons = [
        '89283081347ffff',
        '89283081343ffff',
        '8928308134fffff',
        '8928308137bffff',
        '8928308134bffff',
        '8928308ac97ffff',
        '8928308135bffff'
    ];

    assert.deepEqual(
        featureToH3Set(feature, DEFAULT_RES),
        hexagons,
        'featureToH3Set matches expected'
    );

    assert.end();
});

test('featureToH3Set - MultiPolygon, non-contiguous', assert => {
    const feature = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'MultiPolygon',
            coordinates: [POLYGON, POLYGON_NONCONTIGUOUS]
        }
    };

    const hexagons = [
        '89283081347ffff',
        '89283081343ffff',
        '8928308134fffff',
        '8928308137bffff',
        '8928308a1b7ffff'
    ];

    assert.deepEqual(
        featureToH3Set(feature, DEFAULT_RES),
        hexagons,
        'featureToH3Set matches expected'
    );

    assert.end();
});

test('featureToH3Set - FeatureCollection', assert => {
    const feature = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: POLYGON
                }
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: POLYGON_CONTIGUOUS
                }
            }
        ]
    };

    const hexagons = [
        '89283081347ffff',
        '89283081343ffff',
        '8928308134fffff',
        '8928308137bffff',
        '8928308134bffff',
        '8928308ac97ffff',
        '8928308135bffff'
    ];

    assert.deepEqual(
        featureToH3Set(feature, DEFAULT_RES),
        hexagons,
        'featureToH3Set matches expected'
    );

    assert.end();
});

test('featureToH3Set - resolution 10', assert => {
    const parentHex = '89283082837ffff';
    const vertices = h3.h3ToGeoBoundary(parentHex, true);
    const feature = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    vertices[2],
                    vertices[3],
                    vertices[4],
                    vertices[5],
                    vertices[0],
                    vertices[1],
                    vertices[2]
                ]
            ]
        }
    };
    const resolution = 10;

    const expected = h3.uncompact([parentHex], resolution).sort();

    assert.equal(expected.length, 7, 'Got expected child hexagons');

    assert.deepEqual(
        featureToH3Set(feature, resolution).sort(),
        expected,
        'featureToH3Set matches expected'
    );

    assert.end();
});

test('featureToH3Set - errors', assert => {
    assert.throws(
        () => featureToH3Set({}),
        /Unhandled type/,
        'got expected error for empty object'
    );

    assert.throws(
        () =>
            featureToH3Set({
                type: 'LineString',
                coordinates: []
            }),
        /Unhandled type/,
        'got expected error for non-feature'
    );

    assert.throws(
        () =>
            featureToH3Set({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: []
                }
            }),
        /Unhandled geometry type/,
        'got expected error for unknown geometry type'
    );

    assert.throws(
        () =>
            featureToH3Set({
                type: 'FeatureCollection'
            }),
        /No features/,
        'got expected error for missing features'
    );

    assert.end();
});

test('h3SetToFeature - MultiPolygon', assert => {
    const hexagons = ['8928308137bffff', '8928308a1b7ffff'];
    const feature = h3SetToFeature(hexagons);

    assert.strictEqual(
        feature.geometry.type,
        'MultiPolygon',
        'MultiPolygon generated for two non-contiguous hexagons'
    );
    assert.ok(feature.geometry.coordinates.length === 2, 'Generated polygon for each hex');
    assert.ok(
        feature.geometry.coordinates[0][0][0][0],
        'Generated MultiPolygon coordinate structure for first loop'
    );
    assert.ok(
        feature.geometry.coordinates[1][0][0][0],
        'Generated MultiPolygon coordinate structure second loop'
    );

    assert.end();
});

test('h3SetToFeature - Polygon hole', assert => {
    const hexagons = [
        '89283082877ffff',
        '89283082863ffff',
        '8928308287bffff',
        '89283082847ffff',
        '8928308280bffff',
        '8928308280fffff'
    ];
    const feature = h3SetToFeature(hexagons);

    assert.strictEqual(
        feature.geometry.type,
        'Polygon',
        'Polygon generated for cluster with a hole'
    );
    assert.strictEqual(feature.geometry.coordinates.length, 2, 'Generated expected loop count');
    assert.ok(
        feature.geometry.coordinates[0].length > feature.geometry.coordinates[1].length,
        'Outer loop is first'
    );
    assert.strictEqual(feature.geometry.coordinates[1].length, 7, 'Hole has expected coord count');

    assert.end();
});

test('h3SetToFeature - two-hole Polygon', assert => {
    const hexagons = [
        '89283081357ffff',
        '89283081343ffff',
        '8928308134fffff',
        '8928308137bffff',
        '89283081373ffff',
        '8928308130bffff',
        '892830813c3ffff',
        '892830813cbffff',
        '89283081353ffff',
        '8928308131bffff',
        '892830813c7ffff'
    ];
    const feature = h3SetToFeature(hexagons);

    assert.strictEqual(
        feature.geometry.type,
        'Polygon',
        'Polygon generated for cluster with a hole'
    );
    assert.strictEqual(feature.geometry.coordinates.length, 3, 'Generated expected loop count');
    assert.ok(
        feature.geometry.coordinates[0].length > feature.geometry.coordinates[1].length,
        'Outer loop is first'
    );
    assert.strictEqual(feature.geometry.coordinates[1].length, 7, 'Hole has expected coord count');
    assert.strictEqual(feature.geometry.coordinates[2].length, 7, 'Hole has expected coord count');

    assert.end();
});

test('h3SetToFeature - multi donut', assert => {
    const hexagons = [
        // donut one
        '89283082877ffff',
        '89283082863ffff',
        '8928308287bffff',
        '89283082847ffff',
        '8928308280bffff',
        '8928308280fffff',
        // donut two
        '892830829b3ffff',
        '892830829bbffff',
        '8928308298fffff',
        '89283082983ffff',
        '89283082997ffff',
        '89283095a4bffff'
    ];
    const feature = h3SetToFeature(hexagons);
    const coords = feature.geometry.coordinates;

    assert.strictEqual(coords.length, 2, 'expected polygon count');
    assert.strictEqual(coords[0].length, 2, 'expected loop count for p1');
    assert.strictEqual(coords[1].length, 2, 'expected loop count for p2');
    assert.strictEqual(coords[0][0].length, 19, 'expected outer coord count p1');
    assert.strictEqual(coords[0][1].length, 7, 'expected inner coord count p1');
    assert.strictEqual(coords[1][0].length, 19, 'expected outer coord count p2');
    assert.strictEqual(coords[1][1].length, 7, 'expected inner coord count p2');

    assert.end();
});

test('h3SetToFeature - nested donut throws', assert => {
    const middle = '89283082877ffff';
    const hexagons = h3.hexRing(middle, 1).concat(h3.hexRing(middle, 3));
    assert.throws(
        () => h3SetToFeature(hexagons),
        /Unsupported MultiPolygon topology/,
        'throws expected error'
    );

    assert.end();
});

test('h3SetToFeature - properties', assert => {
    const properties = {
        foo: 1,
        bar: 'baz'
    };
    const hexagons = ['500428f003a9f'];
    const feature = h3SetToFeature(hexagons, properties);

    assert.deepEqual(feature.properties, properties, 'Properties included in feature');

    assert.end();
});

test('h3ToFeature', assert => {
    const hexagon = '89283082837ffff';
    const vertices = h3.h3ToGeoBoundary(hexagon, true);
    const feature = {
        id: hexagon,
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [vertices]
        }
    };

    assert.deepEqual(h3ToFeature(hexagon), feature, 'h3ToFeature matches expected');

    assert.end();
});

test('h3SetToMultiPolygonFeature', assert => {
    const hexagons = ['89283085507ffff', '892830855b3ffff'];

    const feature = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'MultiPolygon',
            coordinates: [HEX_OUTLINE_1, HEX_OUTLINE_2]
        }
    };

    const result = h3SetToMultiPolygonFeature(hexagons);

    assertEqualFeatures(assert, result, feature);

    assert.deepEqual(
        featureToH3Set(result, DEFAULT_RES),
        hexagons,
        'featureToH3Set round-trip matches expected'
    );

    assert.end();
});

test('h3SetToMultiPolygonFeature - properties', assert => {
    const properties = {
        foo: 1,
        bar: 'baz'
    };
    const hexagons = ['89283085507ffff'];
    const feature = h3SetToMultiPolygonFeature(hexagons, properties);

    assert.deepEqual(feature.properties, properties, 'Properties included in feature');

    assert.end();
});

test('h3SetToFeatureCollection', assert => {
    const hexagons = ['89283085507ffff', '892830855b3ffff'];

    const expected = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                id: hexagons[0],
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: HEX_OUTLINE_1
                }
            },
            {
                type: 'Feature',
                id: hexagons[1],
                properties: {},
                geometry: {
                    type: 'Polygon',
                    coordinates: HEX_OUTLINE_2
                }
            }
        ]
    };

    const result = h3SetToFeatureCollection(hexagons);

    assertEqualFeatures(assert, result, expected);

    assert.end();
});

test('h3SetToFeatureCollection - properties', assert => {
    const hexagons = ['89283085507ffff', '892830855b3ffff'];
    const properties = {
        '89283085507ffff': {foo: 1},
        '892830855b3ffff': {bar: 'baz'}
    };

    function getProperties(hexAddress) {
        return properties[hexAddress];
    }

    const result = h3SetToFeatureCollection(hexagons, getProperties);

    assert.deepEqual(
        result.features[0].properties,
        properties[hexagons[0]],
        'Properties match expected for hexagon'
    );

    assert.deepEqual(
        result.features[1].properties,
        properties[hexagons[1]],
        'Properties match expected for hexagon'
    );

    assert.end();
});
