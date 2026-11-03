// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fillStep } from "./fill";
import { readAnswer, type Answer } from "./fields";

const a = (key: string, kind: Answer["kind"], value: string, extra: Partial<Answer> = {}): Answer => ({ key, kind, value, ...extra });

beforeEach(() => {
  history.replaceState({}, "", "#/tac/arrival-card/add");
  vi.spyOn(Element.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
  document.body.innerHTML = `
  <div sit-validate-input="familyName"><input id="name"></div>
  <div sit-validate-input="gender"><mat-radio-group>
    <mat-radio-button><input id="m" type="radio" name="g"><label>MALE</label></mat-radio-button>
    <mat-radio-button><input id="f" type="radio" name="g"><label>FEMALE</label></mat-radio-button></mat-radio-group></div>
  <div sit-validate-input="occupation"><mat-select id="occ"><div class="mat-mdc-select-trigger"></div></mat-select></div>
  <div sit-validate-input="nationalityDesc"><sit-autocomplete><input type="hidden"><input id="nat"></sit-autocomplete></div>
  <div sit-validate-input="cityRes"><sit-autocomplete><input id="city"></sit-autocomplete></div>
  <div class="cdk-overlay-container"></div>
  <button id="next" type="submit">Continue</button>`;
});

const overlay = () => document.querySelector(".cdk-overlay-container")!;
const addOption = (text: string, onClick: () => void) => {
  const o = document.createElement("mat-option"); o.textContent = text; o.addEventListener("click", onClick); overlay().append(o);
};

describe("fill", () => {
  it("fills the step on screen by field kind, and never presses a button", async () => {
    const next = vi.fn(); document.querySelector("#next")!.addEventListener("click", next);
    const inputs: string[] = []; document.querySelector("#name")!.addEventListener("input", e => inputs.push((e.target as HTMLInputElement).value));
    const nat = document.querySelector<HTMLInputElement>("#nat")!;
    nat.addEventListener("input", () => { if (nat.value === "SINGAPORE") addOption(" SINGAPORE ", () => { nat.value = "SINGAPORE"; overlay().replaceChildren(); }); });
    const res = await fillStep([a("familyName", "text", "TAN"), a("gender", "radio", "FEMALE"), a("nationalityDesc", "auto", "SINGAPORE")]);
    expect(res.filled.length).toBe(3);
    expect(inputs).toEqual(["TAN"]);
    expect(document.querySelector<HTMLInputElement>("#f")!.checked).toBe(true);
    expect(document.activeElement).toBe(nat);
    expect(next).not.toHaveBeenCalled();
  });
  it("restores a box the traveller unticked, on a form that has it ticked", async () => {
    document.body.innerHTML = `<div sit-validate-input="arrDate"></div>
      <div sit-validate-input="notStayInTh"><mat-checkbox><input id="stay" type="checkbox" checked></mat-checkbox></div>`;
    const box = document.querySelector<HTMLInputElement>("#stay")!;
    await fillStep([a("notStayInTh", "check", "unchecked")]);
    expect(box.checked).toBe(false);
    expect(readAnswer("notStayInTh")?.value).toBe("unchecked");
    await fillStep([a("notStayInTh", "check", "checked")]);
    expect(box.checked).toBe(true);
    expect(readAnswer("notStayInTh")?.value).toBe("checked");
  });
  it("shares a repeat press for the same answers but refuses another traveller's", async () => {
    const alex = [a("familyName", "text", "TAN")];
    const first = fillStep(alex);
    const again = fillStep([a("familyName", "text", "TAN")]);
    await expect(fillStep([a("familyName", "text", "LIM")])).rejects.toThrow("Still filling");
    expect((await again).filled).toEqual((await first).filled);
    expect((document.querySelector("#name") as HTMLInputElement).value).toBe("TAN");
  });
  it("finds a radio by position when the site's language changed", async () => {
    await fillStep([a("gender", "radio", "หญิง", { index: 1 })]);
    expect(document.querySelector<HTMLInputElement>("#f")!.checked).toBe(true);
  });
  it("leaves an unmatched autocomplete empty for the human, but keeps free-text city", async () => {
    const res = await fillStep([a("nationalityDesc", "auto", "ATLANTIS"), a("cityRes", "suggest", "JURONG")]);
    expect(res.opened).toEqual(["nationalityDesc"]);
    expect(res.filled).toEqual(["cityRes"]);
    expect(document.querySelector<HTMLInputElement>("#nat")!.value).toBe("");
    expect(document.querySelector<HTMLInputElement>("#city")!.value).toBe("JURONG");
  }, 15000);
  it("refuses to run off the new-card form", async () => {
    history.replaceState({}, "", "#/tac/arrival-card/add/submitted/1");
    await expect(fillStep([a("familyName", "text", "TAN")])).rejects.toThrow();
    expect(document.querySelector<HTMLInputElement>("#name")!.value).toBe("");
  });
});

describe("health step", () => {
  const chip = (name: string) => `<mat-chip-row><span class="mdc-evolution-chip__text-label">${name}</span></mat-chip-row>`;
  beforeEach(() => {
    document.body.innerHTML = `
    <div sit-validate-input="ddcCountrys"><sit-chip-autocomplete><div id="chips">${chip("MALAYSIA")}</div><input id="ddc"></sit-chip-autocomplete></div>
    <fieldset sit-validate-input="symptomsIds">
      <mat-checkbox><input id="fever" type="checkbox" checked><label>FEVER</label></mat-checkbox>
      <mat-checkbox><input id="none" type="checkbox"><label>NO SYMPTOMS</label></mat-checkbox>
      <mat-checkbox><input id="cough" type="checkbox"><label>COUGH</label></mat-checkbox></fieldset>
    <div class="cdk-overlay-container"></div>`;
  });
  const addChip = (name: string) => () => { document.getElementById("chips")!.insertAdjacentHTML("beforeend", chip(name)); overlay().replaceChildren(); };

  it("adds saved countries, keeps those already on the form and doesn't re-add", async () => {
    document.getElementById("ddc")!.addEventListener("input", e => {
      const typed = (e.target as HTMLInputElement).value;
      if (typed === "SINGAPORE") addOption("SINGAPORE", addChip("SINGAPORE"));
      if (typed === "KOREA, REPUBLIC OF") addOption("KOREA, REPUBLIC OF", addChip("KOREA, REPUBLIC OF"));
    });
    const r = await fillStep([a("ddcCountrys", "chips", "SINGAPORE; KOREA, REPUBLIC OF; MALAYSIA")]);
    expect(r.filled).toEqual(["ddcCountrys"]);
    expect(readAnswer("ddcCountrys")?.value).toBe("MALAYSIA; SINGAPORE; KOREA, REPUBLIC OF");
  });

  it("leaves a country it can't find for the traveller", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const run = fillStep([a("ddcCountrys", "chips", "ATLANTIS")]);
    await vi.advanceTimersByTimeAsync(20000);
    const r = await run;
    vi.useRealTimers();
    expect(r.opened).toEqual(["ddcCountrys"]);
    expect((document.getElementById("ddc") as HTMLInputElement).value).toBe("");
    expect(readAnswer("ddcCountrys")?.value).toBe("MALAYSIA");
  });

  it("makes the ticks match the saved symptoms, unticking first", async () => {
    const order: string[] = [];
    for (const id of ["fever", "none", "cough"]) document.getElementById(id)!.addEventListener("click", () => order.push(id));
    const r = await fillStep([a("symptomsIds", "checks", "NO SYMPTOMS")]);
    expect(r.filled).toEqual(["symptomsIds"]);
    expect(order).toEqual(["fever", "none"]);
    expect(readAnswer("symptomsIds")?.value).toBe("NO SYMPTOMS");
  });

  it("says so when a saved symptom isn't on the form", async () => {
    const r = await fillStep([a("symptomsIds", "checks", "HEADACHE")]);
    expect(r.opened).toEqual(["symptomsIds"]);
  });
});

