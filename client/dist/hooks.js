"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTranslation = useTranslation;
exports.useLocale = useLocale;
exports.useTranslationLoading = useTranslationLoading;
exports.useTranslationError = useTranslationError;
const context_1 = require("./context");
/**
 * 使用翻译钩子
 * @param namespace 命名空间
 * @returns 翻译函数和语言设置
 */
function useTranslation(namespace) {
    const context = (0, context_1.useTranslationContext)();
    // 如果没有提供命名空间，直接返回上下文
    if (!namespace) {
        return context;
    }
    // 创建一个新的翻译函数，默认使用指定的命名空间
    const t = (key, params, ns) => {
        return context.t(key, params, ns || namespace);
    };
    return {
        ...context,
        t,
    };
}
/**
 * 使用语言钩子
 * @returns 当前语言和设置语言的函数
 */
function useLocale() {
    const { locale, setLocale } = (0, context_1.useTranslationContext)();
    return { locale, setLocale };
}
/**
 * 使用加载状态钩子
 * @returns 加载状态
 */
function useTranslationLoading() {
    const { isLoading } = (0, context_1.useTranslationContext)();
    return isLoading;
}
/**
 * 使用错误状态钩子
 * @returns 错误状态
 */
function useTranslationError() {
    const { error } = (0, context_1.useTranslationContext)();
    return error;
}
//# sourceMappingURL=hooks.js.map