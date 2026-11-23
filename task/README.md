# BẢNG ĐIỀU PHỐI CÔNG VIỆC DỰ ÁN (MASTER TASK TRACKER)
## Dự án: Hệ thống Quản trị Kho Bếp, Nhân sự & Chống Thất Thoát (Sen Việt Buffet)

> **Căn cứ kế hoạch**:
> - [implement_demo_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/implement_demo_plan.md) (Bản Demo 6 Phase - Đã hoàn thành)
> - [phan_bien_va_gop_y_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/phan_bien_va_gop_y_plan.md) (14 Điểm phản biện & hoàn thiện bản Production - Đã hoàn thành)
> - [phase-12-role-view-guard-and-demo-data.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-12-role-view-guard-and-demo-data.md) (Phân view theo vai trò, Cảnh báo nổi bật & Dữ liệu demo khách hàng)
>
> **Kiến trúc cốt lõi**: Java 17 LTS / Spring Boot 3.x + React 18 / TypeScript / Tailwind CSS / Shadcn UI + PostgreSQL 16 + Docker Compose  
> **Chi nhánh mục tiêu**: 02 chi nhánh (Thái Nguyên & Quế Võ)

---

## 1. Tiến Độ Tổng Quan Các Giai Đoạn (Master Phase Overview)

### A. Giai Đoạn Demo Nhanh (Tonight Demo - Đã hoàn thành 100%)

| Giai đoạn | Tên phân hệ / Giai đoạn | File chi tiết | Số task | Trạng thái | Tiến độ |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **P1** | [Khởi tạo Kiến trúc & Hạ tầng Docker](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-1-infrastructure.md) | `phase-1-infrastructure.md` | 6 | ✅ Hoàn thành | 100% |
| **P2** | [Phân hệ Bếp 4 Nút & Chế Biến Mẻ](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-2-kitchen-module.md) | `phase-2-kitchen-module.md` | 6 | ✅ Hoàn thành | 100% |
| **P3** | [Động cơ Chống Thất Thoát & Bảng Cuối Ngày](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-3-anti-loss-reconcile.md) | `phase-3-anti-loss-reconcile.md` | 6 | ✅ Hoàn thành | 100% |
| **P4** | [Chấm Công GPS & Quy Trình Nhân Sự](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-4-hr-attendance.md) | `phase-4-hr-attendance.md` | 6 | ✅ Hoàn thành | 100% |
| **P5** | [Ứng Lương & Bảng Lương Tự Động](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-5-payroll-advance.md) | `phase-5-payroll-advance.md` | 6 | ✅ Hoàn thành | 100% |
| **P6** | [Kiểm Thử E2E, Seed Data & Đóng Gói Demo](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-6-testing-deployment.md) | `phase-6-testing-deployment.md` | 6 | ✅ Hoàn thành | 100% |

---

### B. Giai Đoạn Hoàn Thiện Bản Production (Theo 14 Điểm Phản Biện & Góp Ý - Đã hoàn thành 100%)

| Giai đoạn | Tên phân hệ / Giai đoạn | Điểm phản biện xử lý | File chi tiết | Số task | Trạng thái |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **P7** | [Kho Cơ Sở, Lô Nhập & Nhà Cung Cấp](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-7-warehouse-lots-suppliers.md) | #1, #2, #12 (Phiếu nhập/xuất, lô, NCC, tồn kho, kiểm kê) | `phase-7-warehouse-lots-suppliers.md` | 6 | ✅ Hoàn thành |
| **P8** | [Quy Tắc Chặt Chẽ Bếp & Ra Line](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-8-kitchen-hard-rules.md) | #3, #4, #8, #9, #12 (Chặn mẻ hỏng, món dùng trong ngày, quick add ra line) | `phase-8-kitchen-hard-rules.md` | 6 | ✅ Hoàn thành |
| **P9** | [Phân Quyền Đa Vai Trò (Multi-Role RBAC)](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-9-multi-role-rbac.md) | #6 (1 nhân sự nhiều vai trò, switcher ngữ cảnh) | `phase-9-multi-role-rbac.md` | 5 | ✅ Hoàn thành |
| **P10** | [Nghiệp Vụ Nhân Sự & Khóa Bảng Lương](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-10-hr-payroll-locks.md) | #5, #7, #10, #11 (Khóa bảng lương, lương bỏ việc = 0, hủy bỏ việc nhầm) | `phase-10-hr-payroll-locks.md` | 6 | ✅ Hoàn thành |
| **P11** | [Chịu Lỗi Mất Mạng & Quyền Thiết Bị](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-11-offline-resilience-ux.md) | #13, #14 (Lưu form offline, banner mạng, modal cấp quyền Camera/GPS) | `phase-11-offline-resilience-ux.md` | 4 | ✅ Hoàn thành |

---

### C. Giai Đoạn Nâng Cấp UX Phân Quyền & Dữ Liệu Demo Khách Hàng (Phase 12)

| Giai đoạn | Tên phân hệ / Giai đoạn | Mục tiêu chính | File chi tiết | Số task | Trạng thái |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **P12** | [Phân View Vai Trò, Cảnh Báo Nổi Bật & Dữ Liệu Demo](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-12-role-view-guard-and-demo-data.md) | 1. Ẩn triệt để tính năng không có quyền ngay từ menu<br>2. Thông báo/cảnh báo nổi bật trực quan<br>3. Tạo bộ data mẫu 5-10 records demo khách | `phase-12-role-view-guard-and-demo-data.md` | 4 | ✅ Hoàn thành |

