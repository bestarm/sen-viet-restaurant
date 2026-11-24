# TASK: TÁI CẤU TRÚC LUỒNG VẬN HÀNH BẾP 5 NÚT CẢM ỨNG & KHO 2 TẦNG

> **Trạng thái**: Sẵn sàng triển khai (Ready for Implementation)  
> **Người thực hiện**: AI Swarm (kitchen-recipe-dev, kitchen-flow-author, kitchen-flow-verifier, monitor-17)  
> **Ngày tạo**: 23/11/2026  

---

## 1. Yêu Cầu Chi Tiết (Specifications)

### Nút 1: Lấy hàng từ kho theo công thức & Tạo mẻ trước chế biến
* Khi bấm Nút 1: Hiện danh sách các món ăn (Hàu nướng mỡ hành, Cua sốt me, Ghẹ hấp sả, Bò sốt tiêu đen, Tôm sú nướng muối ớt, Mực chiên giòn, Cá hồi sốt chanh leo, Ba chỉ bò nướng...).
* Khi người dùng chọn 1 món (ví dụ: Hàu nướng mỡ hành):
  * Bung ra danh sách nguyên liệu theo công thức:
    * Hàu sữa (`QVHAU`): số lượng (kg/con)
    * Hành lá (`QVHANHLA`): số lượng (kg)
    * Mỡ phần (`QVMO`): số lượng (kg)
  * Người dùng nhập số lượng thực tế từng nguyên liệu lấy đi nấu.
  * Bắt buộc chụp/upload ảnh mẻ trước chế biến (ảnh khay nguyên liệu thô trước khi đưa vào bếp).
  * Nhấn "XÁC NHẬN TẠO MẺ & LẤY HÀNG":
    * Tạo mẻ mới ở trạng thái `DANG_LAM` kèm thông tin món và ảnh mẻ trước chế biến.
    * Trừ tồn các nguyên liệu tương ứng trong Kho Trước Chế Biến.

### Nút 2: Cân thành phẩm mẻ sau khi hoàn thành & Nhập Kho Sau Chế Biến
* Xóa bỏ hoàn toàn nút 2.1 (Mở mẻ mới) để tránh trùng lặp với Nút 1.
* Nút 2 chỉ tập trung vào: **CÂN THÀNH PHẨM MẺ HOÀN THÀNH**.
* Chọn mẻ đang làm dở dang (ví dụ: mẻ Hàu nướng mỡ hành vừa tạo từ Nút 1).
* Nhập khối lượng thành phẩm cân được (kg) và số lượng ĐĨA thành phẩm (ví dụ: +20 đĩa).
* Chụp ảnh bàn cân thành phẩm.
* Nhấn gửi:
  * Mẻ chuyển sang hoàn thành.
  * Tự động cộng số đĩa thành phẩm vào Kho Sau Chế Biến (`warehouseApi.addProcessedDishStock`).

### Nút 3: Ra line (+1 đĩa)
* Lấy món trong Kho Sau Chế Biến, hiển thị số đĩa đang có sẵn.
* Nhấn "+1": Khấu trừ 1 đĩa từ Kho Sau Chế Biến.
* Chặn xuất âm và cảnh báo khi hết hàng.

### Nút 4: Báo hỏng mẻ
* Đầu bếp nấu hỏng/cháy mẻ: Chọn mẻ đang làm, nhập lý do hỏng, chụp ảnh mẻ hỏng.

### Nút 5: Tổng hợp món dùng trong ngày & Đồ ăn cuối ca
* Nâng cấp thành: **TỔNG HỢP MÓN DÙNG & ĐỒ ĂN CUỐI CA**.
* Bảng tổng hợp số lượng món ăn trong ngày (Tồn đầu + Nhập từ Nút 2 - Ra line Nút 3 = Tồn hiện tại).
* Form ghi nhận thức ăn thừa cuối ca (vị trí trên line hoặc trong bếp, số lượng, bắt buộc chụp ảnh bàn cân).

### Header Bếp
* Gỡ bỏ nút "Cân hàng mới về" khỏi màn hình KitchenModule để tránh trùng với phân hệ Kho cơ sở.
