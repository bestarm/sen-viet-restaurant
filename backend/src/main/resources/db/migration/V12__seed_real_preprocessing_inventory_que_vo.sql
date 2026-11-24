-- ==============================================================================
-- Flyway Migration V12: Nạp dữ liệu thực tế Kho Trước Chế Biến Chi Nhánh Quế Võ
-- Căn cứ: Sheet NHAPHANG trong tệp remove/NHAP HANG QV T11.2026.xlsx
-- Bao gồm: 24 Nhà cung cấp thực tế, 217 Mặt hàng kho trước chế biến & Tồn kho ban đầu
-- ==============================================================================

-- 1. NẠP 24 NHÀ CUNG CẤP THỰC TẾ TỪ SỔ NHẬP HÀNG QUẾ VÕ
INSERT INTO suppliers (supplier_code, supplier_name, phone, address, status, created_at, updated_at)
VALUES
    ('QVANHLUC', 'Công ty Cổ Phần  Shalom LG', '0988000017', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVAXH', 'Anh xứng hạnh', '0988000005', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVBAOTUYET', 'Bia bão tuyết', '0988000012', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVBASAU', 'Bà Sáu', '0988000004', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVBBKS', 'Bánh bao kim sa', '0988000015', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVBH', 'Tiền bảo hiểm', '0988000023', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVCHIPHUONG', 'Chị Phượng rau', '0988000001', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVCHIVINH', 'Chị Vinh- Hà Dũng', '0988000016', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVCONTRUNG', 'Diệt Côn Trùng', '0988000021', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVCOPHUONG', 'Cô Phượng Nghệ An', '0988000014', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVCOTHAO', 'Cô Thảo đồ khô', '0988000010', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVDCP', 'Dũng Cẩm Phả', '0988000013', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVDUNGCH', 'Anh Khanh Cá Hồi', '0988000003', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVDX', 'Đá xay', '0988000008', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVGAS', 'Gas Hồng Lĩnh', '0988000020', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVHUYENHS', 'Huyền hải sản', '0988000006', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVKEMY', 'Kem Ý', '0988000019', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVLIENCUA', 'Liên Cua Cà Mau', '0988000009', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVLV', 'Chi Lặt Vặt', '0988000011', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVNHUNG', 'Cô Nhưng', '0988000002', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVQUANGCAO', 'Chi phí quảng cáo', '0988000022', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVQUANGHUE', 'Rượu Quang Huệ', '0988000018', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVTHN', 'Chị Tâm Hà Nội', '0988000007', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW()),
    ('QVVQV', 'Vũ quế võ', '0988000024', 'Quế Võ, Bắc Ninh', 'HOAT_DONG', NOW(), NOW())
ON CONFLICT (supplier_code) DO UPDATE
SET supplier_name = EXCLUDED.supplier_name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    updated_at = NOW();

