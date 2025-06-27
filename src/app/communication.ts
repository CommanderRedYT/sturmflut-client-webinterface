'use server';

import net from 'net';

// a function that takes a host and port and returns a promise that resolves when the connection is established
export const sendPixelflutCommand = async (
    host: string,
    port: number,
    command: string,
): Promise<string> =>
    new Promise((resolve, reject) => {
        try {
            console.log(
                `Connecting to ${host}:${port} with command: ${command}`,
            );

            const socket = net.connect(port, host, () => {
                console.log(`Connected to ${host}:${port}`);
                socket.write(command, err => {
                    console.log(
                        `Command sent: ${command}`,
                        err ? `Error: ${err.message}` : 'no error',
                    );
                });
            });

            socket.on('data', data => {
                const response = data.toString().trim();
                console.log(`Received response: ${response}`);
                resolve(response);
                socket.destroy(); // kill the client after the server's response
            });

            socket.on('error', err => {
                console.error(`Error: ${err.message}`);
                reject(err);
            });

            socket.on('close', () => {
                console.log('Connection closed');
            });

            console.log(`Attempting to connect to ${host}:${port}...`);
        } catch (error) {
            reject(error);
        }
    });
