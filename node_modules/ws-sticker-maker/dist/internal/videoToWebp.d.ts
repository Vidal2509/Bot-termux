/// <reference types="node" />
import { VideoOptios } from '../interfaces/types';
declare const videoToWebp: (options: VideoOptios) => Promise<Buffer>;
export default videoToWebp;
