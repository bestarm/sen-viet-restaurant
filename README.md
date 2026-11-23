# Hệ Thống Quản Trị Kho Bếp, Nhân Sự & Chống Thất Thoát — Sen Việt Buffet

> **Chủ đầu tư**: Công ty TNHH T&T Nguyễn Dương (Đại diện: Chị Thêm)  
> **Chi nhánh ban đầu**: 02 Chi nhánh (Thái Nguyên & Quế Võ)  
> **Phiên bản release**: `v1.0.0-Demo` (Tonight Demo Release)  
> **Công nghệ**: Java 17 LTS / Spring Boot 3.2.5 + React 18 / TypeScript / Tailwind CSS / Lucide Icons + PostgreSQL 16 + Docker Compose  

---

## 1. Kiến Trúc Kỹ Thuật (Architecture & Tech Stack)

Hệ thống được đóng gói hoàn chỉnh bằng Docker Compose đa tầng, phân tách rõ ràng giữa Backend REST API và Frontend Single Page Application:

```
                                  [ Client Browser ]
                        Mobile Web (Bếp) / Desktop Dashboard
                                          │
                                          ▼
                               [ Nginx Reverse Proxy ]
                              (Port 80 - Container SPA)
                                          │
                        ┌─────────────────┴─────────────────┐
                        │ /api/*                            │ Static Assets
                        ▼                                   ▼
             [ Spring Boot 3.2.5 Backend ]           [ React 18 + TS ]
               (Port 8080 - Java 17 LTS)             (Tailwind CSS)
                        │
                        ▼
             [ PostgreSQL 16 Database ]
               (Port 5432 - UTF-8 / HCM)
```

- **Backend**: Spring Boot 3.2.5, Spring Security 6.x + JWT (HMAC-SHA256), Spring Data JPA, PostgreSQL Driver, Flyway Migration (`V1` $\rightarrow$ `V6`), Apache POI 5.2.5 (Excel Parser & Generator), Spring Boot Actuator.
- **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS, Lucide React, Axios, HTML5 Geolocation API, HTML5 Canvas Image Compressor.
- **Hạ tầng**: Docker & Multi-stage Dockerfile tối ưu kích thước, User không đặc quyền `appuser`, Volume bền vững `postgres_data`.

---

## 2. Khởi Động Nhanh (1-Click Quickstart)

### Bước 1: Khởi chạy toàn bộ hệ thống bằng Docker Compose
```bash
# Khởi động PostgreSQL 16, Backend Spring Boot và Frontend Nginx
docker compose up -d --build
```

