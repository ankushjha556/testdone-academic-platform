// PM2 Ecosystem Configuration
// This file manages both frontend and backend processes

module.exports = {
    apps: [
        {
            name: 'testdone-backend',
            cwd: './backend',
            // Run with tsx to avoid build issues
            script: 'node_modules/.bin/tsx',
            args: 'src/index.ts',
            env: {
                NODE_ENV: 'production',
                PORT: 5000,
            },
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            error_file: './logs/backend-error.log',
            out_file: './logs/backend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
        {
            name: 'testdone-frontend',
            cwd: './frontend',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            error_file: './logs/frontend-error.log',
            out_file: './logs/frontend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        },
    ],
};
