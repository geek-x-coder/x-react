import React from "react";
import LoginComponent from "../components/LoginComponent";
import styles from "../components/Login.module.css";

const LoginContainer = () => {
    return (
        <div className={styles["login-container"]}>
            <div className={styles["login-card"]}>
                <h1 className={styles["app-title"]}>My X-Coder</h1>
                <p className={styles["app-subtitle"]}>
                    Sign in to your account
                </p>

                <LoginComponent />

                <div className={styles["login-footer"]}>
                    <a href='#forgot'>Forgot your password?</a>
                </div>
            </div>
        </div>
    );
};

export default LoginContainer;
