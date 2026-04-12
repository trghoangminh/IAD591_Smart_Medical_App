1. Cài thư viện
pip install fastapi uvicorn sqlalchemy
▶️ Chạy server
uvicorn main:app --reload

👉 Server chạy tại:

http://127.0.0.1:8000
📘 Test API (Swagger)

Mở:

http://127.0.0.1:8000/docs

👉 Có thể test API trực tiếp

🗄️ Database
Sử dụng SQLite
File tự tạo:
smart_medicine.db
Các bảng chính
users
prescriptions
schedules
medication_logs