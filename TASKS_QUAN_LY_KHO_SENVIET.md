# DANH SÁCH TASK GIAO VIỆC: TRIỂN KHAI PHÂN HỆ QUẢN LÝ KHO (SEN VIỆT BUFFET)
**Mục tiêu:** Tập trung 100% hoàn thiện phân hệ KHO trên thư mục `frontend-demo` để chị Thêm và Kế toán chi nhánh đưa vào sử dụng thực tế song song với Google Sheets tháng 11/2026.  
**Thứ tự ưu tiên:** P0 (Bắt buộc xong ngay trong ngày để test) > P1 (Hoàn thiện nghiệp vụ trong 2-3 ngày) > P2 (Tối ưu nâng cao).

---

## BẢNG TỔNG HỢP TIẾN ĐỘ & PHÂN CÔNG (SPRINT KHO)

| Mã Task | Tên Task | Phụ trách | Ưu tiên | Trạng thái | Ước lượng |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **KHO-01** | Sửa form Nhập kho: Bỏ mặc định 10, cho nhập số lẻ `2.33`, fix bug lưu | Frontend | **P0** | Sẵn sàng làm | 2 giờ |
| **KHO-02** | Cơ chế 2 cột SL: `Thực nhập` vs `Công nợ NCC` + Tính chênh lệch | Frontend + DB | **P0** | Sẵn sàng làm | 3 giờ |
| **KHO-03** | Bắt buộc chụp ảnh (`*`), Watermark tự động & Ép mở Camera | Frontend | **P0** | Sẵn sàng làm | 2 giờ |
| **KHO-04** | Form Xuất hủy: 4 nhóm lý do & Liên kết Lô nhập/NCC | Frontend + DB | **P0** | Sẵn sàng làm | 2.5 giờ |
| **KHO-05** | Hiển thị tồn kho thời điểm hủy & Chặn cứng xuất âm kho | Frontend + Logic | **P0** | Sẵn sàng làm | 1.5 giờ |
| **KHO-06** | Phân quyền Duyệt báo hỏng: Quản lý duyệt, Kế toán chỉ xem | Frontend + RBAC | **P0** | Sẵn sàng làm | 2 giờ |
| **KHO-07** | Thêm vai trò & tài khoản `ROLE_KETOAN_CHINHANH` trên Demo Bar | Frontend + Auth | **P0** | Sẵn sàng làm | 1.5 giờ |
| **KHO-08** | Nạp Master Data thực tế T11 (NCC, Mã hàng Thái Nguyên & Quế Võ) | Data / Seed | **P0** | Sẵn sàng làm | 2.5 giờ |
| **KHO-09** | Bảng NXT cuối ngày: Bóc tách Lệch không rõ & Cảnh báo đỏ (>5%, >300k) | Frontend + NXT | **P1** | Sẵn sàng làm | 4 giờ |
| **KHO-10** | Báo cáo % hỏng theo NCC & Bảng đối soát chênh lệch cân (5-10 ngày) | Frontend + Report | **P1** | Sẵn sàng làm | 3 giờ |

---

## CHI TIẾT ĐẶC TẢ TỪNG TASK (DÙNG ĐỂ GIAO VIỆC TRỰC TIẾP)

### 📌 TASK KHO-01: Sửa Form Nhập Kho (Fix Bug Lưu, Bỏ Mặc Định 10, Nhập Số Thập Phân)
* **Người nhận việc:** Frontend Developer
* **Mức độ ưu tiên:** **P0** (Khách hàng phàn nàn trực tiếp trên Excel)
* **Vị trí code cần sửa:** `frontend-demo/src/components/warehouse/WarehouseModule.tsx`
* **Mô tả công việc:**
  1. Xóa bỏ giá trị số lượng mặc định là `10` khi thêm mặt hàng mới vào phiếu nhập/xuất. Chuyển thành ô trống (placeholder `0.00`).
  2. Input số lượng cho phép nhập số thập phân 2 chữ số sau dấu phẩy (thuộc tính `step="0.01"`, ví dụ gõ `2.33` kg, `15.75` kg không bị làm tròn hay báo lỗi).
  3. Sửa triệt để bug validation: *"Đã gõ số lượng nhưng bấm Lưu vẫn báo lỗi không cho lưu"* ở hàm `handleSubmitDoc`. Kiểm tra kỹ parse `parseFloat` khi giá trị là chuỗi số thập phân có dấu chấm/phẩy.
