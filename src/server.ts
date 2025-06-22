import next from 'next';

import { createServer } from 'http';
import { parse } from 'url';

import { initializeDatabase } from './app/db';
import { stopAnyIfRunning } from './app/processes';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, turbopack: true });
const handle = app.getRequestHandler();

const start = async (): Promise<void> => {
    initializeDatabase();
    await stopAnyIfRunning();

    app.prepare().then(() => {
        createServer((req, res) => {
            const parsedUrl = parse(req.url!, true);
            handle(req, res, parsedUrl);
        }).listen(port);

        console.log(
            `> Server listening at http://localhost:${port} as ${
                dev ? 'development' : process.env.NODE_ENV
            }`,
        );
    });
};

start();
