import { useState, useRef, useEffect} from 'react';
import '../App.css'

export default function GameClock({ setCurrentTime }) {
  //Initial Time  
  const [startTime, setStartTime] = useState(null);
  //Store Current time
  const [now, setNow] = useState(null);
  const intervalRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
 
  // Start / stop clock 
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
  let secondsPassed = 0;
  if (startTime != null && now != null) {
    secondsPassed = (now - startTime) / 1000 + offset;
  }

  //Formatting time 
  function formatTime(){
    let minutes = Math.floor(secondsPassed / 60);
    let seconds = Math.floor(secondsPassed % 60);

    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");

    return `${minutes}:${seconds}`;
  }
  
  // Key binds ---> "space" = pause/play & "-" = -5 seconds & "=" = +5 seconds
  useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.code === "Space") {
      e.preventDefault();

      if (!e.repeat) {
        toggleClock();
      }
    }

    if (e.key === "-") {
      e.preventDefault();

      if (secondsPassed >= 5) {
        setOffset(offset - 5);
      } else {
        setOffset(offset - secondsPassed);
      }
    }

    if (e.key === "=") {
      e.preventDefault();
      setOffset(offset + 5);
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  
  

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [isRunning, startTime, now, offset, secondsPassed]);


  useEffect(() => {
    setCurrentTime(formatTime());
}, [secondsPassed]);

  // Currently just buttons - need to make work with keys 
  // Had to stop using emojis for pause play - started causing issues
  return (
    // Move to CSS?
    <div
    style={{border: '5px solid black', backgroundColor: 'lightgrey', padding: '30px',display: 'inline-block', textAlign: 'center'}}
    >
      <h1>{formatTime()}</h1>
      <button onClick={() => setOffset(offset - 5)}>-5 sec</button>
      <button onClick={toggleClock}>
        {isRunning ? '⏸' : '▶'}
      </button>
      <button onClick={() => setOffset(offset + 5)}>+5 sec</button>
    </div>
  );
}