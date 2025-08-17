"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const pino = require("pino");
exports.log = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    }
});
//# sourceMappingURL=logger.js.map