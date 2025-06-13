"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./core"), exports);
tslib_1.__exportStar(require("./services"), exports);
tslib_1.__exportStar(require("./utils"), exports);
// Default export for CommonJS/ESM compatibility
const abdm_client_1 = require("./core/abdm-client");
exports.default = abdm_client_1.ABDMClient;
//# sourceMappingURL=index.js.map