describe("last page", () => {
  beforeEach(() => {
    history.replaceState({}, "", "#/tac/arrival-card/add/preview/abc");
    document.body.innerHTML = `
    <div sit-validate-input="sendTo"><input id="email"></div>
    <div><mat-checkbox formcontrolname="checkedDecalraion"><input id="agree" type="checkbox"></mat-checkbox></div>
    <div class="mat-mdc-dialog-container" hidden><button id="yes">I agree</button></div>
    <button id="submit">Submit</button>`;
  });
  const answers = [a("sendTo", "text", "alex@example.com"), a("agreedTerms", "check", "checked")];

  it("adds the email and opens the agreement, but never presses Agree or Submit", async () => {
    const pressed = vi.fn();
    document.getElementById("yes")!.addEventListener("click", pressed);
    document.getElementById("submit")!.addEventListener("click", pressed);
    // As on the site: a tick is taken back at once and the agreement window opens instead.
    const opened = vi.fn();
    const box = document.getElementById("agree") as HTMLInputElement;
    box.addEventListener("click", () => { opened(); window.setTimeout(() => { box.checked = false; }); });
    box.addEventListener("change", () => { box.checked = false; });
    const r = await fillStep(answers);
    expect((document.getElementById("email") as HTMLInputElement).value).toBe("alex@example.com");
    expect(opened).toHaveBeenCalledOnce();
    expect(pressed).not.toHaveBeenCalled();
    expect(r.filled).toEqual(["sendTo"]);
    expect(r.opened).toEqual(["agreedTerms"]);
  });

  it("doesn't open a second agreement window on a second press", async () => {
    document.body.insertAdjacentHTML("beforeend", "<mat-dialog-container></mat-dialog-container>");
    const box = document.getElementById("agree") as HTMLInputElement;
    const clicked = vi.fn(); box.addEventListener("click", clicked);
    const r = await fillStep(answers);
    expect(clicked).not.toHaveBeenCalled();
    expect(r.opened).toEqual(["agreedTerms"]);
  });

  it("leaves an agreement already given alone", async () => {
    const box = document.getElementById("agree") as HTMLInputElement;
    box.checked = true;
    const clicked = vi.fn(); box.addEventListener("click", clicked);
    const r = await fillStep(answers);
    expect(clicked).not.toHaveBeenCalled();
    expect(r.filled).toEqual(["sendTo", "agreedTerms"]);
    expect(r.opened).toEqual([]);
  });

  it("does nothing for a saved untick", async () => {
    const box = document.getElementById("agree") as HTMLInputElement;
    const r = await fillStep([a("agreedTerms", "check", "unchecked")]);
    expect(box.checked).toBe(false);
    expect(r.opened).toEqual([]);
  });
});