* **Tiêu chí nghiệm thu (DoD):**
  - Mở modal Tạo phiếu nhập -> Ô số lượng trống.
  - Gõ `2.33` -> Bấm Lưu -> Hệ thống lưu thành công vào IndexedDB, không còn báo lỗi đỏ validation.

---

### 📌 TASK KHO-02: Cơ Chế 2 Cột Số Lượng (`Thực Nhập` vs `Công Nợ`) & Tự Tính Chênh Lệch
* **Người nhận việc:** Fullstack / Frontend Developer
* **Mức độ ưu tiên:** **P0** (Nghiệp vụ cốt lõi chị Thêm nhấn mạnh nhiều lần trong cuộc họp)
* **Vị trí code cần sửa:**
  - `frontend-demo/src/components/warehouse/WarehouseModule.tsx`
  - `frontend-demo/src/api/warehouse.ts`
  - `frontend-demo/src/db/schema.ts`
* **Mô tả công việc:**
  1. Trên form Nhập kho, thiết kế rõ ràng 2 cột số lượng:
     - **Cột 1: `Số lượng thực nhập (kg)`** -> Bếp cân thực tế tại quán khi nhận hàng (ghi vào Tồn kho thực tế NXT).
     - **Cột 2: `Số lượng hóa đơn / NCC (kg)`** -> Số lượng trên phiếu giao của nhà cung cấp (dùng để tính tiền công nợ).
  2. Tự động tính hiển thị cột: **`Chênh lệch (kg)`** = `Thực nhập - Công nợ NCC`.
     - Nếu âm (giao thiếu cân): Tô màu đỏ cảnh báo.
     - Nếu dương (giao thừa cân): Tô màu xanh/vàng.
  3. Tự động tính số tiền chênh lệch công nợ = `Chênh lệch * Đơn giá`.
* **Tiêu chí nghiệm thu (DoD):**
  - Nhập Cua: Thực tế cân `13 kg`, Hóa đơn NCC ghi `11 kg` -> Chênh lệch hiển thị `+2.00 kg`.
  - Tồn kho cộng đúng `13 kg`. Công nợ NCC chỉ ghi nhận trả tiền cho `11 kg`.

---

### 📌 TASK KHO-03: Bắt Buộc Ảnh Cân Hàng (`*`), Watermark Tự Động & Ép Mở Camera
* **Người nhận việc:** Frontend Developer
* **Mức độ ưu tiên:** **P0** (Chống gian lận & Bằng chứng đối chiếu NCC)
* **Vị trí code cần sửa:**
  - `frontend-demo/src/utils/imageCompressor.ts`
  - `frontend-demo/src/components/warehouse/WarehouseModule.tsx`
* **Mô tả công việc:**
  1. Trên modal tạo phiếu nhập và phiếu xuất hủy, trường ảnh đính kèm phải có dấu sao đỏ `*` bắt buộc. Nếu chưa chụp/chọn ảnh -> Nút Lưu bị disable hoặc bấm Lưu hiện thông báo: *"Vui lòng chụp ảnh bàn cân hoặc phiếu giao hàng trước khi lưu"*.
  2. Cấu hình input camera trên mobile: `<input type="file" accept="image/*" capture="environment" />` để ưu tiên mở thẳng camera điện thoại chụp trực tiếp.
  3. Nâng cấp hàm nén ảnh trong `imageCompressor.ts`: Tự động in đè Watermark góc dưới ảnh dạng:  
     `📍 [Sen Việt - Thái Nguyên] 21/11/2026 08:35 | NV: Bếp | Phiếu: Nhập kho`
* **Tiêu chí nghiệm thu (DoD):**
  - Không chọn ảnh -> Không lưu được.
  - Chụp 1 ảnh -> Ảnh preview hiển thị dải watermark có tên chi nhánh và thời gian thực.
  - Dung lượng ảnh nén vẫn dưới 200KB, upload siêu nhanh.

---

