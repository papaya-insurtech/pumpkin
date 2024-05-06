[Refetching queries in Apollo Client](https://www.apollographql.com/docs/react/data/refetching/)

Almost all the time, you will need to refetch queries after a mutation. This is because the mutation will change the data on the server, and you need to update the cache to reflect the changes.

```ts
import { getOperationName } from "@apollo/client/utilities";
import ClaimDocumentNotInGroupIdQuery from "app/portal/screens/ClaimPortal/ClaimCaseScreen/screens/ClaimCaseDocumentScreen/component/AddDocumentToGroupModal/graphql/ClaimDocumentNotInGroupIdQuery";
import ClaimDocumentGroupQuery from "app/portal/screens/ClaimPortal/ClaimCaseScreen/screens/ClaimCaseDocumentScreen/component/graphql/ClaimDocumentGroupQuery";
import ClaimDocumentNotInGroupIdCountQuery from "app/portal/screens/ClaimPortal/ClaimCaseScreen/screens/ClaimCaseDocumentScreen/component/graphql/ClaimDocumentNotInGroupIdCountQuery";

const [updateClaimDocumentGroupClaimDocumentMutation] = usePMutation(UPDATE_CLAIM_DOCUMENT_GROUP_CLAIM_DOCUMENT_MUTATION, {
  onCompleted: () => {
    notification.success({ message: "Cập nhật thành công" });
    Modal.destroyAll();
  },
  refetchQueries: [getOperationName(ClaimDocumentGroupQuery), getOperationName(ClaimDocumentNotInGroupIdCountQuery), getOperationName(ClaimDocumentNotInGroupIdQuery)].filter(
    Boolean,
  ),
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

Using `getOperationName(DocumentNode)` is safer than literal strings when query names are changed which may cause the refetch to fail.