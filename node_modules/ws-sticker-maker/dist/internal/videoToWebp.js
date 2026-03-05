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
const os_1 = require("os");
const fs_extra_1 = require("fs-extra");
const ffmpeg_1 = require("@ffmpeg-installer/ffmpeg");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.path);
const videoToWebp = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { image, fps, size, duration, fileSize, loop, crop } = options;
    const filter = crop
        ? [`crop=w='min(min(iw\,ih)\,512)':h='min(min(iw\,ih)\,512)'`]
        : [`scale=${size}:-1`];
    let file = image;
    const isBuffer = Buffer.isBuffer(file);
    if (isBuffer) {
        const tempFile = (0, os_1.tmpdir)() + '/' + Date.now() + '.video';
        (0, fs_extra_1.writeFileSync)(tempFile, file);
        file = tempFile;
    }
    const dir = `${(0, os_1.tmpdir)()}/${Date.now()}.webp`;
    yield new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(file)
            .noAudio()
            .fps(fps || 16)
            .size((size || '512') + 'x?')
            .keepDAR()
            .duration(duration || 10)
            .videoCodec('libwebp')
            //.videoFilter([`scale=${size}:-1`])
            .videoFilters(filter)
            .outputOptions(['-fs', `${fileSize}`, '-loop', `${loop}`])
            .format('webp')
            .output(dir)
            .on('end', () => {
            resolve(dir);
        })
            .on('error', e => {
            console.log(e);
            reject(e);
        })
            .run();
    });
    const media = (0, fs_extra_1.readFileSync)(dir);
    (0, fs_extra_1.unlinkSync)(dir);
    if (isBuffer)
        (0, fs_extra_1.unlinkSync)(file);
    return media;
});
exports.default = videoToWebp;