### 📌 TASK KHO-04: Form Xuất Hủy 4 Nhóm Lý Do & Gắn Tag Lô Nhập NCC
* **Người nhận việc:** Frontend Developer
* **Mức độ ưu tiên:** **P0** (Chị Thêm cần theo dõi cua chết của từng NCC)
* **Vị trí code cần sửa:** `frontend-demo/src/components/warehouse/WarehouseModule.tsx`
* **Mô tả công việc:**
  1. Trong phiếu xuất hủy (hoặc Báo hỏng), thay thế ô lý do tự do bằng Dropdown chọn 4 nhóm nghiệp vụ:
     - `Cua / Hải sản chết` (Cần truy vết NCC)
     - `Mẻ chế biến bị hỏng` (Cháy cháo, hỏng chè, hỏng kim chi)
     - `Đồ tươi thừa cuối ngày` (Salad, đồ dùng trong ngày theo quy định phải hủy)
     - `Hao hụt dây buộc cua & Tiêu hao bóc tách`
  2. Nếu chọn lý do `Cua / Hải sản chết`: Bắt buộc hiển thị dropdown chọn **Lô nhập / Nhà cung cấp** (ví dụ: Lô nhập hôm nay của "Liên Cua Cà Mau" hay "Chị Tâm Hà Nội").
* **Tiêu chí nghiệm thu (DoD):**
  - Bếp báo hủy 3 con cua chết -> Chọn lý do Cua chết -> Chọn NCC Liên Cua -> Báo cáo tháng tự động cộng dồn 3kg cua chết vào nhà cung cấp Liên Cua.

---

### 📌 TASK KHO-05: Hiển Thị Tồn Kho Thời Điểm Xuất & Chặn Cứng Xuất Âm Kho
* **Người nhận việc:** Frontend Developer
* **Mức độ ưu tiên:** **P0** (Khách hàng feedback: *"phiếu xuất hủy nên có dòng tồn tại thời điểm xuất để tránh xuất âm kho"*)
* **Vị trí code cần sửa:** `frontend-demo/src/components/warehouse/WarehouseModule.tsx`
* **Mô tả công việc:**
  1. Khi người dùng chọn mặt hàng cần xuất hủy hoặc xuất dùng, ngay bên cạnh hoặc dưới ô số lượng phải hiển thị nhãn:  
     👉 **"Tồn kho khả dụng hiện tại: [X.XX] kg (hoặc đơn vị)"** (lấy từ dữ liệu `inventoryStock` thời gian thực).
  2. Validation chặn cứng: Nếu người dùng nhập `Số lượng xuất > Tồn kho khả dụng` -> Báo lỗi đỏ: *"Số lượng xuất vượt quá tồn kho hiện tại (tối đa [X.XX] kg). Không được phép xuất âm kho!"* và không cho bấm Lưu.
* **Tiêu chí nghiệm thu (DoD):**
  - Tồn kho cua là `5.5 kg`. Gõ xuất hủy `6.0 kg` -> Báo đỏ ngay lập tức, nút Lưu bị khóa. Gõ `5.0 kg` -> Hợp lệ.

---

### 📌 TASK KHO-06: Phân Quyền Phê Duyệt Báo Hỏng Rõ Ràng
* **Người nhận việc:** Frontend Developer (RBAC)
* **Mức độ ưu tiên:** **P0** (Chị Thêm nhấn mạnh trong video: Quản lý có quyền duyệt, Kế toán chỉ xem thông báo)
* **Vị trí code cần sửa:**
  - `frontend-demo/src/components/warehouse/WarehouseModule.tsx`
  - `frontend-demo/src/utils/rbac.ts`
* **Mô tả công việc:**
  1. Khi phiếu Báo hỏng / Xuất hủy được tạo, trạng thái ban đầu là `CHO_DUYET` (Chờ duyệt).
  2. Phân định quyền trên UI:
     - Nếu Role là **Quản lý Chi nhánh (`ROLE_QL_CHINHANH`)** hoặc **Kế toán Tổng (`ROLE_CHU_CHUOI` / `ROLE_KETOAN_TONG`)**: Hiển thị nút bấm `✅ Duyệt hủy` và `❌ Từ chối`.
     - Nếu Role là **Kế toán Chi nhánh (`ROLE_KETOAN_CHINHANH`)** hoặc **Bếp (`ROLE_BEP`)**: Ẩn nút duyệt, chỉ hiển thị trạng thái `Đang chờ Quản lý duyệt` kèm thông báo.
* **Tiêu chí nghiệm thu (DoD):**
  - Đổi vai trò sang Quản lý chi nhánh -> Thấy nút duyệt. Bấm duyệt -> Tồn kho chính thức bị trừ.
  - Đổi vai trò sang Kế toán chi nhánh -> Không bấm duyệt được.

---