---

### D. Giai Đoạn Tối Ưu Toàn Diện UX/UI Đa Nền Tảng Theo UI/UX Pro Max Skill (Phase 13)

| Giai đoạn | Tên phân hệ / Giai đoạn | Mục tiêu chính | File chi tiết | Số task | Trạng thái |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **P13** | [Tối Ưu UX/UI Đa Nền Tảng (PC, Tablet, Phone) & UI/UX Pro Max](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-13-ui-ux-pro-max-revamp.md) | 1. Chuẩn hóa Design System theo `ui-ux-pro-max-skill`<br>2. Kiến trúc giao diện thích ứng 3 nền tảng (PC, Tablet, Phone)<br>3. Tái thiết kế 5 phân hệ (Bếp, Kho, Đối soát, HR, Lương)<br>4. Đạt chuẩn tiếp cận WCAG 2.1 AA | `phase-13-ui-ux-pro-max-revamp.md` | 7 | 📋 Đã lập kế hoạch |

---

### E. Kế Hoạch Đặc Tả Nghiệp Vụ, Khảo Sát UX & Chuyển Dịch Product

| Tên tài liệu | Phân loại | Mô tả nội dung trọng tâm |
| :--- | :---: | :--- |
| [KE_HOACH_TASK_TAI_CAU_TRUC_KHO_VA_LUONG_BEP_5_NUT.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/KE_HOACH_TASK_TAI_CAU_TRUC_KHO_VA_LUONG_BEP_5_NUT.md) | Nghiệp vụ Kho & Bếp | Tái cấu trúc Kho 2 tầng (trước & sau chế biến), Chuỗi 5 nút cảm ứng Bếp, Cân hàng mới về & Xuất hủy theo lô. |
| [KE_HOACH_TASK_QUAN_LY_KHO_VA_CHONG_GIAN_LAN.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/KE_HOACH_TASK_QUAN_LY_KHO_VA_CHONG_GIAN_LAN.md) | Nghiệp vụ Kho & Bếp | Giải pháp kỹ thuật chống gian lận định lượng, bắt buộc ảnh cân mẻ và đối soát số liệu xuất nhập tồn. |
| [TASKS_QUAN_LY_KHO_SENVIET.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/TASKS_QUAN_LY_KHO_SENVIET.md) | Nghiệp vụ Kho & Bếp | Bộ tiêu chuẩn chi tiết về quản lý thẻ kho, lô hàng nhà cung cấp và đối soát công nợ. |
| [KE_HOACH_TASK_HOAN_THIEN_LOGIC_KHO_VA_TRAI_NGHIEM.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/KE_HOACH_TASK_HOAN_THIEN_LOGIC_KHO_VA_TRAI_NGHIEM.md) | Nghiệp vụ Kho & Bếp | Tối ưu trải nghiệm thao tác kho, ẩn đơn giá tài chính đối với Bếp trưởng/Bếp viên. |
| [KE_HOACH_TASK_TOI_UU_UI_UX_PC_16_9.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/KE_HOACH_TASK_TOI_UU_UI_UX_PC_16_9.md) | Thiết kế UI/UX | Quy chuẩn tối ưu hiển thị màn hình ngang Desktop 16:9 cho máy tính Văn phòng & Kế toán. |
| [BAO_CAO_BAT_TIEN_VA_LOI_UX_VAI_TRO_BEP.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/BAO_CAO_BAT_TIEN_VA_LOI_UX_VAI_TRO_BEP.md) | Khảo sát UX | Khảo sát thực tế các điểm bất tiện của nhân viên bếp và giải pháp khắc phục bằng nút bấm lớn tối thiểu 48px. |
| [HUONG_DAN_TRAI_NGHIEM_THEO_VAI_TRO.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/HUONG_DAN_TRAI_NGHIEM_THEO_VAI_TRO.md) | Hướng dẫn kiểm thử | Sổ tay kịch bản kiểm thử trải nghiệm theo 5 vai trò hệ thống (Bếp, Quản lý bếp, Quản lý chi nhánh, Kế toán, Chủ chuỗi). |
| [KE_HOACH_TASK_CHUYEN_DICH_SANG_PRODUCT.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/KE_HOACH_TASK_CHUYEN_DICH_SANG_PRODUCT.md) | Kế hoạch nâng cấp | Lộ trình dịch chuyển toàn bộ mã nguồn và test suite sang thư mục Production (`backend`, `frontend`, `database`). |
| [KE_HOACH_TASK_NANG_CAP_SAN_PHAM.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/KE_HOACH_TASK_NANG_CAP_SAN_PHAM.md) | Kế hoạch nâng cấp | Kế hoạch tổng thể nâng cấp dự án và hoàn thiện các tiêu chuẩn hợp đồng kinh tế. |

---

## 2. Quy Trình Cập Nhật & Thực Thi (Execution Protocol)

1. **Phân nhánh Git**: `feature/p12-role-views-and-demo-data`
2. **Quy chuẩn mã nguồn**: Tuân thủ tuyệt đối [AGENTS.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/AGENTS.md).
3. **Bảo mật dữ liệu**: Không commit file nội bộ, tài liệu doanh nghiệp hoặc credentials lên Git.
