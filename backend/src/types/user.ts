import { User } from "@prisma/client";

export interface CurrentUser extends Omit<User, 'password'> {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    accessToken: string;
}