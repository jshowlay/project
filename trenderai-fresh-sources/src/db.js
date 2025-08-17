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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initDb = initDb;
var pg_1 = require("pg");
var logger_1 = require("./logger");
exports.pool = new pg_1.Pool({ connectionString: process.env.PG_URL });
function initDb() {
    return __awaiter(this, void 0, void 0, function () {
        var sql;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sql = "\n  CREATE TABLE IF NOT EXISTS signals(\n    id BIGSERIAL PRIMARY KEY,\n    source TEXT NOT NULL,\n    entity_id TEXT NOT NULL,\n    entity_name TEXT,\n    topic TEXT,\n    metric TEXT NOT NULL,\n    value DOUBLE PRECISION NOT NULL,\n    unit TEXT,\n    \"window\" TEXT,\n    region TEXT,\n    url TEXT,\n    tags TEXT[],\n    raw JSONB,\n    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n    bucket_min TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', NOW())\n  );\n  CREATE UNIQUE INDEX IF NOT EXISTS ux_signals_src_ent_metric_win_bucket\n    ON signals(source, entity_id, metric, \"window\", bucket_min);\n  CREATE INDEX IF NOT EXISTS ix_signals_ts ON signals(captured_at DESC);\n  CREATE INDEX IF NOT EXISTS ix_signals_source_metric ON signals(source, metric);\n  ";
                    return [4 /*yield*/, exports.pool.query(sql)];
                case 1:
                    _a.sent();
                    logger_1.log.info("DB ready");
                    return [2 /*return*/];
            }
        });
    });
}