### 📌 TASK KHO-07: Thêm Vai Trò & Chuyển Đổi Nhanh `ROLE_KETOAN_CHINHANH`
* **Người nhận việc:** Frontend Developer
* **Mức độ ưu tiên:** **P0** (Excel feedback: *"Tạo thêm ID kế toán chi nhánh"*)
* **Vị trí code cần sửa:**
  - `frontend-demo/src/components/demo/DemoToolbar.tsx`
  - `frontend-demo/src/context/AuthContext.tsx`
  - `frontend-demo/src/types/auth.ts`
* **Mô tả công việc:**
  1. Bổ sung Role `ROLE_KETOAN_CHINHANH` (Kế toán chi nhánh - đại diện là bạn Thủy...) tách biệt với `ROLE_KETOAN` (Kế toán tổng - Chị Thêm).
  2. Trên thanh công cụ **Demo Control Bar** ở đầu màn hình: Thêm nút 1-click chuyển đổi vai trò sang **"Kế toán Chi nhánh"**.
  3. Khi ở vai trò này: Quyền dữ liệu tự động gắn chặt vào chi nhánh đang chọn (Thái Nguyên hoặc Quế Võ).
* **Tiêu chí nghiệm thu (DoD):**
  - Trên Demo Bar bấm nút "Kế toán Chi nhánh" -> Hệ thống chuyển đổi ngay lập tức, hiển thị đúng menu kho và quyền hạn của kế toán chi nhánh.

---

### 📌 TASK KHO-08: Nạp Master Data Thực Tế Tháng 11/2026 (Thái Nguyên & Quế Võ)
* **Người nhận việc:** Data / Seed Developer
* **Mức độ ưu tiên:** **P0** (Khách hàng feedback: *"Tạo dữ liệu giống với thực tế T11 để kế toán chi nhánh sử dụng song song"*)
* **Vị trí code cần sửa:** `frontend-demo/src/db/seedData.ts`
* **Mô tả công việc:**
  1. Cập nhật danh sách Nhà Cung Cấp trong `seedData.ts` đúng 100% theo file Excel T11:
     - `TNCHITAM`: Chị Tâm Hà Nội (Cua thịt, Ốc hương, Tôm sú)
     - `TNLIENCUA`: Liên Cua Cà Mau (Cua thịt)
     - `TNTHANHHIEP`: Hải sản Thanh Hiệp (Tôm, Mực, Bạch tuộc)
     - `TNDUNGCP`: Dũng Cẩm Phả (Hàu, Thưng, Ngao)
     - `TNCOTHUY`: Cô Thủy - Đồ khô (Bột gạo, Nước cốt dừa, Ngô ngọt...)
     - `TNANHTHO`: Anh Thơ Rau - Thịt (Trứng, Đậu phụ, Rau lẩu, Nấm...)
     - `TNKHANHQV`: Khánh - Cá hồi Quế Võ
  2. Bổ sung đầy đủ danh mục mã hàng thực tế và nhóm chi phí (`HS Chính`, `VỎ CỨNG`, `THỊT`, `HÀNG KHÔ`, `RAU`, `BAR`, `TIÊU HAO`).
* **Tiêu chí nghiệm thu (DoD):**
  - Bấm nút `🔄 Reset Data Mẫu` trên Demo Bar -> Mở dropdown Nhà cung cấp và Hàng hóa thấy ngay các nhà cung cấp và món ăn thực tế của quán.

---

### 📌 TASK KHO-09: Bảng Nhập - Xuất - Tồn (NXT) Bóc Tách Chống Thất Thoát Cuối Ngày
* **Người nhận việc:** Frontend Developer
* **Mức độ ưu tiên:** **P1**
* **Vị trí code cần sửa:**
  - `frontend-demo/src/components/reconciliation/AutoNXTTable.tsx`
  - `frontend-demo/src/components/reconciliation/nxtData.ts`
* **Mô tả công việc:**
  1. Hiển thị đầy đủ bảng cân đối kho theo ngày/ca:
     $$\text{Xuất thực tế} = \text{Tồn đầu} + \text{Nhập} - \text{Tồn cuối kiểm kê}$$
     $$\text{Khách dùng lý thuyết} = \text{Số khách người lớn} \times \text{Định mức} + \text{Số khách trẻ em} \times (\text{Định mức} \times 0.5)$$
     $$\text{Lệch không rõ (Thất thoát)} = \text{Xuất thực tế} - \text{Khách dùng} - \text{Hụt chế biến} - \text{Hỏng có báo}$$
  2. Cảnh báo trực quan: Tự động tô màu đỏ cảnh báo các dòng hàng có mức lệch > 5% hoặc quy đổi tiền > 300.000 đ.
