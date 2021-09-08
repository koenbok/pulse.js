import { getExtension } from "./utils";

test("", () => {
  expect(getExtension("lala.html")).toBe("html");
  expect(getExtension("http://www.koen.com/lala.html")).toBe("html");
  expect(getExtension("http://www.koen.com/lala.html?eee")).toBe("html");
  expect(getExtension("http://www.koen.com/lala.h")).toBe("h");
  expect(getExtension("http://www.koen.com/lala.1")).toBeUndefined();
  expect(getExtension("http://www.koen.com/lala.123")).toBeUndefined();
  expect(getExtension("http://www.koen.com/lala.1d")).toBe("1d");
  expect(getExtension("http://www.koen.com/lala.jpeg")).toBe("jpeg");
});