-- 2. NẠP 217 MẶT HÀNG KHO TRƯỚC CHẾ BIẾN (11 NHÓM DANH MỤC CHUẨN HÓA)
INSERT INTO items (item_code, barcode, item_name, category, unit, cost_price, is_buffet_line, created_at, updated_at)
VALUES
    ('QVBANHMY', 'BAR-QVBANHMY', 'Bánh mỳ dài', 'RAU', 'CÁI', 12000.00, false, NOW(), NOW()),
    ('QVBANHXEO', 'BAR-QVBANHXEO', 'Bột bánh xèo 400g', 'HANG_KHO', 'GÓI', 40000.00, false, NOW(), NOW()),
    ('QVBAP', 'BAR-QVBAP', 'Bắp Bò', 'THIT', 'KG', 187000.00, false, NOW(), NOW()),
    ('QVBAPNGO', 'BAR-QVBAPNGO', 'Bắp Ngô', 'RAU', 'BẮP', 10000.00, false, NOW(), NOW()),
    ('QVBBC', 'BAR-QVBBC', 'Bột bánh cuốn 1T= 24 goi', 'HANG_KHO', 'GÓI', 20000.00, false, NOW(), NOW()),
    ('QVBBKS', 'BAR-QVBBKS', 'Bánh Bao Kim Sa', 'HANG_KHO', 'CÁI', 4200.00, false, NOW(), NOW()),
    ('QVBCBT', 'BAR-QVBCBT', 'Ba Chỉ Bò Thanh', 'THIT', 'KG', 198000.00, false, NOW(), NOW()),
    ('QVBCHH', 'BAR-QVBCHH', 'Muối Hảo Hảo 500g', 'HANG_KHO', 'GÓI', 22000.00, false, NOW(), NOW()),
    ('QVBCL', 'BAR-QVBCL', 'Ba Chỉ Lợn', 'THIT', 'KG', 135000.00, false, NOW(), NOW()),
    ('QVBCLNV', 'BAR-QVBCLNV', 'Ba Chỉ Lợn', 'DO_AN_NHAN_VIEN', 'KG', 135000.00, false, NOW(), NOW()),
    ('QVBCT', 'BAR-QVBCT', 'Bắp Cải Tím', 'RAU', 'KG', 15000.00, false, NOW(), NOW()),
    ('QVBCTR', 'BAR-QVBCTR', 'Bắp Cải Trắng', 'RAU', 'KG', 15000.00, false, NOW(), NOW()),
    ('QVBCX', 'BAR-QVBCX', 'Bột Chiên Xù 1kg', 'HANG_KHO', 'GÓI', 55000.00, false, NOW(), NOW()),
    ('QVBDS', 'BAR-QVBDS', 'Bao Đũa Sạch', 'TIEU_HAO', 'CÁI', 170.00, false, NOW(), NOW()),
    ('QVBEBE', 'BAR-QVBEBE', 'Bề Bề', 'HS_CHINH', 'KG', 210000.00, false, NOW(), NOW()),
    ('QVBICHUOI', 'BAR-QVBICHUOI', 'Bi Chuối', 'RAU', 'CÁI', 15000.00, false, NOW(), NOW()),
    ('QVBM', 'BAR-QVBM', 'Bột Mỳ 1kg', 'HANG_KHO', 'GÓI', 21000.00, false, NOW(), NOW()),
    ('QVBOTCANH', 'BAR-QVBOTCANH', 'Bột Canh Hải Châu 190g', 'HANG_KHO', 'GÓI', 20000.00, false, NOW(), NOW()),
    ('QVBOTNANG', 'BAR-QVBOTNANG', 'Bột Năng 1kg', 'HANG_KHO', 'GÓI', 24000.00, false, NOW(), NOW()),
    ('QVBOTNEP', 'BAR-QVBOTNEP', 'Bột Nếp 400g', 'HANG_KHO', 'GÓI', 40000.00, false, NOW(), NOW()),
    ('QVBOTOTHAN', 'BAR-QVBOTOTHAN', 'Bột Ớt Hàn Quốc 1kg', 'HANG_KHO', 'GÓI', 140000.00, false, NOW(), NOW()),
    ('QVBOTTE', 'BAR-QVBOTTE', 'Bột GẠO TẺ 400g', 'HANG_KHO', 'GÓI', 20000.00, false, NOW(), NOW()),
    ('QVBR', 'BAR-QVBR', 'Bỗng Rượu', 'HANG_KHO', 'LÍT', 10000.00, false, NOW(), NOW()),
    ('QVBRM', 'BAR-QVBRM', 'Bột Rang Muối', 'HANG_KHO', 'KG', 190000.00, false, NOW(), NOW()),
    ('QVBUN', 'BAR-QVBUN', 'Bún', 'RAU', 'KG', 15000.00, false, NOW(), NOW()),
    ('QVBUOINGOT', 'BAR-QVBUOINGOT', 'Bưởi Ngọt', 'RAU', 'QUẢ', 15000.00, false, NOW(), NOW()),
    ('QVCACHUA', 'BAR-QVCACHUA', 'Cà Chua', 'RAU', 'KG', 25000.00, false, NOW(), NOW()),
    ('QVCACHUABI', 'BAR-QVCACHUABI', 'Cà Chua Bi', 'RAU', 'KG', 50000.00, false, NOW(), NOW()),
    ('QVCAHOI', 'BAR-QVCAHOI', 'Cá Hồi', 'HS_CHINH', 'KG', 320000.00, false, NOW(), NOW()),
    ('QVCAICANH', 'BAR-QVCAICANH', 'Cải Canh', 'RAU', 'MỚ', 8000.00, false, NOW(), NOW()),
    ('QVCAICUC', 'BAR-QVCAICUC', 'Cải Cúc', 'RAU', 'MỚ', 10000.00, false, NOW(), NOW()),
    ('QVCAINGONG', 'BAR-QVCAINGONG', 'Cải Ngồng', 'RAU', 'KG', 10000.00, false, NOW(), NOW()),
    ('QVCAITHAO', 'BAR-QVCAITHAO', 'Cải Thảo', 'RAU', 'KG', 9000.00, false, NOW(), NOW()),
    ('QVCALANG', 'BAR-QVCALANG', 'Cá Lăng', 'HS_PHU', 'KG', 110000.00, false, NOW(), NOW()),
    ('QVCAM', 'BAR-QVCAM', 'Cam Ngọt', 'RAU', 'KG', 20000.00, false, NOW(), NOW()),
    ('QVCANTT', 'BAR-QVCANTT', 'Cần Tỏi Tây', 'RAU', 'KG', 30000.00, false, NOW(), NOW()),
    ('QVCAPHAO', 'BAR-QVCAPHAO', 'Cà Pháo', 'RAU', 'KG', 20000.00, false, NOW(), NOW()),
    ('QVCATRICH', 'BAR-QVCATRICH', 'Cá Trích', 'HS_CHINH', 'KG', 310000.00, false, NOW(), NOW()),
    ('QVCBS', 'BAR-QVCBS', 'Chả Bọc Sả', 'THIT', 'KG', 100000.00, false, NOW(), NOW()),
    ('QVCGCX', 'BAR-QVCGCX', 'Chân Gà Có Xương', 'THIT', 'KG', 62000.00, false, NOW(), NOW()),
    ('QVCGG', 'BAR-QVCGG', 'Cánh Gà Giữa', 'THIT', 'KG', 86000.00, false, NOW(), NOW()),
    ('QVCGRX', 'BAR-QVCGRX', 'Chân gà rút xương', 'THIT', 'KG', 97000.00, false, NOW(), NOW()),
    ('QVCHA', 'BAR-QVCHA', 'Chả Thịt Lợn', 'THIT', 'KG', 90000.00, false, NOW(), NOW()),
    ('QVCHANGIO', 'BAR-QVCHANGIO', 'Chân Giò', 'DO_AN_NHAN_VIEN', 'KG', 80000.00, false, NOW(), NOW()),
    ('QVCHANH', 'BAR-QVCHANH', 'Chanh Quả', 'RAU', 'KG', 35000.00, false, NOW(), NOW()),
    ('QVCHANSU', 'BAR-QVCHANSU', 'Chân Sú', 'DO_AN_NHAN_VIEN', 'KG', 100000.00, false, NOW(), NOW()),
    ('QVCHANSUA', 'BAR-QVCHANSUA', 'Chân  Sứa', 'HS_PHU', 'KG', 120000.00, false, NOW(), NOW()),
    ('QVCOC', 'BAR-QVCOC', 'Cóc', 'RAU', 'KG', 30000.00, false, NOW(), NOW()),
    ('QVCONKHO', 'BAR-QVCONKHO', 'Cồn Khô', 'TIEU_HAO', 'BỊCH', 28000.00, false, NOW(), NOW()),
    ('QVCR', 'BAR-QVCR', 'Cà Rốt', 'RAU', 'KG', 15000.00, false, NOW(), NOW()),
    ('QVCRP', 'BAR-QVCRP', 'Cá Rô Phi', 'DO_AN_NHAN_VIEN', 'KG', 55000.00, false, NOW(), NOW()),
    ('QVCTD', 'BAR-QVCTD', 'Chân Trâu Đen 1kg', 'HANG_KHO', 'KG', 26666.00, false, NOW(), NOW()),
    ('QVCUA', 'BAR-QVCUA', 'Cua Thịt', 'HS_CHINH', 'KG', 210000.00, false, NOW(), NOW()),
    ('QVCUCAI', 'BAR-QVCUCAI', 'Củ Cải', 'RAU', 'KG', 13000.00, false, NOW(), NOW()),
    ('QVCUDAU', 'BAR-QVCUDAU', 'Củ Đậu', 'RAU', 'KG', 10000.00, false, NOW(), NOW()),
    ('QVCX', 'BAR-QVCX', 'Cua Xay', 'HS_PHU', 'KG', 85000.00, false, NOW(), NOW()),
    ('QVDAM', 'BAR-QVDAM', 'Dấm trắng 2 Lít 6 can', 'HANG_KHO', 'CAN', 43333.00, false, NOW(), NOW()),
    ('QVDAMHONG', 'BAR-QVDAMHONG', 'Dấm Hồng 620ml', 'HANG_KHO', 'CHAI', 30000.00, false, NOW(), NOW()),
    ('QVDAPCA', 'BAR-QVDAPCA', 'Dấp Cá', 'RAU', 'KG', 25000.00, false, NOW(), NOW()),
    ('QVDAUAN', 'BAR-QVDAUAN', 'Dầu Ăn 18.2 Lít/ 1 thùng', 'HANG_KHO', 'THÙNG', 700000.00, false, NOW(), NOW()),
    ('QVDAUBAP', 'BAR-QVDAUBAP', 'Đậu Bắp', 'RAU', 'KG', 40000.00, false, NOW(), NOW()),
    ('QVDAUCHUOI', 'BAR-QVDAUCHUOI', 'Dầu Chuối', 'HANG_KHO', 'CHAI', 50000.00, false, NOW(), NOW()),
    ('QVDAUCOVE', 'BAR-QVDAUCOVE', 'Đậu kove', 'RAU', 'KG', 20000.00, false, NOW(), NOW()),
    ('QVDAUDEN', 'BAR-QVDAUDEN', 'Đậu Đen', 'HANG_KHO', 'KG', 66000.00, false, NOW(), NOW()),
    ('QVDAUHAO', 'BAR-QVDAUHAO', 'Dầu Hào 700g', 'HANG_KHO', 'CHAI', 25000.00, false, NOW(), NOW()),
    ('QVDAUME', 'BAR-QVDAUME', 'Dầu Mè 250ml', 'HANG_KHO', 'CHAI', 50000.00, false, NOW(), NOW()),
    ('QVDAUPHU', 'BAR-QVDAUPHU', 'Đậu Phụ', 'RAU', 'BÌA', 3500.00, false, NOW(), NOW()),
    ('QVDAUXANH', 'BAR-QVDAUXANH', 'Đậu Xanh', 'HANG_KHO', 'KG', 52000.00, false, NOW(), NOW()),
    ('QVDTN', 'BAR-QVDTN', 'Đường Thốt Nốt', 'HANG_KHO', 'KG', 40000.00, false, NOW(), NOW()),
    ('QVDUA', 'BAR-QVDUA', 'Dứa', 'RAU', 'QUẢ', 20000.00, false, NOW(), NOW()),
    ('QVDUACHUA', 'BAR-QVDUACHUA', 'Dưa Chua', 'RAU', 'KG', 20000.00, false, NOW(), NOW()),
    ('QVDUACHUOT', 'BAR-QVDUACHUOT', 'Dưa Chuột', 'RAU', 'KG', 20000.00, false, NOW(), NOW()),
    ('QVDUAHAU', 'BAR-QVDUAHAU', 'Dưa Hấu', 'RAU', 'KG', 17000.00, false, NOW(), NOW()),
    ('QVDUAKHO', 'BAR-QVDUAKHO', 'Dừa Khô 275g', 'HANG_KHO', 'GÓI', 24000.00, false, NOW(), NOW()),
    ('QVDUALUOI', 'BAR-QVDUALUOI', 'Dưa Lưới', 'RAU', 'KG', 40000.00, false, NOW(), NOW()),
    ('QVDUDU', 'BAR-QVDUDU', 'Đu Đủ Xanh', 'RAU', 'KG', 15000.00, false, NOW(), NOW()),
    ('QVDUONG', 'BAR-QVDUONG', 'Đường 0.9g 1bao= 30 gói', 'HANG_KHO', 'KG', 20666.00, false, NOW(), NOW()),
    ('QVDV', 'BAR-QVDV', 'Đá Viên', 'TIEU_HAO', 'TÚI', 8000.00, false, NOW(), NOW()),
    ('QVDX', 'BAR-QVDX', 'Đá Xay', 'TIEU_HAO', 'TÚI', 8000.00, false, NOW(), NOW()),
    ('QVGA', 'BAR-QVGA', 'Gà', 'DO_AN_NHAN_VIEN', 'KG', 85000.00, false, NOW(), NOW()),
    ('QVGANLON', 'BAR-QVGANLON', 'Gan Lợn', 'DO_AN_NHAN_VIEN', 'KG', 40000.00, false, NOW(), NOW()),
    ('QVGAONHAT', 'BAR-QVGAONHAT', 'Gạo Nhật 1 bao = 25kg', 'HANG_KHO', 'KG', 20800.00, false, NOW(), NOW()),
    ('QVGASN', 'BAR-QVGASN', 'Bình Ga Nhỏ (12kg)', 'TIEU_HAO', 'KG', 37038.00, false, NOW(), NOW()),
    ('QVGAST', 'BAR-QVGAST', 'Bình Ga To (47kg)', 'TIEU_HAO', 'KG', 37000.00, false, NOW(), NOW()),
    ('QVGE', 'BAR-QVGE', 'Genlatine', 'HANG_KHO', 'TÚI', 340000.00, false, NOW(), NOW()),
    ('QVGHE', 'BAR-QVGHE', 'Ghẹ', 'HS_CHINH', 'KG', 210000.00, false, NOW(), NOW()),
    ('QVGIA', 'BAR-QVGIA', 'Giá Đỗ', 'RAU', 'KG', 15000.00, false, NOW(), NOW()),
    ('QVGIAYRUT', 'BAR-QVGIAYRUT', 'Giấy Rút', 'TIEU_HAO', 'BỊCH', 285000.00, false, NOW(), NOW()),
    ('QVGIENGC', 'BAR-QVGIENGC', 'Giềng Củ', 'RAU', 'KG', 20000.00, false, NOW(), NOW()),
    ('QVGIO', 'BAR-QVGIO', 'Giò', 'THIT', 'KG', 110000.00, false, NOW(), NOW()),
    ('QVGNV', 'BAR-QVGNV', 'Gạo Nhân Viên', 'DO_AN_NHAN_VIEN', 'KG', 17000.00, false, NOW(), NOW()),
    ('QVGT', 'BAR-QVGT', 'Gừng Tàu', 'RAU', 'KG', 48000.00, false, NOW(), NOW()),
    ('QVGTTB', 'BAR-QVGTTB', 'Gang Tay Túi Bóng', 'TIEU_HAO', 'KG', 70000.00, false, NOW(), NOW()),
    ('QVGUNG', 'BAR-QVGUNG', 'Gừng Ta', 'RAU', 'KG', 25000.00, false, NOW(), NOW()),
    ('QVHANH', 'BAR-QVHANH', 'Hành Hoa', 'RAU', 'KG', 35000.00, false, NOW(), NOW()),
    ('QVHANHKHO', 'BAR-QVHANHKHO', 'Hành khô phi 1 kg', 'HANG_KHO', 'KG', 90000.00, false, NOW(), NOW()),
    ('QVHANHTA', 'BAR-QVHANHTA', 'Hành Khô Tươi', 'RAU', 'KG', 25000.00, false, NOW(), NOW()),
    ('QVHANHTAY', 'BAR-QVHANHTAY', 'Hành Tây', 'RAU', 'KG', 15000.00, false, NOW(), NOW()),
    ('QVHATE', 'BAR-QVHATE', 'Hạt É', 'HANG_KHO', 'KG', 120000.00, false, NOW(), NOW()),
    ('QVHATSEN', 'BAR-QVHATSEN', 'Hạt Sen', 'RAU', 'KG', 180000.00, false, NOW(), NOW()),
    ('QVHAU', 'BAR-QVHAU', 'Hàu', 'VC_VO_CUNG', 'KG', 17000.00, false, NOW(), NOW()),
    ('QVHN', 'BAR-QVHN', 'Hạt Nêm 5kg', 'HANG_KHO', 'TÚI', 30000.00, false, NOW(), NOW()),
    ('QVHOA', 'BAR-QVHOA', 'Hoa Lan', 'TIEU_HAO', 'BÓ', 90000.00, false, NOW(), NOW()),
    ('QVKEMCHLD', 'BAR-QVKEMCHLD', 'Kem Chua Hy Lạp Dâu 4l', 'TIEU_HAO', 'HỘP', 285000.00, false, NOW(), NOW()),
    ('QVKEMCHLT', 'BAR-QVKEMCHLT', 'Kem Chua Hy Lạp Trắng 4l', 'TIEU_HAO', 'HỘP', 240000.00, false, NOW(), NOW()),
    ('QVKEMCOOKIE OROE', 'BAR-QVKEMCOOKIE OROE', 'Kem Cookie Oreo 4l', 'TIEU_HAO', 'HỘP', 275000.00, false, NOW(), NOW()),
    ('QVKEMDAUTAY', 'BAR-QVKEMDAUTAY', 'Kem Dâu Tây 4l', 'TIEU_HAO', 'HỘP', 230000.00, false, NOW(), NOW()),
    ('QVKEMDUANON', 'BAR-QVKEMDUANON', 'Kem Dừa Non 4l', 'TIEU_HAO', 'HỘP', 285000.00, false, NOW(), NOW()),
    ('QVKEMHTTC', 'BAR-QVKEMHTTC', 'Kem Hồng Trân Châu 4l', 'TIEU_HAO', 'HỘP', 275000.00, false, NOW(), NOW()),
    ('QVKEMIETQUAT', 'BAR-QVKEMIETQUAT', 'Kem Việt Quất 4l', 'TIEU_HAO', 'HỘP', 230000.00, false, NOW(), NOW()),
    ('QVKEMVANI', 'BAR-QVKEMVANI', 'Kem Vani 4l', 'TIEU_HAO', 'HỘP', 180000.00, false, NOW(), NOW()),
    ('QVKHANUOT', 'BAR-QVKHANUOT', 'Khăn Ướt', 'BAR', 'CÁI', 550.00, false, NOW(), NOW()),
    ('QVKHOAITAY', 'BAR-QVKHOAITAY', 'Khoai Tây', 'RAU', 'KG', 15000.00, false, NOW(), NOW()),
    ('QVKINHGIOI', 'BAR-QVKINHGIOI', 'Kinh Giới', 'RAU', 'KG', 50000.00, false, NOW(), NOW()),
    ('QVKLK', 'BAR-QVKLK', 'Khoai Lang Kén', 'RAU', 'GÓI', 12000.00, false, NOW(), NOW()),
    ('QVKTS', 'BAR-QVKTS', 'Khoai tây sợi 10*10', 'THIT', 'KG', 55000.00, false, NOW(), NOW()),
    ('QVLAC', 'BAR-QVLAC', 'Lạc rang nhân viên', 'DO_AN_NHAN_VIEN', 'KG', 65000.00, false, NOW(), NOW()),
    ('QVLACHANH', 'BAR-QVLACHANH', 'Lá Chanh', 'RAU', 'KG', 150000.00, false, NOW(), NOW()),
    ('QVLACRANG', 'BAR-QVLACRANG', 'Lạc Rang', 'HANG_KHO', 'KG', 60000.00, false, NOW(), NOW()),
    ('QVLAHE', 'BAR-QVLAHE', 'Lá Hẹ', 'RAU', 'KG', 50000.00, false, NOW(), NOW()),
    ('QVLE', 'BAR-QVLE', 'Lê', 'RAU', 'KG', 35000.00, false, NOW(), NOW()),
    ('QVLN', 'BAR-QVLN', 'Lườn Ngỗng', 'THIT', 'KG', 150000.00, false, NOW(), NOW()),
    ('QVLONGGA', 'BAR-QVLONGGA', 'Lòng Gà', 'DO_AN_NHAN_VIEN', 'KG', 5833.00, false, NOW(), NOW()),
    ('QVLONGLON', 'BAR-QVLONGLON', 'Lòng Lợn', 'THIT', 'KG', 80000.00, false, NOW(), NOW()),
    ('QVLT', 'BAR-QVLT', 'Lơ Trắng', 'RAU', 'KG', 35000.00, false, NOW(), NOW()),
    ('QVLV', 'BAR-QVLV', 'Giấy A4', 'TIEU_HAO', 'LẦN', 225000.00, false, NOW(), NOW()),
    ('QVLX', 'BAR-QVLX', 'Lơ Xanh', 'RAU', 'KG', 35000.00, false, NOW(), NOW()),
    ('QVMAJOLE', 'BAR-QVMAJOLE', 'Sốt Mayo Majole 3kg (1 thùng 4 hộp)', 'HANG_KHO', 'CAN', 230000.00, false, NOW(), NOW()),
    ('QVMAM5L', 'BAR-QVMAM5L', 'Mắm 5l', 'HANG_KHO', 'CAN', 70000.00, false, NOW(), NOW()),
    ('QVMATONG', 'BAR-QVMATONG', 'Mật Ong 800g', 'HANG_KHO', 'CHAI', 33333.00, false, NOW(), NOW()),
    ('QVMC', 'BAR-QVMC', 'Măng Chua', 'DO_AN_NHAN_VIEN', 'KG', 30000.00, false, NOW(), NOW()),
    ('QVMD', 'BAR-QVMD', 'Mướp Đắng', 'DO_AN_NHAN_VIEN', 'KG', 30000.00, false, NOW(), NOW()),
    ('QVMEKHO', 'BAR-QVMEKHO', 'Me Khô', 'HANG_KHO', 'KG', 30000.00, false, NOW(), NOW()),
    ('QVMOCNHI', 'BAR-QVMOCNHI', 'Mộc Nhĩ', 'HANG_KHO', 'KG', 130000.00, false, NOW(), NOW()),
    ('QVMTP', 'BAR-QVMTP', 'Màng Thực Phẩm 45cm', 'TIEU_HAO', 'HỘP', 200000.00, false, NOW(), NOW()),
    ('QVMUC', 'BAR-QVMUC', 'Mực', 'HS_CHINH', 'KG', 160000.00, false, NOW(), NOW()),
    ('QVMUITA', 'BAR-QVMUITA', 'Rau Mùi Ta', 'RAU', 'KG', 50000.00, false, NOW(), NOW()),
    ('QVMUITAU', 'BAR-QVMUITAU', 'Mùi Tàu', 'RAU', 'KG', 30000.00, false, NOW(), NOW()),
    ('QVMUITAY', 'BAR-QVMUITAY', 'Mùi Tây', 'RAU', 'KG', 80000.00, false, NOW(), NOW()),
    ('QVMUNGTOI', 'BAR-QVMUNGTOI', 'Mùng Tơi', 'RAU', 'MỚ', 10000.00, false, NOW(), NOW()),
    ('QVMUNI', 'BAR-QVMUNI', 'Tôm Mũ Ni', 'HS_PHU', 'KG', 400000.00, false, NOW(), NOW()),
    ('QVMUOIT', 'BAR-QVMUOIT', 'Muối Hạt To 1kg', 'HANG_KHO', 'KG', 5000.00, false, NOW(), NOW()),
    ('QVMUOITINH', 'BAR-QVMUOITINH', 'Muối Tinh 550g', 'HANG_KHO', 'GÓI', 6666.00, false, NOW(), NOW()),
    ('QVMUOP', 'BAR-QVMUOP', 'Mướp', 'RAU', 'KG', 35000.00, false, NOW(), NOW()),
    ('QVMUTAT', 'BAR-QVMUTAT', 'Mù Tạt Tuýp', 'HANG_KHO', 'TUÝP', 11000.00, false, NOW(), NOW()),
    ('QVMYCHINH', 'BAR-QVMYCHINH', 'Mỳ Chính 5 kg', 'HANG_KHO', 'GÓI', 56000.00, false, NOW(), NOW()),
    ('QVMYTOM', 'BAR-QVMYTOM', 'Mỳ Tôm trần( 1 thùng= 10kg)', 'HANG_KHO', 'BỊCH', 45000.00, false, NOW(), NOW()),
    ('QVMYY', 'BAR-QVMYY', 'Mỳ Ý 500g', 'HANG_KHO', 'GÓI', 26000.00, false, NOW(), NOW()),
    ('QVNACSAY', 'BAR-QVNACSAY', 'Thịt Nạc Xay', 'THIT', 'KG', 105000.00, false, NOW(), NOW()),
    ('QVNACVAI', 'BAR-QVNACVAI', 'Nạc Vai', 'DO_AN_NHAN_VIEN', 'KG', 105000.00, false, NOW(), NOW()),
    ('QVNAM', 'BAR-QVNAM', 'Nấm Kim', 'RAU', 'GÓI', 6666.00, false, NOW(), NOW()),
    ('QVNAMHUONG', 'BAR-QVNAMHUONG', 'Nấm Hương', 'HANG_KHO', 'KG', 240000.00, false, NOW(), NOW()),
    ('QVNAMLON', 'BAR-QVNAMLON', 'Nầm Lợn', 'THIT', 'KG', 142000.00, false, NOW(), NOW()),
    ('QVNAMTUYET', 'BAR-QVNAMTUYET', 'Nấm Tuyết 500 g', 'HANG_KHO', 'GÓI', 250000.00, false, NOW(), NOW()),
    ('QVNEPCAM', 'BAR-QVNEPCAM', 'Nếp Cẩm', 'HANG_KHO', 'KG', 36000.00, false, NOW(), NOW()),
    ('QVNGAOHAICUI', 'BAR-QVNGAOHAICUI', 'Ngao Hai Cùi', 'VC_VO_CUNG', 'KG', 60000.00, false, NOW(), NOW()),
    ('QVNGAOMO', 'BAR-QVNGAOMO', 'Ngao Mỡ', 'VC_VO_CUNG', 'KG', 58000.00, false, NOW(), NOW()),
    ('QVNGOKEM', 'BAR-QVNGOKEM', 'Ngô Kem 450gr', 'HANG_KHO', 'HỘP', 12000.00, false, NOW(), NOW()),
    ('QVNRB', 'BAR-QVNRB', 'Nước Rửa Bát', 'TIEU_HAO', 'CAN', 190000.00, false, NOW(), NOW()),
    ('QVNTC', 'BAR-QVNTC', 'Nước Tẩy Cồn', 'TIEU_HAO', 'CAN', 22000.00, false, NOW(), NOW()),
    ('QVNUOCCOTDUA', 'BAR-QVNUOCCOTDUA', 'Nước Cốt Dừa 400ml 24 CHAI', 'HANG_KHO', 'LON', 30000.00, false, NOW(), NOW()),
    ('QVNUOCDASANI', 'BAR-QVNUOCDASANI', 'Nước Dasani', 'BAR', 'CHAI', 3541.00, false, NOW(), NOW()),
    ('QVOCHUONG', 'BAR-QVOCHUONG', 'Ốc Hương', 'VC_VO_CUNG', 'KG', 135000.00, false, NOW(), NOW()),
    ('QVOCNHOI', 'BAR-QVOCNHOI', 'Ốc Nhồi', 'VC_VO_CUNG', 'KG', 80000.00, false, NOW(), NOW()),
    ('QVOI', 'BAR-QVOI', 'ỔI', 'RAU', 'KG', 20000.00, false, NOW(), NOW()),
    ('QVOTCAY', 'BAR-QVOTCAY', 'Ớt Cay', 'RAU', 'KG', 50000.00, false, NOW(), NOW()),
    ('QVOTSUNGDO', 'BAR-QVOTSUNGDO', 'Ớt Sừng Đỏ', 'RAU', 'KG', 50000.00, false, NOW(), NOW()),
    ('QVOTSUNGXANH', 'BAR-QVOTSUNGXANH', 'Ớt Sừng Xanh', 'RAU', 'KG', 35000.00, false, NOW(), NOW()),
    ('QVPHO', 'BAR-QVPHO', 'Phở', 'RAU', 'KG', 15000.00, false, NOW(), NOW()),
    ('QVPHOMAI', 'BAR-QVPHOMAI', 'Phô Mai Sợi', 'HANG_KHO', 'KG', 180000.00, false, NOW(), NOW()),
    ('QVPT', 'BAR-QVPT', 'Phồng Tôm 100g', 'HANG_KHO', 'GÓI', 10000.00, false, NOW(), NOW()),
    ('QVQUAT', 'BAR-QVQUAT', 'Quất', 'RAU', 'KG', 20000.00, false, NOW(), NOW()),
    ('QVQUAY', 'BAR-QVQUAY', 'Quẩy', 'RAU', 'KG', 100000.00, false, NOW(), NOW()),
    ('QVRAUMUONG', 'BAR-QVRAUMUONG', 'Rau Muống', 'RAU', 'MỚ', 10000.00, false, NOW(), NOW()),
    ('QVRBCC', 'BAR-QVRBCC', 'Rong Biển Cuộn Cơm', 'HANG_KHO', 'BỊCH', 320000.00, false, NOW(), NOW()),
    ('QVRBH', 'BAR-QVRBH', 'Rong Biển Hàn Nấu Sup', 'HANG_KHO', 'GÓI', 90000.00, false, NOW(), NOW()),
    ('QVSA', 'BAR-QVSA', 'Sả', 'RAU', 'KG', 15000.00, false, NOW(), NOW()),
    ('QVSAN', 'BAR-QVSAN', 'Sần', 'VC_VO_CUNG', 'KG', 80000.00, false, NOW(), NOW()),
    ('QVSG', 'BAR-QVSG', 'Sốt Gà Thái 1 Lít', 'HANG_KHO', 'CHAI', 60000.00, false, NOW(), NOW()),
    ('QVSMR', 'BAR-QVSMR', 'Sốt Mè Rang 1 Lít', 'HANG_KHO', 'CHAI', 160000.00, false, NOW(), NOW()),
    ('QVSOLONG', 'BAR-QVSOLONG', 'Sò Lông', 'VC_VO_CUNG', 'KG', 45000.00, false, NOW(), NOW()),
    ('QVST', 'BAR-QVST', 'Sa Tế Tôm 55g 1 vì 6 lọ', 'HANG_KHO', 'LỌ', 7666.00, false, NOW(), NOW()),
    ('QVSTKD', 'BAR-QVSTKD', 'Sữa Tươi Không Đường 1lit( 1 thùng 12 hộp)', 'HANG_KHO', 'HỘP', 35833.00, false, NOW(), NOW()),
    ('QVSUACHUA', 'BAR-QVSUACHUA', 'Sữa Chua Không Đường', 'HANG_KHO', 'VỈ', 30000.00, false, NOW(), NOW()),
    ('QVSUADAC', 'BAR-QVSUADAC', 'Sữa Đặc 1.284kg 12 HỘP-1 thùng', 'HANG_KHO', 'HỘP', 55833.00, false, NOW(), NOW()),
    ('QVSUONT', 'BAR-QVSUONT', 'Sườn tảng đông lạnh', 'THIT', 'KG', 112000.00, false, NOW(), NOW()),
    ('QVTAI', 'BAR-QVTAI', 'Tai Lợn', 'THIT', 'KG', 90000.00, false, NOW(), NOW()),
    ('QVTAM', 'BAR-QVTAM', 'Tăm Xiên', 'HANG_KHO', 'TÚI', 17000.00, false, NOW(), NOW()),
    ('QVTAO', 'BAR-QVTAO', 'Táo', 'RAU', 'KG', 30000.00, false, NOW(), NOW()),
    ('QVTAODO', 'BAR-QVTAODO', 'Táo Đỏ', 'HANG_KHO', 'KG', 70000.00, false, NOW(), NOW()),
    ('QVTBT5', 'BAR-QVTBT5', 'Túi Bóng Trắng 5kg', 'TIEU_HAO', 'KG', 48000.00, false, NOW(), NOW()),
    ('QVTCD', 'BAR-QVTCD', 'Trân Châu Nhân Dừa Trắng', 'HANG_KHO', 'KG', 26666.00, false, NOW(), NOW()),
    ('QVTCX', 'BAR-QVTCX', 'Tôm Càng Xanh', 'HS_CHINH', 'KG', 185000.00, false, NOW(), NOW()),
    ('QVTHAITOM', 'BAR-QVTHAITOM', 'Thái Tôm Yum 454 g', 'HANG_KHO', 'LỌ', 68000.00, false, NOW(), NOW()),
    ('QVTHANHCUA', 'BAR-QVTHANHCUA', 'Thanh Cua', 'THIT', 'GÓI', 100000.00, false, NOW(), NOW()),
    ('QVTHANHLONG', 'BAR-QVTHANHLONG', 'Thanh Long', 'RAU', 'KG', 30000.00, false, NOW(), NOW()),
    ('QVTHILA', 'BAR-QVTHILA', 'Thì Là', 'RAU', 'KG', 20000.00, false, NOW(), NOW()),
    ('QVTHITXAY', 'BAR-QVTHITXAY', 'Thịt Xay', 'DO_AN_NHAN_VIEN', 'KG', 105000.00, false, NOW(), NOW()),
    ('QVTIATO', 'BAR-QVTIATO', 'Tía Tô', 'RAU', 'KG', 40000.00, false, NOW(), NOW()),
    ('QVTIGER', 'BAR-QVTIGER', 'Bia tiger', 'BAR', 'LON', 17500.00, false, NOW(), NOW()),
    ('QVTOI', 'BAR-QVTOI', 'Tỏi', 'RAU', 'KG', 35000.00, false, NOW(), NOW()),
    ('QVTOM', 'BAR-QVTOM', 'Tôm lớp', 'HS_CHINH', 'KG', 230000.00, false, NOW(), NOW()),
    ('QVTRUNG', 'BAR-QVTRUNG', 'Trứng', 'RAU', 'QUẢ', 3500.00, false, NOW(), NOW()),
    ('QVTRUNGCUT', 'BAR-QVTRUNGCUT', 'Trứng Chim Cút', 'DO_AN_NHAN_VIEN', 'QUẢ', 1000.00, false, NOW(), NOW()),
    ('QVTRUNGNON', 'BAR-QVTRUNGNON', 'Trứng gà non', 'THIT', 'KG', 125000.00, false, NOW(), NOW()),
    ('QVTUOC', 'BAR-QVTUOC', 'Bạch Tuộc', 'HS_CHINH', 'KG', 165000.00, false, NOW(), NOW()),
    ('QVTUONGOT', 'BAR-QVTUONGOT', 'Tương Ớt Misa 2 Lít 1 thùng= 6can', 'HANG_KHO', 'CHAI', 25000.00, false, NOW(), NOW()),
    ('QVVAT', 'BAR-QVVAT', 'HD VAT', 'TIEU_HAO', 'LẦN', 92000.00, false, NOW(), NOW()),
    ('QVVCHS', 'BAR-QVVCHS', 'Vận Chuyển  Cua, Ghẹ', 'VC_CUA_GHE', 'LẦN', 80000.00, false, NOW(), NOW()),
    ('QVVCK', 'BAR-QVVCK', 'Vận Chuyển Huyền Hải Sản', 'VC_KHAC', 'LẦN', 100000.00, false, NOW(), NOW()),
    ('QVVEMXANH', 'BAR-QVVEMXANH', 'Vẹm xanh', 'VC_VO_CUNG', 'KG', 48000.00, false, NOW(), NOW()),
    ('QVVIT', 'BAR-QVVIT', 'Vịt', 'DO_AN_NHAN_VIEN', 'KG', 75000.00, false, NOW(), NOW()),
    ('QVXALACH', 'BAR-QVXALACH', 'Xà Lách', 'RAU', 'KG', 25000.00, false, NOW(), NOW()),
    ('QVXIDAU', 'BAR-QVXIDAU', 'Xì Dầu Misa 2L 1 thùng= 6can', 'HANG_KHO', 'CHAI', 33333.00, false, NOW(), NOW()),
    ('QVXOAIX', 'BAR-QVXOAIX', 'Xoài Xanh', 'RAU', 'KG', 20000.00, false, NOW(), NOW()),
    ('QVXUCXICH', 'BAR-QVXUCXICH', 'Xúc Xích', 'THIT', 'GÓI', 60000.00, false, NOW(), NOW()),
    ('QVXXB', 'BAR-QVXXB', 'Xúc Xích Bi', 'THIT', 'KG', 66000.00, false, NOW(), NOW())
