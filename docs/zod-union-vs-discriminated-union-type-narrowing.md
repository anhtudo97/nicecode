# Zod `union` vs `discriminatedUnion` & TypeScript Type Narrowing

Tóm lược so sánh `z.union` với `z.discriminatedUnion`, và cách TypeScript type narrowing hoạt động với cả hai.

## 1. `z.union` — thử từng schema

`z.union([...])` nhận một mảng schema và thử validate input lần lượt theo từng schema cho đến khi có một schema match.

```ts
import { z } from "zod"

const Shape = z.union([
  z.object({ kind: z.literal("circle"), radius: z.number() }),
  z.object({ kind: z.literal("square"), side: z.number() })
])

Shape.parse({ kind: "circle", radius: 5 }) // OK, thử schema 1 trước, match
```

**Đặc điểm:**

- Zod thử **tuần tự** từng option. Với union có nhiều schema, hoặc schema phức tạp, chi phí validate tăng theo số lượng option (chạy từ đầu đến khi match, hoặc chạy hết tất cả nếu không match).
- Khi input không khớp bất kỳ option nào, lỗi trả về là tổ hợp lỗi của **tất cả** option đã thử — thường dài, khó đọc, không chỉ rõ "bạn định dùng case nào".
- Không yêu cầu các schema có cấu trúc liên quan gì đến nhau — có thể union `z.string()` với `z.object(...)` với `z.array(...)`, tuỳ ý.

## 2. `z.discriminatedUnion` — dispatch theo field phân biệt

`z.discriminatedUnion(key, [...])` yêu cầu mọi schema trong mảng đều là object và đều có cùng một field (`key`) mang giá trị **literal** khác nhau để phân biệt.

```ts
const Shape = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("circle"), radius: z.number() }),
  z.object({ kind: z.literal("square"), side: z.number() })
])

Shape.parse({ kind: "circle", radius: 5 })
```

**Đặc điểm:**

- Zod đọc giá trị của field `kind` trước, rồi **nhảy thẳng** (O(1) lookup) đến đúng schema tương ứng để validate — không thử từng cái một.
- Nếu `kind` không khớp giá trị literal nào, lỗi trả về rõ ràng: "invalid discriminator value", kèm danh sách giá trị hợp lệ — dễ đọc hơn hẳn so với lỗi tổ hợp của `union`.
- Không phụ thuộc thứ tự khai báo các option trong mảng (vì dispatch theo field, không theo thứ tự thử).
- Yêu cầu bắt buộc: field discriminator phải tồn tại ở **mọi** schema, và giá trị phải là literal (`z.literal(...)`) — không dùng được với schema không có field phân biệt rõ ràng.
- Zod v4 cho phép discriminant là **union của literal** (ví dụ `z.literal(["a", "b"])`) và hỗ trợ **nested discriminated union** (một option trong union lại là discriminated union khác) — Zod v3 không hỗ trợ hai điều này.

## 3. So sánh trực tiếp

| | `z.union` | `z.discriminatedUnion` |
|---|---|---|
| Cách match | Thử từng schema tuần tự | Đọc discriminator field, nhảy thẳng đến schema đúng |
| Performance | Chậm hơn khi nhiều option | Nhanh hơn (lookup trực tiếp) |
| Chất lượng lỗi | Lỗi gộp từ tất cả option đã thử, dài & khó đọc | Lỗi rõ ràng, chỉ rõ giá trị discriminator không hợp lệ |
| Yêu cầu cấu trúc | Không yêu cầu gì, mọi loại schema | Phải là object, phải có field literal chung làm discriminator |
| Phụ thuộc thứ tự | Có (match theo thứ tự khai báo) | Không |
| Dùng khi nào | Các schema không có field chung để phân biệt (vd union giữa string và object) | Các schema đại diện cho các "case" có field phân biệt rõ ràng (vd message types, event types, API response variants) |

**Quy tắc chọn:** nếu dữ liệu có một field đóng vai trò "tag" để phân loại case (giống discriminated union pattern trong TS) → luôn ưu tiên `discriminatedUnion`. Chỉ dùng `union` khi các option không share field chung, hoặc cấu trúc không đồng nhất.

## 4. Type narrowing là gì

Type narrowing là cơ chế TypeScript **thu hẹp kiểu của một biến** từ một kiểu rộng (ví dụ union `A | B | C`) xuống một kiểu cụ thể hơn, dựa trên kiểm tra runtime (if, switch, typeof, ...), để từ điểm đó compiler biết chính xác biến đang có kiểu nào.

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }

function area(shape: Shape) {
  if (shape.kind === "circle") {
    // Tại đây TS đã narrow shape -> { kind: "circle"; radius: number }
    return Math.PI * shape.radius ** 2
  }
  // Tại đây TS đã narrow shape -> { kind: "square"; side: number }
  return shape.side ** 2
}
```

### Các cách narrowing phổ biến

- **So sánh literal discriminant**: `shape.kind === "circle"` (như ví dụ trên) — cách dùng phổ biến nhất với discriminated union pattern.
- **`typeof`**: `typeof x === "string"`.
- **`instanceof`**: `x instanceof Error`.
- **`in`**: `"radius" in shape`.
- **Truthiness / null check**: `if (x) { ... }`, `if (x != null) { ... }`.
- **Custom type guard**: hàm trả về kiểu `x is T`.
  ```ts
  function isCircle(s: Shape): s is Extract<Shape, { kind: "circle" }> {
    return s.kind === "circle"
  }
  ```
- **Exhaustiveness check**: trong `switch` có `default`, gán biến vào kiểu `never` để compiler báo lỗi nếu quên xử lý case nào.
  ```ts
  function area(shape: Shape) {
    switch (shape.kind) {
      case "circle": return Math.PI * shape.radius ** 2
      case "square": return shape.side ** 2
      default: {
        const _exhaustive: never = shape
        throw new Error("unhandled shape")
      }
    }
  }
  ```

### Liên hệ với `union` / `discriminatedUnion` của Zod

Cả `z.union` và `z.discriminatedUnion` khi dùng `z.infer<typeof Schema>` đều ra **cùng một kiểu TS union** (`{kind:"circle";...} | {kind:"square";...}`) — nên khả năng *type narrowing ở phía TypeScript* là **giống nhau** cho cả hai, không phải là lợi ích riêng của `discriminatedUnion`.

Sự khác biệt thật sự giữa hai cách nằm ở phía **validate runtime** (performance, chất lượng lỗi, yêu cầu cấu trúc) như mục 3 — không nằm ở khả năng narrowing của TypeScript.
