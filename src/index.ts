import { log } from "./log";
import {
  getOS,
  getDeviceType,
  getBrowser,
  getPageLoadDuration,
  getResources,
  getMemory,
  getUrl,
} from "./platform";
import * as store from "./store";
import { debounce, getRandomString, post } from "./utils";

type DataValueType = string | number | boolean | undefined;
type DataType = { [index: string]: DataValueType };

export class Pulse {
  private scope: string;
  private source: string;
  private url: string;
  private userId?: string;
  private context: DataType = {};

  constructor(scope: string, source: string, url = "") {
    this.scope = scope;
    this.source = source;
    this.url = url;

    // If we're running inside a browser we set everything up
    if (window) setupBrowser(this);
  }

  // Record an event with a type and data. Data can be number (metric), string (dimension) and boolean.
  record(event: string, data: DataType = {}) {
    data = { ...data, ...this.context };
    log("record", event, data);
    const current = store.get(this.key);
    store.set(
      this.key,
      Array.isArray(current) ? [[event, data], ...current] : [[event, data]]
    );

    this.schedule();
  }

  schedule = debounce(300, 3000, () => {
    this.flush();
  });

  flush = async () => {
    log("flush", this.key);
    const current = store.get(this.key);
    log("current", current);
    if (!current) return; // Nothing to flush

    // Remove everything that we flushed
    store.remove(this.key);

    // Prepare the events to send with the current context
    const payload = current.map((item) => {
      const [event, data] = item;
      const context = {
        source: this.source,
        url: getUrl(),
        cookie: getCookieValue(),
        user_id: this.userId,
      };

      return { event, context, data };
    });

    // Send the payload to the backend
    const result = await post(this.url, payload);

    log(result);
  };

  get key() {
    return this.scope;
  }

  setContext(context: DataType) {
    this.context = { ...context, ...this.context };
  }

  setUserId(userId: string | undefined) {
    this.userId = userId;
  }
}

// The main browser setup function to add the default events
function setupBrowser(pulse: Pulse) {
  // Add the default context for every event
  pulse.setContext({
    os: getOS(),
    device: getDeviceType(),
    browser: getBrowser(),
    ua: navigator.userAgent,
  });

  // Add the default events
  setupPageLoadEvent(pulse);
  setupHeartbeatEvent(pulse);
}

function setupPageLoadEvent(pulse: Pulse) {
  log("setupPageLoadEvent", document.readyState);

  const recordPageLoadEvent = () => {
    log("recordPageLoadEvent");
    pulse.record("page_load", {
      referrer: document.referrer,
      duration: getPageLoadDuration(),
      ...getResources(),
    });
  };

  document.readyState === "complete"
    ? recordPageLoadEvent()
    : window.addEventListener("load", recordPageLoadEvent);
}

function setupHeartbeatEvent(pulse: Pulse, seconds = 60) {
  const isUserActive = getUserActiveTracker(10 * 1000);
  const isDocumentForeground = getDocumentForegroundTracker();
  // const fpsInfo = getDroppedFrameTracker();
  const activeInterval = 1;
  let activeSeconds = 0;
  let activeSecondsPrevious = 0;

  setInterval(() => {
    // Increase active seconds if user is active
    if (isUserActive()) activeSeconds += activeInterval;
  }, activeInterval * 1000);

  // setInterval(() => {
  //   const info = fpsInfo();
  //   console.log(info);
  //   console.log(`fps: ${(info.total / info.time) * 1000}`);
  // }, 3000);

  setInterval(() => {
    pulse.record("heartbeat", {
      document_hidden: document.hidden,
      document_foreground: isDocumentForeground(),
      document_element_count: document.getElementsByTagName("*").length,
      user_active_seconds: activeSeconds - activeSecondsPrevious, // Active seconds since last heartbeat
      user_active_total_seconds: activeSeconds, // Active seconds in total
      ...getMemory(),
    });

    activeSecondsPrevious = activeSeconds;
  }, seconds * 1000);
}

const setCookie = (name: string, value: string, days = 7, path = "/") => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const v = encodeURIComponent(value);
  document.cookie = `${name}=${v}; expires=${expires}; path=${path}`;
};

const getCookie = (name: string): string => {
  return document.cookie.split("; ").reduce((r, v) => {
    const [k, val] = v.split("=");
    return k === name ? decodeURIComponent(val) : r;
  }, "");
};

function getUserActiveTracker(timeout = 1000 * 10) {
  let active = false;
  let activeTimeout;

  const setUserActive = () => {
    if (active) return;
    log("active: true");
    active = true;
    clearTimeout(activeTimeout);
    activeTimeout = setTimeout(setUserInactive, timeout);
  };

  const setUserInactive = () => {
    if (!active) return;
    log("active: false");
    active = false;
  };

  // Todo: we should also add scroll events
  const activeEvents = [
    "mousemove",
    "mousedown",
    "keydown",
    "touchstart",
    "scroll",
  ];

  for (const event of activeEvents) {
    document.addEventListener(event, setUserActive);
  }

  return function isUserActive() {
    return active;
  };
}

function getDocumentForegroundTracker() {
  let foreground = !document.hidden;

  window.addEventListener("focus", () => {
    foreground = true;
  });

  window.addEventListener("blur", () => {
    foreground = false;
  });

  return function isForeground() {
    return foreground;
  };
}

// function getDroppedFrameTracker() {
//   const fps = (1 / 60) * 1000;
//   let time;

//   const frames = {
//     time: 0,
//     total: 0,
//     dropped: [],
//   };

//   const next = (t) => {
//     if (time) {
//       const delta = t - time;
//       frames.time += delta;
//       if (delta > fps * 1.1) {
//         console.log(
//           `Drop frame ${frames.total} with ${delta}ms foreground: ${document.hidden}`
//         );

//         frames.dropped.push(delta);
//       }
//     }
//     frames.total++;

//     time = t;
//     window.requestAnimationFrame(next);
//   };

//   window.requestAnimationFrame(next);

//   return function framesInfo() {
//     return frames;
//   };
// }

function getCookieValue() {
  const key = "pulse";
  let value = getCookie(key);
  if (!value) {
    value = getRandomString(32);
    setCookie(key, value);
  }
  return value;
}
