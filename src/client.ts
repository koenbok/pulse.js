import { Pulse } from "./index";

if (window) {
  window["Pulse"] = (scope: string, source: string) => {
    return new Pulse(scope, source, `https://beat.dev/${scope}`);
  };
}

export { Pulse }


