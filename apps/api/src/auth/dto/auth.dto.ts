import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** AC-01.4: email chuẩn hóa chữ thường, cắt khoảng trắng trước khi lưu. */
const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @IsString({ message: 'Họ tên không hợp lệ' })
  @MinLength(2, { message: 'Họ tên tối thiểu 2 ký tự' })
  @MaxLength(80)
  name: string;

  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  /** 0xxxxxxxxx hoặc +84xxxxxxxxx (AC-01.3) */
  @IsOptional()
  @Matches(/^(0\d{9}|\+84\d{9})$/, { message: 'Số điện thoại không hợp lệ' })
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
