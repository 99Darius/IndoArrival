// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { isReplayable, isSubmitControl, replayLearned, type FieldMap, type LearnedField } from "./formFill";

const map: FieldMap = {
  neverAutoSubmit: true,
  submitButtonText: ["Kirim", "Submit"],
  nextButtonText: ["Lanjut", "Next"],
  steps: [],
};

beforeEach(() => {
  document.body.innerHTML = `
    <input id="spi_full_name_1782107186388" />
    <input id="spi_passport_no_1782107186388" />
    <button id="next">Lanjut</button>
  `;
});

describe("isSubmitControl", () => {
  it("identifies submit/next buttons", () => {
    const btn = document.querySelector("#next")!;
    expect(isSubmitControl(btn, map)).toBe(true);
  });
  it("passes normal inputs", () => {
    const inp = document.querySelector("#spi_full_name_1782107186388")!;
    expect(isSubmitControl(inp, map)).toBe(false);
  });
});

describe("isReplayable", () => {
  const f = (o: Partial<LearnedField>): LearnedField => ({ selector: "#x", control: "text", value: "v", step: "/s", ...o });
  it("drops the dropdown search box, captcha and unchosen dropdowns", () => {
    expect(isReplayable(f({ selector: '[placeholder="Search"]', label: "Search" }))).toBe(false);
    expect(isReplayable(f({ selector: '[placeholder="Enter the captcha"]' }))).toBe(false);
    expect(isReplayable(f({ control: "dropdown", value: "Select Passport/Country/Region" }))).toBe(false);
    expect(isReplayable(f({ control: "dropdown", value: "Pilih Paspor/Negara/Wilayah" }))).toBe(false);
  });
  it("keeps real answers", () => {
    expect(isReplayable(f({ control: "dropdown", value: "SINGAPORE" }))).toBe(true);
    expect(isReplayable(f({ control: "dropdown", selector: null, value: "FEMALE" }))).toBe(true);
  });
});

describe("replayLearned choices", () => {
  it("picks the same option whichever language the site is in", async () => {
    history.replaceState({}, "", "/");
    document.body.innerHTML = `
      <div><p>Jenis Kelamin</p><div id="spi_gender_1"><div><input readonly value="LAKI-LAKI"></div><div><input readonly value="PEREMPUAN"></div></div></div>`;
    let clicked = "";
    document.querySelectorAll("input").forEach((i) => i.addEventListener("click", () => (clicked = i.value)));
    const r = await replayLearned([{ selector: null, control: "dropdown", value: "FEMALE", step: "/" }], map);
    expect(clicked).toBe("PEREMPUAN");
    expect(r.filled).toHaveLength(1);
  });
});

