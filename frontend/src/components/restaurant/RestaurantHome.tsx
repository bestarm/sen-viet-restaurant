import { ArrowDown, ArrowUpRight, Flower2, LogIn, MapPin, Phone } from 'lucide-react';
import './RestaurantHome.css';

const phone = '0972665803';

function RestaurantBrand() {
  return (
    <a className="restaurant-brand" href="/" aria-label="Sen Việt Buffet, trang chủ">
      <span className="restaurant-brand-mark"><Flower2 aria-hidden="true" /></span>
      <span>Sen Việt <small>Buffet</small></span>
    </a>
  );
}

export function RestaurantHome() {
  return (
    <div className="restaurant">
      <header className="restaurant-header restaurant-wrap">
        <RestaurantBrand />
        <nav className="restaurant-nav" aria-label="Điều hướng chính">
          <a href="#gioi-thieu">Giới thiệu</a>
          <a href="#chi-nhanh">Chi nhánh</a>
          <a href="#lien-he">Liên hệ</a>
        </nav>
        <a className="restaurant-login" href="/login">
          <LogIn size={17} aria-hidden="true" />
          Đăng nhập <span>quản lý</span>
        </a>
      </header>

      <main>
        <section className="restaurant-hero restaurant-wrap" aria-labelledby="restaurant-title">
          <picture className="restaurant-hero-photo">
            <source media="(max-width: 620px)" srcSet="/restaurant/sen-viet-buffet-mobile.webp" />
            <img src="/restaurant/sen-viet-buffet.webp" alt="" fetchPriority="high" />
          </picture>
          <div className="restaurant-hero-content">
            <h1 id="restaurant-title">Sen Việt<br />Buffet</h1>
            <p>Hương vị Việt cho những cuộc gặp gỡ.</p>
            <a className="restaurant-button restaurant-button-light" href="#chi-nhanh">
              Xem chi nhánh <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="restaurant-story restaurant-narrow" id="gioi-thieu" aria-labelledby="restaurant-story-title">
          <div className="restaurant-story-copy">
            <span className="restaurant-kicker">Về Sen Việt</span>
            <h2 id="restaurant-story-title">Cùng nhau<br />quanh bàn tiệc</h2>
            <p>Ở Sen Việt Buffet, mỗi người có thể chọn món theo sở thích và cùng thưởng thức trong một bữa ăn. Từ bữa cơm gia đình đến buổi gặp gỡ bạn bè, bàn tiệc là nơi để ngồi lại, trò chuyện và chia sẻ những món mình yêu thích.</p>
          </div>
          <figure>
            <img
              src="/restaurant/sen-viet-ban-tiec.webp"
              alt="Ảnh minh họa bàn ăn với đĩa gốm, đũa tre và rau thơm"
              width="850"
              height="650"
              loading="lazy"
            />
          </figure>
        </section>

        <section className="restaurant-branches" id="chi-nhanh" aria-labelledby="restaurant-branches-title">
          <div className="restaurant-narrow restaurant-branches-layout">
            <div>
              <h2 id="restaurant-branches-title">Các chi nhánh</h2>
              <p>Gọi Sen Việt để hỏi thông tin chi nhánh và đặt bàn.</p>
            </div>
            <ul>
              <li><MapPin size={22} aria-hidden="true" /> Thái Nguyên</li>
              <li><MapPin size={22} aria-hidden="true" /> Quế Võ</li>
            </ul>
            <a className="restaurant-button restaurant-button-dark" href={`tel:${phone}`}>
              <Phone size={17} aria-hidden="true" /> Gọi đặt bàn <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="restaurant-footer" id="lien-he">
        <div className="restaurant-narrow restaurant-footer-row">
          <RestaurantBrand />
          <address>
            <p className="restaurant-company">CÔNG TY TNHH T&amp;T NGUYỄN DƯƠNG</p>
            <p>Mã số doanh nghiệp: 2301031284</p>
            <p>Số điện thoại: <a href={`tel:${phone}`}>{phone}</a></p>
          </address>
        </div>
      </footer>
    </div>
  );
}
