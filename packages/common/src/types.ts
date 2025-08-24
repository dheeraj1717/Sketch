import {z} from "zod";

export const CreateUserSchema = z.object({
    username: z.string().max(50),
    email: z.string().regex(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i).toLowerCase(),
    password: z.string(),
    name: z.string().max(50),
});

export const SignInSchema = z.object({
    email: z.string().regex(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i).toLowerCase(),
    password: z.string(),
});

export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20),
});