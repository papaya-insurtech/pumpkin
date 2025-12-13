# Release Process

## Semi-Automated Release Process

### Release checklist

- [ ] Identify which features, jira tickets are ready for release (PO in charge).
- [ ] Write release notes and request approval from the Head of Operation and/or the CEO (PO in charge).
- [ ] Inform the Tech team about the release before 2 pm on the release date (PO in charge).
- [ ] The tech team deploys to the Staging environment at 2 pm on the release date (Tech team in charge).
- [ ] The QC, PO and biz team test the release on the Staging environment (QC, PO and biz team in charge).
- [ ] The tech team deploys to the PROD environment at 8 pm on the release date (Tech team in charge).
- [ ] The QC, PO and biz team test the release on the PROD environment (QC, PO and biz team in charge).

### Deployment steps

- [ ] Create release/tag from `main` branch for Apple, Berry, Cassava on Github for backup
- [ ] Run script `npx ts-node -T -r tsconfig-paths/register ./scripts/diffSSMParameterStore.ts -p1 '/{project env}/berry' -p2 '/main/berry'` in Berry to check the difference between SSM parameters in Main and Project environment.
- [ ] Merge Project to Main
  - [ ] Merge Apple from Project to Main
  - [ ] Run Hasura migration
  - [ ] Merge Berry from Project to Main
  - [ ] Resolve Berry conflicts without running codegen
  - [ ] Deploy Berry to Main
  - [ ] Run apply Hasura metadata
  - [ ] Run reload Hasura metadata
  - [ ] Run Berry codegen
  - [ ] Deploy Berry to Main
  - [ ] Merge Cassava from Project to Main
  - [ ] Run Cassava codegen
  - [ ] Commit and push code for Apple, Berry, Cassava
  - [ ] Cassava CI/CD automatically deploys to Main
  - [ ] Test Papaya Care Portal after Cassava deployed

## Automated Release Process

Coming soon...
