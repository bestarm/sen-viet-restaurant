# Database Initialization & Real-World Seed Data (Sen Việt Buffet)

Thư mục này quản lý tệp khởi tạo cơ sở dữ liệu gốc (`init.sql` / `init.db`) cho toàn bộ hệ thống Sen Việt Buffet.

---

## 📁 1. Cấu Trúc Tệp Tin
* [init.sql](file:///run/media/tamdae/Data/Source%20code/restaurant_project/database/init.sql): Kịch bản SQL khởi tạo toàn diện cho PostgreSQL 16 (chứa DDL toàn bộ schema, sequences, triggers, constraints, master seeds và dữ liệu thực tế).
* [init.db](file:///run/media/tamdae/Data/Source%20code/restaurant_project/database/init.db): Bản sao chuẩn của `init.sql` phục vụ khởi tạo nhanh theo quy ước `init.db`.
* [../backend/src/main/resources/db/migration/](file:///run/media/tamdae/Data/Source%20code/restaurant_project/backend/src/main/resources/db/migration): Các migration tự động Flyway (`V1` đến `V12`).

---

## 📦 2. Dữ Liệu Thực Tế Đã Tích Hợp (Real-World Data)

### A. Kho Trước Chế Biến Chi Nhánh Quế Võ (T11/2026)
Trích xuất từ bảng nhập hàng thực tế `remove/NHAP HANG QV T11.2026.xlsx`:
1. **24 Nhà cung cấp thực tế**: `QVTHN` (Chị Tâm Hà Nội), `QVLIENCUA` (Liên Cua Cà Mau), `QVCOPHUONG` (Cô Phượng Nghệ An), `QVCOTHAO` (Cô Thảo đồ khô), `QVCHIPHUONG` (Chị Phượng rau), `QVBASAU` (Bà Sáu), `QVDUNGCH` (Anh Khanh Cá Hồi), `QVANHLUC` (Công ty CP Shalom LG), `QVDCP` (Dũng Cẩm Phả), `QVHUYENHS` (Huyền Hải Sản)...
2. **217 Mặt hàng kho trước chế biến**:
   - `HS_CHINH` (9 món): Cua thịt, Ghẹ, Tôm càng xanh, Tôm lớp, Bề bề, Cá hồi, Cá trích, Mực, Bạch tuộc.
   - `VC_VO_CUNG` (8 món): Hàu, Ngao mỡ, Ngao 2 cùi, Ốc hương, Ốc nhồi, Sần, Sò lông, Vẹm xanh.
   - `HS_PHU` (4 món): Tôm mũ ni, Chân sứa, Cá lăng, Cua xay.
   - `THIT` (20 món): Ba chỉ bò thanh, Ba chỉ bò mảnh, Bò tơ, Dẻ sườn bò, Cánh gà, Xúc xích bi...
   - `RAU` (70 món): Dứa, Cam, Thanh long, Mướp, Bún, Cải ngồng, Nấm, Cà chua...
   - `HANG_KHO` (63 món): Sữa chua, Dầu hào, Nước mắm, Bột nếp, Bột năng, Mì chính...
   - `DO_AN_NHAN_VIEN` (15 món): Gạo nhân viên, Nạc vai, Thịt xay, Trứng cút, Cá rô phi...
   - `BAR` (3 món): Bia Tiger, Nước Dasani, Khăn ướt.
   - `TIEU_HAO` (23 món): Gas công nghiệp, Than không khói, Nước rửa bát, Gang tay...
   - `VC_CUA_GHE` (1 món): Vận chuyển Cua Ghẹ.
   - `VC_KHAC` (1 món): Vận chuyển Huyền hải sản, xe khách...
3. **Số dư tồn kho khởi tạo ban đầu**:
   - Tự động nạp vào `import_batches` và `inventory_stocks` cho chi nhánh Quế Võ (`CN_QUE_VO`) để Bếp và Kho có thể thao tác ngay.

---

## 🚀 3. Cách Sử Dụng Khởi Tạo Database

### Cách 1: Tự động qua Docker Compose (Khuyên dùng)
Trong [docker-compose.yml](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docker-compose.yml), thư mục `./database/init.sql` đã được gắn tự động vào `/docker-entrypoint-initdb.d/init.sql`:
```bash
# Khởi động container Postgres (sẽ tự động chạy init.sql khi tạo DB mới)
docker compose up -d postgres
```

### Cách 2: Chạy thủ công trên PostgreSQL đang chạy
```bash
docker exec -i senviet-postgres psql -U senviet_user -d senviet_db < database/init.sql
```

### Cách 3: Chạy qua Spring Boot Flyway
Khi chạy Backend Spring Boot, Flyway sẽ tự động kiểm tra và áp dụng tất cả migrations từ `V1` đến `V12__seed_real_preprocessing_inventory_que_vo.sql`.

---

## 🔄 4. Quy Trình Cập Nhật Khi Có Thêm Dữ Liệu Thực Tế Mới
Khi có thêm dữ liệu thực tế mới (ví dụ: Danh mục món ăn Kho Sau Chế Biến):
1. Bổ sung script migration mới `V13__...sql` vào `backend/src/main/resources/db/migration/`.
2. Áp dụng vào database đang chạy.
3. Xuất lại tệp `database/init.sql` và `database/init.db` bằng lệnh:
   ```bash
   docker exec -i senviet-postgres pg_dump -U senviet_user -d senviet_db --no-owner --no-acl > database/init.sql
   cp database/init.sql database/init.db
   ```
4. Commit và đồng bộ lên Git.
