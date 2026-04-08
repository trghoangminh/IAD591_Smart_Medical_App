# Smart Medication Management App

Repo hiện gồm 2 phần:

- `mobile/`: Ứng dụng React Native/Expo cho bệnh nhân.
- `ai/`: Module AI bằng FastAPI + scikit-learn để dự đoán nguy cơ không tuân thủ uống thuốc và cung cấp dữ liệu analytics cho bác sỹ.

## Yêu cầu môi trường

1. Cài [Node.js](https://nodejs.org/) bản LTS để chạy mobile app.
2. Cài Python 3.11+ để chạy AI service.
3. Cài Expo Go nếu muốn mở app trên điện thoại thật.

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
- `ai/src/smart_medical_ai/main.py`: FastAPI app entrypoint.
- `ai/src/smart_medical_ai/ml/`: Feature engineering, train script, model artifacts.
- `ai/src/smart_medical_ai/services/`: Logic dự đoán và tổng hợp analytics.
- `ai/tests/unit/`: Unit tests cho predictor và analytics.
