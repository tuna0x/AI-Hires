# Backend Rules

- Tôn trọng layer: controller -> service -> repository.
- Không nhét business logic nặng trong controller.
- **CRITICAL**: Endpoint mới bắt buộc phải thêm `PermDef` vào `DatabaseInitializer.syncPermissions()`.
- Bắt buộc sử dụng `@ApiMessage` annotation trên mọi Controller method.
- Không trả trực tiếp Entity ra API response, luôn dùng DTO.
- Luồng queue/worker phải idempotent, có xử lý re-delivery.
- Không log PII/secret.
- Thay đổi schema phải backward-compatible.

