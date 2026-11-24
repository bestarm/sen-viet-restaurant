-- ==============================================================================
-- Flyway Migration V13: Bổ Sung Thực Thể Kho Sau Chế Biến (Processed Dishes)
-- Và Mở Rộng Mẻ Chế Biến Nút 1 & Nút 2 (Ảnh Trước Chế Biến & Số Đĩa Thành Phẩm)
-- ==============================================================================

-- 1. MỞ RỘNG BẢNG processing_batches CHO QUY TRÌNH BẾP NÚT 1 & NÚT 2
ALTER TABLE processing_batches
    ADD COLUMN IF NOT EXISTS raw_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS scale_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS output_plates INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'CHO_DUYET',
    ADD COLUMN IF NOT EXISTS approval_note VARCHAR(255),
    ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- 2. TẠO BẢNG processed_dishes (KHO SAU CHẾ BIẾN - MÓN ĂN HOÀN CHỈNH)
CREATE TABLE IF NOT EXISTS processed_dishes (
    id BIGSERIAL PRIMARY KEY,
    dish_code VARCHAR(100) NOT NULL,
    dish_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    raw_item_id BIGINT REFERENCES items (id) ON DELETE SET NULL,
    raw_item_code VARCHAR(100),
    raw_item_name VARCHAR(255),
    branch_id BIGINT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'đĩa',
    standard_portion_weight NUMERIC(10, 3) DEFAULT 0.650,
    cost_price NUMERIC(15, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_processed_dishes_branch_code UNIQUE (branch_id, dish_code)
);

CREATE INDEX IF NOT EXISTS idx_processed_dishes_branch_status ON processed_dishes (branch_id, status);
CREATE INDEX IF NOT EXISTS idx_processed_dishes_dish_code ON processed_dishes (dish_code);

-- 3. NẠP DỮ LIỆU BAN ĐẦU CHO KHO SAU CHẾ BIẾN 2 CHI NHÁNH (THÁI NGUYÊN & QUẾ VÕ)
INSERT INTO processed_dishes (dish_code, dish_name, category, raw_item_code, raw_item_name, branch_id, quantity, unit, standard_portion_weight, cost_price, status)
VALUES
    -- Chi nhánh Thái Nguyên (branch_id = 1)
    ('DISH-HAU-NUONG', 'Hàu nướng mỡ hành', 'Món Nướng', 'QVHAU', 'Hàu sữa tươi vỏ cứng', 1, 25.0, 'đĩa', 0.650, 185000, 'AVAILABLE'),
    ('DISH-CUA-ME', 'Cua sốt me', 'Món Nóng', 'QVCUATHIT', 'Cua thịt Cà Mau', 1, 12.0, 'đĩa', 0.700, 280000, 'AVAILABLE'),
    ('DISH-GHE-HAP', 'Ghẹ hấp sả', 'Món Hấp', 'QVGHE', 'Ghẹ tươi sống', 1, 15.0, 'đĩa', 0.600, 260000, 'AVAILABLE'),
    ('DISH-BO-SOT-TIEU', 'Bò sốt tiêu đen', 'Món Nóng', 'QVBAP', 'Bắp Bò tươi', 1, 18.0, 'đĩa', 0.500, 195000, 'AVAILABLE'),
    ('DISH-TOM-NUONG', 'Tôm sú nướng muối ớt', 'Món Nướng', 'QVTOMSU', 'Tôm Sú tươi', 1, 22.0, 'đĩa', 0.450, 210000, 'AVAILABLE'),
    ('DISH-MUC-CHIEN', 'Mực chiên giòn', 'Món Nóng', 'QVMUC', 'Mực ống Phú Quốc', 1, 15.0, 'đĩa', 0.400, 175000, 'AVAILABLE'),
    ('DISH-BA-CHI-NUONG', 'Ba chỉ bò nướng tảng', 'Món Nướng', 'QVBCBT', 'Ba Chỉ Bò Thanh', 1, 20.0, 'đĩa', 0.550, 180000, 'AVAILABLE'),
    ('DISH-CA-HOI-CHANH-LEO', 'Cá hồi sốt chanh leo', 'Món Nóng', 'QVCAHOI', 'Cá Hồi phi lê tươi', 1, 12.0, 'đĩa', 0.450, 240000, 'AVAILABLE'),

    -- Chi nhánh Quế Võ (branch_id = 2)
    ('DISH-HAU-NUONG', 'Hàu nướng mỡ hành', 'Món Nướng', 'QVHAU', 'Hàu sữa tươi vỏ cứng', 2, 16.0, 'đĩa', 0.650, 185000, 'AVAILABLE'),
    ('DISH-CUA-ME', 'Cua sốt me', 'Món Nóng', 'QVCUATHIT', 'Cua thịt Cà Mau', 2, 8.0, 'đĩa', 0.700, 280000, 'AVAILABLE'),
    ('DISH-GHE-HAP', 'Ghẹ hấp sả', 'Món Hấp', 'QVGHE', 'Ghẹ tươi sống', 2, 10.0, 'đĩa', 0.600, 260000, 'AVAILABLE'),
    ('DISH-BO-SOT-TIEU', 'Bò sốt tiêu đen', 'Món Nóng', 'QVBAP', 'Bắp Bò tươi', 2, 14.0, 'đĩa', 0.500, 195000, 'AVAILABLE'),
    ('DISH-TOM-NUONG', 'Tôm sú nướng muối ớt', 'Món Nướng', 'QVTOMSU', 'Tôm Sú tươi', 2, 20.0, 'đĩa', 0.450, 210000, 'AVAILABLE'),
    ('DISH-MUC-CHIEN', 'Mực chiên giòn', 'Món Nóng', 'QVMUC', 'Mực ống Phú Quốc', 2, 12.0, 'đĩa', 0.400, 175000, 'AVAILABLE'),
    ('DISH-BA-CHI-NUONG', 'Ba chỉ bò nướng tảng', 'Món Nướng', 'QVBCBT', 'Ba Chỉ Bò Thanh', 2, 15.0, 'đĩa', 0.550, 180000, 'AVAILABLE'),
    ('DISH-CA-HOI-CHANH-LEO', 'Cá hồi sốt chanh leo', 'Món Nóng', 'QVCAHOI', 'Cá Hồi phi lê tươi', 2, 10.0, 'đĩa', 0.450, 240000, 'AVAILABLE')
ON CONFLICT (branch_id, dish_code) DO UPDATE
SET quantity = EXCLUDED.quantity,
    standard_portion_weight = EXCLUDED.standard_portion_weight,
    cost_price = EXCLUDED.cost_price,
    status = EXCLUDED.status,
    updated_at = NOW();
