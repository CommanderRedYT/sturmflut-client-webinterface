'use client';

import type { FC } from 'react';
import React, { useState } from 'react';

const Visual: FC = () => {
    const [state, setState] = useState({
        x: 0,
        y: 0,
    });

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        e.preventDefault();
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <label>
                    X:
                    <input
                        type="number"
                        value={state.x}
                        onChange={e =>
                            setState({
                                ...state,
                                x: parseInt(e.target.value, 10),
                            })
                        }
                    />
                </label>
                <label>
                    Y:
                    <input
                        type="number"
                        value={state.y}
                        onChange={e =>
                            setState({
                                ...state,
                                y: parseInt(e.target.value, 10),
                            })
                        }
                    />
                </label>
                <button type="submit">(Re-)Create sturmflut client</button>
            </form>
        </div>
    );
};

export default Visual;