* **Tiêu chí nghiệm thu (DoD):**
  - Xem bảng NXT thấy rõ hàng nào bị vượt định mức, nguyên nhân do đâu (do hỏng, do hụt chế biến, hay lệch không rõ nguyên nhân).

---

### 📌 TASK KHO-10: Báo Cáo Chất Lượng NCC & Bảng Đối Soát Chênh Lệch Cân
* **Người nhận việc:** Frontend Developer
* **Mức độ ưu tiên:** **P1**
* **Vị trí code cần sửa:** `frontend-demo/src/components/warehouse/WarehouseModule.tsx`
* **Mô tả công việc:**
  1. Xây dựng Tab **"Báo cáo Nhà cung cấp"**:
     - Lọc theo tháng và chi nhánh.
     - Thống kê: Tổng kg nhập, Tổng kg cua chết/hỏng, Tỷ lệ % hỏng.
     - Tự động sắp xếp nhà cung cấp hỏng nhiều nhất lên đầu.
  2. Xây dựng Tab **"Đối chiếu công nợ & Chênh lệch cân"**:
     - Danh sách các đợt nhập hàng có chênh lệch giữa `Thực cân` và `Hóa đơn NCC`.
     - Phục vụ chu kỳ 5–10 ngày/lần của chị Thêm để trừ tiền công nợ NCC.
* **Tiêu chí nghiệm thu (DoD):**
  - Hiển thị bảng tổng kết: Nhà cung cấp Liên Cua nhập 300kg, hỏng 15kg (5%), chênh lệch cân thiếu 4kg -> hiển thị rõ số tiền cần đàm phán trừ công nợ.


---

## 🏢 BỔ SUNG CÁC TASK QUẢN LÝ DANH MỤC KHO & VỊ TRÍ LƯU TRỮ VẬT LÝ

### 📌 TASK KHO-11: Quản Lý Phân Vùng Kho (Kho Khô, Kho Đông Lạnh, Kho Bể Sống, Kho Bar)
* **Người nhận việc:** Fullstack / Frontend Developer
* **Mức độ ưu tiên:** **P0** (Chị Thêm nhấn mạnh: hàng khô thất thoát do không khóa kho và kiểm soát vị trí)
* **Vị trí code cần sửa:**
  - `frontend-demo/src/db/schema.ts`
  - `frontend-demo/src/components/warehouse/WarehouseModule.tsx`
* **Mô tả công việc:**
  1. Thêm thực thể `WarehouseLocation` (Phân vùng kho trong chi nhánh):
     - `KHO_KHO`: Kho hàng khô (Gia vị, gạo, đường, đồ hộp, cồn thạch...)
     - `KHO_DONG_LANH`: Kho đông lạnh (Thịt bò, sườn, ba chỉ, cá phi lê...)
     - `KHO_BE_SONG`: Bể hải sản tươi sống (Cua thịt, ghẹ, tôm càng, bề bề, ốc hương...)
     - `KHO_BEP`: Kho đệm tại bếp (Nguyên liệu đã xuất sang bếp để chế biến trong ngày)
     - `KHO_BAR`: Quầy bar (Trái cây, nước ngọt, bia, rượu...)
  2. Khi Nhập hàng hoặc Kiểm kê: Cho phép chọn nhập/kiểm tại Kho cụ thể nào.
  3. Lọc danh sách tồn kho theo từng kho vật lý.
* **Tiêu chí nghiệm thu (DoD):**
  - Mở màn hình kho -> Có bộ lọc chọn `Tất cả kho`, `Kho khô`, `Kho lạnh`, `Bể sống`, `Kho bar`.
  - Chọn `Kho khô` -> Chỉ hiển thị danh sách các mặt hàng khô và số lượng tồn trong kho khô.

---

