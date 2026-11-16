import { describe, expect, it } from "vitest";
import { cleanNumber } from "@/components/sugarapp/shared";
describe("leading zero", () => {
  it("cleared field stays empty", () => expect(cleanNumber("")).toBe(""));
  it("09000 becomes 9000", () => expect(cleanNumber("09000")).toBe("9000"));
});
