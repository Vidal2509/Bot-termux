/// <reference types="node" />
import { Background, Categories, IStickerOptions, Message } from '../interfaces/types';
import { StickerTypes } from './metadata/stickertTypes';
export declare class Sticker {
    private Metadata;
    private sticker;
    constructor(options?: IStickerOptions | string | Buffer);
    setAuthor(author: string): this;
    setPack(pack: string): this;
    setId(id: string): this;
    setImage(image: string | Buffer): this;
    setBackground(background: Background): this;
    setQuality(quality: number): this;
    setFps(fps: number): this;
    setLoop(loop: number): this;
    setType(type: StickerTypes | string): this;
    setCategories(categories: Categories[]): this;
    setEffort(effort: number): this;
    setSize(size: number): this;
    setDuration(duration: number): this;
    setFileSize(fileSize: number): this;
    get defaultFileName(): string;
    build: () => Promise<Buffer>;
    toBuffer: () => Promise<Buffer>;
    toFile: (path?: string) => Promise<void>;
    toMessage: () => Promise<Message>;
}
export declare const createSticker: (image: string | Buffer, options?: string | IStickerOptions | Buffer | undefined) => Promise<Buffer>;
