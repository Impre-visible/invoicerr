import * as bcrypt from 'bcrypt';
import * as os from 'os';

import { BadRequestException, Injectable } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

const ACCESS_DURATION = '15m';
const REFRESH_DURATION = '7d';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) { }


    static getJWTSecret() {
        if (process.env.JWT_SECRET) {
            return process.env.JWT_SECRET;
        }
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
            console.error('User not found for ID:', userId);
            throw new BadRequestException('User not found');
        }

        return user;
    }

    async updateMe(userId: string, firstname: string, lastname: string, email: string) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                firstname,
                lastname,
                email,
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
            },
        });

        return user;
    }

    async updatePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (!user || !bcrypt.compareSync(currentPassword, user.password || '')) {
            throw new BadRequestException('Invalid current password');
        }

        if (!newPassword) {
            throw new BadRequestException('New password is required');
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: 'Password updated successfully' };
    }

    async signUp(firstname: string, lastname: string, email: string, password?: string) {
        if (await this.prisma.user.count() > 0) {
            throw new BadRequestException('User already exists');
        }

        if (await this.prisma.user.findUnique({ where: { email } })) {
            throw new BadRequestException('Email already used');
        }

        if (!password) {
            throw new BadRequestException('Password is required');
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
        console.log('Signing in user with email:', email);
        const user = await this.prisma.user.findUnique({ where: { email } });

        if (!user || !bcrypt.compareSync(password, user.password || '')) {
            throw new BadRequestException('Invalid email or password');
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
                throw new BadRequestException('Invalid refresh token payload');
            }

            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

            if (!user) {
                throw new BadRequestException('User not found');
            }

            const newAccessToken = this.jwt.sign({ sub: user.id, email: user.email }, {
                secret: AuthService.getJWTSecret(),
                expiresIn: ACCESS_DURATION,
            });

            return { access_token: newAccessToken };
        } catch (error) {
            throw new BadRequestException('Invalid refresh token');
        }
    }


    async exchangeCodeForTokens(code: string): Promise<{ id_token: string; access_token: string }> {
        const params = new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: process.env.OIDC_CALLBACK_URL || '',
            client_id: process.env.OIDC_CLIENT_ID || '',
            client_secret: process.env.OIDC_CLIENT_SECRET || '',
        });

        const response = await fetch(process.env.OIDC_TOKEN_ENDPOINT || '', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            console.error('Failed to exchange code for tokens:', response.statusText);
            throw new Error('Failed to exchange code for tokens');
        }

        const responseData = await response.json();

        if (!responseData.id_token) {
            throw new Error('No id_token returned');
        }
        if (!responseData.access_token) {
            throw new Error('No access_token returned');
        }
        return {
            id_token: responseData.id_token,
            access_token: responseData.access_token,
        };
    }

    async processIdToken(idToken: string) {
        const JWKS = createRemoteJWKSet(new URL(process.env.OIDC_JWKS_URI || ''));
        const { payload } = await jwtVerify(idToken, JWKS, {
            issuer: process.env.OIDC_ISSUER,
            audience: process.env.OIDC_CLIENT_ID,
        });
        return payload;
    }

    async loginOrCreateUserFromOidc(userInfo: any) {
        let user = await this.prisma.user.findUnique({ where: { email: userInfo.email } });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: userInfo.email,
                    firstname: userInfo.given_name || '',
                    lastname: userInfo.family_name || '',
                },
            });
        }

        const accessToken = this.jwt.sign({ sub: user.id, email: user.email });

        return { accessToken, user };
    }
}
