import React from 'react';
import Link from 'next/link';

export default function ForgotPassword() {
  return (
    <div className="w-full flex justify-center py-20 font-sans">
      
      {/* Container Form (Căn giữa, không chia cột như Login/Register) */}
      <div className="w-[480px] flex flex-col bg-white p-8 rounded-2xl">
        
        {/* Icon Chìa khóa */}
        <div className="mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6F4E37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
          </svg>
        </div>

        {/* Tiêu đề & Thông điệp */}
        <h2 className="text-[32px] font-bold text-[#2B2118] font-['Inter'] mb-2">
          Quên mật khẩu?
        </h2>
        
        <p className="text-[#74665B] text-[16px] font-['Inter'] font-normal leading-[150%] mb-2">
          Đừng lo, chúng mình sẽ giúp bạn quay lại.
        </p>
        
        <p className="text-[#74665B] text-[16px] font-['Inter'] font-normal leading-[150%] mb-8">
          Nhập email đã đăng ký. Bạn sẽ nhận được liên kết để tạo mật khẩu mới.
        </p>

        {/* Form Quên mật khẩu */}
        <form className="flex flex-col gap-6">
          
          {/* Input Email */}
          <div className="flex flex-col gap-2">
            <label className="text-[#2B2118] text-sm font-bold font-['Inter']">Email</label>
            <div className="relative">
              <input 
                type="email" 
                placeholder="Nhập email" 
                className="w-full border border-[#E5D9CD] rounded-lg px-4 py-3 text-[#2B2118] placeholder-[#74665B] font-['Inter'] focus:outline-none focus:border-[#6F4E37]"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-4 top-1/2 -translate-y-1/2 text-[#74665B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Nút Gửi liên kết */}
          <button type="button" className="w-full bg-[#6F4E37] text-white font-bold font-['Inter'] py-4 rounded-lg mt-2 hover:bg-opacity-90 transition-colors">
            Gửi liên kết đặt lại
          </button>

          {/* Quay lại đăng nhập */}
          <div className="w-full text-center mt-2">
            <Link href="/login" className="text-[#2B2118] text-sm font-bold font-['Inter'] hover:text-[#6F4E37] transition-colors">
              Quay lại đăng nhập
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}