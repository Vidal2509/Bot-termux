/// <reference types="node" />
export declare const getFileType: (data: string | Buffer) => Promise<import("file-type/core").FileTypeResult>;
export declare const generateStickerID: () => string;
export declare const onlyEmojis: (array: string[]) => string[];
