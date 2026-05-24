import { Link } from "react-router-dom";
import './Home.css';

export default function HomePage() {
    return (
            <div>
                <h1 style={{paddingBottom: "2vw", textAlign: "center"}}>Home Page</h1>
                <div style={{textAlign: "center", alignItems: "center",
                    backgroundColor: "#6F263D", width: "100%",
                    padding: "5vw", borderRadius: "100%"}}>
                    <img src="src/assets/QLD_reds_logo.svg.png" alt="Red's Logo"
                    style={{height: "22vw", width: "25vw", textAlign: "center"}}/>
                </div>
                <div style={{marginTop: "5vw", marginBottom: "5vw"}}>
                    <p className="paragraph-font">Welcome to the Red's Event Recording Application</p>
                    <p className="paragraph-font">To get started, select 'Capture' from the Menu</p>
                </div>
                <div style={{backgroundColor: "lightgrey", marginBottom: "10vw", paddingTop: "20px"}}>
                    <h1 style={{alignItems: "center", textAlign: "center"}}>How to Use the App</h1>
                    <div style={{padding: "10px", paddingRight: "25px"}}>
                        <ol class = "paragraph-bullet-marks" style={{marginTop:"3vw"}}>
                            <li><p>Start by <strong>Logging in</strong> through the <strong>'Login' screen</strong></p></li>
                            <li><p>Select <strong>Starting Zones</strong> by
                                either <strong>clicking</strong> on a Zone OR using
                                the <strong>arrow keys</strong> &#8594; and &#8592; to move Zones </p>
                                <ul>
                                    <li><p>To switch <strong>Defense Zone directions</strong>, press
                                        the <strong>switch</strong> button between the <strong>teams</strong></p></li>
                                    </ul></li>
                            <li><p>Select <strong>Team</strong> by clicking
                                either the <strong>Reds</strong> or <strong>Away</strong> team under the Zones</p></li>
                            <li><p>Start the <strong>Timer</strong> when the game starts</p>
                                <ul>
                                    <li><p>You can <strong>Add</strong> and <strong>Minus 5 Seconds </strong>
                                    through the corresponding buttons to Adjust time</p></li>
                                    <li><p>You can <strong>Pause</strong> and <strong>Start</strong> the
                                    timer as needed throughout the game using the <strong>Start</strong> button</p></li>
                                </ul></li>
                            <li><p>Select an <strong>Action</strong> and it will display in
                                the <strong>Event History</strong></p>
                                <ul>
                                    <li><p>To <strong>Edit</strong> events, press the pencil icon
                                        and select a <strong>new</strong> action</p></li>
                                    <li><p>To <strong>Delete</strong> events, press the bin icon</p></li>
                                </ul></li>
                            <li><p>To change keybindings, got to <strong>'Settings'</strong></p></li>
                            <li><p>To Visualise data, go to <strong>'Data Analysis'</strong></p></li>
                        </ol>
                    </div>
                </div>


                <div style={{background: "maroon", fontSize: "1.5vw", color: "white", padding: "3vw"}}>
                    <p>Queensland Rugby Union acknowledges the Traditional Owners of the land on which we gather and play</p>
                    <p>We pay our respects to their Elders, past, present, and recognise their ongoing connection to the land, waters, and culture</p>
                    <p>Queensland Ruby Union are committed to promoting reconcilation, respect, and understand
                        between all Austrailians and strive to create an inclusive and welcoming environment for all.
                        Through our programs and inititives, we aim to foster reconciliation, promote cultural diversity, and create a sense of belonging
                        for all indivisuals involved in Queensland Rugby Union.</p>
                </div>
            </div>
    );
}