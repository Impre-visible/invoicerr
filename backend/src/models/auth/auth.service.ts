import * as bcrypt from 'bcrypt';
import * as os from 'os';

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

const ACCESS_DURATION = '1min';
const REFRESH_DURATION = '7d';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) { }


    static getJWTSecret() {
        const platform = os.platform();
        const arch = os.arch();
        const ram = os.totalmem();
        return Buffer.from(`${platform}-${arch}-${ram}`).toString('base64');
    }

    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    async signUp(firstname: string, lastname: string, email: string, password?: string) {
        if (await this.prisma.user.findUnique({ where: { email } })) {
            throw new Error('Email already used');
        }

        if (!password) {
            throw new Error('Password is required');
        }

        const user = await this.prisma.user.create({
            data: {
                firstname,
                lastname,
                email,
                password: bcrypt.hashSync(password, 10),
            },
        });

        return {
            user: {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
            },
            message: 'User created successfully',
        };
    }

    async signIn(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });

        if (!user || !bcrypt.compareSync(password, user.password)) {
            throw new Error('Invalid email or password');
        }

        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwt.sign(payload, {
            secret: AuthService.getJWTSecret(),
            expiresIn: ACCESS_DURATION,
        });
        const refreshToken = this.jwt.sign(payload, {
            secret: AuthService.getJWTSecret(),
            expiresIn: REFRESH_DURATION,
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
            },
        };
    }

    async refreshToken(token: string) {
        try {
            const payload = this.jwt.verify<{ sub: string, email: string, iat: number, exp: number }>(token, { secret: AuthService.getJWTSecret() });

            if (!payload || !payload.sub || !payload.email) {
                throw new Error('Invalid refresh token payload');
            }

            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

            if (!user) {
                throw new Error('User not found');
            }

            const newAccessToken = this.jwt.sign({ sub: user.id, email: user.email }, {
                secret: AuthService.getJWTSecret(),
                expiresIn: ACCESS_DURATION,
            });

            return { access_token: newAccessToken };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
}
