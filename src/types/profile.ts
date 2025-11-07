export interface UpdateProfileDto {
    nombre?: string;
    telefono?: string | null;
    email?: string | null;
}

export interface ChangePasswordDto {
    actual: string;
    nueva: string;
}