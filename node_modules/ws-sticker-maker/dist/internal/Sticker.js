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
exports.createSticker = exports.Sticker = void 0;
const stickertTypes_1 = require("./metadata/stickertTypes");
const fs_extra_1 = require("fs-extra");
const converter_1 = __importDefault(require("./converter"));
class Sticker {
    constructor(options) {
        this.build = () => __awaiter(this, void 0, void 0, function* () {
            if (this.sticker)
                return this.sticker;
            this.sticker = yield new converter_1.default(this.Metadata).build();
            return this.sticker;
        });
        this.toBuffer = () => __awaiter(this, void 0, void 0, function* () {
            if (this.sticker)
                return this.sticker;
            return yield this.build();
        });
        this.toFile = (path) => __awaiter(this, void 0, void 0, function* () {
            if (!this.sticker)
                yield this.build();
            const filePath = path || this.defaultFileName;
            return (0, fs_extra_1.writeFile)(filePath, this.sticker);
        });
        this.toMessage = () => __awaiter(this, void 0, void 0, function* () {
            if (!this.sticker)
                yield this.build();
            return { sticker: this.sticker };
        });
        if (typeof options === 'string' || options instanceof Buffer) {
            options = { image: options };
        }
        const defaults = {
            id: '',
            image: '',
            author: '',
            pack: '',
            quality: 50,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
            fps: 10,
            loop: 0,
            type: 'default',
            categories: [],
            effort: 0,
            size: 512,
            duration: 10,
            fileSize: 800000
        };
        this.Metadata = Object.assign(Object.assign({}, defaults), options);
        this.Metadata.type = Object.values(stickertTypes_1.StickerTypes).includes(this.Metadata.type)
            ? this.Metadata.type
            : 'default';
        return this;
    }
    setAuthor(author) {
        this.Metadata.author = author;
        return this;
    }
    setPack(pack) {
        this.Metadata.pack = pack;
        return this;
    }
    setId(id) {
        this.Metadata.id = id;
        return this;
    }
    setImage(image) {
        this.Metadata.image = image;
        return this;
    }
    setBackground(background) {
        this.Metadata.background = background;
        return this;
    }
    setQuality(quality) {
        this.Metadata.quality = quality;
        return this;
    }
    setFps(fps) {
        this.Metadata.fps = fps;
        return this;
    }
    setLoop(loop) {
        this.Metadata.loop = loop;
        return this;
    }
    setType(type) {
        this.Metadata.type = Object.values(stickertTypes_1.StickerTypes).includes(type)
            ? type
            : 'default';
        return this;
    }
    setCategories(categories) {
        this.Metadata.categories = categories;
        return this;
    }
    setEffort(effort) {
        this.Metadata.effort = effort;
        return this;
    }
    setSize(size) {
        this.Metadata.size = size;
        return this;
    }
    setDuration(duration) {
        this.Metadata.duration = duration;
        return this;
    }
    setFileSize(fileSize) {
        this.Metadata.fileSize = fileSize;
        return this;
    }
    get defaultFileName() {
        var _a, _b;
        return `./${((_a = this.Metadata) === null || _a === void 0 ? void 0 : _a.pack) || 'sticker'}-${((_b = this.Metadata) === null || _b === void 0 ? void 0 : _b.author) || 'WSM'}.webp`;
    }
}
exports.Sticker = Sticker;
const createSticker = (image, ...args) => __awaiter(void 0, void 0, void 0, function* () {
    return new Sticker(Object.assign({ image }, args)).build();
});
exports.createSticker = createSticker;
