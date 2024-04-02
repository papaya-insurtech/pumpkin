# Rules

## Typescript

- Do not use undefined as `value`, use null.
- Do not use `any` type of committed code. Use `any` while you're still working on the code until you figure out the types. Typing things from the start is a good practice though.


- [Nullish coalescing operator (??)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) should be carefully put in the last part of an expression for readability and data fallback.

Example of ❌ **bad** usage of this rule: often times data need to be present as nullish, removing nullish using fallback this way may cause unexpected side effects.
```ts
  const certificates = policyData?.mbal?.policyByPolicyNumber?.certificates ?? [];
```

Example of ❌ **bad** usage of this rule: unnecessary data fallback. `data` props of <TableList> component accepts nullish value (null or undefined) by default.

```ts
<TableList data={certificate.insured_certificate?.claim_cases ?? []} />
```

Example of ❌ **bad** usage of this rule

```ts
const allClaims = (res.data?.claim_case_details ?? []).concat(
  await getClaimCasesUntilEnough({
    exportTime,
    where,
    total,
    offset: countFetchItems,
    updateProgress,
  }),
);
```

Example of ✅ **good** usage of this rule

```ts
const allClaims = (res.data?.claim_case_details).concat(
await getClaimCasesUntilEnough({
  exportTime,
  where,
  total,
  offset: countFetchItems,
  updateProgress,
}),
) ?? [];
```

Example of ❌ **bad** usage of this rule (read the comment)

```ts
const UploadClaimDocumentsScreen: FC = () => {
  const { email } = useEmailDetail();
  const { mailbox } = useParams<{ mailbox: string }>();


  return (
    <div className={styles.mailBox}>
      <div className={styles.createClaimScreen}>
        <Flex gap={8} style={{ padding: "4px 8px" }}>
          <Link
            to={
              mailbox == null
                ? generatePath(PORTAL_PATH.MAILBOX.EMAIL_DETAIL_DEFAULT, {
                    emailId: email?.id ?? "", // bad fallback, this will result page crash thrown by generatePath
                  })
                : generatePath(PORTAL_PATH.MAILBOX.EMAIL_DETAIL, {
                    emailId: email?.id ?? "", // bad fallback, this will result page crash thrown by generatePath
                    mailbox,
                  })
            }
          >
            <Button size="small" icon={<LeftOutlined />}>
              Quay lại
            </Button>
          </Link>
        </Flex>
      </div>
    </div>
  );
};
```

Example of ❌ **bad** usage of this rule: removing null value from email not only helps with bad fallback but is also useful when `email` object is further used in the code when expanded

```ts
const UploadClaimDocumentsScreen: FC = () => {
  const { email, loading } = useEmailDetail();
  const { mailbox } = useParams<{ mailbox: string }>();

  if (email == null) return <Spin spinning={loading} />;
  return (
    <div className={styles.mailBox}>
      <div className={styles.createClaimScreen}>
        <Flex gap={8} style={{ padding: "4px 8px" }}>
          <Link
            to={
              mailbox == null
                ? generatePath(PORTAL_PATH.MAILBOX.EMAIL_DETAIL_DEFAULT, {
                    emailId: email.id,
                  })
                : generatePath(PORTAL_PATH.MAILBOX.EMAIL_DETAIL, {
                    emailId: email.id,
                    mailbox,
                  })
            }
          >
            <Button size="small" icon={<LeftOutlined />}>
              Quay lại
            </Button>
            <Text ellipsis style={{ fontSize: 16, fontWeight: 700 }}>
              {email.subject}
            </Text>
          </Link>
        </Flex>
      </div>
    </div>
  );
};
```

## React

- Conditional rendering: use `&&` operator instead of ternary operator `? :` for conditional rendering. It's more readable and less error-prone. The only use case where `&&` is allowed is when there is only one condition.

Example of ❌ **bad** usage of this rule

```ts
<div onClick={() => claim != null && somethingBoolean && utils.calculateTat({ claim })}>TAT: {tat} hours.</div>
```

Example of ✅ **good** usage of this rule

```ts
<div onClick={() => claim != null && utils.calculateTat({ claim })}>TAT: {tat} hours.</div>
```

