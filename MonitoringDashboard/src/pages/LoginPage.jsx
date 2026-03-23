import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/api";
import "./LoginPage.css";

const LoginPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await authService.login(username, password);
            login(response.user, response.token);
            navigate("/dashboard");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "로그인 실패. 다시 시도해주세요.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='login-page'>
            <div className='login-container'>
                <div className='login-box'>
                    <div className='login-header'>
                        <h1>Monitoring Dashboard</h1>
                        <p>System Administrator</p>
                    </div>

                    {error && (
                        <div className='alert alert-error' role='alert'>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className='login-form'>
                        <div className='form-group'>
                            <label htmlFor='username'>사용자명</label>
                            <input
                                id='username'
                                type='text'
                                placeholder='username'
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className='form-group'>
                            <label htmlFor='password'>비밀번호</label>
                            <input
                                id='password'
                                type='password'
                                placeholder='password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        <button
                            type='submit'
                            disabled={loading}
                            className='submit-btn'
                        >
                            {loading ? (
                                <>
                                    <span className='spinner'></span>
                                    로그인 중...
                                </>
                            ) : (
                                "로그인"
                            )}
                        </button>
                    </form>

                    <div className='login-footer'>
                        <p>© 2026 Monitoring Dashboard. All rights reserved.</p>
                    </div>
                </div>

                <div className='login-background'>
                    <div className='bg-animation'></div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
