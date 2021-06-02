# carbites

[![dependencies Status](https://status.david-dm.org/gh/alanshaw/carbites.svg)](https://david-dm.org/alanshaw/carbites)

Chunking for CAR files. Split a single CAR into multiple CARs.

⚠️ v0.x uses naive algorithm and creates multi root CAR files.

## Install

```sh
npm install carbites
```

## Usage

```js
import { Carbites } from 'carbites'
import { CarReader } from '@ipld/car/reader'
import fs from 'fs'

const bigCar = fs.createReadStream('/path/to/big.car')
const reader = CarReader.fromIterable(bigCar)
const targetSize = 1024 * 1024 * 100 // chunk to ~100MB CARs
const chunker = new Carbites(reader, targetSize)

for await (const car of chunker.cars()) {
  // Each `car` is an AsyncIterable<Uint8Array>
}
```

## Contribute

Feel free to dive in! [Open an issue](https://github.com/alanshaw/carbites/issues/new) or submit PRs.

# License

Dual-licensed under [MIT](https://github.com/ipfs-shipyard/nft.storage/blob/main/LICENSE-MIT) + [Apache 2.0](https://github.com/ipfs-shipyard/nft.storage/blob/main/LICENSE-APACHE)
