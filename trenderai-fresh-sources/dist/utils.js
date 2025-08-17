"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.http = void 0;
exports.getJson = getJson;
exports.floorToMinute = floorToMinute;
exports.safe = safe;
const axios_1 = __importDefault(require("axios"));
const p_retry_1 = __importDefault(require("p-retry"));
exports.http = axios_1.default.create({
    timeout: 15000,
    headers: { "User-Agent": "trenderai-fresh/1.0" }
});
async function getJson(url, config = {}) {
    return (0, p_retry_1.default)(async () => {
        const res = await exports.http.get(url, config);
        return res.data;
    }, { retries: 3 });
}
function floorToMinute(d = new Date()) {
    const ms = d.getTime();
    return new Date(ms - (ms % 60000));
}
function safe(fn, label) {
    return fn().catch((e) => {
        console.error(`[${label}]`, e?.response?.status, e?.response?.data || e?.message);
        return null;
    });
}
//# sourceMappingURL=utils.js.map