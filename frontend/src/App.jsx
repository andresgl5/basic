import { useState, useEffect } from "react";

function App() {
    const [message, setMessage] = useState("");
    const [counter, setCounter] = useState(0);
    const [text, setText] = useState("");
    const [responseText, setResponseText] = useState("");

    // Obtener mensaje inicial de FastAPI
    useEffect(() => {
        fetch("http://localhost:8000/")
            .then(response => response.json())
            .then(data => setMessage(data.message));
    }, []);

    // Obtener contador desde el backend
    useEffect(() => {
        fetch("http://localhost:8000/counter")
            .then(response => response.json())
            .then(data => setCounter(data.counter));
    }, []);

    // Función para incrementar el contador
    const handleIncrement = () => {
        fetch("http://localhost:8000/increment", {
            method: "POST"
        })
        .then(response => response.json())
        .then(data => setCounter(data.counter));
    };

    // Función para enviar texto al backend y recibir respuesta
    const handleSubmit = (e) => {
        e.preventDefault();
        fetch("http://localhost:8000/text", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text })
        })
        .then(response => response.json())
        .then(data => setResponseText(data.storedText));
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial" }}>
            <h1>{message || "HOLA HOLA HOLA HOLA HOLA"}</h1>

            {/* Contador */}
            <h2>Contador: {counter}</h2>
            <button onClick={handleIncrement}>Incrementar</button>

            {/* Formulario para enviar texto */}
            <h2>Formulario</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe algo..."
                />
                <button type="submit">Enviar</button>
            </form>
            <p>Respuesta del backend: {responseText}</p>
        </div>
    );
}

export default App;