import React from 'react';
import Link from 'next/link';

export default function Login() {
  return (
    <div className="w-full flex justify-center py-10 font-sans">
      
      {/* Container chính - W: 1280px */}
      <div className="w-[1280px] flex gap-[10px] items-start">
        
        {/* Cột trái: Hình ảnh */}
        <div className="w-1/2 flex flex-col gap-6">
          <img 
            src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
            alt="Coffee shop" 
            className="w-full h-[500px] object-cover rounded-2xl"
          />
          <div className="flex flex-col gap-2">
            <h2 className="text-[28px] font-bold text-[#2B2118] font-['Inter']">
              Chào bạn, một ngày mới!
            </h2>
            <p className="text-[#74665B] text-sm font-['Inter']">
              Đăng nhập để lưu món yêu thích, theo dõi đơn hàng và tích điểm cho những lần ghé tiếp theo.
            </p>
          </div>
        </div>

        {/* Cột phải: Form đăng nhập */}
        <div className="w-1/2 px-16 flex flex-col pt-8">
          
          <h2 className="text-[32px] font-bold text-[#2B2118] font-['Inter'] mb-2">
            Rất vui gặp lại bạn
          </h2>
          <p className="text-[#74665B] text-[15px] font-['Inter'] mb-8">
            Đăng nhập để tiếp tục với ly cà phê yêu thích.
          </p>

          <form className="flex flex-col gap-5">
            
            {/* Input Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[#2B2118] text-sm font-bold font-['Inter']">Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="ban@email.com" 
                  className="w-full border border-[#E5D9CD] rounded-lg px-4 py-3 text-[#2B2118] placeholder-[#74665B] font-['Inter'] focus:outline-none focus:border-[#6F4E37]"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-4 top-1/2 -translate-y-1/2 text-[#74665B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Input Mật khẩu */}
            <div className="flex flex-col gap-2">
              <label className="text-[#2B2118] text-sm font-bold font-['Inter']">Mật khẩu</label>
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="Nhập mật khẩu " 
                  className="w-full border border-[#E5D9CD] rounded-lg px-4 py-3 text-[#2B2118] placeholder-[#2B2118] font-['Inter'] tracking-widest focus:outline-none focus:border-[#6F4E37]"
                />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#74665B] hover:text-[#6F4E37]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Ghi nhớ & Quên mật khẩu */}
            <div className="flex justify-between items-center mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-[#E5D9CD] text-[#6F4E37] focus:ring-[#6F4E37]" />
                <span className="text-[#2B2118] text-sm font-['Inter']">Ghi nhớ đăng nhập</span>
              </label>
              <Link href="/forgotpassword" className="text-[#6F4E37] text-sm font-bold font-['Inter'] hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            {/* Nút Đăng nhập */}
            <button className="w-full bg-[#6F4E37] text-white font-bold font-['Inter'] py-3.5 rounded-lg mt-4 hover:bg-opacity-90 transition-colors">
              Đăng nhập
            </button>

            {/* Hoặc */}
            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-[#E5D9CD]"></div>
              <span className="text-[#74665B] text-xs font-['Inter']">hoặc</span>
              <div className="flex-1 h-px bg-[#E5D9CD]"></div>
            </div>

            {/* Đăng nhập với Google */}
            <button type="button" className="w-full border border-[#E5D9CD] bg-white text-[#2B2118] font-bold font-['Inter'] py-3.5 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-[#4285F4]" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Đăng nhập với Google
            </button>

            {/* Đăng ký */}
            <p className="text-center text-[#74665B] text-sm font-['Inter'] mt-4">
              Chưa có tài khoản? <Link href="/register" className="text-[#6F4E37] font-bold hover:underline">Đăng ký ngay</Link>
            </p>
            
            <p className="text-center text-[#74665B] text-[11px] font-['Inter'] mt-2">
              Thông tin của bạn được bảo mật và mã hóa.
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}