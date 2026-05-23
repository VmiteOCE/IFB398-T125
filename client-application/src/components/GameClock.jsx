
import { useState, useRef, useEffect } from "react";

export default function GameClock({ setCurrentTime }) {
  const [startTime, setStartTime] = useState(null);
  const [now, setNow] = useState(null);
  const intervalRef = useRef(null);

  const [offset, setOffset] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Keep latest toggleClock reference (fix for keyboard bug)
  const toggleRef = useRef(null);

  function toggleClock() {
    if (isRunning) {
      clearInterval(intervalRef.current);
      setIsRunning(false);
    } else {
      const currentTime = Date.now();

      if (startTime === null) {
        setStartTime(currentTime);
        setNow(currentTime);
      } else {
        const pausedDuration = now - startTime;
        setStartTime(currentTime - pausedDuration);
        setNow(currentTime);
      }

      clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setNow(Date.now());
      }, 10);

      setIsRunning(true);
    }
  }

  // Always keep latest function reference
  toggleRef.current = toggleClock;

  // Calculate time
  let secondsPassed = 0;
  if (startTime != null && now != null) {
    secondsPassed = (now - startTime) / 1000 + offset;
  }

  // Format mm:ss
  function formatTime() {
    let minutes = Math.floor(secondsPassed / 60);
    let seconds = Math.floor(secondsPassed % 60);

    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");

    return `${minutes}:${seconds}`;
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) {
          toggleRef.current(); // uses latest function
        }
      }

      if (e.key === "-") {
        e.preventDefault();
        setOffset((prev) =>
          Math.max(prev - 5, -secondsPassed)
        );
      }

      if (e.key === "=") {
        e.preventDefault();
        setOffset((prev) => prev + 5);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Update parent
  useEffect(() => {
    setCurrentTime(formatTime());
  }, [secondsPassed]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div
      style={{
        border: "5px solid black",
        backgroundColor: "lightgrey",
        padding: "30px",
        display: "inline-block",
        textAlign: "center",
      }}
    >
      <h1>{formatTime()}</h1>

      <button onClick={() => setOffset((prev) => prev - 5)}>
        -5 sec
      </button>

      <button onClick={toggleClock}>
        {isRunning ? "Pause" : "Start"}
      </button>

      <button onClick={() => setOffset((prev) => prev + 5)}>
        +5 sec
      </button>
    </div>
  );
}
