import { IRawMetadata, Metadata } from '../../interfaces/types';
export default class RawMetadata implements IRawMetadata {
    emojis: string[];
    'sticker-pack-id': string;
    'sticker-pack-name': string;
    'sticker-pack-publisher': string;
    constructor(options: Metadata);
}
