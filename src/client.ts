import { Pulse } from "./index";

console.log("test")

window["Pulse"] = (scope: string, source: string) => {
  return new Pulse(scope, source, `https://beat.dev/${scope}`);
};
