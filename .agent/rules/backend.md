# Backend Rules

- Tôn trọng layer: controller -> service -> repository.
- Không nhét business logic nặng trong controller.
- Luồng queue/worker phải idempotent, có xử lý re-delivery.
- Không log PII/secret.
- Thay đổi schema phải backward-compatible.

