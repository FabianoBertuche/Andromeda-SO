import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../../../shared/config/env';
import { IUserRepository, ITokenRepository } from '../../domain/ports';

export class LoginUseCase {
    constructor(
        private userRepository: IUserRepository,
        private tokenRepository: ITokenRepository
    ) { }

    async execute(email: string, password: string) {
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            return { success: false, error: 'Invalid credentials' };
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return { success: false, error: 'Invalid credentials' };
        }

        const accessToken = jwt.sign(
            { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
            env.JWT_SECRET as string,
            { expiresIn: env.JWT_ACCESS_EXPIRES as any }
        );

        const refreshTokenRaw = jwt.sign({ sub: user.id }, env.JWT_SECRET as string, {
            expiresIn: env.JWT_REFRESH_EXPIRES as any,
        });

        const tokenHash = await bcrypt.hash(refreshTokenRaw, env.BCRYPT_ROUNDS);

        await this.tokenRepository.saveRefreshToken({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 dias aprox
        });

        return {
            success: true,
            data: {
                accessToken,
                refreshToken: refreshTokenRaw,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    tenantId: user.tenantId,
                },
            },
        };
    }
}
