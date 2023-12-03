# Rules

## Typescript

- Do not use undefined as `value`, use null.
- Do not use `any` type of committed code. Use `any` while you're still working on the code until you figure out the types. Typing things from the start is a good practice though.
- [Nullish coalescing operator (??)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) should be carefully put in the last part of an expression for readability.

Example of **bad** usage of this rule

```js
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

Example of **good** usage of this rule

```js
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

## React

## Ant Design

### Notifications

- Use the [notification component](https://ant.design/components/notification) for notifications instead of [message](https://ant.design/components/message) unless you are 120% sure what you are doing. Notification offers more control and is more flexible.
- Use [notification hooks](https://ant.design/components/notification#notification-demo-update) for progress indicators. Such use cases include mutating data with multiple separate queries like a sequence of creating a claim case, uploading documents, sending Slack notifications, sending email notifications, and assigning to users.
  - The last notification content should display a concise message of the whole process, e.g. "Claim case DB-21-00141221 created successfully".
  - Clicking the notification should redirect the user to the page of the created claim case.
  - DB-21-00141221 is hyperlinked to the claim case page too, not for clicking but almost all claim cases are displayed in the same style in the Portal.
  - After a period of time, the notification should redirect the user to the created object/resources unless the newly created object is part of the screen. A golden number is 1 second.

```js
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

