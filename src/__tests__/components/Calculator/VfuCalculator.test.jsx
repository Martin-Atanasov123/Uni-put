// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import VfuCalculator from "@/components/Calculator/VfuCalculator";
import { vfuProgram } from "@/lib/vfuScore";
import React from "react";

afterEach(cleanup);

describe("VfuCalculator", () => {
    it("shows the official score and conditional bonus", () => {
        const row = { university_name: 'Варненски свободен университет „Черноризец Храбър”', specialty: "Психология" };
        render(<VfuCalculator row={row} program={vfuProgram(row)} />);
        fireEvent.change(screen.getByLabelText("Призната конкурсна оценка"), { target: { value: "5,50" } });
        fireEvent.change(screen.getByLabelText("Среден успех от дипломата"), { target: { value: "5,00" } });
        expect(screen.getByRole("status").textContent).toContain("16.00");
        fireEvent.click(screen.getByRole("checkbox"));
        expect(screen.getByRole("status").textContent).toContain("17.00");
    });

    it("uses the doubled diploma rule for engineering programs", () => {
        const row = { university_name: 'Варненски свободен университет „Черноризец Храбър”', specialty: "Строителен инженеринг" };
        render(<VfuCalculator row={row} program={vfuProgram(row)} />);
        fireEvent.change(screen.getByLabelText("Призната конкурсна оценка"), { target: { value: "6" } });
        fireEvent.change(screen.getByLabelText("Среден успех от дипломата"), { target: { value: "6" } });
        expect(screen.getByRole("status").textContent).toContain("24.00 от 25");
    });
});
