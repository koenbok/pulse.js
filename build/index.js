(() => {
  // src/log.ts
  var LOG;
  try {
    LOG = localStorage.getItem("BEAT_LOG");
  } catch (error) {
  }
  function log(...args) {
    if (document.location.hostname === "localhost" || LOG) {
      console.log(...args);
    }
  }

  // src/utils.ts
  function getSnakeCase(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
  function getExtension(str) {
    const fileExtensionPattern = /\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gim;
    const match = str.match(fileExtensionPattern);
    if (!match)
      return;
    const ext = match[0].replace(".", "");
    if (Number(ext).toString() === ext)
      return;
    return ext;
  }
  async function post(url, data = {}) {
    log("post", url, data);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
  function debounce(debounce2, max, f) {
    let time, timer;
    function reset() {
      if (timer)
        clearTimeout(timer);
      timer = time = void 0;
    }
    function set2() {
      reset();
      time = Date.now();
      timer = setTimeout(() => {
        f();
        reset();
      }, max);
    }
    return () => {
      if (!time || Date.now() - time < debounce2) {
        set2();
      }
    };
  }
  function getRandomString(n, chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {
    let result = "";
    for (var i = 0; i < n; i++) {
      const index = Math.floor(Math.random() * chars.length);
      result += chars.substring(index, index + 1);
    }
    return result;
  }

  // src/platform.ts
  function getUrl() {
    return window.location.href.toString();
  }
  function getMemory() {
    const memory = window.performance["memory"];
    return {
      memory_heap_limit: memory ? memory.jsHeapSizeLimit : void 0,
      memory_heap_total: memory ? memory.totalJSHeapSize : void 0,
      memory_heap_used: memory ? memory.usedJSHeapSize : void 0
    };
  }
  function getResources() {
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
          const resourceKeyExt = `resource_${getSnakeCase(key)}_${getExtension(resource.name)}`;
          result[resourceKeyExt] = result[resourceKeyExt] || Math.round(0 + resource[key]);
        }
      }
    }
    return result;
  }
  function getPageLoadDuration() {
    return window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
  }
  function getOS() {
    const userAgent = window.navigator.userAgent, platform = window.navigator.platform, macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"], windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"], iosPlatforms = ["iPhone", "iPad", "iPod"];
    let os = "other";
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
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "tablet";
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return "mobile";
    }
    return "desktop";
  }
  function getBrowser() {
    const test = (regexp) => regexp.test(window.navigator.userAgent);
    if (test(/edg/i))
      return "edge";
    if (test(/trident/i))
      return "msie";
    if (test(/chrome|chromium|crios/i))
      return "chrome";
    if (test(/safari/i))
      return "safari";
    if (/firefox|fxios/i)
      return "firefox";
    if (test(/opr\//i))
      return "opera";
    if (test(/samsungbrowser/i))
      return "samsung";
    return "other";
  }

  // src/store.ts
  function get(key) {
    try {
      return JSON.parse(window.localStorage.getItem(key));
    } catch (error) {
      return;
    }
  }
  function set(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
  function remove(key) {
    window.localStorage.removeItem(key);
  }

  // src/index.ts
  var Pulse = class {
    constructor(scope, source, url = "") {
      this.context = {};
      this.schedule = debounce(300, 3e3, () => {
        this.flush();
      });
      this.flush = async () => {
        log("flush", this.key);
        const current = get(this.key);
        log("current", current);
        if (!current)
          return;
        remove(this.key);
        const payload = current.map((item) => {
          const [event, data] = item;
          const context = {
            source: this.source,
            url: getUrl(),
            cookie: getCookieValue(),
            user_id: this.userId
          };
          return { event, context, data };
        });
        const result = await post(this.url, payload);
        log(result);
      };
      this.scope = scope;
      this.source = source;
      this.url = url;
      if (window)
        setupBrowser(this);
    }
    record(event, data = {}) {
      data = { ...data, ...this.context };
      log("record", event, data);
      const current = get(this.key);
      set(this.key, Array.isArray(current) ? [[event, data], ...current] : [[event, data]]);
      this.schedule();
    }
    get key() {
      return this.scope;
    }
    setContext(context) {
      this.context = { ...context, ...this.context };
    }
    setUserId(userId) {
      this.userId = userId;
    }
  };
  function setupBrowser(pulse) {
    pulse.setContext({
      os: getOS(),
      device: getDeviceType(),
      browser: getBrowser(),
      ua: navigator.userAgent
    });
    setupPageLoadEvent(pulse);
    setupHeartbeatEvent(pulse);
  }
  function setupPageLoadEvent(pulse) {
    log("setupPageLoadEvent", document.readyState);
    const recordPageLoadEvent = () => {
      log("recordPageLoadEvent");
      pulse.record("page_load", {
        referrer: document.referrer,
        duration: getPageLoadDuration(),
        ...getResources()
      });
    };
    document.readyState === "complete" ? recordPageLoadEvent() : window.addEventListener("load", recordPageLoadEvent);
  }
  function setupHeartbeatEvent(pulse, seconds = 60) {
    const isUserActive = getUserActiveTracker(10 * 1e3);
    const isDocumentForeground = getDocumentForegroundTracker();
    const activeInterval = 1;
    let activeSeconds = 0;
    let activeSecondsPrevious = 0;
    setInterval(() => {
      if (isUserActive())
        activeSeconds += activeInterval;
    }, activeInterval * 1e3);
    setInterval(() => {
      pulse.record("heartbeat", {
        document_hidden: document.hidden,
        document_foreground: isDocumentForeground(),
        document_element_count: document.getElementsByTagName("*").length,
        user_active_seconds: activeSeconds - activeSecondsPrevious,
        user_active_total_seconds: activeSeconds,
        ...getMemory()
      });
      activeSecondsPrevious = activeSeconds;
    }, seconds * 1e3);
  }
  var setCookie = (name, value, days = 7, path = "/") => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const v = encodeURIComponent(value);
    document.cookie = `${name}=${v}; expires=${expires}; path=${path}`;
  };
  var getCookie = (name) => {
    return document.cookie.split("; ").reduce((r, v) => {
      const [k, val] = v.split("=");
      return k === name ? decodeURIComponent(val) : r;
    }, "");
  };
  function getUserActiveTracker(timeout = 1e3 * 10) {
    let active = false;
    let activeTimeout;
    const setUserActive = () => {
      if (active)
        return;
      log("active: true");
      active = true;
      clearTimeout(activeTimeout);
      activeTimeout = setTimeout(setUserInactive, timeout);
    };
    const setUserInactive = () => {
      if (!active)
        return;
      log("active: false");
      active = false;
    };
    const activeEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll"
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
  function getCookieValue() {
    const key = "pulse";
    let value = getCookie(key);
    if (!value) {
      value = getRandomString(32);
      setCookie(key, value);
    }
    return value;
  }

  // src/client.ts
  window["Pulse"] = (scope, source) => {
    return new Pulse(scope, source, `https://beat.dev/${scope}`);
  };
})();
