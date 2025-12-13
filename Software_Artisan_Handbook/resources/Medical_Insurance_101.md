# MEDICAL INSURANCE 101: DOMAIN KNOWLEDGE

## 1\. Tổng quan các thực thể (Key Entities)

Trong một hệ thống bảo hiểm, việc xác định đúng vai trò của từng người là quan trọng nhất để xây dựng mô hình dữ liệu.

### 1.1. Nhóm khách hàng & Người thụ hưởng

| Thuật ngữ (EN) | Thuật ngữ (VN) | Định nghĩa & Vai trò |
| :--- | :--- | :--- |
| **Policy Owner (PO)** <br>*(Alias: Policyholder)* | Bên mua bảo hiểm / Chủ hợp đồng | Là người **sở hữu** hợp đồng và chịu trách nhiệm **đóng phí** (Payer). <br>PO có toàn quyền yêu cầu thay đổi thông tin, hủy hợp đồng hoặc chỉ định người thụ hưởng. |
| **Life Assured (LA)** | Người được bảo hiểm (Nhân thọ) | Thường dùng trong bảo hiểm **Nhân thọ** (Life Insurance). Rủi ro (tử vong, thương tật) xảy ra với người này thì công ty bảo hiểm mới trả tiền. |
| **Insured Person (IP)** | Người được bảo hiểm (Sức khỏe) | Thường dùng trong bảo hiểm **Sức khỏe/Phi nhân thọ** (Health/Non-life). Là người đi khám bệnh và hưởng dịch vụ y tế. <br>*Lưu ý: Trong nhiều hệ thống, LA và IP có thể được gộp chung concept là "Insured", nhưng ngữ cảnh sử dụng khác nhau.* |
| **Beneficiary** | Người thụ hưởng | Người được PO chỉ định để nhận tiền khi sự kiện bảo hiểm nghiêm trọng xảy ra (thường là khi LA tử vong). |

> **Mối quan hệ:**
>
> * Một **PO** có thể mua cho chính mình (PO là LA/IP) hoặc mua cho người khác (Vợ mua cho Chồng, Bố mua cho Con).
> * Một Hợp đồng có thể có 1 PO nhưng có nhiều LA/IP (Gói gia đình).

### 1.2. Nhóm cung cấp dịch vụ & Trung gian

| Thuật ngữ (EN) | Thuật ngữ (VN) | Định nghĩa & Vai trò |
| :--- | :--- | :--- |
| **Insurer** | Công ty Bảo hiểm | Đơn vị phát hành sản phẩm, chịu rủi ro và chi trả. |
| **Medical Provider** | Cơ sở y tế (CSYT) | Bệnh viện, phòng khám, nhà thuốc nơi IP sử dụng dịch vụ. |
| **TPA** (Third Party Administrator) | Đơn vị giải quyết bồi thường | Đơn vị trung gian được Insurer thuê để xử lý hồ sơ bồi thường (Claim) và bảo lãnh viện phí. TPA làm việc trực tiếp với CSYT và Khách hàng. |
| **Agent / Agency** | Đại lý / Kênh đại lý | Người/Tổ chức tư vấn và bán bảo hiểm. |

-----

## 2\. Phân loại Hợp đồng (Policy Classification)

Cần phân biệt rõ loại hình hợp đồng để thiết kế luồng quản lý (Management Flow) phù hợp.

### 2.1. Phân loại theo Đối tượng sở hữu (Ownership Type)

1. **Individual Policy (Hợp đồng cá nhân):**
      * Khách hàng là cá nhân mua cho bản thân hoặc gia đình.
      * Quan hệ 1-1 hoặc 1-n (1 chủ hợp đồng - vài người được bảo hiểm).
2. **Group Policy (Hợp đồng nhóm):**
      * Khách hàng là **Doanh nghiệp/Tổ chức** (Corporate Client) mua cho nhân viên (Employee Benefit).
      * **Master Policy:** Hợp đồng khung ký giữa Công ty Bảo hiểm và Doanh nghiệp.
      * Nhân viên chỉ nhận được giấy chứng nhận hoặc thẻ bảo hiểm, không giữ hợp đồng gốc. Nhân viên nghỉ việc sẽ bị cắt bảo hiểm (Terminated) khỏi Group Policy.

### 2.2. Phân loại theo Nghiệp vụ (Line of Business)

1. **Life Insurance (Nhân thọ):** Bảo vệ sinh mạng, dài hạn, có tích lũy (như tài sản).
2. **Non-Life / General Insurance (Phi nhân thọ):** Bảo vệ sức khỏe, tài sản, ngắn hạn (1 năm), không tích lũy (rơi phí).

-----

## 3\. Cấu trúc Sản phẩm & Quyền lợi (Product & Benefits)

Hiểu cấu trúc này để xây dựng **Product Factory** (Công cụ cấu hình sản phẩm).

### 3.1. Cấu trúc gói (Bundling)

* **Main Product (Sản phẩm chính):** Bắt buộc. Quyết định sự tồn tại của hợp đồng.
* **Rider / Supplementary (Sản phẩm bổ trợ):** Mua kèm để gia tăng quyền lợi (VD: Mua BH Nhân thọ kèm thẻ Sức khỏe).
  * *Quy tắc:* Sản phẩm chính hủy -\> Rider hủy theo. Rider hủy -\> Sản phẩm chính vẫn sống.

### 3.2. Các khái niệm về Tiền & Hạn mức (Money & Limits)

Đây là các thông số quan trọng trong **Schedule of Benefits (SOB) - Bảng quyền lợi bảo hiểm**.

