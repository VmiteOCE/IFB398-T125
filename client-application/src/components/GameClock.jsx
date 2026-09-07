
import { useState, useRef, useEffect } from "react";

  // Format mm:ss
  function formatTime(secondsPassed) {
    let minutes = Math.floor(secondsPassed / 60);
    let seconds = Math.floor(secondsPassed % 60);

    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");

    return `${minutes}:${seconds}`;
  }


export default function GameClock({ setCurrentTime, keybinds, selectedHalf, setHalf, }) {
  const [startTime, setStartTime] = useState(null);
  const [now, setNow] = useState(null);
  const intervalRef = useRef(null);

  const [offset, setOffset] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Keep latest toggleClock reference (fix for keyboard bug)
  const toggleRef = useRef(null);
  const secondsPassedRef = useRef(0);

  /// Manual Time entry 
  const [manualTime, setManualTime] = useState("");

  

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
  useEffect(() => {
    toggleRef.current = toggleClock;
  });

  // Calculate time
  let secondsPassed = 0;
  if (startTime != null && now != null) {
    secondsPassed = Math.max(0, (now - startTime) / 1000 + offset);
  }

  useEffect(() => {
    secondsPassedRef.current = secondsPassed;
  }, [secondsPassed]);

  function decreaseTime(){
    const currentTime = secondsPassedRef.current;
    if (currentTime <= 0) {
        return;
    }
    setOffset((prev) => prev - Math.min(1,currentTime));
  }

  // Manual clock function
  function setManualClockTime() {
    const [minutes,seconds] = manualTime.split(":").map(Number);
  //Check if time entered is valid 
  if ( 
    Number.isNaN(minutes) ||
    Number.isNaN(seconds) ||
    minutes < 0 ||
    minutes > 80 || // 80 minutes in a game 
    seconds < 0 ||
    seconds > 59
  ) {
    return;
  }
  // reset elapsed time 
  const currentTime = Date.now();
  setStartTime(currentTime);
  setNow(currentTime);
  
  setOffset(minutes * 60 + seconds);
  
  setManualTime(""); // clear after setting time
}

// Switch between halfs 
function selectHalf(half) {
  setHalf(half);
  const currentTime = Date.now();
  setStartTime(currentTime);
  setNow(currentTime);
//H1 starts at 0:00
  if (half === 1) {
    setOffset(0);}
//H2 starts at 40:00
  if (half === 2) {
    setOffset(40 * 60);}
}

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === keybinds.Pause) {
        e.preventDefault();
        if (!e.repeat) {
          toggleRef.current(); // uses latest function
        }
      }

      /// subtract 1 second
      if (e.key === keybinds.Remove_Time) {
        e.preventDefault();
        decreaseTime();
    }

      // Add 1 second
      if (e.key === keybinds.Add_Time) {
        e.preventDefault();
        setOffset((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [keybinds]);

  // Update parent
  useEffect(() => {
    setCurrentTime(formatTime(secondsPassed));
  }, [secondsPassed, setCurrentTime]);

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
      <h1>{formatTime(secondsPassed)}</h1>

      <button onClick={decreaseTime}>
        -1 sec
      </button>

      <button onClick={toggleClock}>
        {isRunning ? "Pause" : "Start"}
      </button>

      <button onClick={() => setOffset((prev) => prev + 1)}>
        +1 sec
      </button>

      <div style={{ marginTop: "15px" }}>
        <input
        type="text"
        placeholder="40:00" // placeholder is 40:00 for coming back after half time
        value={manualTime}
        onChange={(e) => setManualTime(e.target.value)}
        style={{width: "90px", textAlign: "center", marginRight: "5px",}}/>
        <button onClick={setManualClockTime}>
             Set Game Time
             </button>
        </div>
        
        <div style={{ marginTop: "10px" }}>
            <button
            onClick={() => selectHalf(1)}
            style={{backgroundColor: selectedHalf === 1 ? "#6F263D" : "white", color: selectedHalf === 1 ? "white" : "black", marginRight: "5px",}}>
                H1 
            </button>
            
            <button
            onClick={() => selectHalf(2)}
            style={{backgroundColor: selectedHalf === 2 ? "#6F263D" : "white",color: selectedHalf === 2 ? "white" : "black"}}>
                H2
            </button>
        </div>
    </div>
  );
}
