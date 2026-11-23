# TASK: TÁCH NÚT ĐIỀU HƯỚNG KHO TRƯỚC/SAU CHẾ BIẾN & HIỂN THỊ CHUẨN XÁC 217 MẶT HÀNG NHẬP VỀ

> **Trạng thái**: Sẵn sàng triển khai (Ready for Implementation)  
> **Người thực hiện**: AI Swarm (wh-dual-nav-dev, wh-data-217-dev, wh-nav-verifier, monitor-16)  
> **Ngày tạo**: 23/11/2026  

---

## 1. Yêu Cầu Chi Tiết (Specifications)

1. **Top Cockpit Tabs Navigation**:
   * Xóa nút gộp `1. Kho 2 Tầng: Trước & Sau Chế Biến`.
   * Tách thành 2 nút top-level độc lập trên thanh điều hướng chính:
     * `🌱 KHO TRƯỚC CHẾ BIẾN` (`activeTab = 'kho-truoc'`)
     * `🍲 KHO SAU CHẾ BIẾN` (`activeTab = 'kho-sau'`)
     * Kế tiếp là các tab: `🏷️ Lô Hàng FEFO`, `📄 2. Chứng Từ Nhập - Xuất - Hủy`, `📋 3. Kiểm Kê Kho Định Kỳ`, `🤝 4. Đối Soát & NCC`.
2. **Nút Header Cân Hàng Mới Về**:
   * Trả về nguyên bản không có ngoặc đơn: `⚖️ CÂN HÀNG MỚI VỀ`.
3. **Danh Mục 217 Mặt Hàng Thực Tế Trong Kho Trước Chế Biến**:
   * Tạo tệp dữ liệu `frontend/src/data/realPreProcessingItems.ts` chứa đầy đủ 217 mặt hàng đã chuẩn hóa từ Quế Võ T11/2026.
   * `StockCardsTab.tsx` nạp danh sách này, hiển thị theo 11 nhóm danh mục chuẩn hóa:
     * `HS_CHINH` (9 món: Cua Thịt, Ghẹ, Bề Bề, Hàu, Tôm Càng Xanh, Tôm Sú, Tôm Mũ Ni, Mực, Ốc Hương)
     * `VC_VO_CUNG` (8 món: Sò Lông, Sò Huyết, Vẹm Xanh, Ngao Hai Cùi, Ngao Mỡ, Ốc Nhồi, Ốc Mít, Sò Méo)
     * `HS_PHU` (4 món: Cá Lăng, Cá Trích, Cá Hồi, Tôm Lớp)
     * `THIT` (20 món: Bắp Bò, Ba Chỉ Bò Thanh, Cánh Gà, Xúc Xích...)
     * `RAU` (70 món: Dứa, Cải Canh, Nấm Kim Châm, Mướp, Bắp Ngô...)
     * `HANG_KHO` (63 món: Bột bánh xèo, Bánh bao kim sa, Muối Hảo Hảo, Dầu hào...)
     * `DO_AN_NHAN_VIEN` (15 món: Cá Rô Phi, Thịt Nạc Vai, Giò Lụa, Trứng gà...)
     * `BAR` (3 món: Bia bão tuyết, Rượu Quang Huệ, Đá xay)
     * `TIEU_HAO` (23 món: Cồn khô, Gas Hồng Lĩnh, Bao đũa, Giấy rút...)
     * `VC_CUA_GHE` (1 món: Vận Chuyển Cua, Ghẹ)
     * `VC_KHAC` (1 món: Vận Chuyển Khác)
   * Tuyệt đối không hiển thị các mặt hàng mock cũ như "Cá hồi phi lê Nauy" trong Kho Trước Chế Biến.
4. **Kiểm Thử & Build**:
   * 241/241 tests PASS 100%.
   * `npm run build` thành công.
   * Push đồng bộ cả 2 nhánh `dev` và `main`.
