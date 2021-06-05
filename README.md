# carbites

[![dependencies Status](https://status.david-dm.org/gh/alanshaw/carbites.svg)](https://david-dm.org/alanshaw/carbites)

Chunking for CAR files. Split a single CAR into multiple CARs.

## Install

```sh
npm install carbites
```

## Usage

```js
import { CarBiter } from 'carbites'
import { CarReader } from '@ipld/car/reader'
import fs from 'fs'

const bigCar = fs.createReadStream('/path/to/big.car')
const reader = await CarReader.fromIterable(bigCar)
const targetSize = 1024 * 1024 * 100 // chunk to ~100MB CARs
const chunker = new CarBiter(reader, targetSize)

for await (const car of chunker.cars()) {
  // Each `car` is an AsyncIterable<Uint8Array>
  // ⚠️ Note: only the first CAR output has roots in the header!
}
```

Some CAR implementations require a **single root CID in the header** of a CAR file. To generate a root node for each split CAR, use the `RootedCarBiter` constructor. When reading/extracting data from the CARs, the root node should be discarded.

```js
import { RootedCarBiter } from 'carbites'
import { CarReader } from '@ipld/car/reader'
import * as dagCbor from '@ipld/dag-cbor'
import fs from 'fs'

const bigCar = fs.createReadStream('/path/to/big.car')
const reader = await CarReader.fromIterable(bigCar)
const targetSize = 1024 * 1024 * 100 // chunk to ~100MB CARs
const chunker = new RootedCarBiter(reader, targetSize)

const cars = chunker.cars()

// Every CAR has a single root - a CBOR node that is an tuple of `/carbites/1`
// and an array of CIDs. e.g. ['/carbites/1', ['bafy1', 'bafy2']]

const { done, value: car } = await cars.next()
const reader = await CarReader.fromIterable(car)
const rootCids = await reader.getRoots()
const rootNode = dagCbor.decode(await reader.get(rootCids[0]))

console.log(rootNode[0]) // /carbites/1
console.log(rootNode[1])
/*
[
  CID(bafyreihcsxqhd6agqpboc3wrlvpy5bwuxctv5upicdnt3u2wojv4exxl24),
  CID(bafyreiasq7d2ihbqm5xvhjjzlmzsensuadrpmpt2tkjsuwq42xpa34qevu),
  CID(bafyreibg623uhbcz4iudzplvftdn3ewrezyhlddpnjsjt5jzhc3qpaiyd4)
]
*/
```

## Contribute

Feel free to dive in! [Open an issue](https://github.com/alanshaw/carbites/issues/new) or submit PRs.

# License

Dual-licensed under [MIT](https://github.com/alanshaw/carbites/blob/main/LICENSE-MIT) + [Apache 2.0](https://github.com/alanshaw/carbites/blob/main/LICENSE-APACHE)
