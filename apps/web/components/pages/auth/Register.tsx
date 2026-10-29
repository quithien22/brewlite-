import React from 'react';
import Link from 'next/link';

export default function Register() {
  return (
    <div className="w-full flex justify-center py-10 font-sans">
      
      {/* Container chính - Giữ layout giống trang Login (W: 1280px) */}
      <div className="w-[1280px] flex gap-[10px] items-start">
        
        {/* Cột trái: Hình ảnh & Thông điệp */}
        <div className="w-1/2 flex flex-col gap-6">
          <img 
            src="https://images.unsplash.com/photo-1511920170033-f8396924c348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
            alt="Coffee shop table" 
            className="w-full h-[400px] object-cover rounded-2xl"
          />
          <div className="flex flex-col gap-3 mt-4">
            <span className="bg-[#F5EBDD] text-[#6F4E37] text-[13px] font-semibold font-['Inter'] px-3 py-1 rounded w-max">
              Mỗi lần ghé, thêm một niềm vui
            </span>
            <h2 className="text-[28px] font-bold text-[#2B2118] font-['Inter']">
              Gia nhập nhà BrewLite
            </h2>
            <p className="text-[#74665B] text-[15px] font-['Inter'] leading-relaxed">
              Tích điểm mỗi đơn, nhận ưu đãi riêng và lưu hương vị bạn yêu. Ly đầu tiên giảm 10% với CHAO10.
            </p>
          </div>
        </div>

        {/* Cột phải: Form Đăng ký */}
        <div className="w-1/2 px-16 flex flex-col">
          
          <h2 className="text-[36px] font-bold text-[#2B2118] font-['Inter'] leading-[150%] mb-1">
            Tạo tài khoản
          </h2>
          <p className="text-[#74665B] text-[16px] font-['Inter'] leading-[150%] mb-8">
            Một phút đăng ký, nhiều ngày cà phê ngon.
          </p>

          <form className="flex flex-col gap-5">
            
            {/* Input Họ và tên */}
            <div className="flex flex-col gap-2">
              <label className="text-[#2B2118] text-sm font-bold font-['Inter']">Họ và tên</label>
              <input 
                type="text" 
                placeholder="Nhập họ và tên" 
                className="w-full border border-[#E5D9CD] rounded-lg px-4 py-3 text-[#2B2118] placeholder-[#74665B] font-['Inter'] focus:outline-none focus:border-[#6F4E37]"
              />
            </div>

            {/* Input Email */}
            <div className="flex flex-col gap-2">
              <label className="text-[#2B2118] text-sm font-bold font-['Inter']">Email</label>
              <input 
                type="email" 
                placeholder="Nhập email" 
                className="w-full border border-[#E5D9CD] rounded-lg px-4 py-3 text-[#2B2118] placeholder-[#74665B] font-['Inter'] focus:outline-none focus:border-[#6F4E37]"
              />
            </div>

            {/* Input Số điện thoại */}
            <div className="flex flex-col gap-2">
              <label className="text-[#2B2118] text-sm font-bold font-['Inter']">Số điện thoại</label>
              <input 
                type="tel" 
                placeholder="Nhập số điện thoại" 
                className="w-full border border-[#E5D9CD] rounded-lg px-4 py-3 text-[#2B2118] placeholder-[#74665B] font-['Inter'] focus:outline-none focus:border-[#6F4E37]"
              />
              <span className="text-[#74665B] text-[12px] font-['Inter'] mt-1">
                Dùng để thông báo khi đơn sẵn sàng.
              </span>
            </div>

            {/* Input Mật khẩu */}
            <div className="flex flex-col gap-2">
              <label className="text-[#2B2118] text-sm font-bold font-['Inter']">Mật khẩu</label>
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="Nhập mật khẩu" 
                  className="w-full border border-[#E5D9CD] rounded-lg px-4 py-3 text-[#2B2118] placeholder-[#74665B] font-['Inter'] tracking-normal focus:outline-none focus:border-[#6F4E37]"
                />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#74665B] hover:text-[#6F4E37]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
              
              {/* Password strength indicator */}
              <div className="flex gap-2 mt-1">
                <div className="h-1 flex-1 bg-[#27AE60] rounded"></div>
                <div className="h-1 flex-1 bg-[#27AE60] rounded"></div>
                <div className="h-1 flex-1 bg-[#27AE60] rounded"></div>
                <div className="h-1 flex-1 bg-[#E5D9CD] rounded"></div>
              </div>
              <span className="text-[#27AE60] text-[12px] font-['Inter'] mt-1">
                Mật khẩu mạnh - Ít nhất 8 ký tự, có chữ và số
              </span>
            </div>

            {/* Input Nhập lại mật khẩu */}
            <div className="flex flex-col gap-2">
              <label className="text-[#2B2118] text-sm font-bold font-['Inter']">Nhập lại mật khẩu</label>
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="Nhập lại mật khẩu" 
                  className="w-full border border-[#E5D9CD] rounded-lg px-4 py-3 text-[#2B2118] placeholder-[#74665B] font-['Inter'] tracking-normal focus:outline-none focus:border-[#6F4E37]"
                />
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#74665B] hover:text-[#6F4E37]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Checkbox Điều khoản */}
            <div className="flex items-start gap-2 mt-2">
              <input type="checkbox" className="w-4 h-4 rounded border-[#E5D9CD] text-[#6F4E37] focus:ring-[#6F4E37] mt-1 cursor-pointer" />
              <label className="text-[#2B2118] text-sm font-['Inter'] leading-relaxed cursor-pointer">
                Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật.
              </label>
            </div>

            {/* Nút Đăng ký */}
            <button className="w-full bg-[#6F4E37] text-white font-bold font-['Inter'] py-4 rounded-lg mt-2 hover:bg-opacity-90 transition-colors">
              Tạo tài khoản
            </button>

            {/* Link Đăng nhập */}
            <p className="text-center text-[#74665B] text-sm font-['Inter'] mt-2">
              Đã có tài khoản? <Link href="/login" className="text-[#6F4E37] font-bold hover:underline">Đăng nhập</Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}