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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = __importDefault(require("validator"));
const exif_1 = __importDefault(require("./metadata/exif"));
const imageToWebp_1 = __importDefault(require("./imageToWebp"));
const utils_1 = require("../tools/utils");
const downloadImage_1 = __importDefault(require("./downloadImage"));
class converter {
    constructor(options) {
        this.options = options;
        this.convertOptions = Object.assign({}, options);
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.options.image)
                throw new Error('File not found');
            if (!Buffer.isBuffer(this.options.image)) {
                this.options.image = validator_1.default.isURL(this.options.image)
                    ? (this.options.image = yield (0, downloadImage_1.default)(this.options.image))
                    : this.options.image;
            }
            const { ext, mime } = yield (0, utils_1.getFileType)(this.options.image);
            this.convertOptions.ext = ext;
            this.convertOptions.fileMimeType = mime;
            this.convertOptions.isAnimated = [
                'video',
                'webp',
                'gif',
                'webm',
                'mp4'
            ].includes(ext);
            const bufferWebp = yield (0, imageToWebp_1.default)(this.convertOptions);
            const { author, pack, categories, id } = this.options;
            const sticker = yield new exif_1.default({ author, categories, id, pack }).add(bufferWebp);
            return sticker;
        });
    }
}
exports.default = converter;
