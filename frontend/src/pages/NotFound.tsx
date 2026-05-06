import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-black text-primary">404</h1>
        <p className="mb-6 text-xl text-muted-foreground font-medium">Rất tiếc! Không tìm thấy trang bạn yêu cầu.</p>
        <a href="/" className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95 transition-all">
          Quay lại Trang chủ
        </a>
      </div>
    </div>
  );
};

export default NotFound;