- Use `<If>` component in complex conditional rendering. `<If>` component cannot remove null and undefined time from rendering children. It's perfectly safe, Typescript simply doesn't know. Normally using [jsx-control-statement](https://www.npmjs.com/package/jsx-control-statements) is enough but [it doesn't work well with Vite](https://github.com/vitejs/vite/discussions/7927).

- Use react-router-dom's `<Link>` component instead of `<a>` tag for links. Avoid using any other components for hyperlinks such as

Example of ❌ **bad** usage of this rule

```ts
<div onClick={() => navigate("http://google.com")}>...</div>
```

- External links and links that open a new tab should use `<ExternalLink />` component from `app/common/components/ExternalLink` to indicate that the link will open a new tab. This is to prevent users from losing their current page when clicking on the link.

Example of ❌ **bad** usage of this rule
```ts
<Link target="_blank" to={generatePath(PORTAL_PATH.HC_CREATE_CLAIM_CASE_LA, { id })}>
                                      {name}
                                    </Link>
```


Example of ✅ **good** usage of this rule

```ts
import ExternalLink from "app/common/components/ExternalLink";

<ExternalLink to={generatePath(PORTAL_PATH.HC_CREATE_CLAIM_CASE_LA, { id })}>{name}</ExternalLink>
```

## Ant Design

### Notifications

- Use the [notification component](https://ant.design/components/notification) for notifications instead of [message](https://ant.design/components/message) unless you are 120% sure what you are doing. Notification offers more control and is more flexible.
- Use [notification hooks](https://ant.design/components/notification#notification-demo-update) for progress indicators. Such use cases include mutating data with multiple separate queries like a sequence of creating a claim case, uploading documents, sending Slack notifications, sending email notifications, and assigning to users.
  - The last notification content should display a concise message of the whole process, e.g. "Claim case DB-21-00141221 created successfully".
  - Clicking the notification should redirect the user to the page of the created claim case.
  - DB-21-00141221 is hyperlinked to the claim case page too, not for clicking but almost all claim cases are displayed in the same style in the Portal.
  - After a period of time, the notification should redirect the user to the created object/resources unless the newly created object is part of the screen. A golden number is 1 second.

```ts
const [notificationApi, notificationApiContextHolder] = notification.useNotification();

notificationApi.info({ message: "Đang tạo claim case", description: "Vui lòng chờ trong giây lát", key: NOTIFICATION_KEY });

notificationApi.error({ message: "Lỗi tạo claim", description: "Thẻ được chọn chưa có thông tin công ty BH", key: NOTIFICATION_KEY });

notificationApi.info({
  message: "Tạo claim case thành công",
  description: `Chuyển ${selectedAttachments.length} file đính kèm từ email sang claim ${claimCode}`,
  key: NOTIFICATION_KEY,
});

notificationApi.success({
    message: "Tạo claim thành công",
    description: `Mã claim là: ${claimCode}`,
    key: NOTIFICATION_KEY,
    duration: 1,
    onClick: () => navigate(`${generatePath(PORTAL_PATH.CLAIM_CASE, { claimCaseId })}/${CLAIM_CASE_PATH.CLAIM_CASE_INFO}`),
    onClose: () => navigate(`${generatePath(PORTAL_PATH.CLAIM_CASE, { claimCaseId })}/${CLAIM_CASE_PATH.CLAIM_CASE_INFO}`),
  });
```

### Modal

#### Loading indicator for form submission on modals

AntD Modal shows a loading indicator for the submit button by default and close automatically when `promise` is resolved when `onOk` button is an async function and returns a promise. This is a good practice to prevent users from clicking the button multiple times and causing unexpected side effects. This applies to all modal types: `info`, `success`, `error`, `warning`, and `confirm`.

[https://codesandbox.io/p/sandbox/manual-to-update-destroy-antd-5-15-3-forked-7x3w99](https://codesandbox.io/p/sandbox/manual-to-update-destroy-antd-5-15-3-forked-7x3w99)

```ts
Modal.confirm({
  content: "This modal will show loading indicator for 5 seconds on submit button",
  onOk: async () =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true);
      }, 5000);
    }),
  title: "Modal button submission with loading indicator",
});
```

Usage with Graphql: simply returns the Graphql query

```ts
Modal.confirm({
  content: "This modal will show loading indicator until GraphQL query completes",
  onOk: () =>
    updateInsuredCertificateMutation({
      variables: {
        id: insuredCertificate.id,
        input: {
          status: "approved",
        },
      },
    })
  title: "Modal button submission with loading indicator",
});
```

#### 3 usages of Modal

When to use which type of Modal?

1. Always go for the static method.
2. If contents on Modal require contexts like Apollo Client/Claim Context, use hooks.
3. If updating data on modal causes re-rendering of the parent component, use the basic component-based modal to prevent modal from disappearing unexpectedly. This is the least preferred method as it causes clutters in JSX and is less readable.

##### [Static method](https://ant.design/components/modal#components-modal-demo-static-info)
##### [Hooks](https://ant.design/components/modal#components-modal-demo-hooks)
##### [Basic (Component based)](https://ant.design/components/modal#components-modal-demo-basic)


## Apollo Client

### Convention

Declaring mutations:
- Update queries must always be name `update${table_name}`. Object to be updated should always be name $input. Returning data should always be the updating fields to adhere to [Apollo Cache's update mechanism](https://www.apollographql.com/docs/react/data/mutations/#include-modified-objects-in-mutation-responses).

```ts
gql`
  mutation updateCompanyCampusUser($id: uuid!, $input: company_campus_users_set_input!) {
    update_company_campus_users_by_pk(pk_columns: { id: $id }, _set: $input) {
      __typename
    }
  }
`
const [updateCompanyCampusUserMutation] = usePMutation(UpdateCompanyCampusUserDocument, {
  onCompleted: () => {
    notification.success({ message: "Cập nhật thành công" });
  },
  refetchQueries: ["getCompany"],
});
```

### Realtime

Use Polling instead of Subscriptions for realtime data. Read more: https://www.apollographql.com/docs/react/data/subscriptions/#when-to-use-subscriptions

Use Poll Interval with [ahooks's useDocumentVisibility](https://ahooks.js.org/hooks/use-document-visibility) to prevent over queried. This functionality is built into usePollInterval();

```ts
const {
    data,
    loading,
  } = usePQuery(AllClaimCasesDocument, {
    variables: {
      where,
    },
    pollInterval: usePollInterval(POLL_INTERVAL_CONFIG),
  });
```