describe("later-page replay", () => {
  beforeEach(() => { history.replaceState({}, "", "/arrival-card-submission/travel-details"); });
  it("fills a search-disabled arrival dropdown and a newly mounted permit number", async () => {
    document.body.innerHTML = `<div id="arrival"><label for="std_arrival_date_foreigner_individual">Arrival Date to Indonesia</label><input id="std_arrival_date_foreigner_individual" value="Select" readonly></div>
      <input id="std_departure_date_foreigner_individual" placeholder="DD/MM/YYYY">
      <div><p>Do you already have a Visa or Stay Permit?</p><div id="std_do_have_visa_kitas_kitap_foreigner_individual"><div><input readonly value="YES"></div><div><input readonly value="NO"></div></div></div>
      <button id="next">Next</button><button id="submit">Submit</button>`;
    let navClicks = 0;
    document.querySelectorAll("button").forEach(b => b.addEventListener("click", () => navClicks++));
    const arrival = document.querySelector<HTMLInputElement>("#std_arrival_date_foreigner_individual")!;
    const label = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(new Date()).toUpperCase();
    arrival.addEventListener("click", () => {
      const list = document.createElement("div"); list.dataset.testid = "virtuoso-item-list";
      list.innerHTML = `<div><div>${label}</div></div>`;
      list.querySelector("div div")!.addEventListener("click", () => { arrival.value = label; list.remove(); });
      document.querySelector("#arrival")!.append(list);
    });
    document.querySelector<HTMLInputElement>("#std_do_have_visa_kitas_kitap_foreigner_individual input")!.addEventListener("click", () => {
      const input = document.createElement("input"); input.id = "std_visa_kitas_kitap_no_foreigner_individual"; document.body.append(input);
    });
    const path = location.pathname;
    const result = await replayLearned([
      { selector: "#std_do_have_visa_kitas_kitap_foreigner_individual", control: "choice", value: "YES", step: path, index: 0 },
      { selector: "#std_visa_kitas_kitap_no_foreigner_individual", control: "text", value: "TEST-KITAS-123", step: path },
    ], map);
    expect(result.filled).toHaveLength(4);
    expect(arrival.value).toBe(label);
    expect((document.querySelector("#std_visa_kitas_kitap_no_foreigner_individual") as HTMLInputElement).value).toBe("TEST-KITAS-123");
    expect((document.querySelector("#std_departure_date_foreigner_individual") as HTMLInputElement).value).not.toBe("");
    expect(navClicks).toBe(0);
  });
  it("waits for a loading port dropdown, then selects the recorded async search result", async () => {
    history.replaceState({}, "", "/arrival-card-submission/mode-of-transport");
    document.body.innerHTML = '<div id="port"><input id="smta_place_of_arrival_air_foreigner" readonly value="Select port"></div>';
    const port = document.querySelector<HTMLInputElement>("input")!;
    let ready = false;
    setTimeout(() => { ready = true; }, 250);
    port.addEventListener("click", () => {
      if (!ready) return;
      const search = document.createElement("input"); search.placeholder = "Search";
      const list = document.createElement("div"); list.dataset.testid = "virtuoso-item-list";
      search.addEventListener("input", () => { setTimeout(() => {
        list.innerHTML = '<div><div>SOEKARNO-HATTA (CGK)</div></div>';
        list.querySelector("div div")!.addEventListener("click", () => { port.value = "SOEKARNO-HATTA (CGK)"; search.remove(); list.remove(); });
      }, 100); });
      document.querySelector("#port")!.append(search, list);
      list.innerHTML = '<div><div>Loading</div></div>';
    });
    const r = await replayLearned([{ selector: "#smta_place_of_arrival_air_foreigner", control: "dropdown", value: "SOEKARNO-HATTA (CGK)", step: location.pathname }], map);
    expect(r.filled).toHaveLength(1);
    expect(port.value).toBe("SOEKARNO-HATTA (CGK)");
  });
  it("fills baggage 0 and learned declaration answers, but leaves the certify tick for the human", async () => {
    history.replaceState({}, "", "/arrival-card-submission/declaration");
    document.body.innerHTML = '<input id="asd_total_baggage_individual"><input id="goods" type="radio" value="NO"><input id="certify" type="checkbox"><button>Submit</button>';
    const r = await replayLearned([
      { selector: "#goods", control: "radio", value: "NO", step: location.pathname },
      { selector: "#certify", control: "checkbox", value: "on", step: location.pathname },
    ], map);
    expect(r.filled).toHaveLength(2);
    expect((document.querySelector("#asd_total_baggage_individual") as HTMLInputElement).value).toBe("0");
    expect((document.querySelector("#goods") as HTMLInputElement).checked).toBe(true);
    expect((document.querySelector("#certify") as HTMLInputElement).checked).toBe(false);
  });
  it("fills the declaration page's id-less yes/no questions and its tick box", async () => {
    history.replaceState({}, "", "/arrival-card-submission/declaration");
    const option = (v: string) => `<div><div><div></div></div><div></div><input readonly value="${v}"></div>`;
    document.body.innerHTML = `<div><p>Any symptoms?</p><div></div><div>${option("Yes")}${option("No")}</div></div>
      <div><p>Bringing animals?</p><div></div><div>${option("Yes")}${option("No")}</div></div>
      <div><div></div><div></div><p>I hereby certify</p></div>`;
    const clicked: string[] = [];
    document.querySelectorAll<HTMLInputElement>("input").forEach((i, n) => i.addEventListener("click", () => clicked.push(`${n}:${i.value}`)));
    const box = document.querySelector<HTMLElement>("div:has(> p:last-child) > div")!;
    const tick = [...document.querySelectorAll("p")].pop()!.parentElement!.firstElementChild as HTMLElement;
    tick.addEventListener("click", () => { tick.innerHTML = "<svg></svg>"; });
    const step = location.pathname;
    const r = await replayLearned([
      { selector: "@q:Bringing animals?", control: "choice", value: "No", step },
      { selector: "@q:I hereby certify", control: "tick", value: "checked", step },
    ], map);
    expect(r.filled).toHaveLength(2);
    expect(clicked).toEqual(["3:No"]);
    expect(tick.querySelector("svg")).not.toBeNull();
    expect(box).toBeTruthy();
  });
  it("replays native select and radio controls", async () => {
    document.body.innerHTML = '<select id="permit"><option value="">Select</option><option value="K">KITAP</option></select><input type="radio" name="hasPermit" value="N"><input type="radio" name="hasPermit" value="Y">';
    const r = await replayLearned([
      { selector: "#permit", control: "select", value: "K", step: location.pathname },
      { selector: '[name="hasPermit"]', control: "radio", value: "Y", step: location.pathname },
    ], map);
    expect(r.filled).toHaveLength(2);
    expect((document.querySelector("select") as HTMLSelectElement).value).toBe("K");
    expect((document.querySelectorAll("input")[1] as HTMLInputElement).checked).toBe(true);
  });
});
