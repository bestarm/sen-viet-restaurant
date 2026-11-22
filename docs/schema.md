# ĐẶC TẢ CƠ SỞ DỮ LIỆU CHÍNH THỨC — SEN VIỆT BUFFET

> Tài liệu chi tiết và đầy đủ nhất về cấu trúc 35 bảng CSDL, 6 phân hệ nghiệp vụ, quan hệ Foreign Keys và chiến lược Index được lưu trữ tại:  
> 👉 [DATABASE_SCHEMA.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md)

---

## TỔNG QUAN HỆ THỐNG CƠ SỞ DỮ LIỆU
* **Hệ quản trị CSDL**: PostgreSQL 16 (Container `senviet-postgres`)
* **Database Name**: `senviet_db` | **Port**: `5432`
* **Cơ chế Migration**: Flyway Migration (11 phiên bản: `V1` $\rightarrow$ `V11`)
* **Encoding**: `UTF-8` | **Múi giờ**: `Asia/Ho_Chi_Minh` (`UTC+7`)
* **Tổng số bảng**: **35 bảng nghiệp vụ** + 1 bảng theo dõi migration `flyway_schema_history`.

---

## DANH MỤC 35 BẢNG THEO 6 PHÂN HỆ NGHIỆP VỤ

### 1. Phân hệ Xác thực, Phân quyền & Chi nhánh (5 Bảng)
* [`branches`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#11-bảng-branches-danh-mục-chi-nhánh): Quản lý 2 chi nhánh (Thái Nguyên `CN_THAI_NGUYEN` & Quế Võ `CN_QUE_VO`), tọa độ GPS Geofencing.
* [`roles`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#12-bảng-roles-danh-mục-vai-trò): 5 vai trò hệ thống (`ROLE_KITCHEN_STAFF`, `ROLE_HEAD_CHEF`, `ROLE_RESTAURANT_MANAGER`, `ROLE_BRANCH_ACCOUNTANT`, `ROLE_GENERAL_ACCOUNTANT`).
* [`users`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#13-bảng-users-danh-mục-nhân-sự--người-dùng): Tài khoản đăng nhập, chi nhánh trực thuộc, tài khoản ngân hàng, lương cứng.
* [`user_roles`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#14-bảng-user_roles-bảng-phân-quyền-người-dùng---vai-trò): Bảng quan hệ nhiều - nhiều gán vai trò (hỗ trợ kiêm nhiệm).
* [`audit_logs`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#15-bảng-audit_logs-nhật-ký-vết-kiểm-toán): Nhật ký vết kiểm toán cho toàn bộ hành động nhạy cảm.

### 2. Phân hệ Vận hành Bếp & Quy trình 4 Nút (8 Bảng)
* [`items`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#21-bảng-items-danh-mục-hàng-hóa--món-ăn): Danh mục hàng hóa (nguyên liệu thô, bán thành phẩm, món line, đồ uống, gia vị). Giá vốn ẩn đối với thợ bếp và Bếp trưởng.
* [`recipes`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#22-bảng-recipes-công-thức--định-mức-món): Công thức món ăn và định mức hao hụt chuẩn cho phép.
* [`recipe_ingredients`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#23-bảng-recipe_ingredients-chi-tiết-định-mức-nguyên-liệu-công-thức): Chi tiết nguyên liệu cấu thành 1 mẻ.
* [`take_out_logs`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#24-bảng-take_out_logs-nút-1-lấy-hàng-ra-chế-biến): **Nút 1** - Rút nguyên liệu ra chế biến, trừ tồn kho tức thời, cấm rút quá tồn khả dụng.
* [`processing_batches`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#25-bảng-processing_batches-nút-2-cân-mẻ--cân-thành-phẩm): **Nút 2** - Cân mẻ đầu vào, ẩn định mức % hao hụt, chụp ảnh cân thành phẩm thực tế, cảnh báo mở mẻ trùng.
* [`damage_reports`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#26-bảng-damage_reports-nút-3-báo-hỏng-nguyên-liệu): **Nút 3** - Báo hỏng hàng, ảnh chụp nén canvas $\le 250$ KB, xét duyệt bởi Quản lý Bếp.
* [`line_item_logs`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#27-bảng-line_item_logs-nút-4-bấm-ra-line-1): **Nút 4** - Ghi nhận đĩa thức ăn đưa ra line buffet, cơ chế chống click đúp.
* [`daily_waste_confirmations`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#28-bảng-daily_waste_confirmations-biên-bản-chốt-hủy-thức-ăn-cuối-ngày): Chốt hủy thức ăn thừa trên quầy buffet cuối ngày.

### 3. Phân hệ Quản lý Kho, Lô hàng & Nhà cung cấp (7 Bảng)
* [`suppliers`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#31-bảng-suppliers-danh-mục-nhà-cung-cấp): Danh bạ đối tác cung ứng và số dư công nợ.
* [`import_batches`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#32-bảng-import_batches-quản-lý-lô-hàng-nhập-kho): Quản lý hạn sử dụng, ngày sản xuất và số lượng của từng lô hàng theo nguyên tắc FIFO.
* [`warehouse_documents`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#33-bảng-warehouse_documents-phiếu-nhập--xuất-kho): Phiếu nhập NCC, xuất chế biến, xuất hủy, điều chuyển chi nhánh.
* [`warehouse_document_items`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#34-bảng-warehouse_document_items-chi-tiết-mặt-hàng-trong-phiếu-kho): Chi tiết mặt hàng, số lượng và đơn giá trong phiếu kho.
* [`inventory_stocks`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#35-bảng-inventory_stocks-sổ-theo-dõi-tồn-kho-thực-tế): Tồn kho theo từng chi nhánh và phân loại kho (Kho đông lạnh, Kho mát, Kho đồ khô...).
* [`inventory_checks`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#36-bảng-inventory_checks-phiếu-kiểm-kê-kho-định-kỳ): Đợt kiểm kê kho định kỳ.
* [`inventory_check_items`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#37-bảng-inventory_check_items-chi-tiết-mặt-hàng-kiểm-kê): Tồn sổ sách vs Tồn thực tế vs Chênh lệch thừa thiếu.

### 4. Phân hệ Đối soát Bán hàng CukCuk POS & Chống Thất Thoát (4 Bảng)
* [`cukcuk_sales_imports`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#41-bảng-cukcuk_sales_imports-đợt-nhập-dữ-liệu-bán-hàng-từ-pos-cukcuk): Lịch sử import file Excel doanh thu từ CukCuk POS.
* [`inventory_snapshots`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#42-bảng-inventory_snapshots-ảnh-chụp-tồn-kho-đầu--cuối-ngày): Ảnh chụp tồn kho đầu/cuối ngày phục vụ đối soát.
* [`daily_reconciliations`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#43-bảng-daily_reconciliations-bảng-cân-đối--báo-cáo-thất-thoát-cuối-ngày): Tính chênh lệch không rõ nguyên nhân giữa Kho và POS. Bật cờ cảnh báo nếu lệch $> 300.000$ đ hoặc $> 5\%$.
* [`notification_logs`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#44-bảng-notification_logs-nhật-ký-cảnh-báo-zalo-webhook): Nhật ký gửi tin nhắn Webhook Zalo Bot cho Quản lý và Chủ chuỗi.

### 5. Phân hệ Nhân sự, Chấm công GPS & Đồng phục (6 Bảng)
* [`attendances`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#51-bảng-attendances-sổ-chấm-công-gps-geofencing): Chấm công vào/ra kèm tọa độ GPS (bán kính 50m), ảnh selfie, tính giờ làm và đi muộn về sớm.
* [`exam_questions`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#52-bảng-exam_questions-ngân-hàng-đề-thi-tay-nghề-nội-bộ): Đề thi tay nghề nội bộ (bếp, phục vụ).
* [`exam_submissions`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#53-bảng-exam_submissions-bài-thi--kết-quả-sát-hạch-của-nhân-viên): Bài thi và kết quả chấm điểm của nhân viên.
* [`uniform_items`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#54-bảng-uniform_items-danh-mục-đồng-phục--tiền-đặt-cọc): Danh mục đồng phục kèm giá trị tiền cọc.
* [`uniform_allocations`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#55-bảng-uniform_allocations-sổ-cấp-phát--thu-hồi-đồng-phục): Sổ theo dõi cấp phát và thu hồi đồng phục.
* [`resignation_requests`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#56-bảng-resignation_requests-đơn-xin-nghỉ-việc--ràng-buộc-trả-lương): Đơn xin nghỉ việc. Ràng buộc thu hồi đủ đồng phục mới được giải phóng tiền lương giữ lại.

### 6. Phân hệ Tiền lương, Ứng lương & Khóa sổ Kỳ lương (5 Bảng)
* [`salary_rules`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#61-bảng-salary_rules-quy-tắc-tính-thưởng--phạt--phụ-cấp): Quy tắc phạt muộn, thưởng chuyên cần, phụ cấp ca gãy.
* [`salary_advances`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#62-bảng-salary_advances-đơn-xin-ứng-lương-giữa-tháng): Đơn xin ứng lương và trạng thái phê duyệt của Quản lý chi nhánh.
* [`salary_increase_proposals`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#63-bảng-salary_increase_proposals-đề-xuất-tăng-lương-nhân-viên): Đề xuất tăng bậc lương cho nhân sự.
* [`payroll_periods`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#64-bảng-payroll_periods-kỳ-tính-lương--trạng-thái-khóa-sổ): Kỳ tính lương tháng kèm cờ khóa sổ `is_locked` chống sửa đổi số liệu quá khứ.
* [`payrolls`](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md#65-bảng-payrolls-bảng-lương-chi-tiết-từng-nhân-viên): Bảng lương chi tiết từng nhân viên (công, lương cứng, phụ cấp, thưởng, phạt, ứng, thực lĩnh).

---

> Toàn bộ chi tiết về cột, kiểu dữ liệu, ràng buộc và sơ đồ ERD Mermaid xem tại: [DATABASE_SCHEMA.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md)
