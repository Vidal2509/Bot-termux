/// <reference types="node" />
import { IstickerConfig } from '../../interfaces/types';
import { Image } from 'node-webpmux';
declare class Exif {
    private data;
    private exif;
    constructor(options: IstickerConfig);
    build: () => Buffer;
    add: (image: string | Buffer | Image) => Promise<Buffer>;
}
export default Exif;
