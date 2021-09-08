import { getSnakeCase, getExtension } from "./utils";

export function getUrl() {
    return window.location.href.toString()
}

export function getMemory() {
    const memory = window.performance["memory"];
    return {
        memory_heap_limit: memory ? memory.jsHeapSizeLimit : undefined,
        memory_heap_total: memory ? memory.totalJSHeapSize : undefined,
        memory_heap_used: memory ? memory.usedJSHeapSize : undefined,
    };
}


export function getResources() {
    const resources = performance.getEntriesByType("resource");
    const result = {};
    const keys = ["duration", "encodedBodySize", "decodedBodySize"];

    for (const resource of resources) {
        result[`resource_count`] = result[`resource_count`] || 0 + 1;
        for (const key of keys) {
            const resourceKey = `resource_${getSnakeCase(key)}_total`;
            result[resourceKey] = result[resourceKey] || 0 + resource[key];

            const ext = getExtension(resource.name);
            if (ext && resource[key]) {
                const resourceKeyExt = `resource_${getSnakeCase(key)}_${getExtension(
                    resource.name
                )}`;
                result[resourceKeyExt] =
                    result[resourceKeyExt] || Math.round(0 + resource[key]);
            }
        }
    }

    return result;
}

export function getPageLoadDuration() {
    return (
        window.performance.timing.domContentLoadedEventEnd -
        window.performance.timing.navigationStart
    );
}


export function getOS() {
    const userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
        windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
        iosPlatforms = ["iPhone", "iPad", "iPod"];
    let os: "macos" | "ios" | "windows" | "android" | "linux" | "other" = "other";

    if (macosPlatforms.indexOf(platform) !== -1) {
        os = "macos";
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = "ios";
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = "windows";
    } else if (/Android/.test(userAgent)) {
        os = "android";
    } else if (!os && /Linux/.test(platform)) {
        os = "linux";
    }

    return os;
}

export function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "tablet";
    }
    if (
        /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
            ua
        )
    ) {
        return "mobile";
    }
    return "desktop";
}

export function getBrowser() {
    const test = (regexp) => regexp.test(window.navigator.userAgent);
    if (test(/edg/i)) return "edge";
    if (test(/trident/i)) return "msie";
    if (test(/chrome|chromium|crios/i)) return "chrome";
    if (test(/safari/i)) return "safari";
    if (/firefox|fxios/i) return "firefox";
    if (test(/opr\//i)) return "opera";
    if (test(/samsungbrowser/i)) return "samsung";
    return "other";
}

