import { db } from '../db/schema';
import { simulateLatency, initializeDatabaseIfEmpty } from '../db/dbService';
import { JwtAuthResponse, LoginRequest, User } from '../types/auth';

/**
 * Đăng nhập Client-side đọc từ Dexie IndexedDB
 */
export async function loginApi(data: LoginRequest): Promise<JwtAuthResponse> {
  await initializeDatabaseIfEmpty();
  await simulateLatency(100, 150);

  const usernameLower = data.username.trim().toLowerCase();
  const allUsers = await db.users.toArray();
  const user = allUsers.find(
    (u) => u.username.toLowerCase() === usernameLower
  );

  if (!user) {
    throw new Error('Tài khoản hoặc mật khẩu không chính xác');
  }

  const token = `demo-jwt-token-${user.id}-${Date.now()}`;
  localStorage.setItem('senviet_demo_user_id', String(user.id));

  return {
    accessToken: token,
    tokenType: 'Bearer',
    expiresIn: 86400,
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    branchId: user.branchId,
    branchName: user.branchName,
    roles: user.roles,
  };
}

/**
 * Lấy thông tin người dùng hiện tại từ IndexedDB
 */
export async function getMeApi(): Promise<User> {
  await initializeDatabaseIfEmpty();
  await simulateLatency(80, 120);

  const savedUserId = localStorage.getItem('senviet_demo_user_id');
  if (savedUserId) {
    const user = await db.users.get(Number(savedUserId));
    if (user) return user;
  }

  // Fallback tài khoản mặc định là Quản lý Bếp / Bếp nếu chưa chọn
  const defaultUser = await db.users.where('username').equals('bep_tn').first();
  if (defaultUser) {
    localStorage.setItem('senviet_demo_user_id', String(defaultUser.id));
    return defaultUser;
  }

  const firstUser = (await db.users.toArray())[0];
  if (!firstUser) {
    throw new Error('Chưa có dữ liệu người dùng trong hệ thống');
  }
  return firstUser;
}

/**
 * Lấy danh sách toàn bộ người dùng trong hệ thống
 */
export async function getUsersApi(): Promise<User[]> {
  await initializeDatabaseIfEmpty();
  await simulateLatency(100, 150);
  return await db.users.toArray();
}

/**
 * Gán danh sách vai trò cho người dùng
 */
export async function assignUserRolesApi(userId: number, roles: string[]): Promise<User> {
  await simulateLatency(100, 150);
  await db.users.update(userId, { roles });
  const updated = await db.users.get(userId);
  if (!updated) throw new Error('Không tìm thấy người dùng');
  return updated;
}
