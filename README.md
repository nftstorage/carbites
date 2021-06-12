# carbites

[![Build](https://github.com/alanshaw/carbites/actions/workflows/main.yml/badge.svg)](https://github.com/alanshaw/carbites/actions/workflows/main.yml)
[![dependencies Status](https://status.david-dm.org/gh/alanshaw/carbites.svg)](https://david-dm.org/alanshaw/carbites)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/carbites)

Chunking for CAR files. Split a single CAR into multiple CARs.

## Install

```sh
npm install carbites
```

## Usage

```js
import { CarSplitter } from 'carbites'
import fs from 'fs'

const bigCar = fs.createReadStream('/path/to/big.car')
const targetSize = 1024 * 1024 * 100 // chunk to ~100MB CARs
const splitter = new CarSplitter(bigCar, targetSize)

for await (const car of splitter.cars()) {
  // Each `car` is an AsyncIterable<Uint8Array>
}
```

⚠️ Note: The first CAR output has roots in the header, subsequent CARs have an empty root CID [`bafkqaaa`](https://cid.ipfs.io/#bafkqaaa) as [recommended](https://github.com/ipld/specs/blob/master/block-layer/content-addressable-archives.md#number-of-roots).

Instead of an empty CID, carbites can generate a special root node for each split CAR that references all the blocks _and_ the original roots (only in the first CAR). To do this, use the `RootedCarSplitter` constructor. When reading/extracting data from the CARs, the root node should be discarded.

```js
import { RootedCarSplitter } from 'carbites/rooted'
import { CarReader } from '@ipld/car/reader'
import * as dagCbor from '@ipld/dag-cbor'
import fs from 'fs'

const bigCar = fs.createReadStream('/path/to/big.car')
const targetSize = 1024 * 1024 * 100 // chunk to ~100MB CARs
const chunker = new RootedCarSplitter(bigCar, targetSize)

const cars = chunker.cars()

// Every CAR has a single root - a CBOR node that is an tuple of `/carbites/1`,
// an array of root CIDs and an array of block CIDs.
// e.g. ['/carbites/1', ['bafkroot'], ['bafy1', 'bafy2']]

const { done, value: car } = await cars.next()
const reader = await CarReader.fromIterable(car)
const rootCids = await reader.getRoots()
const rootNode = dagCbor.decode(await reader.get(rootCids[0]))

console.log(rootNode[0]) // /carbites/1
console.log(rootNode[1]) // Root CIDs (only in first CAR)
/*
[
  CID(bafybeictvyf6polqzgop3jt32owubfmsg3kl226omqrfte4eyidubc4rpq)
]
*/
console.log(rootNode[2]) // Block CIDs (all blocks in this CAR)
/*
[
  CID(bafybeictvyf6polqzgop3jt32owubfmsg3kl226omqrfte4eyidubc4rpq),
  CID(bafyreihcsxqhd6agqpboc3wrlvpy5bwuxctv5upicdnt3u2wojv4exxl24),
  CID(bafyreiasq7d2ihbqm5xvhjjzlmzsensuadrpmpt2tkjsuwq42xpa34qevu)
]
*/
```

Note: The root node is limited to 4MB in size (the largest message IPFS will bitswap). Depending on the settings used to construct the DAG in the CAR, this may mean a split CAR size limit of around 30GiB.

### CLI

```sh
npm i -g carbites

# Split a big CAR into many smaller CARs
carbites split big.car --size 100MB # (default size)

# Join many split CARs back into a single CAR.
carbites join big-0.car big-1.car ...
# Note: not a tool for joining arbitrary CARs together! The split CARs MUST
# belong to the same CAR and big-0.car should be the first argument.
```

## API

* [`class CarSplitter`](#class-carsplitter)
    * [`constructor(car: AsyncIterable<Uint8Array>, targetSize: number)`](#constructorcar-asynciterableuint8array-targetsize-number)
    * [`cars(): AsyncGenerator<AsyncIterable<Uint8Array>>`](#cars-asyncgeneratorasynciterableuint8array)
* [`class CarJoiner`](#class-carjoiner)
    * [`constructor(cars: Iterable<AsyncIterable<Uint8Array>>)`](#constructorcars-iterableasynciterableuint8array)
    * [`car(): AsyncGenerator<Uint8Array>`](#car-asyncgeneratoruint8array)
* [`class RootedCarSplitter`](#class-rootedcarsplitter)
* [`class RootedCarJoiner`](#class-rootedcarjoiner)

### `class CarSplitter`

Split a CAR file into several smaller CAR files.

Import in the browser:

```js
import { CarSplitter } from 'https://cdn.skypack.dev/carbites'
```

Import in Node.js:

```js
import { CarSplitter } from 'carbites'
```

#### `constructor(car: AsyncIterable<Uint8Array>, targetSize: number)`

Create a new `CarSplitter` for the passed CAR file, aiming to generate CARs of around `targetSize` bytes in size.

#### `cars(): AsyncGenerator<AsyncIterable<Uint8Array>>`

Split the CAR file and create multiple smaller CAR files. Returns an `AsyncGenerator` that yields the split CAR files (of type `AsyncIterable<Uint8Array>`).

### `class CarJoiner`

Join together split CAR files into a single big CAR.

Import in the browser:

```js
import { CarJoiner } from 'https://cdn.skypack.dev/carbites'
```

Import in Node.js:

```js
import { CarJoiner } from 'carbites'
```

#### `constructor(cars: Iterable<AsyncIterable<Uint8Array>>)`

Create a new `CarJoiner`  for joining the passed CAR files together.

#### `car(): AsyncGenerator<Uint8Array>`

Join the CAR files together and return the joined CAR.

### `class RootedCarSplitter`

Split a CAR file into several smaller CAR files ensuring every CAR file contains a single root node.

Some CAR implementations require a single root CID in the header of a CAR file. When reading/extracting data from the CARs, the root node should be discarded.

Import in the browser:

```js
import { RootedCarSplitter } from 'https://cdn.skypack.dev/carbites/rooted'
```

Import in Node.js:

```js
import { RootedCarSplitter } from 'carbites/rooted'
```

The API is the same as for [`CarSplitter`](#class-carsplitter).

#### Root Node Format

The root node is a `dag-cbor` node that is a tuple of the string `/carbites/1`, an array of root CIDs (only seen in first CAR) and an array of block CIDs (all the blocks in the CAR). e.g. `['/carbites/1', ['bafkroot'], ['bafy1', 'bafy2']]`.

Note: The root node is limited to 4MB in size (the largest message IPFS will bitswap). Depending on the settings used to construct the DAG in the CAR, this may mean a split CAR size limit of around 30GiB.

### `class RootedCarJoiner`

Join together CAR files that were split using [`RootedCarSplitter`](#class-rootedcarsplitter).

The API is the same as for [`CarJoiner`](#class-carjoiner).

## Contribute

Feel free to dive in! [Open an issue](https://github.com/alanshaw/carbites/issues/new) or submit PRs.

## License

Dual-licensed under [MIT](https://github.com/alanshaw/carbites/blob/main/LICENSE-MIT) + [Apache 2.0](https://github.com/alanshaw/carbites/blob/main/LICENSE-APACHE)
