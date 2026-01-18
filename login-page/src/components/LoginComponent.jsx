import React, { useState, useEffect } from "react";
import styles from "./Login.module.css";
import EyeIcon from "../icons/EyeIcon";
import EyeOffIcon from "../icons/EyeOffIcon";

const LoginComponent = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberId, setRememberId] = useState(false);

    // Load saved username on mount
    useEffect(() => {
        const savedId = localStorage.getItem("savedId");
        if (savedId) {
            setUsername(savedId);
            setRememberId(true);
        }
    }, []);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Remember username logic
        if (rememberId) {
            localStorage.setItem("savedId", username);
        } else {
            localStorage.removeItem("savedId");
        }

        // Actual login logic goes here
        console.log("Logging in with:", { username, password, rememberId });
        alert(`Welcome, ${username}!`);
    };

    return (
        <form onSubmit={handleSubmit} className={styles["login-form"]}>
            <div className={styles["input-group"]}>
                <label htmlFor='username'>Username</label>
                <input
                    type='text'
                    id='username'
                    placeholder='Enter your username'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>

            <div className={styles["input-group"]}>
                <label htmlFor='password'>Password</label>
                <div className={styles["password-wrapper"]}>
                    <input
                        type={showPassword ? "text" : "password"}
                        id='password'
                        placeholder='Enter your password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type='button'
                        className={styles["toggle-password"]}
                        onClick={togglePasswordVisibility}
                        aria-label={
                            showPassword ? "Hide password" : "Show password"
                        }
                    >
                        {showPassword ? (
                            <EyeIcon className={styles.icon} />
                        ) : (
                            <EyeOffIcon className={styles.icon} />
                        )}
                    </button>
                </div>
            </div>

            {/* Remember username checkbox area */}
            <div className={styles["options-group"]}>
                <label className={styles["remember-me"]}>
                    <input
                        type='checkbox'
                        checked={rememberId}
                        onChange={(e) => setRememberId(e.target.checked)}
                    />
                    <span>Remember username</span>
                </label>
            </div>

            <button type='submit' className={styles["login-button"]}>
                Sign In
            </button>
        </form>
    );
};

export default LoginComponent;
