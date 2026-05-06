export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  readTime: string;
  cover: string;
  body: { heading: string; paragraphs: string[] }[];
};

export const posts: BlogPost[] = [
  {
    slug: "best-resume-tips",
    title: "12 mẹo viết CV giúp bạn chinh phục nhà tuyển dụng năm 2025",
    description: "Các mẹo viết CV đã được kiểm chứng bởi các nhà tuyển dụng hàng đầu giúp vượt qua bộ lọc ATS, thu hút sự chú ý trong 6 giây đầu và chứng minh năng lực bằng con số.",
    category: "Viết CV",
    date: "2025-02-04",
    readTime: "8 phút",
    cover: "/blog-cover-1.jpg",
    body: [
      {
        heading: "Mở đầu mỗi dòng mô tả bằng một động từ hành động mạnh và số liệu cụ thể",
        paragraphs: [
          "Nhà tuyển dụng chỉ quét qua CV của bạn trong vài giây để tìm kiếm mức độ đóng góp và kết quả cụ thể. Hãy thay thế các câu chung chung kiểu 'Chịu trách nhiệm cho dự án X' bằng 'Dẫn dắt dự án X giúp tăng trưởng Y% hiệu suất'. Các con số giúp các tuyên bố của bạn trở nên đáng tin cậy hơn và chứng minh rõ nét giá trị thực tế bạn đem lại cho doanh nghiệp.",
          "Nếu bạn không có số liệu chính xác tuyệt đối, hãy ước lượng một cách hợp lý và có thể bảo vệ được: quy mô đội ngũ, tần suất thực hiện, giá trị tài chính hoặc lượng thời gian tối ưu hóa được."
        ],
      },
      {
        heading: "Tinh chỉnh từ khóa khớp chính xác với bản mô tả công việc (JD)",
        paragraphs: [
          "Hầu hết các tập đoàn và công ty công nghệ lớn hiện nay đều sử dụng hệ thống ATS để sàng lọc hồ sơ tự động trước khi tới tay con người. Hãy đưa các thuật ngữ chuyên ngành cốt lõi xuất hiện trong JD vào phần Kỹ năng, phần Tóm tắt và mô tả kinh nghiệm của bạn — sau đó chứng minh chúng bằng kết quả thực tế."
        ],
      },
      {
        heading: "Độ dài chỉ nên gói gọn trong 1 trang nếu dưới 10 năm kinh nghiệm",
        paragraphs: [
          "Độ cô đọng và trọng tâm quan trọng hơn độ dài. Một CV dài 1 trang được biên soạn súc tích, mạch lạc luôn hoạt động hiệu quả hơn một CV dài 2 trang lan man trong hầu hết mọi trường hợp."
        ],
      },
    ],
  },
  {
    slug: "how-to-pass-ats",
    title: "Cách viết CV vượt qua bộ lọc ATS (Hướng dẫn từng bước)",
    description: "Tìm hiểu chính xác cách hệ thống quản lý ứng viên (ATS) phân tích CV của bạn — cùng các quy tắc bắt buộc về định dạng, từ khóa và cấu trúc cần tuân theo.",
    category: "Vượt qua ATS",
    date: "2025-01-22",
    readTime: "10 phút",
    cover: "/blog-cover-2.jpg",
    body: [
      {
        heading: "Sử dụng bố cục một cột, tập trung vào văn bản sạch",
        paragraphs: [
          "Bố cục hai cột, bảng biểu và các yếu tố đồ họa phức tạp thường làm rối loạn bộ phân tích cú pháp của ATS. Hãy giữ bố cục một cột sạch sẽ với các tiêu đề mục tiêu chuẩn rõ ràng: Tóm tắt chuyên môn, Kinh nghiệm làm việc, Học vấn, Kỹ năng."
        ],
      },
      {
        heading: "Lưu file ở định dạng PDF — đảm bảo văn bản có thể chọn bôi đen được",
        paragraphs: [
          "Các file PDF dạng scan ảnh hoàn toàn vô hình trước hệ thống ATS. Sau khi xuất file, hãy thử bôi đen và sao chép văn bản. Nếu không thể chọn được chữ, hãy xuất lại từ một nguồn xử lý văn bản chuẩn (như Word hoặc Google Docs)."
        ],
      },
      {
        heading: "Khớp từ 60% đến 70% các từ khóa chính trong bản mô tả công việc",
        paragraphs: [
          "Bạn không cần phải đưa tất cả từ khóa vào — nhưng các kỹ năng cốt lõi được lặp lại nhiều lần trong JD nên xuất hiện trong danh sách kỹ năng và ít nhất một dòng mô tả kinh nghiệm của bạn, khớp chính xác định dạng mà JD sử dụng (ví dụ: viết 'TypeScript' thay vì 'TS')."
        ],
      },
    ],
  },
  {
    slug: "interview-questions-2025",
    title: "15 câu hỏi phỏng vấn phổ biến nhất bạn sẽ gặp trong năm 2025",
    description: "Tổng hợp các câu hỏi phỏng vấn hành vi và kỹ thuật phổ biến nhất năm 2025 — kèm theo các khung tư duy chuẩn giúp bạn trả lời xuất sắc từng câu.",
    category: "Phỏng vấn",
    date: "2025-01-10",
    readTime: "12 phút",
    cover: "/blog-cover-3.jpg",
    body: [
      {
        heading: "Giới thiệu bản thân — bài tự giới thiệu trong vòng 60 giây",
        paragraphs: [
          "Cấu trúc đề xuất chuẩn: Vai trò hiện tại → 2 thành tích nổi bật nhất liên quan đến vị trí ứng tuyển → lý do tại sao bạn quan tâm đến vị trí này. Hãy luyện nói to thành tiếng cho đến khi nghe thật tự nhiên như một cuộc trò chuyện, tránh cảm giác như đang học thuộc lòng."
        ],
      },
      {
        heading: "Sử dụng mô hình STAR cho mọi câu hỏi phỏng vấn hành vi",
        paragraphs: [
          "STAR viết tắt của: Situation (Tình huống), Task (Nhiệm vụ), Action (Hành động), Result (Kết quả). Hãy dành 70% thời lượng câu trả lời của bạn cho phần Hành động và Kết quả — đây mới chính là những điểm chứng minh thực lực hành động của bạn."
        ],
      },
    ],
  },
];

export const categories = ["Tất cả", "Viết CV", "Vượt qua ATS", "Phỏng vấn", "Phát triển sự nghiệp"];