| Thuật ngữ (EN) | Thuật ngữ (VN) | Giải thích |
| :--- | :--- | :--- |
| **Sum Assured (SA)** | Số tiền bảo hiểm (STBH) | Thường dùng trong **Nhân thọ**. Số tiền **cố định** cam kết chi trả. <br>*Ví dụ: Mua mệnh giá 1 tỷ. Chết trả đúng 1 tỷ.* |
| **Sum Insured (SI)** / **Limit** | Hạn mức bảo hiểm | Thường dùng trong **Sức khỏe**. Số tiền **tối đa** chi trả. <br>*Ví dụ: Hạn mức 500 triệu/năm. Chữa hết 300tr trả 300tr. Chữa 600tr chỉ trả tối đa 500tr.* |
| **Balance** | Hạn mức còn lại | `Balance = Limit - Claimed Amount`. Số tiền còn lại khách hàng được dùng trong năm. |
| **Premium** | Phí bảo hiểm | Số tiền khách hàng phải đóng để duy trì hợp đồng. |
| **Deductible** | Mức miễn thường | Số tiền khách tự chịu trước khi BH chi trả. |
| **Co-payment** | Đồng chi trả | Tỷ lệ % khách hàng chia sẻ rủi ro với công ty BH (VD: Khách 20% - BH 80%). |

### 3.3. Tài liệu định nghĩa (Documentation)

* **SOB (Schedule of Benefits):** Bảng tóm tắt quyền lợi, hạn mức chi tiết của gói bảo hiểm mà khách hàng mua. (Dùng để tra cứu nhanh: "Tôi được nằm phòng bao nhiêu tiền?").
* **T\&C (Terms & Conditions - Quy tắc & Điều khoản):** Văn bản pháp lý chi tiết, quy định định nghĩa bệnh, các điểm loại trừ (Exclusions), điều kiện chi trả. Đây là "Luật" của hợp đồng.

-----

## 4\. Các phương thức Chi trả (Claim Methods)

Khi thiết kế tính năng Claim, cần phân biệt rõ cơ chế tính toán số tiền:

### 4.1. Lump Sum (Khoán / Trả một cục)

* **Cơ chế:** Chi trả một số tiền cố định dựa trên chẩn đoán bệnh, không quan tâm chi phí chữa trị thực tế.
* **Áp dụng:** Bảo hiểm Nhân thọ, Bảo hiểm Bệnh hiểm nghèo (Critical Illness).
* *Ví dụ:* Hợp đồng quy định bị Ung thư trả 500 triệu. Khách hàng mang giấy xét nghiệm Ung thư về -\> Nhận 500 triệu (dù chữa trị hết ít hay nhiều).

### 4.2. Reimbursement (Bồi hoàn / Thực thanh)

* **Cơ chế:** Chi trả dựa trên **chi phí thực tế** phát sinh (có hóa đơn), nhưng không vượt quá Hạn mức (Limit).
* **Áp dụng:** Bảo hiểm sức khỏe, tai nạn.
* *Ví dụ:* Hạn mức khám 5 triệu. Đi khám hết 2 triệu -\> Trả 2 triệu. Đi khám hết 7 triệu -\> Trả 5 triệu.

-----

## 5\. Vòng đời Hợp đồng (Policy Lifecycle)

Hợp đồng bảo hiểm là một thực thể "sống", trạng thái thay đổi theo thời gian.

1. **New Business (Cấp mới):** Khách hàng nộp hồ sơ -\> Thẩm định -\> Phát hành hợp đồng.
2. **Active (Hiệu lực):** Khách hàng đóng phí đầy đủ, quyền lợi được đảm bảo.
3. **Grace Period (Gia hạn đóng phí):** Thường là 60 ngày sau khi đến hạn đóng phí mà khách chưa đóng. Hợp đồng vẫn Active tạm thời.
4. **Lapse (Mất hiệu lực):** Hết thời gian gia hạn mà vẫn chưa đóng phí. Hợp đồng bị "treo", quyền lợi bị dừng. Nếu xảy ra rủi ro lúc này sẽ không được trả tiền.
5. **Reinstate (Khôi phục hiệu lực):** Hành động "hồi sinh" hợp đồng đã bị Lapse.
      * Khách hàng phải đóng bù phí.
      * Có thể phải khai báo lại sức khỏe hoặc thẩm định lại.
      * Thường chỉ được Reinstate trong vòng 2 năm kể từ ngày Lapse.
6. **Termination / Maturity (Chấm dứt / Đáo hạn):** Hợp đồng kết thúc (do khách hủy, do tử vong, hoặc do hết hạn hợp đồng).

-----

## 6\. Quy trình Bồi thường Sức khỏe (Health Claim Process)

Có 2 hình thức chính mà hệ thống cần xử lý:

### 6.1. Cashless / Direct Billing (Bảo lãnh viện phí)

* **Quy trình:** Khách chìa thẻ tại CSYT -\> CSYT check hệ thống với Insurer/TPA -\> Insurer/TPA xác nhận -\> Khách khám xong đi về (chỉ trả phần chi phí không thuộc phạm vi).
* **Đặc điểm:** Tiện lợi, khách không cần ứng tiền. Cần hệ thống kết nối thời gian thực.

### 6.2. Reimbursement Claim (Trả trước - Đòi sau)

* **Quy trình:** Khách tự trả tiền tại CSYT -\> Lấy hồ sơ/hóa đơn về -\> Nộp cho Insurer (qua App/Web/Giấy) -\> Insurer thẩm định -\> Chuyển khoản hoàn tiền cho Khách.
