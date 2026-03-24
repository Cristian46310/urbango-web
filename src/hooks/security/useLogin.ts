import { useLoginStore } from "@/store/security/loginStore";
import type { login, LoginResponse } from "@/core/domain/entities/security/Login";

export function useLogin() {
    const {
        loading,
        error,
        login
    } = useLoginStore();

    return {
        loading,
        error,
        login: (credentials: login) => login(credentials),
    };
}