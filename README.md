# Smart Medication Management App

Repo hiện gồm 3 phần:

- `mobile/`: Ứng dụng React Native/Expo cho bệnh nhân.
- `ai/`: Module AI bằng FastAPI + scikit-learn để dự đoán nguy cơ không tuân thủ uống thuốc và cung cấp dữ liệu analytics cho bác sỹ.
- `back-end/`: Core Backend bằng FastAPI + SQLite quản lý tủ thuốc thông minh, đặt lịch thuốc và cảnh báo người nhà tự động qua mạch ESP32.

## Yêu cầu môi trường

1. Cài [Node.js](https://nodejs.org/) bản LTS để chạy mobile app.
2. Cài Python 3.9+ để chạy AI service và Backend service.
3. Cài Expo Go nếu muốn mở app trên điện thoại thật.

## Chạy Backend Service (Quản lý tủ thuốc & Lịch uống)

```bash
cd back-end
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

*Server Backend mởi tại `http://127.0.0.1:8000`. Test API tại: `http://127.0.0.1:8000/docs`.*

API quản lý chính:
- `POST /api/auth/login` (Xác thực đăng nhập)
- `POST /api/prescriptions` (Tạo đơn thuốc theo giờ)
- `GET /api/schedule/{user_id}` (Phần cứng IOT lấy lịch)
- `POST /api/device/confirm` (Phần cứng báo xác nhận đã uống)
- `POST /api/cron/check-missed-schedules` (Quét để nhắc nhở cảnh báo nhỡ thuốc)

## Chạy AI Service

```bash
cd ai
pip install -e '.[dev]'
PYTHONPATH=src uvicorn smart_medical_ai.main:app --reload
```

API chính:

- `GET /api/analytics/overview`
- `GET /api/analytics/charts`
- `POST /api/analytics/predict`

Train model thủ công:

```bash
cd ai
PYTHONPATH=src python -m smart_medical_ai.ml.train
```

Đặt dataset Kaggle vào `ai/data/raw/`. Nếu chưa có dataset thật, service sẽ tự dùng dữ liệu synthetic bootstrap để chạy demo.

## Chạy Mobile App

```bash
cd mobile
npm install
npm start
```

Màn hình `Analytics` đã gọi API thật. Nếu muốn mobile trỏ tới backend khác, đặt biến môi trường:

```bash
EXPO_PUBLIC_AI_API_URL=http://127.0.0.1:8000 npm start
```

Khi API chưa chạy, app tự fallback sang dữ liệu demo để giao diện vẫn hoạt động.

## Cấu trúc thư mục

- `mobile/src/components/`: UI dùng chung.
- `mobile/src/screens/`: Các màn hình chính của app React Native.
- `mobile/src/services/analytics.ts`: Client gọi AI API.
- `back-end/main.py`: Core API Backend quản lý người dùng, nhắc lịch thuốc, lưu file dữ liệu `smart_medicine.db`.
- `ai/src/smart_medical_ai/main.py`: FastAPI app entrypoint.
- `ai/src/smart_medical_ai/ml/`: Feature engineering, train script, model artifacts.
- `ai/src/smart_medical_ai/services/`: Logic dự đoán và tổng hợp analytics.
- `ai/tests/unit/`: Unit tests cho predictor và analytics.
