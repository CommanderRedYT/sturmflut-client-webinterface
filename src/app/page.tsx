import type { FC } from 'react';

import { getRunningProcesses } from '@/app/processes';
import Visual from '@/app/Visual';

const Home: FC = async () => {
    const processes = await getRunningProcesses();

    return (
        <main>
            <h1>Sturmflut Webinterface</h1>
            <Visual />
            <h1>Running Sturmflut Processes</h1>
            <div>
                {processes.map(p => (
                    <div key={p.pid}>
                        <span>{p.name}</span>
                        <span>PID: {p.pid}</span>
                        <span>Status: {p.status}</span>
                    </div>
                ))}
                {processes.length === 0 ? (
                    <div>No running processes found.</div>
                ) : null}
            </div>
        </main>
    );
};

export default Home;
