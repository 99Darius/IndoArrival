import { describe, expect, it } from "vitest";
import { fromIndonesia, fromThailand, indonesiaItems, thailandItems } from "./commonAnswers";
import type { LearnedField } from "../content/formFill";
import type { Answer } from "../content/th/fields";

const P1 = "/arrival-card-submission/personal-information";
const indo = (selector: string | null, value: string, extra: Partial<LearnedField> = {}): LearnedField => ({ selector, control: "text", value, step: P1, ...extra });
const thai = (key: string, value: string): Answer => ({ key, kind: "text", value });

const fromIndo = [
  indo('[id^="spi_full_name_"]', "ALEX TAN"), indo('[id^="spi_passport_no_"]', "K0000000X"), indo('[id^="spi_dob_"]', "14/03/1988"),
  indo('[id^="spi_gender_"]', "PEREMPUAN", { control: "choice" }), indo('[id^="spi_mobile_no_"]', "91234567"),
  indo('[id^="spi_date_of_passport_expiry_"]', "01/01/2030"), indo('[id^="smta_flight_no_"]', "123"), indo("@q:Do you have symptoms?", "NO", { control: "choice" }),
];
const fromThai = [
  thai("familyName", "TAN"), thai("firstName", "ALEX"), thai("passportNo", "K0000000X"), thai("bdDateYear", "1988"), thai("bdDateMonth", "03"), thai("bdDateDay", "14"),
  thai("gender", "FEMALE"), thai("phoneNo", "91234567"), thai("flightNo", "SQ708"), thai("accAddress", "1 TEST ROAD"),
];

describe("common answers", () => {
  it("offers Indonesia's answers on Thailand's form, without splitting the name", () => {
    const items = thailandItems(fromIndonesia(fromIndo));
    expect(items.map((i) => [i.label, i.value])).toEqual([
      ["Passport number", "K0000000X"], ["Date of birth", "14/03/1988"], ["Gender", "FEMALE"], ["Phone number", "91234567"],
    ]);
    expect(items.flatMap((i) => i.answers.map((a) => [a.key, a.value]))).toEqual([
      ["passportNo", "K0000000X"], ["bdDateYear", "1988"], ["bdDateMonth", "03"], ["bdDateDay", "14"], ["gender", "FEMALE"], ["phoneNo", "91234567"],
    ]);
  });

  it("offers Thailand's answers on Indonesia's form, joining the name", () => {
    const items = indonesiaItems(fromThailand(fromThai));
    expect(items.map((i) => [i.label, i.value])).toEqual([
      ["Full name", "ALEX TAN"], ["Passport number", "K0000000X"], ["Date of birth", "14/03/1988"], ["Phone number", "91234567"],
    ]);
    expect(items.every((i) => i.answers.every((f) => f.step === P1 && f.selector?.startsWith("[id^=\"spi_")))).toBe(true);
  });

  it("never shares trip details, declarations or anything else outside the list", () => {
    const json = JSON.stringify([thailandItems(fromIndonesia(fromIndo)), indonesiaItems(fromThailand(fromThai))]);
    for (const secret of ["SQ708", "1 TEST ROAD", "symptoms", "smta_", "01/01/2030"]) expect(json).not.toContain(secret);
  });

  it("reads an old recording that kept only the gender's option text", () => {
    expect(fromIndonesia([indo(null, "LAKI-LAKI", { control: "dropdown" })]).gender).toBe("MALE");
  });

  it("skips what it can't be sure of", () => {
    expect(fromIndonesia([indo('[id^="spi_dob_"]', "not a date")]).birth).toBeUndefined();
    expect(fromThailand([thai("bdDateYear", "1988")]).birth).toBeUndefined();
    expect(fromThailand([thai("familyName", "TAN")]).fullName).toBeUndefined();
    expect(fromThailand([thai("gender", "UNDEFINED")]).gender).toBeUndefined();
  });
});
