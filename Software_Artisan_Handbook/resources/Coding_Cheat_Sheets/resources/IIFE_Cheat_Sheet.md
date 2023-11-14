# Using IIFE

## Definition

[IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE) stands for Immediately Invoked Function Expression. It is a JavaScript design pattern that involves creating a function and immediately invoking it.

## Use Cases

IIFE can be used to assist in building data for a variable in the following scenarios:

1. Grouping code into a single block.
2. Avoiding the need to use `let` or mutate variables after declaration when building data with complex logic (involving multiple conditions).
3. If the logic for building the variable is too complex and lengthy, it is recommended to consider extracting it into a separate function (instead of using IIFE) to reduce the length of the main function.

### Without IIFE Examples

Option 1:
Requires the use of `let` and allows re-assigning the variable. It is difficult to collapse this section into a related block.

```javascript
let insuredPersons: Parameters<typeof validatePoLaNameWithBeneficiaryName>[1];
if (insuredCertificate.policy.types === PolicyTypesEnum.Corporate) {
  const { insuredPersonsForClaimCase } = await sdk.getInsuredPersonsForClaimCase({
    claimCaseId: claimCase.claim_case_id,
  });
  insuredPersons = insuredPersonsForClaimCase;
} else {
  const { insuredPersons: pos } = await sdk.getPOForClaimCase({
    claimCaseId: claimCase.claim_case_id,
  });
  insuredPersons = pos;
}
```

Option 2: Uses `const` but requires mutating the variable. If the type is inferred as `Readonly`, it cannot be mutated. It is difficult to collapse this section into a related block.

```javascript
const insuredPersons: Parameters<typeof validatePoLaNameWithBeneficiaryName>[1] = [];
if (insuredCertificate.policy.types === PolicyTypesEnum.Corporate) {
  const { insuredPersonsForClaimCase } = await sdk.getInsuredPersonsForClaimCase({
    claimCaseId: claimCase.claim_case_id,
  });
  insuredPersons.push(...insuredPersonsForClaimCase);
} else {
  const { insuredPersons: pos } = await sdk.getPOForClaimCase({
    claimCaseId: claimCase.claim_case_id,
  });
  insuredPersons.push(...pos);
}
```

### With IIFE Example

Using IIFE with If/Else

```javascript
const insuredPersons = await (async () => {
  if (insuredCertificate.policy.types === PolicyTypesEnum.Corporate) {
    return sdk
      .getInsuredPersonsForClaimCase({ claimCaseId: claimCase.claim_case_id })
      .then(({ insuredPersonsForClaimCase }) => insuredPersonsForClaimCase);
  }

  return sdk
    .getPOForClaimCase({ claimCaseId: claimCase.claim_case_id })
    .then(({ insuredPersons: pos }) => pos);
})();
```

Using IIFE with Switch/Case

```javascript
const insuredPersons = await (async () => {
  switch (insuredCertificate.policy.types) {
    case PolicyTypesEnum.Corporate:
      return sdk
        .getInsuredPersonsForClaimCase({ claimCaseId: claimCase.claim_case_id })
        .then(({ insuredPersonsForClaimCase }) => insuredPersonsForClaimCase);
    case PolicyTypesEnum.Individual:
      return sdk
        .getPOForClaimCase({ claimCaseId: claimCase.claim_case_id })
        .then(({ insuredPersons: pos }) => pos);
    default:
      throw new Error('Invalid policy type');
  }
})();
```
