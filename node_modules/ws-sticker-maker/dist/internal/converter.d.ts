/// <reference types="node" />
import { IStickerOptions } from '../interfaces/types';
export default class converter {
    private options;
    private convertOptions;
    constructor(options: IStickerOptions);
    build(): Promise<Buffer>;
}
