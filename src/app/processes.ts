'use server';

import { spawn } from 'child_process';

import db from './db';

const sturmflutBinary = '/usr/bin/sturmflut';

const createOrFailPid = async (pid: number, args: string[]): Promise<number> =>
    new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO processes (pid, name, arguments, status) VALUES (?, ?, ?, ?)',
            [pid, 'sturmflut', args.join(' '), 'running'],
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

export const startSturmflut = async (args: string[]): Promise<void> => {
    const childProcess = spawn(sturmflutBinary, args, {
        stdio: 'inherit',
        shell: true,
    });

    if (!childProcess.pid) {
        console.error('Failed to start Sturmflut process.');
        return;
    }

    const { pid } = childProcess;

    await createOrFailPid(childProcess.pid, args);

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

export const getRunningProcesses = async (): Promise<
    {
        pid: number;
        name: string;
        status: string;
        arguments: string;
    }[]
> =>
    new Promise((resolve, reject) => {
        db.all(
            'SELECT pid, name, status, arguments FROM processes',
            (err, rows) => {
                if (err) {
                    console.error(
                        'Error fetching running processes:',
                        err.message,
                    );
                    reject(err);
                } else {
                    resolve(
                        rows as {
                            pid: number;
                            name: string;
                            status: string;
                            arguments: string;
                        }[],
                    );
                }
            },
        );
    });
