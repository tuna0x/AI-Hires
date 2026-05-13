# Frontend Rules

- Giữ tách lớp: `api/`, `hooks/`, `pages/`, `components/`.
- Không hardcode base URL trong component, sử dụng `import.meta.env.VITE_API_URL`.
- Endpoint mới phải cập nhật type tương ứng.
- Có trạng thái loading/error/empty cho UI dữ liệu.
- Tránh thêm animation nặng không cần thiết.

