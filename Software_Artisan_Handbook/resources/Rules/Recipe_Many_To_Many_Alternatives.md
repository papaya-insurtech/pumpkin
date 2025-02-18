[Refetching queries in Apollo Client](https://www.apollographql.com/docs/react/data/refetching/)

Almost all the time, you will need to refetch queries after an update/insert mutation. The reason is the mutation will change the data on the server, and you need to update the cache to reflect the changes.

```ts
import getRefetchOperationNames from "libs/getRefetchOperationNames";
import ClaimDocumentNotInGroupIdQuery from "app/portal/screens/ClaimPortal/ClaimCaseScreen/screens/ClaimCaseDocumentScreen/component/AddDocumentToGroupModal/graphql/ClaimDocumentNotInGroupIdQuery";
import ClaimDocumentGroupQuery from "app/portal/screens/ClaimPortal/ClaimCaseScreen/screens/ClaimCaseDocumentScreen/component/graphql/ClaimDocumentGroupQuery";
import ClaimDocumentNotInGroupIdCountQuery from "app/portal/screens/ClaimPortal/ClaimCaseScreen/screens/ClaimCaseDocumentScreen/component/graphql/ClaimDocumentNotInGroupIdCountQuery";

const [updateClaimDocumentGroupClaimDocumentMutation] = usePMutation(UPDATE_CLAIM_DOCUMENT_GROUP_CLAIM_DOCUMENT_MUTATION, {
  onCompleted: () => {
    notification.success({ message: "Cập nhật thành công" });
    Modal.destroyAll();
  },
  refetchQueries: getRefetchOperationNames([ClaimDocumentGroupQuery, ClaimDocumentNotInGroupIdCountQuery, ClaimDocumentNotInGroupIdQuery, "someQuery"]),
})
```

where `ClaimDocumentNotInGroupIdQuery`, `ClaimDocumentGroupQuery`, and `ClaimDocumentNotInGroupIdCountQuery` are the queries composed by `gql.tada`

```ts
import ClaimDocumentFragment from "app/portal/screens/ClaimPortal/ClaimCaseScreen/screens/ClaimCaseDocumentScreen/component/graphql/ClaimDocumentFragment";
import { graphql } from "sdk/v2/graphql";

export default graphql(
  `
    query ClaimDocumentNotInGroupId($claimCaseId: uuid!, $claimDocumentGroupId: uuid!) {
      claim_documents(
        where: {
          _not: { claim_document_group_claim_documents: { claim_document_group_id: { _eq: $claimDocumentGroupId } } }
          claim_case_id: { _eq: $claimCaseId }
          file: { mime_type: { _ilike: "image%" } }
        }
      ) {
        ...ClaimDocument
      }
    }
  `,
  [ClaimDocumentFragment],
);
```

Using `getRefetchOperationNames([DocumentNode, string])` is safer than literal strings when query names are changed which may cause the refetches to fail.

In case you're not sure what to refetch (e.g. you're not sure which queries are affected by the mutation), use: `active` in `refetchQueries` option.