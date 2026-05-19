
import React, { useEffect, useRef, useState } from "react";

const PLACEHOLDER_REGEX = /{{(\d+)}}/g;

function parsePlaceholders(text) {
    const placeholders = [];

    let match;

    while ((match = PLACEHOLDER_REGEX.exec(text)) !== null) {
        placeholders.push({
            raw: match[0],
            number: Number(match[1]),
            start: match.index,
            end: PLACEHOLDER_REGEX.lastIndex
        });
    }

    return placeholders;
}

function validatePlaceholders(placeholders) {
    const seen = new Set();

    const numbers = placeholders.map((p) => p.number);

    // DUPLICATE CHECK
    for (const num of numbers) {
        if (seen.has(num)) {
            throw new Error(
                `Duplicate placeholder {{${num}}} not allowed`
            );
        }

        seen.add(num);
    }

    // SEQUENTIAL CHECK
    const sorted = [...numbers].sort((a, b) => a - b);

    for (let i = 0; i < sorted.length; i++) {
        const expected = i + 1;

        if (sorted[i] !== expected) {
            throw new Error(
                `Invalid sequence. Expected {{${expected}}}`
            );
        }
    }
}

function normalizeTextAndSamples(text, oldSamples) {
    const placeholders = parsePlaceholders(text);

    const mapping = new Map();

    placeholders
        .sort((a, b) => a.number - b.number)
        .forEach((p, index) => {
            mapping.set(p.number, index + 1);
        });

    // NORMALIZE TEXT
    const normalizedText = text.replace(
        PLACEHOLDER_REGEX,
        (_, num) => {
            return `{{${mapping.get(Number(num))}}}`;
        }
    );

    // REBUILD SAMPLE ARRAY
    const oldMap = new Map();

    oldSamples.forEach((sample) => {
        oldMap.set(sample.id, sample);
    });

    const normalizedSamples = placeholders
        .sort((a, b) => a.number - b.number)
        .map((p, index) => {
            return {
                id: index + 1,
                value: oldMap.get(p.number)?.value || ""
            };
        });

    return {
        text: normalizedText,
        samples: normalizedSamples
    };
}

export default function PlaceholderEditor() {
    const editorRef = useRef(null);

    const [text, setText] = useState(
        "Hello {{1}}"
    );

    const [samples, setSamples] = useState([
        {
            id: 1,
            value: "John"
        }
    ]);

    const [error, setError] = useState("");

    // INITIAL RENDER
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerText = text;
        }
    }, []);

    const handleInput = (e) => {
        try {
            setError("");

            const rawText = e.currentTarget.innerText;

            // PARSE
            const placeholders =
                parsePlaceholders(rawText);

            // VALIDATE
            validatePlaceholders(placeholders);

            // NORMALIZE
            const normalized =
                normalizeTextAndSamples(
                    rawText,
                    samples
                );

            setText(normalized.text);
            setSamples(normalized.samples);

            // UPDATE UI
            if (
                editorRef.current.innerText !==
                normalized.text
            ) {
                editorRef.current.innerText =
                    normalized.text;
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const addPlaceholder = () => {
        const nextId = samples.length + 1;

        const newPlaceholder = `{{${nextId}}}`;

        const updatedText =
            text + " " + newPlaceholder;

        const updatedSamples = [
            ...samples,
            {
                id: nextId,
                value: ""
            }
        ];

        setText(updatedText);
        setSamples(updatedSamples);

        editorRef.current.innerText =
            updatedText;
    };

    const updateSampleValue = (id, value) => {
        setSamples((prev) =>
            prev.map((sample) =>
                sample.id === id
                    ? { ...sample, value }
                    : sample
            )
        );
    };

    return (
        <div
            style={{
                padding: 20,
                maxWidth: 700
            }}
        >
            <h2>
                Placeholder Editor
            </h2>

            {/* EDITOR */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                style={{
                    border: "1px solid #ccc",
                    minHeight: 120,
                    padding: 12,
                    borderRadius: 8,
                    outline: "none",
                    whiteSpace: "pre-wrap"
                }}
            />

            {/* ERROR */}
            {error && (
                <div
                    style={{
                        color: "red",
                        marginTop: 10
                    }}
                >
                    {error}
                </div>
            )}

            {/* BUTTON */}
            <button
                onClick={addPlaceholder}
                style={{
                    marginTop: 16,
                    padding: "8px 14px"
                }}
            >
                Add Placeholder
            </button>

            {/* SAMPLE VALUES */}
            <div
                style={{
                    marginTop: 24
                }}
            >
                <h3>Sample Values</h3>

                {samples.map((sample) => (
                    <div
                        key={sample.id}
                        style={{
                            marginBottom: 10
                        }}
                    >
                        <label>
                            {`{{${sample.id}}}`}
                        </label>

                        <input
                            type="text"
                            value={sample.value}
                            onChange={(e) =>
                                updateSampleValue(
                                    sample.id,
                                    e.target.value
                                )
                            }
                            style={{
                                marginLeft: 10,
                                padding: 6
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* DEBUG */}
            <div
                style={{
                    marginTop: 24,
                    background: "#f5f5f5",
                    padding: 12
                }}
            >
                <h4>Current State</h4>

                <pre>
                    {JSON.stringify(
                        {
                            text,
                            samples
                        },
                        null,
                        2
                    )}
                </pre>
            </div>
        </div>
    );
}