ON CONFLICT (item_code) DO UPDATE
SET item_name = EXCLUDED.item_name,
    category = EXCLUDED.category,
    unit = EXCLUDED.unit,
    cost_price = EXCLUDED.cost_price,
    updated_at = NOW();

-- 3. KHỞI TẠO LÔ HÀNG VÀ SỐ DƯ TỒN KHO THỰC TẾ CHO CHI NHÁNH QUẾ VÕ
INSERT INTO import_batches (batch_code, supplier_id, item_id, branch_id, import_date, initial_quantity, current_stock, unit_price, unit, status, created_at, updated_at)
SELECT
    'LOT-QV-202611-' || i.item_code,
    COALESCE(s.id, (SELECT id FROM suppliers WHERE supplier_code = 'QVTHN' LIMIT 1)),
    i.id,
    b.id,
    '2026-11-01'::DATE,
    50.000,
    50.000,
    i.cost_price,
    i.unit,
    'CON_HANG',
    NOW(),
    NOW()
FROM items i
CROSS JOIN branches b
LEFT JOIN suppliers s ON s.supplier_code = CASE
    WHEN i.item_code = 'QVBANHMY' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVBANHXEO' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVBAP' THEN 'QVANHLUC'
    WHEN i.item_code = 'QVBAPNGO' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVBBC' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVBBKS' THEN 'QVBBKS'
    WHEN i.item_code = 'QVBCBT' THEN 'QVANHLUC'
    WHEN i.item_code = 'QVBCHH' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVBCL' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVBCLNV' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVBCT' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVBCTR' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVBCX' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVBDS' THEN 'QVAXH'
    WHEN i.item_code = 'QVBEBE' THEN 'QVHUYENHS'
    WHEN i.item_code = 'QVBICHUOI' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVBM' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVBOTCANH' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVBOTNANG' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVBOTNEP' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVBOTOTHAN' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVBOTTE' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVBR' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVBRM' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVBUN' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVBUOINGOT' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCACHUA' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCACHUABI' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCAHOI' THEN 'QVDUNGCH'
    WHEN i.item_code = 'QVCAICANH' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCAICUC' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCAINGONG' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCAITHAO' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCALANG' THEN 'QVBASAU'
    WHEN i.item_code = 'QVCAM' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCANTT' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCAPHAO' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCATRICH' THEN 'QVDUNGCH'
    WHEN i.item_code = 'QVCBS' THEN 'QVVQV'
    WHEN i.item_code = 'QVCGCX' THEN 'QVANHLUC'
    WHEN i.item_code = 'QVCGG' THEN 'QVANHLUC'
    WHEN i.item_code = 'QVCGRX' THEN 'QVANHLUC'
    WHEN i.item_code = 'QVCHA' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVCHANGIO' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVCHANH' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCHANSU' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVCHANSUA' THEN 'QVDCP'
    WHEN i.item_code = 'QVCOC' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCONKHO' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVCR' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCRP' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVCTD' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVCUA' THEN 'QVLIENCUA'
    WHEN i.item_code = 'QVCUCAI' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCUDAU' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVCX' THEN 'QVBASAU'
    WHEN i.item_code = 'QVDAM' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVDAMHONG' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVDAPCA' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVDAUAN' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVDAUBAP' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVDAUCHUOI' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVDAUCOVE' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVDAUDEN' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVDAUHAO' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVDAUME' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVDAUPHU' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVDAUXANH' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVDTN' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVDUA' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVDUACHUA' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVDUACHUOT' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVDUAHAU' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVDUAKHO' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVDUALUOI' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVDUDU' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVDUONG' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVDV' THEN 'QVDX'
    WHEN i.item_code = 'QVDX' THEN 'QVDX'
    WHEN i.item_code = 'QVGA' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVGANLON' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVGAONHAT' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVGASN' THEN 'QVGAS'
    WHEN i.item_code = 'QVGAST' THEN 'QVGAS'
    WHEN i.item_code = 'QVGE' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVGHE' THEN 'QVCOPHUONG'
    WHEN i.item_code = 'QVGIA' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVGIAYRUT' THEN 'QVAXH'
    WHEN i.item_code = 'QVGIENGC' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVGIO' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVGNV' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVGT' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVGTTB' THEN 'QVLV'
    WHEN i.item_code = 'QVGUNG' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVHANH' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVHANHKHO' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVHANHTA' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVHANHTAY' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVHATE' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVHATSEN' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVHAU' THEN 'QVDCP'
    WHEN i.item_code = 'QVHN' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVHOA' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVKEMCHLD' THEN 'QVKEMY'
    WHEN i.item_code = 'QVKEMCHLT' THEN 'QVKEMY'
    WHEN i.item_code = 'QVKEMCOOKIE OROE' THEN 'QVKEMY'
    WHEN i.item_code = 'QVKEMDAUTAY' THEN 'QVKEMY'
    WHEN i.item_code = 'QVKEMDUANON' THEN 'QVKEMY'
    WHEN i.item_code = 'QVKEMHTTC' THEN 'QVKEMY'
    WHEN i.item_code = 'QVKEMIETQUAT' THEN 'QVKEMY'
    WHEN i.item_code = 'QVKEMVANI' THEN 'QVKEMY'
    WHEN i.item_code = 'QVKHANUOT' THEN 'QVAXH'
    WHEN i.item_code = 'QVKHOAITAY' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVKINHGIOI' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVKLK' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVKTS' THEN 'QVCHIVINH'
    WHEN i.item_code = 'QVLAC' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVLACHANH' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVLACRANG' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVLAHE' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVLE' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVLN' THEN 'QVCHIVINH'
    WHEN i.item_code = 'QVLONGGA' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVLONGLON' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVLT' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVLV' THEN 'QVLV'
    WHEN i.item_code = 'QVLX' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVMAJOLE' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVMAM5L' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVMATONG' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVMC' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVMD' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVMEKHO' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVMOCNHI' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVMTP' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVMUC' THEN 'QVTHN'
    WHEN i.item_code = 'QVMUITA' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVMUITAU' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVMUITAY' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVMUNGTOI' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVMUNI' THEN 'QVTHN'
    WHEN i.item_code = 'QVMUOIT' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVMUOITINH' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVMUOP' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVMUTAT' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVMYCHINH' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVMYTOM' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVMYY' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVNACSAY' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVNACVAI' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVNAM' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVNAMHUONG' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVNAMLON' THEN 'QVANHLUC'
    WHEN i.item_code = 'QVNAMTUYET' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVNEPCAM' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVNGAOHAICUI' THEN 'QVDCP'
    WHEN i.item_code = 'QVNGAOMO' THEN 'QVDCP'
    WHEN i.item_code = 'QVNGOKEM' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVNRB' THEN 'QVAXH'
    WHEN i.item_code = 'QVNTC' THEN 'QVAXH'
    WHEN i.item_code = 'QVNUOCCOTDUA' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVNUOCDASANI' THEN 'QVQUANGHUE'
    WHEN i.item_code = 'QVOCHUONG' THEN 'QVTHN'
    WHEN i.item_code = 'QVOCNHOI' THEN 'QVBASAU'
    WHEN i.item_code = 'QVOI' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVOTCAY' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVOTSUNGDO' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVOTSUNGXANH' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVPHO' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVPHOMAI' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVPT' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVQUAT' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVQUAY' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVRAUMUONG' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVRBCC' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVRBH' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVSA' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVSAN' THEN 'QVDCP'
    WHEN i.item_code = 'QVSG' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVSMR' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVSOLONG' THEN 'QVDCP'
    WHEN i.item_code = 'QVST' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVSTKD' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVSUACHUA' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVSUADAC' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVSUONT' THEN 'QVANHLUC'
    WHEN i.item_code = 'QVTAI' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVTAM' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVTAO' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVTAODO' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVTBT5' THEN 'QVLV'
    WHEN i.item_code = 'QVTCD' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVTCX' THEN 'QVTHN'
    WHEN i.item_code = 'QVTHAITOM' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVTHANHCUA' THEN 'QVCHIVINH'
    WHEN i.item_code = 'QVTHANHLONG' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVTHILA' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVTHITXAY' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVTIATO' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVTIGER' THEN 'QVBAOTUYET'
    WHEN i.item_code = 'QVTOI' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVTOM' THEN 'QVBASAU'
    WHEN i.item_code = 'QVTRUNG' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVTRUNGCUT' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVTRUNGNON' THEN 'QVANHLUC'
    WHEN i.item_code = 'QVTUOC' THEN 'QVBASAU'
    WHEN i.item_code = 'QVTUONGOT' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVVAT' THEN 'QVCHIVINH'
    WHEN i.item_code = 'QVVCHS' THEN 'QVLIENCUA'
    WHEN i.item_code = 'QVVCK' THEN 'QVLV'
    WHEN i.item_code = 'QVVEMXANH' THEN 'QVDCP'
    WHEN i.item_code = 'QVVIT' THEN 'QVNHUNG'
    WHEN i.item_code = 'QVXALACH' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVXIDAU' THEN 'QVCOTHAO'
    WHEN i.item_code = 'QVXOAIX' THEN 'QVCHIPHUONG'
    WHEN i.item_code = 'QVXUCXICH' THEN 'QVANHLUC'
    WHEN i.item_code = 'QVXXB' THEN 'QVANHLUC'
    ELSE 'QVTHN' END
WHERE b.branch_code = 'CN_QUE_VO'
  AND i.item_code LIKE 'QV%'
ON CONFLICT (batch_code) DO UPDATE
SET current_stock = EXCLUDED.current_stock,
    unit_price = EXCLUDED.unit_price,
    updated_at = NOW();

-- 4. ĐỒNG BỘ TỒN KHO INVENTORY_STOCKS CHO KHO TRƯỚC CHẾ BIẾN QUẾ VÕ
INSERT INTO inventory_stocks (branch_id, item_id, batch_id, quantity, last_updated_at)
SELECT ib.branch_id, ib.item_id, ib.id, ib.current_stock, NOW()
FROM import_batches ib
WHERE ib.batch_code LIKE 'LOT-QV-202611-%'
ON CONFLICT (branch_id, item_id, batch_id) DO UPDATE
SET quantity = EXCLUDED.quantity,
    last_updated_at = NOW();
