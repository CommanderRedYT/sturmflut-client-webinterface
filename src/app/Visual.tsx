'use client';

import type { FC } from 'react';
import React, { useEffect, useState } from 'react';

import { sendPixelflutCommand } from '@/app/communication';
import { startSturmflut } from '@/app/processes';

const Visual: FC = () => {
    const [host, setHost] = useState('localhost');
    const [port, setPort] = useState(1234);
    const [canvasSize, setCanvasSize] = useState({
        width: 0,
        height: 0,
    });
    const [imageData, setImageData] = useState<string | null>(null);

    const [state, setState] = useState({
        x: 0,
        y: 0,
    });

    const imageRef = React.useRef<HTMLImageElement | null>(null);

    const handleHostPortSubmit = async (
        e: React.FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        e.preventDefault();
        // Here you would typically send the host and port to the server or use them in some way
        console.log(`Host: ${host}, Port: ${port}`);

        const size = await sendPixelflutCommand(host, port, 'SIZE\n');
        // "SIZE <width> <height>\n" is the expected response format
        const sizeRegex = /^SIZE (\d+) (\d+)\n?$/;
        const match = size.match(sizeRegex);
        if (match) {
            const width = parseInt(match[1], 10);
            const height = parseInt(match[2], 10);
            console.log(`Canvas size: ${width}x${height}`);
            setCanvasSize({ width, height });
        } else {
            console.error('Invalid SIZE response:', size);
        }
    };

    const handleCoordsSubmit = async (
        e: React.FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        e.preventDefault();

        await startSturmflut(host, port, imageData || '', [
            `-o ${state.x}:${state.y}`,
        ]);
    };

    const updateImageData = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                if (!reader.result) {
                    console.error('Failed to read file');
                    return;
                }

                // check if file is a data url
                if (typeof reader.result !== 'string') {
                    console.error('File is not a valid data URL');
                    return;
                }

                setImageData(reader.result);
                // Here you would typically send the image data to the server or use it in some way
                console.log('Image data updated:', reader.result);
            };
            reader.readAsDataURL(file); // or readAsArrayBuffer, depending on your needs
        } else {
            console.error('No file selected');
        }
    };

    // add code to make the image draggable
    useEffect(() => {
        const img = imageRef.current;
        if (img) {
            img.ondragstart = e => {
                e.dataTransfer?.setData('text/plain', ''); // Prevent default drag behavior
                e.dataTransfer?.setDragImage(img, state.x, state.y);
            };

            img.ondragend = e => {
                const newX = e.clientX - img.width / 2;
                const newY = e.clientY - img.height / 2;
                setState({ x: newX, y: newY });
            };
        }
    }, [imageRef, state.x, state.y]);

    useEffect(() => {
        if (state.x < 0) {
            setState(prevState => ({ ...prevState, x: 0 }));
        }

        if (state.y < 0) {
            setState(prevState => ({ ...prevState, y: 0 }));
        }
    }, [state.x, state.y]);

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <h2>Configure pixelflut client</h2>
                <form onSubmit={handleHostPortSubmit}>
                    <label>
                        Host:
                        <input
                            type="text"
                            value={host}
                            onChange={e => setHost(e.target.value)}
                        />
                    </label>
                    <label>
                        Port:
                        <input
                            type="number"
                            value={port}
                            onChange={e =>
                                setPort(parseInt(e.target.value, 10))
                            }
                        />
                    </label>
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
                    <button type="submit">Set pixelflut client</button>
                </form>
                <input
                    id="imageData"
                    type="file"
                    accept="image/*"
                    onChange={updateImageData}
                />
            </div>
            <pre>
                Task: PUT IMAGE TO{' '}
                {JSON.stringify({ host, port, x: state.x, y: state.y })}
            </pre>
            <div style={{ padding: '8px' }}>
                <h2>Canvas</h2>
                <div
                    style={{
                        width: `${canvasSize.width || 24}px`,
                        height: `${canvasSize.height || 24}px`,
                        border: '1px solid black',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageData || ''}
                        alt="Canvas"
                        style={{
                            top: `${state.y}px`,
                            left: `${state.x}px`,
                            position: 'absolute',
                            cursor: 'move',
                        }}
                        draggable="true"
                        ref={imageRef}
                    />
                </div>
            </div>
            <div>
                <form onSubmit={handleCoordsSubmit}>
                    <button type="submit">(Re-)Create sturmflut client</button>
                </form>
            </div>
        </div>
    );
};

export default Visual;