### 📌 TASK KHO-12: Màn Hình Tồn Kho Tổng Hợp & Thẻ Kho Thời Gian Thực (Stock Ledger)
* **Người nhận việc:** Frontend Developer
* **Mức độ ưu tiên:** **P0** (Bảng theo dõi tồn tức thời của từng mặt hàng)
* **Vị trí code cần sửa:** `frontend-demo/src/components/warehouse/WarehouseModule.tsx`
* **Mô tả công việc:**
  1. Bổ sung một Tab chính: **"📊 Tồn Kho Hiện Tại"** trong Module Kho:
     - Danh sách toàn bộ mặt hàng có trong kho: `Mã hàng`, `Tên hàng`, `Kho lưu trữ`, `Tồn thực tế (kg/gói)`, `Đơn giá bình quân`, `Tổng giá trị tồn`, `Trạng thái`.
     - Cảnh báo tồn: Cảnh báo `Sắp hết hàng` (dưới mức tồn tối thiểu) và `Cận date` (sắp hết hạn sử dụng).
  2. Chức năng **Xem Thẻ Kho (Lịch sử biến động)**:
     - Bấm vào 1 mặt hàng -> Hiện popup Thẻ kho: Nhật ký toàn bộ các giao dịch Nhập - Xuất - Chế biến - Báo hỏng của mặt hàng đó theo thời gian kèm người thực hiện và số phiếu.
* **Tiêu chí nghiệm thu (DoD):**
  - Bấm vào tab "Tồn kho hiện tại" -> Thấy ngay tổng giá trị tồn kho của chi nhánh (ví dụ 104 triệu) và chi tiết từng mặt hàng.
  - Bấm vào "Cua thịt" -> Thấy lịch sử: 08:00 nhập 20kg (Phiếu #PN01), 10:30 xuất hấp 10kg, 14:00 báo hỏng 1kg cua chết -> Tồn hiện tại: 9kg.

---

### 📌 TASK KHO-13: Cấp Quyền & Thêm Nút "Bếp Nhận & Cân Hàng" Trên Mobile Của Bếp
* **Người nhận việc:** Frontend Developer
* **Mức độ ưu tiên:** **P0** (Chị Thêm: Bếp là người trực tiếp cân và tạo phiếu nhập)
* **Vị trí code cần sửa:**
  - `frontend-demo/src/components/layout/MobileShell.tsx`
  - `frontend-demo/src/components/kitchen/KitchenModule.tsx`
* **Mô tả công việc:**
  1. Trong `MobileShell.tsx`, bổ sung tab **"Nhập Kho"** hoặc nút bấm **"Cân Hàng Về"** trực tiếp trên giao diện của `ROLE_BEP`.
  2. Giao diện mobile tối giản cho Bếp:
     - Bếp chỉ thấy nút: `Cân hàng mới về` -> Chọn nhà cung cấp -> Chọn món -> Nhập số cân thực tế -> Bấm chụp ảnh cân -> Lưu phiếu.
     - Không cho Bếp sửa giá tiền hoặc xem doanh thu/lãi lỗ.
* **Tiêu chí nghiệm thu (DoD):**
  - Đăng nhập tài khoản Bếp trên điện thoại -> Thấy nút tạo phiếu cân hàng nhanh. Bếp cân xong bấm lưu là dữ liệu tự đổ về màn hình Kế toán chi nhánh.

---

### 📌 TASK KHO-14: Quy Trình Cấp Phát Hàng Khô (Khóa Kho & Xuất Dùng Nội Bộ)
* **Người nhận việc:** Frontend Developer
* **Mức độ ưu tiên:** **P1** (Giải quyết triệt để thói quen tự do vào kho lấy hàng khô)
* **Vị trí code cần sửa:** `frontend-demo/src/components/warehouse/WarehouseModule.tsx`
* **Mô tả công việc:**
  1. Tạo phiếu **"Xuất chuyển kho nội bộ" (Chuyển từ Kho Khô -> Bếp)**:
     - Bếp trưởng hoặc người được giao giữ chìa khóa kho thực hiện mở kho phát nguyên liệu 1 lần đầu ca (theo quy định nhà hàng).
     - Ghi nhận: Xuất bao nhiêu gói đường, bao nhiêu lít dầu ăn, bao nhiêu kg hạt nêm sang Bếp.
  2. Hàng khô sau khi phát sang Bếp sẽ chuyển trạng thái sang `Tồn tại Bếp`, trừ tồn tại `Kho khô`.
* **Tiêu chí nghiệm thu (DoD):**
  - Có phiếu xuất chuyển rõ ràng, chấm dứt tình trạng nhân viên tự do vào kho lấy đồ mà không ghi sổ.
