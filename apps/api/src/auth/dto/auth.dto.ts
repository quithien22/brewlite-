import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/** Chỉ chấp nhận địa chỉ Gmail khi ĐĂNG KÝ (đăng nhập / quên mật khẩu không giới hạn để tài khoản demo @brewlite.vn vẫn đăng nhập được). */
const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

export class RegisterDto {
  @IsString({ message: 'Họ tên không hợp lệ' })
  @MinLength(2, { message: 'Họ tên tối thiểu 2 ký tự' })
  @MaxLength(80)
  name: string;

  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @Matches(GMAIL_REGEX, {
    message: 'Chỉ chấp nhận email Gmail (ví dụ: ten@gmail.com)',
  })
  email: string;

  @IsOptional()
  @Matches(/^(0|\+84)\d{9,10}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu cần có cả chữ và số',
  })
  password: string;
}

export class ForgotPasswordDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Vui lòng nhập mật khẩu' })
  @MaxLength(72)
  password: string;
}
