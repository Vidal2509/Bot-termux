"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../tools/utils");
class RawMetadata {
    constructor(options) {
        this['sticker-pack-id'] = options.id || (0, utils_1.generateStickerID)();
        this['sticker-pack-name'] = options.pack || '';
        this['sticker-pack-publisher'] = options.author || '';
        this.emojis = options.categories || [];
    }
}
exports.default = RawMetadata;
