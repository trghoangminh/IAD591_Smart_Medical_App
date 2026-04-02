# Smart Medication Management Mobile App

Đây là ứng dụng di động cho Hệ thống Quản lý Thuốc Thông minh, được xây dựng bằng **React Native** và **Expo**.

## Yêu cầu môi trường (Prerequisites)

1. Cài đặt [Node.js](https://nodejs.org/) (khuyên dùng bản LTS mới nhất).
2. Cài đặt App **Expo Go** trên điện thoại di động (có sẵn trên App Store hoặc Google Play).

## Hướng dẫn cài đặt (Setup/Installation)

1. Mở Terminal và di chuyển vào thư mục dự án:
   ```bash
   cd Mobile-App
   ```

2. Cài đặt các gói thư viện cần thiết:
   ```bash
   npm install
   ```
   *(Dự án đang sử dụng `lucide-react-native` cho icon và bộ lõi của Expo).*

## Hướng dẫn chạy ứng dụng (Run / Development)

Để khởi động server và trải nghiệm App, chạy lệnh sau:
```bash
npx expo start
```
*hoặc*
```bash
npm start
```

### Các tùy chọn sau khi chạy lệnh:
- **Xem trên điện thoại thật (Khuyên dùng):** Bật ứng dụng Expo Go trên Android hoặc ứng dụng Camera trên iOS để quét mã QR xuất hiện trên Terminal.
- **Xem trên Máy ảo iOS (Simulator):** Nhấn phím `i` trong Terminal (Yêu cầu Macbook đã cài Xcode).
- **Xem trên Máy ảo Android (Emulator):** Nhấn phím `a` trong Terminal (Yêu cầu đã cài đặt Android Studio).
- **Xem trên nền Web:** Nhấn phím `w` trong Terminal.

## Cấu trúc thư mục

- `src/components/`: Chứa các UI thành phần dùng chung (Button, Card, TopBar, BottomNav).
- `src/screens/`: Chứa mã nguồn của 5 màn hình chính (HomeDashboard, Analytics, ScanPrescription, History, Profile, MedicationReminder).
- `src/styles/`: Theme chung quy định màu sắc, font chữ và kích cỡ của app (`theme.js`).
- `App.js`: File gốc điều hướng và quản lý trạng thái các màn hình.
