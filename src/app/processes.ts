'use server';

import { spawn } from 'child_process';
import fs from 'fs';

import db from './db';

const sturmflutBinary = '/usr/bin/sturmflut';

export interface DbProcess {
    pid: number;
    name: string;
    arguments: string;
    status: string;
    created_at: string;
    pixelflut_host: string;
    pixelflut_port: number;
    image_file_path: string;
}

const createOrFailPid = async (
    pid: number,
    host: string,
    port: number,
    image_file_path: string,
    args: string[],
): Promise<number> =>
    new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO processes (pid, name, arguments, status, pixelflut_host, pixelflut_port, image_file_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                pid,
                'sturmflut',
                args.join(' '),
                'running',
                host,
                port,
                image_file_path,
            ],
            err => {
                if (err) {
                    console.error('Error creating PID entry:', err.message);
                    reject(err);
                } else {
                    resolve(pid);
                }
            },
        );
    });

const deletePidFile = (pid: number): void => {
    db.run('DELETE FROM processes WHERE pid = ?', [pid], err => {
        if (err) {
            console.error('Error deleting PID entry:', err.message);
        } else {
            console.log(`Deleted PID entry for process ${pid}`);
        }
    });
};

export const startSturmflut = async (
    host: string,
    port: number,
    fileUrlEncoded: string,
    args: string[],
): Promise<void> => {
    const childProcess = spawn(sturmflutBinary, args, {
        stdio: 'inherit',
        shell: true,
    });

    if (!childProcess.pid) {
        console.error('Failed to start Sturmflut process.');
        return;
    }

    const { pid } = childProcess;

    // write file to temp directory
    const filePath = `/tmp/sturmflut-${pid}.png`;
    try {
        const fileData = await fs.promises.readFile(fileUrlEncoded);
        await fs.promises.writeFile(filePath, fileData);
    } catch (error) {
        console.error('Error writing image file:', error);
        return;
    }

    await createOrFailPid(childProcess.pid, host, port, filePath, args);

    childProcess.on('exit', async code => {
        console.log(`Sturmflut process exited with code ${code}`);
        deletePidFile(pid);
    });

    childProcess.on('error', async error => {
        console.error('Error starting Sturmflut process:', error);
        deletePidFile(pid);
    });
};

export const stopSturmflut = async (pid: number): Promise<void> => {
    db.get('SELECT * FROM processes WHERE pid = ?', [pid], (err, row) => {
        if (err) {
            console.error('Error fetching PID entry:', err.message);
            return;
        }

        if (!row) {
            console.log(`No process found with PID ${pid}`);
            return;
        }

        const childProcess = spawn('kill', ['-9', pid.toString()], {
            stdio: 'inherit',
            shell: true,
        });

        childProcess.on('exit', code => {
            console.log(
                `Stopped Sturmflut process with PID ${pid} (exit code: ${code})`,
            );
            deletePidFile(pid);
        });

        childProcess.on('error', error => {
            console.error('Error stopping Sturmflut process:', error);
        });
    });
};

export const isSturmflutRunning = async (pid: number): Promise<boolean> =>
    new Promise(resolve => {
        db.get('SELECT * FROM processes WHERE pid = ?', [pid], (err, row) => {
            if (err) {
                console.error('Error checking PID entry:', err.message);
                resolve(false);
            } else {
                resolve(!!row);
            }
        });
    });

export const stopSturmflutIfRunning = async (pid: number): Promise<void> => {
    const isRunning = await isSturmflutRunning(pid);
    if (isRunning) {
        await stopSturmflut(pid);
    } else {
        console.log(`No running Sturmflut process with PID ${pid}`);
    }
};

export const stopAnyIfRunning = async (): Promise<void> => {
    db.all('SELECT pid FROM processes', (err, rows) => {
        if (err) {
            console.error('Error fetching all PIDs:', err.message);
            return;
        }

        if (rows.length === 0) {
            console.log('No running Sturmflut processes found.');
            return;
        }

        rows.forEach(row => {
            if (typeof row !== 'object' || !row || !('pid' in row)) {
                console.warn('Found a row without a PID:', row);
                return;
            }

            stopSturmflutIfRunning(row.pid as number).catch(stopErr => {
                console.error(
                    `Error stopping process with PID ${row.pid}:`,
                    stopErr,
                );
            });
        });
    });
};

export const getRunningProcesses = async (): Promise<DbProcess[]> =>
    new Promise((resolve, reject) => {
        db.all('SELECT * FROM processes', (err, rows) => {
            if (err) {
                console.error('Error fetching running processes:', err.message);
                reject(err);
            } else {
                resolve(rows as DbProcess[]);
            }
        });
    });
