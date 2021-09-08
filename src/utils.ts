import { log } from "./log";

export function getSnakeCase(str: string) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function getExtension(str: string) {
    const fileExtensionPattern = /\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gim;
    const match = str.match(fileExtensionPattern);

    if (!match) return;
    const ext = match[0].replace(".", "");

    if (Number(ext).toString() === ext) return;

    return ext;
}

export async function post(url: string, data: any = {}) {
    log("post", url, data);
    const response = await fetch(url, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return response.json();
}

export function debounce(debounce: number, max: number, f: Function) {
    let time, timer;

    function reset() {
        if (timer) clearTimeout(timer);
        timer = time = undefined;
    }

    function set() {
        reset();
        time = Date.now();
        timer = setTimeout(() => {
            f();
            reset();
        }, max);
    }

    return () => {
        // Push the debounce timer forward
        if (!time || Date.now() - time < debounce) {
            set();
        }
    };
}

export function getRandomString(
    n: number,
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
) {
    let result = "";

    for (var i = 0; i < n; i++) {
        const index = Math.floor(Math.random() * chars.length);
        result += chars.substring(index, index + 1);
    }
    return result;
}
