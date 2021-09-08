import { Pulse } from "./index";

window["Pulse"] = (scope: string, source: string) => {
  return new Pulse(scope, source, `https://beat.dev/${scope}`);
};
