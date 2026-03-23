import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor: 토큰 추가
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor: 401 처리
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("auth_token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    },
);

export const authService = {
    login: async (username, password) => {
        const response = await apiClient.post("/auth/login", {
            username,
            password,
        });
        return response.data;
    },

    logout: async () => {
        try {
            await apiClient.post("/auth/logout");
        } catch (error) {
            console.error("Logout error:", error);
        }
    },
};

export const dashboardService = {
    // API 엔드포인트 목록 조회
    getApiEndpoints: async () => {
        const response = await apiClient.get("/dashboard/endpoints");
        return response.data;
    },

    // 특정 API 엔드포인트에서 데이터 조회
    getApiData: async (apiId, endpoint) => {
        const response = await apiClient.get(`${endpoint}`);
        return response.data;
    },

    // 여러 API 엔드포인트에서 동시에 데이터 조회
    getMultipleApiData: async (endpoints) => {
        const promises = endpoints.map(({ id, url }) =>
            apiClient
                .get(url)
                .then((res) => ({ id, data: res.data, status: "success" }))
                .catch((error) => ({
                    id,
                    data: null,
                    status: "error",
                    error: error.message,
                })),
        );
        return Promise.all(promises);
    },

    // 알람/이벤트 조회
    getAlerts: async () => {
        const response = await apiClient.get("/dashboard/alerts");
        return response.data;
    },
};

export default apiClient;
