"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTranslationError = exports.useTranslationLoading = exports.useLocale = exports.useTranslation = exports.useTranslationContext = exports.TranslationProvider = exports.TranslationClient = void 0;
// 导出类型
__exportStar(require("./types"), exports);
// 导出客户端
var client_1 = require("./client");
Object.defineProperty(exports, "TranslationClient", { enumerable: true, get: function () { return client_1.TranslationClient; } });
// 导出上下文
var context_1 = require("./context");
Object.defineProperty(exports, "TranslationProvider", { enumerable: true, get: function () { return context_1.TranslationProvider; } });
Object.defineProperty(exports, "useTranslationContext", { enumerable: true, get: function () { return context_1.useTranslationContext; } });
// 导出钩子
var hooks_1 = require("./hooks");
Object.defineProperty(exports, "useTranslation", { enumerable: true, get: function () { return hooks_1.useTranslation; } });
Object.defineProperty(exports, "useLocale", { enumerable: true, get: function () { return hooks_1.useLocale; } });
Object.defineProperty(exports, "useTranslationLoading", { enumerable: true, get: function () { return hooks_1.useTranslationLoading; } });
Object.defineProperty(exports, "useTranslationError", { enumerable: true, get: function () { return hooks_1.useTranslationError; } });
//# sourceMappingURL=index.js.map