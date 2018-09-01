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

/* eslint-env node */
/* eslint-disable no-console */
const Benchmark = require('benchmark');
const h3 = require('h3-js');
const geojson2h3 = require('../src/geojson2h3');

const suite = new Benchmark.Suite();

// fixtures

const h3Index = '89283080ddbffff';
const ring50 = h3.kRing(h3Index, 50);
const ring50Feature = geojson2h3.h3SetToFeature(ring50, 9);
const ring50Donuts = h3
    .kRing(h3Index, 10)
    .concat(h3.kRing(h3, 20))
    .concat(h3.kRing(h3, 30))
    .concat(h3.kRing(h3, 40))
    .concat(h3.kRing(h3, 50));
const ring50DonutsFeature = geojson2h3.h3SetToFeature(ring50Donuts, 9);

// add tests

suite.add('h3SetToFeature - ring50', () => {
    geojson2h3.h3SetToFeature(ring50);
});

suite.add('h3SetToFeature - ring50Donuts', () => {
    geojson2h3.h3SetToFeature(ring50Donuts);
});

suite.add('featureToH3Set - ring50', () => {
    geojson2h3.featureToH3Set(ring50Feature, 9);
});

suite.add('featureToH3Set - ring50Donuts', () => {
    geojson2h3.featureToH3Set(ring50DonutsFeature, 9);
});

// add listeners
suite
    .on('cycle', event => {
        console.log(String(event.target));
    })
    // run async
    .run({async: true});
