import { describe, expect, it } from 'vitest';
import { w2Schema } from './w2.js';
import type { W2Data } from './w2.js';

const validW2: W2Data = {
  employerName: 'Acme Corporation',
  employerAddress: '100 Corporate Blvd, Chicago, IL 60601',
  employerEin: '12-3456789',
  employeeName: 'Jane Smith',
  employeeAddress: '456 Elm Ave, Chicago, IL 60602',
  employeeSsn: 'XXX-XX-1234',
  taxYear: '2023',
  wagesTipsOtherComp: 75000,
  federalIncomeTaxWithheld: 12500,
  stateWages: 75000,
  stateTaxWithheld: 4500,
  stateCode: 'IL',
};

describe('w2Schema', () => {
  it('accepts a complete valid W-2 object', () => {
    expect(w2Schema.safeParse(validW2).success).toBe(true);
  });

  it('fails when wagesTipsOtherComp is missing', () => {
    const { wagesTipsOtherComp: _wagesTipsOtherComp, ...missingWages } = validW2;

    expect(w2Schema.safeParse(missingWages).success).toBe(false);
  });

  it('fails when wagesTipsOtherComp is a string instead of a number', () => {
    expect(
      w2Schema.safeParse({
        ...validW2,
        wagesTipsOtherComp: '75000',
      }).success,
    ).toBe(false);
  });

  it('accepts nullable optional W-2 fields', () => {
    expect(
      w2Schema.safeParse({
        ...validW2,
        employerAddress: null,
        employeeAddress: null,
        employerEin: null,
        employeeSsn: null,
        stateWages: null,
        stateTaxWithheld: null,
        stateCode: null,
      }).success,
    ).toBe(true);
  });

  it('accepts string taxYear and rejects numeric taxYear', () => {
    expect(w2Schema.safeParse(validW2).success).toBe(true);
    expect(
      w2Schema.safeParse({
        ...validW2,
        taxYear: 2023,
      }).success,
    ).toBe(false);
  });

  it('contains all required top-level W-2 fields', () => {
    expect(Object.keys(w2Schema.shape)).toEqual([
      'employerName',
      'employerAddress',
      'employerEin',
      'employeeName',
      'employeeAddress',
      'employeeSsn',
      'taxYear',
      'wagesTipsOtherComp',
      'federalIncomeTaxWithheld',
      'stateWages',
      'stateTaxWithheld',
      'stateCode',
    ]);
  });
});
