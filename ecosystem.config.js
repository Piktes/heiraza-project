module.exports = {
    apps: [
        {
            name: "heiraza",
            script: "npm",
            args: "start",
            cwd: "/home/test.heiraza.com/public_html",
            env: {
                NODE_ENV: "production",
                PORT: 3001,
            },
            // Graceful restart settings
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,
            // Restart policy
            max_restarts: 10,
            restart_delay: 1000,
            // Logging
            error_file: "./logs/pm2-error.log",
            out_file: "./logs/pm2-out.log",
            merge_logs: true,
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            // Don't auto-restart on file changes (we do atomic deploys)
            watch: false,
        },
    ],
};