### Bước 2: Truy cập ứng dụng
- **Giao diện Web App (Mobile & Desktop)**: [http://localhost](http://localhost) (Port 80)
- **Backend Actuator Healthcheck**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- **Tài liệu Swagger UI / OpenAPI**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

---

## 3. Danh Sách Tài Khoản Demo (5 Vai Trò RBAC)

Hệ thống được nạp sẵn bộ dữ liệu mẫu sống động cho 2 chi nhánh (**Thái Nguyên** & **Quế Võ**). Toàn bộ tài khoản sử dụng mật khẩu chung: `Demo@123456`.

| STT | Tên tài khoản | Mật khẩu | Họ và Tên | Vai trò hệ thống | Chi nhánh | Phạm vi quyền hạn |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `bep_thainguyen` | `Demo@123456` | Nguyễn Văn Bếp | `ROLE_KITCHEN_STAFF` | Thái Nguyên | Màn hình Bếp 4 nút lớn, Cân mẻ hụt, Báo hỏng ảnh |
| **2** | `quanly_thainguyen` | `Demo@123456` | Trần Quản Lý | `ROLE_RESTAURANT_MANAGER` | Thái Nguyên | Duyệt hủy, chấm thi thực hành, thu hồi đồng phục |
| **3** | `ketoan_thainguyen` | `Demo@123456` | Lê Kế Toán | `ROLE_BRANCH_ACCOUNTANT` | Thái Nguyên | Upload Excel CukCuk, đối soát kho, duyệt chi ứng lương |
| **4** | `ketoan_tong` | `Demo@123456` | Phạm Kế Toán Tổng | `ROLE_GENERAL_ACCOUNTANT` | Toàn hệ thống | Chốt bảng lương toàn chuỗi, duyệt tăng lương, xuất Excel ngân hàng |
| **5** | `nhanvien_quevo` | `Demo@123456` | Hoàng Nhân Viên | `ROLE_EMPLOYEE` | Quế Võ | Chấm công GPS selfie, làm bài thi quý, xin ứng lương |

---

## 4. Kịch Bản Kiểm Thử & Nghiệm Thu 10 Tiêu Chí Hợp Đồng (E2E Scenarios)

### Tiêu chí 1: Màn hình Bếp 4 nút bấm lớn di động & Chống double-click
- Đăng nhập: `bep_thainguyen`
- Giao diện tối ưu Mobile-first với 4 nút cực lớn: **LẤY HÀNG**, **CHẾ BIẾN MẺ**, **RA LINE (+1)**, **BÁO HỎNG**.
- Nút **RA LINE (+1)** tích hợp khóa nút tức thì, animation spinner phản hồi và cơ chế chống bấm đúp bảo vệ tính toàn vẹn dữ liệu.

### Tiêu chí 2: Cân mẻ hụt vượt định mức báo cờ đỏ trực quan
- Tại nút **CHẾ BIẾN MẺ**: Chọn món *Cua Cà Mau hấp* (Định mức hao hụt chuẩn $20\%$).
- Nhập đầu vào thô $10.0\text{ kg}$, thành phẩm $7.0\text{ kg}$ (Hao hụt thực tế $30\% > 20\%$).
- Hệ thống tự động gắn cờ đỏ `is_over_standard = true` cảnh báo Quản lý Bếp.

### Tiêu chí 3: Cảnh báo đỏ khi mở mẻ chế biến thứ hai dở dang
- Trong khi món *Cua Cà Mau* đang có một mẻ ở trạng thái `DANG_LAM`, tiếp tục nhấn mở thêm mẻ mới cho món này.
- Hệ thống lập tức bật Modal cảnh báo đỏ: *"Món này đang có mẻ chưa hoàn tất cân thành phẩm. Bạn có chắc chắn muốn mở thêm mẻ mới?"* ngăn chặn việc mở mẻ mới nhằm che giấu hao hụt mẻ cũ.

### Tiêu chí 4: Nạp file Excel CukCuk POS & Động cơ 6 công thức đối soát kho cuối ngày
- Đăng nhập: `ketoan_thainguyen` $\rightarrow$ Menu **Đối Soát Cuối Ngày (CukCuk)**.
- Tải file Excel mẫu hoặc upload file bán hàng thực tế từ CukCuk POS: Hệ thống tự động bóc tách doanh thu và số lượng khách.
- Bảng đối soát áp dụng **6 công thức kế toán kho**: Các dòng thất thoát vượt ngưỡng ($> 300.000\text{ đ}$ hoặc $> 5\%$) tự động được **tô đỏ toàn bộ dòng** và kích hoạt log cảnh báo Webhook Zalo Bot.

### Tiêu chí 5: Chấm công camera selfie & Định vị GPS Geofencing
- Đăng nhập: `nhanvien_quevo` $\rightarrow$ Menu **Chấm công**.
- Hệ thống kích hoạt camera chụp selfie và tính khoảng cách Haversine từ GPS thiết bị đến tọa độ chi nhánh.
- Nếu khoảng cách $\le 100\text{m}$: Badge xanh *"VỊ TRÍ HỢP LỆ"*.
- Nếu khoảng cách $> 100\text{m}$: Cảnh báo đỏ *"VI PHẠM GEOFENCE"*.

### Tiêu chí 6: Kỳ thi định kỳ quý trắc nghiệm đếm ngược giờ server
- Menu **Kỳ Thi Định Kỳ**: Chọn khối Bếp / Phục vụ, đồng hồ đếm ngược 15:00.
- Câu hỏi trắc nghiệm tự động đảo thứ tự. Khi nộp bài: Máy chủ chấm điểm lý thuyết tự động thang 100.
- Quản lý nhà hàng chấm phần thực hành: Tổng điểm $= 40\% \text{Lý thuyết} + 60\% \text{Thực hành}$ ($\ge 70\text{ đ}$ là ĐẠT).

### Tiêu chí 7: Quy trình ứng lương & Duyệt chi khấu trừ tự động
- Nhân viên gửi đơn xin ứng $1.500.000\text{ đ}$ kèm lý do.
- Kế toán mở bảng duyệt chi, nhập số tiền thực chi và ấn định tháng khấu trừ (`YYYY-MM`).
- Khi tổng hợp lương cuối tháng, hệ thống tự động trừ tiền tạm ứng vào cột *Trừ Tạm Ứng*.

### Tiêu chí 8: Bàn giao đồng phục nghỉ việc & Ràng buộc giữ lương
- Nhân viên nộp đơn xin nghỉ việc.
- Quản lý mở Checklist đồng phục đã cấp:
  - Nếu thiếu dù chỉ 01 món $\rightarrow$ Trạng thái tự động chuyển thành **ĐANG GIỮ LƯƠNG** (liệt kê rõ tên món thiếu) và khóa thanh toán.
  - Khi tick nhận đủ 100% $\rightarrow$ Chuyển **HOÀN TẤT BÀN GIAO** và mở khóa thanh toán.

### Tiêu chí 9: Quét nhân viên tự ý bỏ việc 3 ngày & Đưa lương về 0 đ
- Tính năng quét tự động nhân viên không chấm công 3 ngày liên tiếp.
- Quản lý nhấn *Xác nhận bỏ việc* $\rightarrow$ Hệ thống khóa tài khoản, tự động thiết lập **Lương = 0 đ** với ghi chú *"Bỏ việc — không trả theo quy định"*.

### Tiêu chí 10: Xuất file Excel lệnh chi chuyển khoản ngân hàng chuẩn
- Đăng nhập: `ketoan_tong` $\rightarrow$ Nhấn **Xuất File Ngân Hàng**.
- File Excel được tải xuống với đầy đủ STK, Tên chủ TK, Ngân hàng, Số tiền thực lĩnh.
- **Ràng buộc an toàn tài chính**: Toàn bộ nhân viên có trạng thái `BO_VIEC` hoặc `DANG_GIU_LUONG` được loại trừ 100% khỏi file chuyển khoản.

---

## 5. Lệnh Thường Dùng Khi Phát Triển Local

```bash
# 1. Chạy toàn bộ Unit Tests backend (Maven trong Docker)
docker run --rm -v "$(pwd)/backend":/app -v "$HOME/.m2":/root/.m2 -w /app maven:3.9-eclipse-temurin-17-alpine mvn test -B

# 2. Build gói JAR Backend
docker run --rm -v "$(pwd)/backend":/app -v "$HOME/.m2":/root/.m2 -w /app maven:3.9-eclipse-temurin-17-alpine mvn package -DskipTests -B

# 3. Build gói Frontend Production (Node 20 trong Docker)
docker run --rm -v "$(pwd)/frontend":/app -w /app node:20-alpine npm run build

# 4. Xem logs realtime của các container
docker compose logs -f backend
docker compose logs -f frontend
```

---

## 6. Thư Mục Tài Liệu & Kế Hoạch (Documentation & Tasks)

- **Tài liệu Thiết kế Cơ sở Dữ liệu & Schema**: [docs/DATABASE_SCHEMA.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/docs/DATABASE_SCHEMA.md)
- **Kế hoạch kỹ thuật & Báo cáo nghiệp vụ**: [task/README.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/README.md)

---
*Dự án được xây dựng và nghiệm thu theo đúng tiêu chuẩn Enterprise của Sen Việt Buffet.*
