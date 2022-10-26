# **Task Lifecycle**

## **#I. New Task**

- Đảm bảo mọi task có tổng thời gian life cycle chiếm từ 30p trở lên đều phải được track trên Jira. Nếu chưa có, yêu cầu người giao task tạo.
- Đảm bảo mọi task đều nên có đủ các thành phần cần thiết để bất kỳ Dev nào đọc vào cũng hiểu task này cần làm gì:
  - **Name** : (required)
    Tên task phải đảm bảo đọc vào dễ hiểu (biết ngay được đó là task gì, thuộc module nào …). Nếu thấy tên gây khó hiểu, yêu cầu người tạo task đặt lại tên. Hoặc tự đặt lại tên task, sau khi đã hiểu rõ task.
  - **Description** : (required)
    1. Phần description cần cover được ít nhất 2 câu hỏi: What? Why? Đặt biệt là phần WHY rất quan trọng, nhưng thường bị bỏ qua.
    2. Người tạo task có thể cung cấp cả phần When và How. Dev cần tỉnh táo làm rõ What và Why để validate When và How.
    3. Nếu thấy Description khó hiểu, hoặc thiếu thông tin, yêu cầu người tạo task bổ sung thông tin.
    4. Các thông tin thường có ở Description:
       1. Module nào
       2. Khách hàng nào
       3. User role nào
       4. Domain knowledge đi kèm nếu có
       5. Use cases
       6. Các thông tin liên quan khác
  - **Priority** (required)
  - **Due date** (required) - Due date là ngày task được Deploy hoặc Release (tùy yêu cầu), mỗi Dev phải đảm bảo task của mình meet được Due Date đúng hạn.
  - **UI** - Link giao diện đi kèm nếu có
  - **Related task**
  - **References resources**
- Khi thấy một số task có vấn đề có thể feedback lại cho người tạo task, hoặc raise lên với team để cùng thảo luận. Dev phải tỉnh táo khi nhận task, không phải cứ có task là nhận.

## **#II. Research / Investigate**

- Đối với tất cả các task, đều cần có 1 bước tìm hiểu rõ task, tiến hành research thêm thông tin và kiến thức nếu cần. Bước này có thể làm nhanh hoặc chậm tùy từng task. Đây là bước tối quan trọng, không được bỏ qua bước này mà bay vào code ngay, nếu là task bé, bước này có thể làm nhanh.
- Trong quá trình research nếu có bất cứ vấn đề gì khó khăn, lập tức chủ động tìm người trợ giúp.
- Sau khi Research và Investigate, cập nhật lại các nội dung vừa tìm hiểu vào task Jira. Bước này rất quan trọng, để giúp bất kỳ ai đọc task Jira cũng có thể hiểu rõ về task.
- Sau khi Research và Investigate, nếu nhận thấy task này cần có sự support của người khác (vd cần tạo fields, tạo columns database, cần tạo permission, tạo data test, confirm thông tin với khách hàng …), chủ động tạo subtask, checklist và thông báo cho người đó biết.
- Đưa ra end-to-end solution: Solution phải rõ ràng, giải quyết được task, giải quyết được các use case của task. Solution phải thể hiện rõ được các bước từ đầu - cuối cần làm là gì. Tránh những solution mang tính chung chung, hoặc solution nửa vời.

## **#III. Solution Review**

Bước này là bước sau khi đã investigate đầy đủ và nghĩ ra được solution, lập tức nhờ peer/leader review và confirm. Bước này giúp mọi người cùng nắm được task này sẽ được thực hiện như thế, có side effect gì có thể xảy ra, solution có phù hợp hay không, có conflict với các chỗ khác trong hệ thống hoặc conflict vs task khác không.

- Đối với task quen thuộc lập đi lập lại, solution đã có sẵn, document có sẵn =\> bypass bước này.
- Đối với task bé, đơn giản, side effect ít, tổng thời gian làm mất khoảng 2 tiếng: có thể bỏ qua bước này nếu gấp hoặc reviewer bận, nhưng vẫn khuyến khích nên có.
- Đối với các task phức tạp cao, cần viết/vẽ sơ bộ các thông tin / diagram cần thiết, chuẩn bị sẵn các tài liệu/links bài viết liên quan và tổ chức 1 buổi meeting để cũng nhau thảo luận.

## **#IV. Coding**

- Tạo branch `feature` (hoặc `bugfix`) từ latest default branch (thường là develop). Tạo branch `hotfix` từ `main`.
- Code và push code mỗi ngày. Phải push code lên Gitlab mỗi ngày, tránh làm mất code.
- Log work mỗi ngày.
- Ngay lần đầu push code, tạo ngay 1 PR với trạng thái `Draft`. Naming convention: `Draft: [Jira-issue-id] Tên của PR`
- Tất cả commits phải đảm bảo đúng convention: `[Jira-issue-id] nội dung commit`. Lưu ý là tất cả commits đều phải đúng convention, không loại trừ các commit fix code review feedback.
- Đảm bảo vscode cài đặt đầy đủ các extension eslint, prettier để format code và bắt các lỗi code convention cho chuẩn.
- Trong quá trình code gặp vấn đề gì khó khăn (vd như mất từ 30p để giải quyết mà chưa được), lập tức chủ động tìm người trợ giúp.
- Khi viết code, đảm bảo các điều sau đây theo thứ tự ưu tiên: code chạy đúng, code đẹp dễ đọc đúng convention, code chạy tối ưu.
- Khi viết code, chú ý xem lại code cũ có liên quan để hiểu rõ code mình đang viết có gây ảnh hưởng gì không. Khi sử dụng lại code của người khác, cần đọc hiểu rõ, tránh sử dụng sai.
- Khi sửa code của người khác: phải hỏi người đó trước để hiểu rõ.
- Khi resolve conflict trong quá trình merge/rebase, nếu thấy có liên quan những phần của người khác, cần nhờ hỗ trợ từ người có liên quan để tránh làm mất code.

## **#V. Testing**

- Phải tự test tất cả các use case của task.
- Phải test lại các tính năng khác nếu code có liên quan.
- Cập nhật How to test vào task Jira, nếu có có các lưu ý đặc biệt khi test task.

## **#VI. Code Review**

- Cập nhật lại name của PR, bỏ trạng thái Draft.
- Thêm link của Jira task vào Description của PR. Cập nhật status của Task Jira thành In Review
- Remind reviewer hằng ngày để PR được review.
- Nếu đây là task gấp, nêu rõ thông tin về độ quan trọng / độ ưu tiên, dealine của task, hậu quả nếu task hoàn thành trễ, để Reviewer ưu tiên thực hiện review. Raise lên với team nếu task có dấu hiệu trễ.

## **#VII. Deploying**

- Chủ động theo dõi trạng thái của 1 task liệu đã được deploy hay chưa. Nếu chưa deploy cần push người phụ trách deploy.
- Cách push và remind tương tự Code Review ở trên.

## **#VIII. Releasing**

- Phải nắm thông tin task có cần phải release gấp hay không.
- Cách push và remind release tương tự Code Review và Deploy.
- Sau khi task được release thành công, cập nhật status của Task Jira thành Done.

_**Dev phải luôn là người nắm rõ nhất task của mình phụ trách, cũng như là người chịu trách nhiệm cao nhất cho task của mình.**_
