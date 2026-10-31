// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { describeField } from "./formFields";
import { fieldRole, planForPage } from "./tripDefaults";

describe("field identity on mixed form layouts", () => {
  it("does not borrow the first field's label for departure or permit inputs", () => {
    history.replaceState({}, "", "/arrival-card-submission/travel-details");
    document.body.innerHTML = `<label for="std_arrival_date_foreigner_individual">Arrival Date to Indonesia</label><input id="std_arrival_date_foreigner_individual" readonly value="Select"><p>Departure Date</p><input id="std_departure_date_foreigner_individual"><p>Permit</p><input id="std_visa_kitas_kitap_no_foreigner_individual" value="TEST-PERMIT">`;
    const fields = [...document.querySelectorAll("input")].map(describeField);
    expect(fields.map(f => f.label)).toEqual(["Arrival Date to Indonesia", "", ""]);
    expect(fields.map(fieldRole)).toEqual(["arrival", "departure", undefined]);
    const plan = planForPage(fields, new Date(2026, 9, 18));
    expect(plan.map(f => f.value)).toEqual(["18/10/2026", "01/11/2026", "TEST-PERMIT"]);
  });
});
