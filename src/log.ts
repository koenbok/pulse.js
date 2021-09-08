// To enable logging set:
// localStorage.setItem("BEAT_LOG", "1")
// localStorage.removeItem("BEAT_LOG")
let LOG;

try {
    LOG = localStorage.getItem("BEAT_LOG");
} catch (error) { }

export function log(...args) {
    if (document.location.hostname === "localhost" || LOG) {
        console.log(...args);
    }
}