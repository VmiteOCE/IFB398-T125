
import { useState, useRef, useEffect } from "react";

export default function GameClock({ setCurrentTime }) {
  const [startTime, setStartTime] = useState(null);
  const [now, setNow] = useState(null);
  const intervalRef = useRef(null);

  const [offset, setOffset] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Keep latest toggleClock reference (fix for keyboard bug)
  const toggleRef = useRef(null);
  const secondsPassedRef = useRef(0);

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
    secondsPassed = Math.max(0, (now - startTime) / 1000 + offset);
  }

  secondsPassedRef.current = secondsPassed;

  function decreaseTime(){
    const currentTime = secondsPassedRef.current;
    if (currentTime <= 0) {
        return;
    }
    setOffset((prev) => prev - Math.min(1,currentTime));
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

      /// subtract 1 second
      if (e.key === "-") {
        e.preventDefault();
        decreaseTime();
    }

      // Add 1 second
      if (e.key === "=") {
        e.preventDefault();
        setOffset((prev) => prev + 1);
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
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

      <button onClick={decreaseTime}>
        -1 sec
      </button>

      <button onClick={toggleClock}>
        {isRunning ? "Pause" : "Start"}
      </button>

      <button onClick={() => setOffset((prev) => prev + 1)}>
        +1 sec
      </button>
    </div>
  );
}
