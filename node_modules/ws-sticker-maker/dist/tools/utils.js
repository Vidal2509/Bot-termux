"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlyEmojis = exports.generateStickerID = exports.getFileType = void 0;
const crypto_1 = require("crypto");
const file_type_1 = require("file-type");
const getFileType = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const type = Buffer.isBuffer(data)
        ? yield (0, file_type_1.fromBuffer)(data)
        : yield (0, file_type_1.fromFile)(data).catch(() => {
            return null;
        });
    if (!type) {
        throw new Error('Invalid file type');
    }
    return type;
});
exports.getFileType = getFileType;
const generateStickerID = () => (0, crypto_1.randomBytes)(32).toString('hex');
exports.generateStickerID = generateStickerID;
const onlyEmojis = (array) => {
    const regex = /\p{Emoji}/u;
    return array.filter(x => x.match(regex));
};
exports.onlyEmojis = onlyEmojis;
